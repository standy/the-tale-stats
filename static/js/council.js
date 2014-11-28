window.app.pages.council = (function(_council) {
	_council.init = init;

	function init(councilId) {
		var council = app.json.councils[councilId];
		//councils[id] = [name, placeId, RACES.indexOf(race), PROFS.indexOf(prof), MASTERIES.indexOf(mastery)];
		var name = council[0];
		var placeId = council[1];

		var place = app.json.places[placeId];

		app.dom.title('Советник ' + name);
		app.dom.nav('council', councilId, placeId);
		app.dom.breadcrumb('council', councilId, placeId);

		$.when(
			app.getJson('place/' + placeId),
			app.getJson('cell/' + placeId),
			app.getTmpl('place/table'),
			app.getTmpl('place/councils-table'),
			app.getTmpl('utils/council'),
			app.getTmpl('utils/council-short'),
			app.getTmpl('utils/player'),
			app.getTmpl('utils/player-short'),
			app.getTmpl('utils/player-event'),
			app.getTmpl('utils/place-short')
		)
			.done(function(placeLogs, cellLogs) {
				draw(placeLogs, cellLogs, councilId, placeId);
			});
	}

	function draw(placeLogs, cellLogs, councilId, placeId) {
		app.dom.header(app.draw.councilShort(councilId) + ' <small>из города ' + app.draw.placeShort(placeId) + '</small>');
		var html = '';
		html += drawCouncilHistoryPlayers(placeLogs, councilId, placeId);
		html += '<div class="chart" id="chart-council" style="height: 400px; width: 100%;"></div>';
		app.dom.content(html);
		var councilLogs = placeLogs.map(function(placeLog) { return {
			data: placeLog[councilId],
			date: placeLog.date
		} });
		initChart('council', councilLogs);
	}


	function drawCouncilHistoryPlayers(placeLogs, councilId, placeId) {
		councilId = +councilId;
		var lastCouncil;
		var logs = [];
		placeLogs.forEach(function(placeLog, i) {
			var events = [];
			var date = placeLog.date;
			var eventHtml = '';
			var council = placeLog[councilId];
			if (council && lastCouncil) {
				var diffFriends = app.utils.arrayDiff(lastCouncil.friends, council.friends);
				if (diffFriends.add.length)    {events.push(drawEventPlayers(diffFriends.add   , councilId, 1, 1)); }
				if (diffFriends.remove.length) {events.push(drawEventPlayers(diffFriends.remove, councilId, 1, 0)); }

				var diffEnemies = app.utils.arrayDiff(lastCouncil.enemies, council.enemies);
				if (diffEnemies.add.length)    {events.push(drawEventPlayers(diffEnemies.add   , councilId, 0, 1)); }
				if (diffEnemies.remove.length) {events.push(drawEventPlayers(diffEnemies.remove, councilId, 0, 0)); }
			} else if (council && !lastCouncil && i>0) {
				events.push('Покинул совет');
			} else if (!council && lastCouncil && i>0) {
				events.push('Занял место в совете');
			}
			if (council && i == placeLogs.length-1) { /*  && moment(date).diff(app.logStart) > 0 */
				events.push('Начало записей');
			}
			lastCouncil = council;


			if (events.length) {
				logs.push({
					date: date,
					events: events
				})
			}
		});

		return '<h2>События</h2>' + app.draw.playersLog(logs);

		function drawEventPlayers(players, councilId, isFriend, isAdded) {
			return players.map(function(playerId) {
				return app.draw.playerEventByCouncil(playerId, councilId, isFriend, isAdded)
			}).join('');
		}
	}


	function initChart(type, councilLogs) {
		var chartData = [];
//		var verbose = app.json.verbose[type];
		var sets = chartsSettings[type];
		var params = {
			inf: 'Влиятельность',
			plus: 'Бонус',
			minus: 'Минус',
			friends: 'Соратники',
			enemies: 'Противники '

		};
		for (var param in params) if (params.hasOwnProperty(param)) {
			var cdata = $.extend(true, {legendText: params[param]}, sets.global, sets[param]);
			cdata.dataPoints = councilLogs.map(function(councilLog) {
				if (!councilLog.data) return;
				var y = councilLog.data[param];
				if (y && (param == 'friends' || param == 'enemies')) y = y.length;
				return {
					x: new Date(councilLog.date),
					y: y
				}
			});
			if (!cdata.hide) chartData.push(cdata);
		}

		var defaultOptions = {
			legend: {
				cursor: "pointer",
				itemclick: function(e) {
					e.dataSeries.visible = e.dataSeries.visible===false;
					chart.render();
				}
			},
			toolTip: {
				content: function(e) {
					var entry = e.entries[0];
					var k = entry.dataSeries._options.k || 1;
					return '<a href="">'+entry.dataSeries.legendText+'</a><br />' +
						Math.round(entry.dataPoint.y/k) + '<br />' +
						moment(entry.dataPoint.x).format();
				}
			}
		};
		var options = $.extend(true, {}, defaultOptions, sets.options, {data: chartData});



		var chart = new CanvasJS.Chart('chart-' + type, options);

		chart.render();
	}



	var chartsSettings = {
		council: {
			options: {
				title: {
					//text: 'Специализация'
				},
				animationEnabled: false,
				theme: "theme2",
				culture: 'ru',
				axisX: {
					valueFormatString: "DD.MM"
				},
				axisY: {
					tickThickness: 1,
					gridThickness: 1,
					//interval: 20,
					valueFormatString: "#"
				},
				//axisY2:{
				//	gridThickness: 0,
				//	tickThickness: 0,
				//	minimum: 0,
				//	title: "Влиятельность",
				//	valueFormatString: "#0"
				//},
				axisY2:{
					gridThickness: 0,
					tickThickness: 0,
					minimum: 0,
					title: "Соратники/противники",
					valueFormatString: "#0"
				}
			},
			global: {
				type: "stepLine",
				showInLegend: true
				//toolTipContent: "<a href={name}>{legendText}</a><br />{y}<br />{x}"
			},
			friends: {
				color: "rgba(12,143,221,.2)",
				axisYType: "secondary",
				type: "stepArea"
			},
			enemies: {
				color: "rgba(255,0,0,.2)",
				axisYType: "secondary",
				type: "stepArea"
			},
			plus: {
				visible: false
			},
			minus: {
				visible: false
			}
		},
		parameters: {
			options: {
				animationEnabled: false,
				//zoomEnabled: true,
				title: {
					//text: 'Параметры города'
				},
				theme: "theme2",
				culture: 'ru',
				axisX: {
					valueFormatString: "DD.MM"
				},
				axisY: {
					tickThickness: 1,
					gridThickness: 1,
					valueFormatString: "#0"
				},
				axisY2:{
					gridThickness: 0,
					tickThickness: 0,
					minimum: 0,
					maximum: 6000,
					title: "Товары",
					valueFormatString: "#0"
				}

			},
			global: {
				type: "line",
				showInLegend: true

				//toolTipContent: "<a href = {name}>{legendText}</a><br />{y}",

			},
			0: {
				sort: 100,
				//visible: false,
				//hide: true,
				label: "размер города",
				k: 10
			},
			1: {
				sort: 100,
				//visible: false,
				//hide: true,
				label: "размер экономики",
				k: 10
			},
			2: {
				sort: 100,
				visible: false,
				//hide: true,
				label: "радиус владений",
				k: 10
			},
			3: {
				sort: 100,
				visible: false,
				//hide: true,
				label: "радиус изменений",
				k: 10
			},
			4: {
				sort: 50,
				//visible: false,
				label: "стабильность"
			},
			5: {
				sort: 90,
				//visible: false,
				label: "производство"
			},
			6: {
				sort: 10,
				color: "rgba(12,143,221,.2)",
				axisYType: "secondary",
				type: "area",
				label: "товары"
			},
			7: {
				sort: 120,
				hide: true,
				label: "дары Хранителей"
			},
			8: {
				sort: 20,
				label: "безопасность"
			},
			9: {
				sort: 30,
				label: "транспорт"
			},
			10:{
				sort: 40,
				label: "свобода"
			},
			11:{
				sort: 110,
				visible: false,
				label: "пошлина"
			}
		},



		modifiers: {
			options: {
				title: {
					//text: 'Специализация'
				},
				animationEnabled: false,
				theme: "theme2",
				culture: 'ru',
				axisX: {
					valueFormatString: "DD.MM"
				},
				axisY: {
					tickThickness: 1,
					gridThickness: 1,
					interval: 20,
					valueFormatString: "#"
				}
			},
			global: {
				type: "area",
				showInLegend: true
				//toolTipContent: "<a href={name}>{legendText}</a><br />{y}<br />{x}"
			}
		}
	};


	return _council;
})(window.app.pages.council || {});
