var AbstractGame = function (session) {
	this.id 		= session || 'invalidHash';
	this.playersNo	= -1;
	this.state 		= {
		gametype: 	'generic',
		game: 	    'new', 
		players:    [ ],
		spectators: [ ], 
		board: 	    [ ],
		currPlayer: null,
		winner: 	null,
		lastmove: 	{}
	},
	this.nextPlayer	= function() { return 0 };
	this.makeMove	= function(move) {
				var lastmove = null
				if (this.state.game !== 'finished' && this.checkAndMakeMove(move)) {
					lastmove = move;
					if (!this.checkEnd()) {
						this.state.currPlayer = this.nextPlayer();
					}
				} // if invalid move ignore
				this.state.lastmove = lastmove;
				return lastmove !== null;
			};
	this.addPlayer = function(sid) { 
		if (this.state['players'].length < this.playersNo) {
			this.state.players.push(sid); 
		} else {
			this.state.spectators.push(sid);
		}
		return this.state;
	}
	this.start = function() {
		if (this.playersNo === this.state.players.length) {
			this.state.game = 'progressing';
			this.state.currPlayer = this.nextPlayer();
		}
		return this.state;
	};
	this.checkEnd = function() { return false };
	// this should also make the move
	this.checkAndMakeMove = function() { return false };
};

module.exports = AbstractGame;