window.app.pages.places = (function(_places) {
	_places.init = init;

	function init() {

		app.dom.title('Список городов');
		app.dom.header('Список городов');
		app.dom.nav('places');
		app.dom.breadcrumb('place');

		$.when(
//			app.getAllCellLogs(),
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
				label: app.json.verbose.translate.modifiers.toLowerCase(),
				filter: 'spec',
				type: 'checkbox',
				inputs: app.json.verbose.modifiers.map(function(item, index) { return {text: item, value: index} })
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
		//var placesData = {};
		var column = [
			['',             '№',               0, 'left number'],
			['name',         'название',         0, 'left desc'],
			['spec',         'специализация',    0, 'spec desc left', app.json.verbose.modifiers],
			['frontier',     'фронтир',          1, 'center', ['нет', 'да']],
			['leadModifier', 'развитие',         1, 'right'],
			['',             'безопасность',     1, 'right'],
			['',             'транспорт',        1, 'right'],
			['',             'свобода',          1, 'right'],
			['',             'размер города',    1, 'right'],
			['',             'экономика',        1, 'right'],
//			['',             'радиус владений',  1, 'right'],
//			['',             'радиус изменений', 1, 'right'],
			['',             'стабильность',     1, 'right'],
			['',             'производство',     1, 'right'],
//			['',             'товары',           1, 'right'],
			['',             'дары',             1, 'right'],
			['',             'пошлина',          1, 'right'],
			['',             'советники',        1, 'right'],
			['',             'прописано',        1, 'right'],
			['',             'помогают',         1, 'right'],
			['',             'мешают',           1, 'right']
		];

		var dataList = [];
		$.each(app.json.places, function(placeId) {
			var cellLog = app.json.lastLog.cellLog[placeId];
			var placeLog = app.json.lastLog.placeLog[placeId];
			var place = app.json.places[placeId];
			var spec = cellLog.spec;
			if (spec === undefined) spec = Infinity;


			var townFriends = placeLog[0].friends ? placeLog[0].friends.length : 0;
			var councilFriends = 0;
			var councilEnemies = 0;
			var townCouncils = 0;
			$.each(placeLog, function(councilId, council) {
				if (councilId == '0' || councilId == 'date') return;
				townCouncils++;
				if (council.friends) councilFriends += council.friends.length;
				if (council.enemies) councilEnemies += council.enemies.length;
			});

			var leadModifier = cellLog.modifiers.slice(0).sort(function(a,b) {return a-b;}).pop();

			/* данные по городу */
			dataList.push([
				'',
				'<a href="#place=' + placeId + '">' + place.name + '</a>', //название
				spec, //специализация
				place.frontier|0, // фронтир
				leadModifier, // развитие

				cellLog.parameters[8],  //безопасность
				cellLog.parameters[9],  //транспорт
				cellLog.parameters[10], //свобода

				cellLog.parameters[0],  //размер города
				cellLog.parameters[1],  //экономика
//				cellLog.parameters[2],  //радиус владений
//				cellLog.parameters[3],  //радиус изменений
				cellLog.parameters[4],  //стабильность
				cellLog.parameters[5],  //производство
//				cellLog.parameters[6],  //товары
				cellLog.parameters[7],  //дары
				cellLog.parameters[11], //пошлина

				townCouncils,    //прописано
				townFriends,    //прописано
				councilFriends, //помогают
				councilEnemies  //мешают
			]);
		});

		var html = app.tmpl['data/table']({
			column: column,
			dataList: dataList
		});

		$('#table').html(html);

		tables.makeSortable($('.table-data'));
	}



	return _places;
})(window.app.pages.places || {});


