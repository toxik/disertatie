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
		winner: 	null
	},
	this.nextPlayer	= function() { return 0 };
	this.makeMove	= function(move) {
				console.log('in makeMove');
				if (this.state.game !== 'finished' && this.checkAndMakeMove(move)) {
					if (!this.checkEnd()) {
						this.state.currPlayer = this.nextPlayer();
					}
				} // if invalid move ignore
				return this.state;
			};
	this.addPlayer = function(sid) { 
		console.log('In add player', this.state);
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