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
                     .digest('hex');
}
io.adapter(
  redis({ host: process.env.REDIS_PORT_6379_TCP_ADDR, 
        port: process.env.REDIS_PORT_6379_TCP_PORT })
);

server.listen(port, function () {
  console.log('Server listening at port %d', port);
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
var gametype = null;
app.get('/:gametype/:gameid', function (req, res) {
  if (req.params.gametype !== 'ttt') { return; }
  gameid = req.params.gameid;
  gametype = req.params.gametype;
  res.sendFile(__dirname + '/public/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
var skt = { on: function() {} };

io.on('connection', function (socket) {
  skt = socket;
  var addedUser = false;

  if (gameid != null) {
    socket.join(gameid, function() {
        socket.currentgame = gameid;
        console.log( socket.id + ' joined ' + gameid )
        // now load the board config and everything from redis
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
    var newGame = { type: data.type, id: socket.currentgame, starter: socket.id };
    socket.join(socket.currentgame, function() {
      socket.emit('new game sid', newGame);
    });
  });

  socket.on('game move', function (data) {
    if (typeof socket.currentgame === 'undefined') return;
    console.log('game move', socket.currentgame, data);
    socket.to(socket.currentgame).emit('game move', data);
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

