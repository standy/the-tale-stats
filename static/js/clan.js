window.app.pages.clan = (function(_clan) {
	_clan.init = init;

	function init() {
		var clanId = app.req.clan;
		var clanName = app.json.clans[clanId];
		app.dom.title('Клан ' + clanName);
		app.dom.header('Клан ' + clanName);
		app.dom.nav('clan', clanId);
		app.dom.breadcrumb('clan', clanId);

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
				draw(clanId);
			});
	}

	function draw(clanId) {
		var clanPlayers = getClanPlayers(clanId);
		var html = '';
		html += '<div id="table"></div>';
		html += drawInfo(clanId, clanPlayers);
		html += drawHistoryClanPlayers(clanId, clanPlayers);
//		html += drawFilter();
		app.dom.content(html);

		drawTable(clanPlayers);
//		app.utils.addFilterHandlers();
	}


	function getClanPlayers(clanId) {
		var players = [];
		$.each(app.json.players, function(playerId, player) {
			if (clanId != player[3]) return;
			players.push(+playerId);
		});
		return players;
	}
	function drawFilter() {
		var filter = [

		];

		return app.tmpl['data/filter']({filter: filter});
	}

	function drawHistoryClanPlayers(clanId, clanPlayers) {
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
					var friends = app.utils.arrayCross(council.friends, clanPlayers);
					var enemies = app.utils.arrayCross(council.enemies, clanPlayers);
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
				return app.draw.playerEvent(playerId, councilId, isFriend, isAdded, placeId)
			}).join('');
		}
	}

	function drawInfo(clanId, clanPlayers) {
		var placeLogs = app.json.lastLog.placeLog;
		var clanData = getClanData(clanId, placeLogs);

		var html = '';


		html +=
			[
				'<h4>Прописан</h4>',
				'<div class="over">' + clanPlacesList(clanData.home) + '</div>',
				'<h4>Помогает</h4>',
//				'<div class="over">' + clanPlacesList(clanData.friend) + '</div>',
//				'<h5>Советники:</h5>',
				'<div class="over">' + clanCouncilsList(clanData.friendCouncil) + '</div>',

				'<h4>Мешает</h4>',
//				'<div class="over">' + clanPlacesList(clanData.enemy) + '</div>',
//				'<h5>Советники:</h5>',
				'<div class="over">' + clanCouncilsList(clanData.enemyCouncil) + '</div>'
			].join('');


		return html;
	}

	function clanList(list, translate) {
		return $.map(list, function(value, key) {
			return { key: key, value: value }
		})
			.sort(function(a,b) { return b.value - a.value; })
			.filter(function(item) { return item.value > 0; })
			.map(function(item) { return  translate[item.key] + ': ' + item.value; })
			.join('<br>');
	}

	function getClanData(clanId, placeLogs) {
		var clanData = {home: {}, friend: {}, enemy: {}, friendCouncil: {}, enemyCouncil: {}};
		$.each(placeLogs, function(placeId, placeLog) {
			placeId = +placeId;
			$.each(placeLog, function(councilId, council) {
				councilId = +councilId;
				if (council.friends){
					if (!councilId) {
						council.friends.forEach(function(playerId) {
							addData(playerId, 'home', placeId)
						})
					} else {
						council.friends.forEach(function(playerId) {
							addData(playerId, 'friend', placeId, councilId)
						})
					}
				}
				if (council.enemies) {
					council.enemies.forEach(function(playerId) {
						addData(playerId, 'enemy', placeId, councilId)
					})
				}
			})
		});
		return clanData;
		function addData(playerId, relation, placeId, councilId) {
			var currClanId = app.json.players[playerId][3];
			if (clanId != currClanId) return;
			var data = clanData[relation];
			data[placeId] = data[placeId] || [];
			data[placeId].push(playerId);
			if (councilId > 0) {
				var dataCouncil = clanData[relation + 'Council'];
				dataCouncil[councilId] = dataCouncil[councilId] || [];
				dataCouncil[councilId].push(playerId);
			}
		}
	}
	function clanPlacesList(clanDataItem) {
		return $.map(clanDataItem, function(players, placeId) {
			return { place: placeId, count: players.length }
		})
			.sort(function(a,b) { return b.count - a.count; })
			.map(function(item) { return  app.draw.placeShort(item.place) + ': ' + item.count; })
			.join('<br>');
	}
	function clanCouncilsList(clanDataItem) {
		return $.map(clanDataItem, function(players, data) {
			return { data: data, count: players.length }
		})
			.sort(function(a,b) { return b.count - a.count; })
			.map(function(item) {
				var councilId = item.data;
				var placeId = app.json.councils[councilId][1];
				return  item.count + ' — ' + app.draw.councilShort(councilId) + ' из города ' +  app.draw.placeShort(placeId);
			})
			.join('<br>');
	}



	function drawTable(players) {
//		hero
//		level
//		name
//		clan
//		gender
//		race
		var placeLogs = app.json.lastLog.placeLog;
		var playersByPlace = {};
		$.each(placeLogs, function(placeId, placeLog) {
			$.each(placeLog, function(councilId, council) {
				if (council.friends){
					if (councilId == '0') {
						council.friends.forEach(function(playerId) {
							playersByPlace[playerId] = playersByPlace[playerId] || {};
							playersByPlace[playerId].place = +placeId;
						})
					} else {
						council.friends.forEach(function(playerId) {
							playersByPlace[playerId] = playersByPlace[playerId] || {};
							playersByPlace[playerId].placeFriend = +placeId;
							playersByPlace[playerId].friend = +councilId;
						})
					}
				}
				if (council.enemies) {
					council.enemies.forEach(function(playerId) {
						playersByPlace[playerId] = playersByPlace[playerId] || {};
						playersByPlace[playerId].placeEnemy = +placeId;
						playersByPlace[playerId].enemy = +councilId;
					})
				}
			})
		});
//		var places = [''].concat($.map(app.json.places, function(item) { return item.name; })); // названия городов

		var clanLinks = {};
		$.each(app.json.clans, function(clanId, clan) {
			clanLinks[clanId] = '<a href="' + app.url('clan=' + clanId) + '">' + clan + '</a>';
		});
		var column = [
			//[filter,    header,      rotate, class, list, listLinks]
			['',            '№',            0, 'left number'],
			['name',        'имя',           0, 'left desc'],
			['clan',        'клан',          0, 'left desc', app.json.clans, clanLinks],
			['hero',        'герой',         0, 'left desc'],
			['gender',      'пол',           0, 'left', app.json.verbose.genders],
			['race',        'раса',          0, 'center', app.json.verbose.races],
			['level',       'уровень',       0, 'center'],

			['place',       'город',         0, 'left desc'],
			['placeFriend', 'соратник',      0, 'left desc'],
			['placeEnemy',  'противник',     0, 'left desc']
		];


		var dataList = [];
		players.forEach(function(playerId) {
			var player = app.json.players[playerId];
			var playerByPlace = playersByPlace[playerId] || {};
			var placeName =       playerByPlace.place ?       app.draw.placeShort(playerByPlace.place)       : '';
			var placeNameFriend = playerByPlace.placeFriend ? app.draw.placeShort(playerByPlace.placeFriend) : '';
			var placeNameEnemy =  playerByPlace.placeEnemy ?  app.draw.placeShort(playerByPlace.placeEnemy)  : '';

			dataList.push([
				'', //№
				'<a href="' + app.url('player=' + playerId) + '">' + player[2] + '</a>', //имя
				player[3]||Infinity, //клан
				'<a href="' + app.url('player=' + playerId) + '">' + player[0] + '</a>', //герой
				player[4], //пол
				player[5], //раса
				player[1], //уровень
				placeName,
				placeNameFriend,
				placeNameEnemy
			]);
		});
		var html = app.tmpl['data/table']({
			column: column,
			dataList: dataList
		});

		$('#table').html(html);
		tables.makeSortable($('.table-data'));
	}

	return _clan;
})(window.app.pages.clan || {});
