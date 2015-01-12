$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize varibles
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var currentGame = {};

  var socket = io();

  window.socket = socket;

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
    }
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    var currentUsername = username,
        eventName = 'new message';
    // if there is a non-empty message and a socket connection
    if (currentGame) {
      currentUsername += ' (private)';
      eventName = 'game chat';
    }
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: currentUsername,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit(eventName, message);
    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  if (document.location.hash.substr(1).length) {
    $usernameInput.val(document.location.hash.substr(1));
    setUsername();
  }

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  var $ttt = $('#ttt');
  var $gameState = $('#game_state');

  $ttt.find('table td').on('click', function() {
    socket.emit('game move', { index: $(this).data('idx') } );
  })

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  // Started a new game
  socket.on('new game sid', function (game) {
    window.history.pushState({}, '', '/g/'+ encodeURIComponent(game.id));
    currentGame = game;
    var state = game.state;
    $('#qrcode').hide(0);
    qr.canvas({
        canvas: document.getElementById('qrcode'),
        value: document.location.href
      });
    $('#qrcode').fadeIn(1200);
    handleGameState(state);
  });


  socket.on('game joined', function (game) {
    currentGame = game;
    window.history.pushState({}, '', '/g/'+ encodeURIComponent(game.id));
    $('#qrcode').hide(0);
    qr.canvas({
        canvas: document.getElementById('qrcode'),
        value: document.location.href
      });
    $('#qrcode').fadeIn(1200);
    handleGameState(game.state);
  });

  // received game move
  // Started a new game
  socket.on('game move', function (game) {
    console.log(game);
  });

  // received game chat
  socket.on('game chat', function (game) {
    addChatMessage(game);
  });

  $('#new_ttt').on('click', function(){
    socket.emit('request game sid', {type: 'ttt'});
     $ttt.find('table td').each(function(idx,el) {
      el.innerHTML = '&nbsp;';
    });
  });
  $('#rematch_ttt').on('click', function(){
    socket.emit('game move', {index: 255});
  });

  socket.on('game state', function (game) {
    handleGameState(game);
  });

  function handleGameState(state) {
    if (state.gametype == 'ttt') {
        $ttt.find('table td').each(function(idx,el) {
        el.innerHTML = state.board[idx] === -1 ? '&nbsp;' :
                       state.board[idx] === 1 ? '0' : 'X';
      });
      var gameState = 'no game';
      if (state.game === 'new') {
        gameState = 'waiting for second player';
      } else if (state.game === 'finished') {
        if (state.winner === null) {
          gameState = 'DRAW!';
        } else if (state.players[state.winner] === socket.io.engine.id) {
          gameState = 'you WON!';
        } else if (state.players[~~!state.winner] === socket.io.engine.id) {
          gameState = 'you lost :(';
        } else {
          gameState = (state.winner === 0 ? 'X' : '0') + ' won';
        }
      } else {
        if (state.currPlayer != null) {
          if (state.players[state.currPlayer] === socket.io.engine.id) {
            gameState = 'your turn';
          } else if (state.players[~~!state.currPlayer] === socket.io.engine.id) {
            gameState = 'waiting for opponent\'s turn';
          } else {
            gameState =(state.currPlayer === 0 ? 'X' : '0') + ' is on the move';
          }
        }
      }
      var gameState2 = '';
      if (state.lastmove && state.lastmove.index === 255) {
        gameState2 = '; rematch requested, ';
        if (state.lastmove.actor === socket.io.engine.id) {
          gameState2 += ' waiting for response.';
        } else if (state.players.indexOf(socket.io.engine.id) > -1) {
          gameState2 += ' confirm ?';
        } else {
          gameState2 += ' waiting for confirmation by ' + (~~!state.players.indexOf(state.lastmove.actor) === 0 ? 'X' : '0');
        }
        if (state.rematch[0] === 0 && state.rematch[1] === 0) {
          gameState2 = ' (rematch started)'
        }
      }
      $gameState.html(gameState + gameState2);
    }

  }

});
