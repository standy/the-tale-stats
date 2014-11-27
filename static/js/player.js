window.app.pages.player = (function(_player) {
	_player.init = init;

	function init() {
		var playerId = +app.req.player;
		var playerName = app.json.players[playerId][0];
		var name = app.json.players[playerId][2];
		var header = playerName + ', покровитель ' + name.link('http://the-tale.org/game/heroes/' + playerId);
		var title = playerName;

		var clanId = app.json.players[playerId][3];
		if (clanId) {
			var clanName = app.json.clans[clanId];
			title += ' из клана ' + clanName;
			header += ' из клана ' + clanName.link(app.url('clan=' + clanId));
		}
		app.dom.header(header);
		app.dom.title(title);

		app.dom.nav('player', playerId);
		app.dom.breadcrumb('player', playerId);

		$.when(
			app.getJson('lastLog'),
			app.getAllPlaceLogs(),
			app.getTmpl('data/table'),
			app.getTmpl('data/filter'),
			app.getTmpl('utils/player'),
			app.getTmpl('utils/player-short'),
			app.getTmpl('utils/player-event'),
			app.getTmpl('utils/council-short'),
			app.getTmpl('utils/place-short')
		)
			.done(function() {
				draw(playerId);
			});
	}

	function draw(playerId) {
		var playerHtml = app.draw.player(playerId);

		var html = '';
		html += playerHtml;
//		html += drawInfo(playerId);
//		html += '<div id="table"></div>';
		html += drawHistoryPlayer(playerId);
//		html += drawFilter();
		app.dom.content(html);

//		drawTable(playerId);
//		app.utils.addFilterHandlers();
	}



	function drawHistoryPlayer(playerId) {
		var logs = [];
		$.each(app.json.places, function(placeId, place) {
			placeId = +placeId;
			var placeLogs = app.json['place/'+placeId];
			var lastCouncils = {};
			placeLogs.forEach(function(placeLog, i) {
				var date = placeLog.date;
				var events = [];
				$.each(placeLog, function(councilId, council) {
					if (councilId == 'date') return;
					councilId = +councilId;
					if (!councilId) var currPlaceId = placeId;
					var friends = app.utils.arrayCross(council.friends, [playerId]);
					var enemies = app.utils.arrayCross(council.enemies, [playerId]);
					if (lastCouncils[councilId]) {
						var diffFriends = app.utils.arrayDiff(lastCouncils[councilId].friends, friends);
//						if (diffFriends.add.length || diffFriends.remove.length) {
//							console.log(councilId, clanPlayers, council.friends, friends)
//							console.log('>>>>', lastCouncils[councilId].friends, diffFriends)
//						}
						if (diffFriends.add.length)    {events.push(drawEventPlayers(diffFriends.add   , councilId, 1, 1, placeId)); }
						if (diffFriends.remove.length) {events.push(drawEventPlayers(diffFriends.remove, councilId, 1, 0, placeId)); }

						var diffEnemies = app.utils.arrayDiff(lastCouncils[councilId].enemies, enemies);
						if (diffEnemies.add.length)    {events.push(drawEventPlayers(diffEnemies.add   , councilId, 0, 1, placeId)); }
						if (diffEnemies.remove.length) {events.push(drawEventPlayers(diffEnemies.remove, councilId, 0, 0, placeId)); }
					}
					lastCouncils[councilId] = {
						friends: friends,
						enemies: enemies
					};
				});



				if (events.length) {
					logs.push({
						date: date,
						events: events
					});
					//html += '<dt>' + moment(date).format() + '</dt>' + eventHtml;
				}
			});
		});



		logs.sort(function(a, b) {
			return new Date(b.date) - new Date(a.date);
		});
		return '<h2>События</h2>' + app.draw.playersLog(logs);

		function drawEventPlayers(players, councilId, isFriend, isAdded, placeId) {
			return players.map(function(playerId) {
				return app.draw.playerEventByPlayer(playerId, councilId, isFriend, isAdded, placeId)
			}).join('');
		}
	}


	return _player;
})(window.app.pages.player || {});
