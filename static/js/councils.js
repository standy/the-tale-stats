window.app.pages.councils = (function(_councils) {
	_councils.init = init;

	function init() {

		app.dom.title('Список советников ');
		app.dom.header('Список советников ');
		app.dom.nav('councils');
		app.dom.breadcrumb('council');

		$.when(
//			app.getAllPlaceLogs(),
			app.getJson('lastLog'),
			app.getTmpl('data/table'),
			app.getTmpl('data/filter'),
			app.getTmpl('utils/council'),
			app.getTmpl('utils/council-short'),
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
				label: app.json.verbose.translate.races.toLowerCase(),
				filter: 'race',
				type: 'checkbox',
				inputs: app.json.verbose.races.map(function(item, index) { return {text: item, value: index} })
			},
			{
				label: app.json.verbose.translate.profs.toLowerCase(),
				filter: 'prof',
				type: 'checkbox',
				inputs: app.json.verbose.profs.map(function(item, index) { return {text: item, value: index} })
			},
			{
				label: app.json.verbose.translate.masteries.toLowerCase(),
				filter: 'mastery',
				type: 'checkbox',
				inputs: app.json.verbose.masteries.map(function(item, index) { return {text: item, value: index} }).slice(1)
			},
			{
				label: 'в игре',
				filter: 'ingame',
				type: 'checkbox',
				inputs: [{text: 'да', value: 1}, {text: 'нет', value: 0}]
			},
			{
				label: 'фронтир',
				filter: 'frontier',
				type: 'checkbox',
				inputs: [{text: 'да', value: 1}, {text: 'нет', value: 0}]
			}
		];

		return app.tmpl['data/filter']({filter: filter});
	}

	function drawTable() {
		var column = [
			//[filter,    header,      rotate, class, list]
			['',         '№',            0, 'left number'],
			['name',     'имя',           0, 'left'],
			['',         'город',         0, 'left'],
			['race',     'раса',          0, 'center', app.json.verbose.races],
			['prof',     'профессия',     0, 'center', app.json.verbose.profs],
			['mastery',  'мастерство',    0, 'center', app.json.verbose.masteries],
			['ingame',   'в игре',        1, 'right', ['нет', 'да']],
			['frontier', 'фронтир',       1, 'right', ['нет', 'да']],
			['',         'друзья',        1, 'right'],
			['',         'враги',         1, 'right'],
			['',         'влиятельность', 1, 'right'],
			['',         'плюс',          1, 'right'],
			['',         'минус',         1, 'right']
		];

		var dataList = [];
		$.each(app.json.councils, function(councilId, council) {
			var placeId = council[1];
			var placeLog = app.json.lastLog.placeLog[placeId];
			var councilData = placeLog[councilId] || false;

			dataList.push([
				'',
				'<a href="#council=' + councilId + '">' + council[0] + '</a>', //name
				app.draw.placeShort(placeId), //placeId
				council[2], //raceId
				council[3], //profId
				council[4], //masteryId
				councilData ? 1 : 0, //в игре
				app.json.places[placeId].frontier|0, //фронтир
				councilData.friends ? councilData.friends.length: 0, //друзья
				councilData.enemies ? councilData.enemies.length: 0, //враги
				councilData.inf||0, //влиятельность
				councilData.plus||0, //плюс
				councilData.minus||0 //минус
			]);
		});
		var html = app.tmpl['data/table']({
			column: column,
			dataList: dataList
		});

		$('#table').html(html);
		tables.makeSortable($('.table-data'));
	}



	return _councils;
})(window.app.pages.councils || {});
