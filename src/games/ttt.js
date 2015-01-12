var AbstractGame = require('./abstract');
var TicTacToe = function(session) {
  	AbstractGame.apply(this,arguments);
  	var wins = [7, 56, 448, 73, 146, 292, 273, 84];
  	this.playersNo = 2;
  	this.state.gametype = 'ttt';
  	this.state.score = [ 0, 0 ];
  	this.state.rematch = [ 0, 0 ];
  	this.state.board = [ -1, -1, -1, -1, -1, -1, -1, -1 , -1 ];
  	this.nextPlayer = function() {
		return this.state.currPlayer === 0 ? 1 : 0;
  	}
  	this.checkEnd = function() {
  		var i;
  		// see if this was a winning move
        for (i in wins) {
            if ((wins[i] & this.state.score[this.state.currPlayer]) === wins[i]) {
            	this.state.game = 'finished';
            	this.state.winner = this.state.currPlayer;
            	break;
            }
        }
        // see if there are any more possible moves
        if (this.state.game !== 'finished') {
        	this.state.game = 'finished';
        	for (i in this.state.board) {
        		if (this.state.board[i] === -1) {
        			this.state.game = 'progressing';
        		}
        	}
        }
        return this.state.game === 'finished';
  	}
  	this.checkAndMakeMove = function(move) {
  		// make sure we're dealing with integers
  		move.index = parseInt(move.index, 10);

  		// disregard if move is outside of bounds
  		if (move.index < 0 || move.index > 8) return false;

  		// disregard move if it doesn't come the current player
  		if ( this.state.currPlayer !== this.state.players.indexOf(move.actor) ) return false;

  		// disergard move if the index is currently occupied
  		if (this.state.board[move.index] !== -1) return false;

  		// everything fine, change the state and score
  		this.state.game = 'progressing';
  		this.state.board[ move.index ] = this.state.currPlayer;
  		this.state.score[ this.state.currPlayer ] += Math.pow(2, move.index);
  		return true;
  	}
  	this.reset	= function() {
  		this.state.game = 'new';
  		this.state.board   = [ -1, -1, -1, -1, -1, -1, -1, -1, -1 ];
  		this.state.currPlayer = this.state.winner = null;
  		this.state.score   = [ 0, 0 ];
  	}
  	this.rematch = function(move) {
  		// check if rematch is asked (magic code 255)
  		if (move.index === 255) {
        console.log('Tryig to rematch by ' + move.actor);
        if (this.state.players.indexOf(move.actor) > -1) {
          this.state.rematch [ this.state.players.indexOf(move.actor) ] = 1;
          if (this.state.rematch[0] === 1 && this.state.rematch[1] === 1) {
            console.log('Starting a rematch !');
            this.state.game = 'progressing';
            var p1 = this.state.players[0], p2 = this.state.players[1];
            this.state.players = [ p2, p1 ]; // change roles
            this.state.board   = [ -1, -1, -1, -1, -1, -1, -1, -1, -1 ];
            this.state.currPlayer = this.state.winner = null;
            this.state.score   = [ 0, 0 ];
            this.state.rematch = [ 0, 0 ];
            this.state.currPlayer = this.nextPlayer();
          }
          return true;
        }
  		}
		return false;
  	}
}
TicTacToe.prototype = Object.create(AbstractGame.prototype);
TicTacToe.prototype.constructor = TicTacToe;

module.exports = TicTacToe;

/*

// test the draw
var game = new TicTacToe('abcdef');
game.addPlayer('X');
game.addPlayer('0');
game.start();

game.makeMove({ actor: 'X', index: 0 });
game.makeMove({ actor: '0', index: 2 });
game.makeMove({ actor: 'X', index: 1 });
game.makeMove({ actor: '0', index: 3 });
game.makeMove({ actor: 'X', index: 5 });
game.makeMove({ actor: '0', index: 4 });
game.makeMove({ actor: 'X', index: 6 });
game.makeMove({ actor: '0', index: 7 });
game.makeMove({ actor: 'X', index: 8 });
// test a win
var game = new TicTacToe('abcdef');
game.addPlayer('X');
game.addPlayer('0');
game.start();

game.makeMove({ actor: 'X', index: 0 });
game.makeMove({ actor: '0', index: 1 });
game.makeMove({ actor: 'X', index: 2 });
game.makeMove({ actor: '0', index: 3 });
game.makeMove({ actor: 'X', index: 4 });
game.makeMove({ actor: '0', index: 5 });
game.makeMove({ actor: 'X', index: 6 });

*/
