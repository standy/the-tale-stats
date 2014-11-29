window.app.pages.place = (function(_place) {
	_place.init = init;
	function init(placeId) {
		var place = app.json.places[placeId];

		var title = place.name;
		app.dom.title(title);
		app.dom.nav('place', placeId);
		app.dom.breadcrumb('place', placeId);

		$.when(
			app.getJson('place/' + placeId),
			app.getJson('cell/' + placeId),
			app.getTmpl('place/table'),
			app.getTmpl('place/councils-table'),
			app.getTmpl('utils/place-short'),
			app.getTmpl('utils/council-short'),
			app.getTmpl('utils/council'),
			app.getTmpl('utils/player'),
			app.getTmpl('utils/player-short'),
			app.getTmpl('utils/player-event')
		)
			.done(function(placeLogs, cellLogs) {
				draw(placeLogs, cellLogs, placeId);
			});
	}

	function draw(placeLogs, cellLogs, placeId) {
		var place = app.json.places[placeId];
		var spec = cellLogs[0].spec;
		var header = place.name;
		if (spec>=0) {
			header = app.json.verbose.modifiers[spec] + ' ' + header;
		}
		header +=
			' <small>(<a target="_blank" href="http://the-tale.org/game/map/places/' + placeId + '">подробнее</a>, ' +
			'<a target="_blank" href="http://the-tale.org/game/map/cell-info?x=' + place.pos.x + '&y=' + place.pos.y + '">на карте</a>)</small>';
		app.dom.header(header);

		var html = '';
		html += drawCouncils(placeLogs, placeId);

		html += drawTable('parameters', cellLogs[0]);
		html += drawTable('modifiers', cellLogs[0], 1);
		html += drawHistoryPlayers(placeLogs, cellLogs);

		app.dom.content(html);
		//window.setTimeout(function() {
		initChart('councils', placeLogs, cellLogs);
		initChart('parameters', placeLogs, cellLogs);
		initChart('modifiers', placeLogs, cellLogs);
		//});
	}

	function drawCouncils(placeLogs, placeId) {
		var html = '<h2>Советники</h2>';
		html += drawCouncilsTable(placeLogs, placeId);
		return html
	}

	function drawCouncilsTable(placeLogs, placeId) {
		var placeLog = placeLogs[0];
		//hash => array
		var councilsList = [];
		$.each(placeLog, function(councilId, council) {
			if (councilId == 'date') return;
			councilId = +councilId;
			var councilData = $.extend({id: councilId}, council);
			['friends', 'enemies'].forEach(function(relation) {
				if (!council[relation]) return;
				var councilRelation = council[relation].map(function(playerId) {
					var date = lastPresentInLogs(playerId, councilId, relation, placeLogs);
					var days = moment().diff(date || app.logStart, 'd');
					return {
						id: playerId,
						html: app.draw.playerShort(playerId),
						days: days,
						daysStr: (date ? '' : '>') + app.utils.pluralize(days, ['день', 'дня', 'дней'], ' ')
					}
				});
				councilRelation.sort(function(a,b) { return b.days - a.days});
				councilData[relation] = councilRelation;
			});

			if (councilId) {
				councilData.councilHtml = app.draw.councilShort(councilId, council)
			} else {
				councilData.townHtml ='Город ' + app.draw.placeShort(placeId);
			}
			councilsList.push(councilData)
		});
		councilsList.sort(function(a, b) {
			if (!a.id) return -1;
			if (!b.id) return 1;
			return b.inf - a.inf;
		});
		return app.tmpl['place/councils-table']({ councils: councilsList });
		//return html;
	}

	function lastPresentInLogs(playerId, councilId, relation, placeLogs) {
		var lastPresent = 'test';
		for (var i=0; i<placeLogs.length; i++) {
			var placeLog = placeLogs[i];
			var players = placeLog[councilId] && placeLog[councilId][relation];
			if (players && players.indexOf(playerId) < 0) return lastPresent;
			lastPresent = placeLog.date;
		}
	}

	// полная история игроков по городу (события)
	function drawHistoryPlayers(placeLogs, cellLogs) {
		var lastCouncils = {};
		var logs = [];
		placeLogs.forEach(function(placeLog, i) {
			var date = placeLog.date;
			//var eventHtml = '';
			var events = [];
			$.each(placeLog, function(councilId, council) {
				if (councilId == 'date') return;
				councilId = +councilId;
				if (lastCouncils[councilId]) {
					var diffFriends = app.utils.arrayDiff(lastCouncils[councilId].friends, council.friends);
					if (diffFriends.add.length)    {events.push(drawEventPlayers(diffFriends.add   , councilId, 1, 1)); }
					if (diffFriends.remove.length) {events.push(drawEventPlayers(diffFriends.remove, councilId, 1, 0)); }

					var diffEnemies = app.utils.arrayDiff(lastCouncils[councilId].enemies, council.enemies);
					if (diffEnemies.add.length)    {events.push(drawEventPlayers(diffEnemies.add   , councilId, 0, 1)); }
					if (diffEnemies.remove.length) {events.push(drawEventPlayers(diffEnemies.remove, councilId, 0, 0)); }
				} else if (i>0) {
					events.push('<b>Ушел советник</b> ' + app.draw.councilShort(councilId) + '');
				}
				lastCouncils[councilId] = council;
			});
			if (i>0) {
				$.each(placeLogs[i-1], function(prevCouncilId) {
					if (!placeLog[prevCouncilId]) {
						events.push('<b>Пришел советник</b> ' + app.draw.councilShort(prevCouncilId) + '');
					}
				})
			}

			if (events.length) {
				logs.push({
					date: date,
					events: events
				});
				//html += '<dt>' + moment(date).format() + '</dt>' + eventHtml;
			}
		});

		var firstCellLog;
		cellLogs.forEach(function(cellLog) {
			var date = cellLog.date;
			if (firstCellLog && firstCellLog.spec != cellLog.spec) {
				if (!cellLog.spec && firstCellLog.spec>=0) {
					if (moment(date).diff(app.logStartSpec) > 0 )
					var event = 'Новая специализация "' + app.json.verbose.modifiers[firstCellLog.spec] + '"';
				} else if (cellLog.spec >= 0 && !firstCellLog.spec) {
					event = 'Утрачена специализация "' + app.json.verbose.modifiers[cellLog.spec] + '"';
				} else if (cellLog.spec >= 0 && firstCellLog.spec>=0) {
					event = 'Специализация изменилась на "' + app.json.verbose.modifiers[firstCellLog.spec] + '"';
				}
				logs.push({
					date: date,
					events: [event]
				})
			}
			firstCellLog = cellLog;
		});
		logs.sort(function(a, b) {
			return new Date(b.date) - new Date(a.date);
		});

		return '<h2>События</h2>' + app.draw.playersLog(logs);

		function drawEventPlayers(players, councilId, isFriend, isAdded) {
			return players.map(function(playerId) {
				return app.draw.playerEvent(playerId, councilId, isFriend, isAdded)
			}).join('');
		}
	}



	// таблицы параметры и специализация
	function drawTable(type, cellLog, doSort) {
		var data = cellLog[type].map(function(item, index) {
			return {
				key: app.json.verbose[type][index],
				value: item
			};
		});
		if (doSort) {
			data.sort(function(a, b) {
				return b.value - a.value;
			});
		}

		return app.tmpl['place/table']({
			type: type,
			verbose: app.json.verbose,
			data: data
		});
	}








	app.charts = app.charts || {};

	function initChart(type, placeLogs, cellLogs) {
		var chartData = [];
		var verbose = app.json.verbose[type];
		var sets = chartsSettings[type];
		if (type === 'councils') {
			var currCouncils = placeLogs[0];
			var councilsList = [];
			// hash => array
			for (var councilId in currCouncils) if (currCouncils.hasOwnProperty(councilId) && councilId != '0' && councilId != 'date') {
				councilsList.push({
					id: councilId,
					data: currCouncils[councilId]
				});
			}
			councilsList.sort(function(a, b) {
				return b.data.inf - a.data.inf;
			});

			for (var i=0; i<councilsList.length; i++) {
				var councilId = councilsList[i].id;
				var council = app.json.councils[councilId];
				var cdata = $.extend(true, {legendText: council[0]}, sets.global);
				cdata.dataPoints = placeLogs.map(function(placeLog) {
					var council = placeLog[councilId] || false;
					return {
						x: new Date(placeLog.date),
						y: council.inf
					}
				});
				if (!cdata.hide) chartData.push(cdata);
			}
		} else {
			for (var param = 0; param < verbose.length; param++) {
				var cdata = $.extend(true, {legendText: verbose[param]}, sets.global, sets[param]);
				var k = +cdata.k || 1;
				cdata.dataPoints = cellLogs.map(function(cellLog) {
					var val = cellLog[type][param];
					return {
						x: new Date(cellLog.date),
						y: val * k
					}
				});
				if (!cdata.hide) chartData.push(cdata);
			}
			if (type == 'modifiers') {
//				chartData.sort(function(a,b) {
//					return b.dataPoints[0].y - a.dataPoints[0].y;
//				});
				var max = cellLogs[0].modifiers.slice(0).sort(function(a,b) { return b-a;});
				chartData.forEach(function(item) { item.visible = item.dataPoints[0].y >= max[3] && item.dataPoints[0].y > 0; })
			}

			if (type == 'parameters') {
				chartData.sort(function(a,b) {
					return a.sort - b.sort;
				});
			}
		}

		var defaultOptions = {
			toolTip: {
				content: function(e) {
					var entry = e.entries[0];
					var k = entry.dataSeries._options.k || 1;
					return '<a href="">'+entry.dataSeries.legendText+'</a><br />' +
						Math.round(entry.dataPoint.y/k) + '<br />' +
						moment(entry.dataPoint.x).format();
				}
			},
			legend: {
				cursor: "pointer",
				itemclick: function(e) {
					e.dataSeries.visible = e.dataSeries.visible===false;
					chart.render();
				}
			}
		};
		var options = $.extend(true, {}, app.chartsSettingsGlobal.options, defaultOptions, sets.options, {data: chartData});



		var chart = new CanvasJS.Chart('chart-' + type, options);
		app.charts[type] = chart;
		chart.render();
	}


	var chartsSettings = {
		councils: {
			options: {
				axisY: {
					interval: 20,
					minimum: 0,
					maximum: 100,
					valueFormatString: "#"
				}
			},
			global: {
				type: "stackedArea",
				showInLegend: true
				//toolTipContent: "<a href={name}>{legendText}</a><br />{y}<br />{x}"
			}
		},


		parameters: {
			options: {
				axisY: {
					valueFormatString: "#0"
				},
				axisY2:{
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
			6: {
				sort: 10,
				color: "rgba(12,143,221,.2)",
				axisYType: "secondary",
				type: "area",
				label: "товары"
			},
			0: {
				sort: 100,
				//visible: false,
				//hide: true,
				type: 'stepLine',
				label: "размер города",
				k: 10
			},
			1: {
				sort: 100,
				//visible: false,
				//hide: true,
				type: 'stepLine',
				label: "размер экономики",
				k: 10
			},
			2: {
				sort: 100,
				visible: false,
				//hide: true,
				type: 'stepLine',
				label: "радиус владений",
				k: 10
			},
			3: {
				sort: 100,
				visible: false,
				//hide: true,
				type: 'stepLine',
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
				visible: false,
				label: "производство"
			},
			7: {
				sort: 120,
//				hide: true,
				visible: false,
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
				type: 'stepLine',
				label: "пошлина"
			}
		},



		modifiers: {
			options: {
				axisY: {
					interval: 20,
//					minimum: 0,
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



	return _place;
})(window.app.pages.place || {});