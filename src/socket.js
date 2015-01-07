// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
io.adapter(redis({ host: process.env.REDIS_PORT_6379_TCP_ADDR, port: process.env.REDIS_PORT_6379_TCP_PORT }));
var redis_client = require('redis').createClient(process.env.REDIS_PORT_6379_TCP_PORT, process.env.REDIS_PORT_6379_TCP_ADDR, {});
var port = process.env.PORT || 3000;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;
redis_client.get('clients_no', function(e, resp){ numUsers=resp; });

io.on('connection', function (socket) {
  var addedUser = false;

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
    	// echo globally (all clients) that a person has connected
	    socket.broadcast.emit('user joined', {
	      username: socket.username,
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
