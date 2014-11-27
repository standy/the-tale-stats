window.app.pages.players = (function(_players) {
	_players.init = init;

	function init() {

		app.dom.title('Список игроков');
		app.dom.header('Список игроков');
		app.dom.nav('players');
		app.dom.breadcrumb('player');

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
		html += '<div id="table"></div>';
		app.dom.content(html);
		drawTable();
		app.utils.addFilterHandlers();
	}


	function drawFilter() {
		var filter = [
			{
				label: app.json.verbose.translate.clans.toLowerCase(),
				filter: 'clan',
				type: 'radio',
				inputs: [{text: 'все', value: 'all'}].concat($.map(app.json.clans, function(item, index) { return {text: item, value: index} }))
			},
			{
				label: app.json.verbose.translate.genders.toLowerCase(),
				filter: 'gender',
				type: 'checkbox',
				inputs: app.json.verbose.genders.map(function(item, index) { return {text: item, value: index} })
			},
			{
				label: app.json.verbose.translate.races.toLowerCase(),
				filter: 'race',
				type: 'checkbox',
				inputs: app.json.verbose.races.map(function(item, index) { return {text: item, value: index} })
			}
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
		$.each(app.json.players, function(playerId, player) {
//			var placeId = player[1];
//			var playerData = placeLog[playerId] || false;
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



	return _players;
})(window.app.pages.players || {});
