"use strict"
// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var crypto = require('crypto');
var redis_client = require('redis').createClient(
		process.env.REDIS_PORT_6379_TCP_PORT, 
		process.env.REDIS_PORT_6379_TCP_ADDR, {}
);
var port = process.env.PORT || 3000;
var createGameId = function(sessionId) { 
	return crypto.createHash('sha256')
			 .update(sessionId + new Date())
			 .digest('base64');
}

var ttt = require('./games/ttt');

io.adapter(
	redis({ host: process.env.REDIS_PORT_6379_TCP_ADDR, 
				port: process.env.REDIS_PORT_6379_TCP_PORT })
);

server.listen(port, function () {
	console.info('Server listening at port %d', port);
});

// Routing
app.enable('trust proxy');
app.use(express.static(__dirname + '/public', {
		etag: false,
		maxAge: '1y',
		setHeaders: function (res, path, stat) {
			res.set('x-hostname', process.env.HOSTNAME )
		}
	})
);

var gameid = null;
app.get('/g/:gameid', function (req, res) {
	gameid = req.params.gameid;
	res.sendFile(__dirname + '/public/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var skt = { on: function() {} };

function loadGame(gameId, cb) {
	redis_client.lrange('game:' + gameId, 0, 0, function(e, data){
		if (!data) {
			return
		}
		var game = null;
		if (data[0].gametype = 'ttt') {
			game = new ttt(gameid);
		}
		game.state = JSON.parse(data[0]);
		cb(game);
	});
}

function saveGame(game, cb) { 
	redis_client.lpush('game:' + game.id, JSON.stringify(game.state), function(e, data) {
		cb(data);
	});
}

io.on('connection', function (socket) {
	skt = socket;
	var addedUser = false;

	// so we're trying to join a game :)
	if (gameid != null) { 
		loadGame(gameid, function(game){
			socket.currentgame = gameid;
			socket.join(gameid, function() {				
				game.addPlayer(socket.id);
				game.start();

				if (game.state) {
					saveGame(game, function(data) {
						socket.emit('game joined', game);
						socket.to(game.id).emit('game state', game.state);
					});
				}
			});
		});
	}

	// when the client emits 'new message', this listens and executes
	socket.on('new message', function (data) {
		// we tell the client to execute 'new message'
		socket.broadcast.emit('new message', {
			username: socket.username,
			message: data
		});
	});

	// when the client emits 'add user', this listens and executes
	socket.on('add user', function (username) {
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		addedUser = true;
		redis_client.incr('clients_no', function(e, resp){ 
			socket.emit('login', {
				numUsers: resp
			});
			numUsers ++;
			// echo globally (all clients) that a person has connected
			socket.broadcast.emit('user joined', {
				username: socket.username + ' from ' + process.env.HOSTNAME,
				numUsers: resp
			});
		});
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function () {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	socket.on('request game sid', function (data) {
		socket.currentgame = createGameId(socket.id);
		if (typeof data === 'undefined' || typeof data.type === 'undefined') return;
		var game;
		if (data.type !== 'ttt') {
			return;
		}
		// general code: push state to redis, join channel and emit event
		//TODO: replace this with `new data.type(socket.currentgame)` or smth
		game = new ttt(socket.currentgame);
		game.addPlayer(socket.id);
		saveGame(game, function(e, data) {
			console.log('creating game ', game.id);
			socket.join(game.id, function() {
				socket.emit('new game sid', game);
			});
		});
	});

	socket.on('game move', function (data) {
		if (typeof socket.currentgame === 'undefined') return;
		loadGame(socket.currentgame, function(game) {
			var move = data;
			move.actor = socket.id
			// save game only if it was a legal move
			if (game.makeMove(data)) {
				saveGame(game, function(data){
					socket.to(game.id).emit('game state', game.state);
					socket.emit('game state', game.state);
				});
			}
		})
		//socket.to(socket.currentgame).emit('game move', data);
	});

	socket.on('game chat', function (data) {
		if (typeof socket.currentgame === 'undefined') return;
		console.log('game chat', socket.currentgame, socket.username, data);
		socket.to(socket.currentgame).emit('game chat', { 
				username: socket.username + ' (private)', 
				message: data 
		});
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function () {
		socket.broadcast.emit('stop typing', {
			username: socket.username
		});
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		// remove the username from global usernames list
		if (addedUser) {
			delete usernames[socket.username];
			numUsers--;

			redis_client.decr('clients_no', function(e, resp){ 
				// echo globally that this client has left
				socket.broadcast.emit('user left', {
					username: socket.username,
					numUsers: resp
				});

			});
		}
	});
});

process.on('SIGTERM', function() {
	redis_client.decrby('clients_no', numUsers, function(e, resp){ });
});
process.on('SIGUSR2', function() {
	redis_client.decrby('clients_no', numUsers, function(e, resp){ });
});

