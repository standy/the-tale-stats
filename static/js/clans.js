window.app.pages.clans = (function(_clans) {
	_clans.init = init;

	function init() {

		app.dom.title('Список кланов');
		app.dom.header('Список кланов');
		app.dom.nav('clans');
		app.dom.breadcrumb('clan');

		$.when(
//			app.getAllPlaceLogs(),
			app.getJson('lastLog'),
			app.getTmpl('data/table'),
			app.getTmpl('data/filter'),
//			app.getTmpl('utils/player'),
//			app.getTmpl('utils/player-short'),
			app.getTmpl('utils/place-short')
		)
			.done(function() {
				draw();
			});
	}

	function draw() {
		var html = '';
		html += drawFilter();
		html += '<div id="table" class="clans-table"></div>';
		app.dom.content(html);
		drawTable();
		app.utils.addFilterHandlers();
	}


	function drawFilter() {
		var filter = [

		];

		return app.tmpl['data/filter']({filter: filter});
	}

	function drawTable() {
//		hero
//		level
//		name
//		clan
//		gender
//		race
		var placeLogs = app.json.lastLog.placeLog;
		var clansData = {};
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
		function addData(playerId, relation, placeId, councilId) {
			var clanId = app.json.players[playerId][3];
			clansData[clanId] = clansData[clanId] || {home: {}, friend: {}, enemy: {}, friendCouncil: {}, enemyCouncil: {}};
			var data = clansData[clanId][relation];
			data[placeId] = data[placeId] || [];
			data[placeId].push(playerId);
			if (councilId > 0) {
				var dataCouncil = clansData[clanId][relation + 'Council'];
				dataCouncil[councilId] = dataCouncil[councilId] || [];
				dataCouncil[councilId].push(playerId);
			}
		}


		var clanLinks = {};
		$.each(app.json.clans, function(clanId, clan) {
			clanLinks[clanId] = '<a href="' + app.url('clan=' + clanId) + '">' + clan + '</a>';
		});

		function clanPlacesList(clanId, relation) {
			if (!clansData[clanId]) return '';
			return $.map(clansData[clanId][relation], function(players, placeId) {
				return { place: placeId, count: players.length }
			})
				.sort(function(a,b) { return b.count - a.count; })
				.map(function(item) { return  app.json.places[item.place].name + ': ' + item.count; })
				.join('<br>');
		}
		var playersByClan = {};
		$.each(app.json.players, function(playerId, player) {
			var clanId = player[3];
			playersByClan[clanId] = playersByClan[clanId] || [];
			playersByClan[clanId].push(playerId);
		});


		var column = [
			//[filter,    header,      rotate, class, list, listLinks]
			['',            '№',            0, 'left number'],
//			['name',        'имя',           0, 'left desc'],
			['clan',        'клан',          0, 'left desc'],
			['count',       'игроки',        0, 'left'],
			['level',       'уровень',       0, 'left'],
			['race',        'раса',          0, 'left'],
			['place',       'прописан',      0, 'left desc over-height'],
			['friend',      'помогает',      0, 'left desc over-height'],
			['enemy',       'мешает',        0, 'left desc over-height']
//			['hero',        'герой',         0, 'left desc'],
//			['gender',      'пол',           0, 'left', app.json.verbose.genders],
//			['race',        'раса',          0, 'center', app.json.verbose.races],
//			['level',       'уровень',       0, 'center'],
//
//			['place',       'город',         0, 'left desc'],
//			['placeFriend', 'соратник',      0, 'left desc'],
//			['placeEnemy',  'противник',     0, 'left desc'],
		];

		var dataList = [];
		$.each(app.json.clans, function(clanId, clanName) {
			if (!clansData[clanId]) return;
			var placeHomeData = clanPlacesList(clanId, 'home');
			var placeFriendsData = clanPlacesList(clanId, 'friend');
			var placeEnemiesData = clanPlacesList(clanId, 'enemy');

			var players = playersByClan[clanId];
			var genders =  [0,0,0];
			var races = [0,0,0,0,0];
			var levelSum = 0;
			players.forEach(function(playerId) {
				var player = app.json.players[playerId];
				genders[player[4]]++;
				races[player[5]]++;
				levelSum += player[1];
			});
			var level = levelSum / players.length;
			function clanList(list, translate) {
				return $.map(list, function(value, key) {
					return { key: key, value: value }
				})
					.sort(function(a,b) { return b.value - a.value; })
					.filter(function(item) { return item.value > 0; })
					.map(function(item) { return  translate[item.key] + ': ' + item.value; })
					.join('<br>');
			}
			var racesData = clanList(races, app.json.verbose.races);

			dataList.push([
				'', //№
				'<a href="' + app.url('clan=' + clanId) + '">' + clanName + '</a>', //имя
				(playersByClan[clanId] || []).length,
				Math.round(level*100)/100,
				racesData,
				'<div class="over">' + placeHomeData + '</div>',
				'<div class="over">' + placeFriendsData + '</div>',
				'<div class="over">' + placeEnemiesData + '</div>'

			]);
		});
		var html = app.tmpl['data/table']({
			column: column,
			dataList: dataList
		});

		$('#table').html(html);
		$('.over-height .over').customScroll();
		tables.makeSortable($('.table-data'));
	}



	return _clans;
})(window.app.pages.clans || {});
