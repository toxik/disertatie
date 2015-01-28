var crypto = require('crypto');
var ttt = require('./ttt');
var GameDao = function (redis_client) {
	var createId = function(socketId) {
		return crypto.createHash('sha256')
				.update(socketId + new Date())
				.digest('base64');
	};
	return {
		create: function(gameType, socketId) {
			var game = null;
			if (gameType === 'ttt') {
				game = new ttt( createId(socketId) );
			}
			game.addPlayer(socketId);
			return game;
		},
		load: function(gameId, cb) {
			redis_client.lrange('game:' + gameId, 0, 0, function(e, data){
				if (!data || !data.length) {
					return
				}
				var game = null;
				if (data[0].gametype = 'ttt') {
					game = new ttt(gameId);
				}
				game.state = JSON.parse(data[0]);
				cb(game);
			});
		},
		loadMoves: function(gameId, cb) {
			redis_client.lrange('game:' + gameId, 0, -1, function(e, data){
				if (!data || !data.length) {
					return
				}
				cb( data );
			});
		},
		save: function(game, cb) {
			redis_client.lpush('game:' + game.id, JSON.stringify(game.state), function(e, data) {
				cb(data);
			});
		}
	};
};
module.exports = GameDao;