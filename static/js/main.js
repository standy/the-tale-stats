//[ноя 03 16:45:08]
moment.locale('ru');
moment.defaultFormat = 'YYYY.MM.DD HH:mm';
$.fn.customScroll({horizontal: false});

swig.setDefaults({ cache: false });
CanvasJS.addCultureInfo("ru", {
	decimalSeparator: ",",
	digitGroupSeparator: " ",
	shortMonths: 'янв_фев_мар_апр_май_июнь_июль_авг_сен_окт_ноя_дек'.split('_'),
	months: 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_')
});


var app = (function(app) {
	app.logStart = new Date(2014, 10, 1);
	app.logStartSpec = new Date(2014, 10, 3);
	/* загрузка данных */
	app.get = function(url) {
		var dfr = $.Deferred();
		$.ajax({url: '/the-tale-stats/' + url})
			.done(function(res) { dfr.resolve(res); })
			.fail(function(err) { dfr.reject(err); });
		return dfr;
	};
	app.json = {};
	app.getJson = function(url) {
		if (app.json[url]) {
			return deferResult(app.json[url]);
		} else {
			return app.get('data-json/' + url + '.json')
				.done(function(result) {
					if (url === 'clans') result[42] = result[42].replace(/█/g, '_');
					app.json[url] = result;
				});
		}

	};
	app.tmpl = {};
	app.getTmpl = function(url) {
		if (app.tmpl[url]) {
			return deferResult(app.tmpl[url]);
		} else {
			return app.get('tpl/' + url + '.swig')
				.done(function(tpl) {
					app.tmpl[url] = swig.compile(tpl, {
						filename: url + '.swig'
					})
				});
		}
	};

	app.getAllPlaceLogs = function() {
		var promises = [];
		$.each(app.json.places, function(placeId) {
			promises.push(app.getJson('place/' + placeId));
		});
		return $.when.apply($, promises);
	};
//	app.getAllCellLogs = function() {
//		var promises = [];
//		$.each(app.json.places, function(placeId) {
//			promises.push(app.getJson('cell/' + placeId));
//		});
//		return $.when.apply($, promises);
//	};
	/* eo загрузка данных */

	/* misc */
	function deferResult(result, delay) {
		var dfr = $.Deferred();
		window.setTimeout(function() {
			dfr.resolve(result);
		}, delay|0);
		return dfr;
	}
	app.utils = (function() {
		return {
			parseRequest: parseRequest,
			arrayCross: arrayCross,
			arrayAdds: arrayAdds,
			arrayDiff: arrayDiff
		};
		function arrayCross(list1, list2) {
			list1 = list1 || [];
			list2 = list2 || [];
			return list1.filter(function(item) {
				return list2.indexOf(item) >= 0;
			});
		}
		function arrayAdds(list1, list2) {
			list1 = list1 || [];
			list2 = list2 || [];
			return list1.filter(function(item) {
				return list2.indexOf(item) < 0;
			});
		}
		function arrayDiff(list1, list2) {
			return {
				add: arrayAdds(list1, list2),
				remove: arrayAdds(list2, list1)
			};
		}
		function parseRequest(str) {
			var params = {};
			if (!str) return false;
			var split = str.split('&');
			for (var i=0; i<split.length; i++) {
				var s = split[i];
				var p = s.split('=');
				params[p[0]] = p[1];
			}
			return params;
		}
	})();
	/* eo misc */




	/* загрузка словарей */
	window.setTimeout(prepare, 10);
	function prepare() {
		$.when(
			app.getJson('verbose'),
			app.getJson('players'),
			app.getJson('places'),
			app.getJson('councils'),
			app.getJson('clans')
		)
			.done(function() {
//				console.log('--ready--\n', app);
				readyCallbacks.forEach(function(fn) {
					fn.call(app);
				})
			});
	}
	/* eo загрузка словарей */


	var readyCallbacks = [route];
	app.ready = function(fn) {
		readyCallbacks.push(fn);
	};

	var routeTry = 0;
	function route() {
		var req = app.req = app.utils.parseRequest(window.location.hash.slice(1));
		try {
			if (!req) {
				app.pages.index();
			} else if ('place' in req) {
				app.pages.place.init(req.place);
			} else if ('places' in req) {
				app.pages.places.init();
			} else if ('council' in req) {
				app.pages.council.init(req.council);
			} else if ('councils' in req) {
				app.pages.councils.init();
			} else if ('clan' in req) {
				app.pages.clan.init();
			} else if ('clans' in req) {
				app.pages.clans.init();
			} else if ('player' in req) {
				app.pages.player.init();
			} else if ('players' in req) {
				app.pages.players.init();
			}
			routeTry = 0;
		} catch (e) {
			if (routeTry < 2) window.setTimeout(route, 1000);
			routeTry++;
		}
	}

	app.pages = {};
	app.pages.index = function() {
		dom.title('Обзор');
		dom.header('Обзор');
		dom.breadcrumb();
		var content = [
			'<a href="#places">Города</a>',
			'<a href="#councils">Советники</a>',
			'<a href="#players">Игроки</a>',
			'<a href="#clans">Кланы</a>'
		];
		dom.content(content.join('<br>'));
		dom.nav();
	};


	var dom = app.dom = {};
	dom.title = function(title) {
		document.title = (title ? title + ' — ' : '') + 'Сказочная статистика';
	};
	dom.content = function(html) {
		$('#content').html(html);
	};
	dom.header = function(html) {
		$('#header').html(html);
	};
	dom.breadcrumb = function(type, id) {
		var ids = Array.prototype.slice.call(arguments, 1);
		var bc = [{
			text: 'Сказочная статистика',
			href: '#'
		}];
		if (type === 'place') {
			bc.push({
				text: 'Города',
				href: '#places'
			});
			if (ids.length) bc.push({
				text: app.json.places[id].name,
				href: '#place=' + id
			});
		}
		if (type === 'council') {
			bc.push({
				text: 'Советники',
				href: '#councils'
			});
			if (ids.length>1) bc.push({
				text: app.json.places[ids[1]].name,
				href: '#place=' + ids[1]
			});
			if (ids.length) bc.push({
				text: 'Советник ' + app.json.councils[id][0],
				href: '#council=' + id
			});
		} else if (type === 'player') {
			bc.push({
				text: 'Игроки',
				href: '#players'
			});
			if (id) bc.push({
				text: '' + app.json.players[id][0],
				href: '#player=' + id
			});
		} else if (type === 'clan') {
			bc.push({
				text: 'Кланы',
				href: '#clans'
			});
			if (id) bc.push({
				text: app.json.clans[id],
				href: '#clan=' + id
			});
		}

		breadcrumb(bc);
		function breadcrumb(list) {
			var html = list.map(function(item) {
				return '<li><a href="' + item.href + '">' + item.text + '</a></li> '
			}).join('');
			$('#breadcrumb').html(html);
		}
	};
	dom.nav = function(type, id) {
		var $navPlaces = $('#nav-places').find('a');
		var $navTop = $('#nav-top').find('li');
		$navPlaces.removeClass('label label-primary label-default');
		$navTop.removeClass('active');
		if (type == 'places' || type == 'place') {
			if (id) selectPlace(id, 'primary');
			selectTopNav('place');
		} else if (type == 'councils' || type == 'council') {
			var placeId = arguments[2];
			if (placeId) selectPlace(placeId, 'default');
			selectTopNav('council');
		} else if (type == 'players' || type == 'player') {
			selectTopNav('player');
		} else if (type == 'clans' || type == 'clan') {
			selectTopNav('clan');
		}

		function selectTopNav(type) {
			$navTop.find('[data-type="' + type + '"]').parent().addClass('active');
		}
		function selectPlace(id, cls) {
			$navPlaces.filter('[href="#place=' + id + '"]').addClass('label label-' + cls);
		}
	};


	/* templates */
	app.draw = {};

	app.draw.councilShort = function(id) {
		//[name, placeId, RACES.indexOf(race), PROFS.indexOf(prof), MASTERIES.indexOf(mastery)];
		var council = app.json.councils[id];
		if (!council) return 'советник ' + id;
		var data = {
			id: id,
			name: council[0],
			placeId: council[1],
			raceId: council[2],
			profId: council[3],
			masteryId: council[4],
			race: app.json.verbose.races[council[2]],
			prof: app.json.verbose.profs[council[3]],
			mastery: app.json.verbose.masteries[council[4]]
		};
		return app.tmpl['utils/council-short'](data);
	};

	app.draw.council = function(id, councilData) {
		councilData = councilData || {};
		//[name, placeId, RACES.indexOf(race), PROFS.indexOf(prof), MASTERIES.indexOf(mastery)];
		var council = app.json.councils[id];
		if (!council) return 'советник ' + id;
		var data = {
			id: id,
			name: council[0],
			placeId: council[1],
			raceId: council[2],
			profId: council[3],
			masteryId: council[4],
			race: app.json.verbose.races[council[2]],
			prof: app.json.verbose.profs[council[3]],
			mastery: app.json.verbose.masteries[council[4]],
			council: councilData
		};
		return app.tmpl['utils/council'](data);
	};

	app.draw.player = function drawPlayer(id) {
		//(hero, level, name, clanId, genderId, raceId)
		var player = app.json.players[id];
		if (!player) return '<a target="_blank" href="http://the-tale.org/game/heroes/' + id +'">игрок ' + id + '</a>';
		var data = {
			id: id,
			hero: player[0],
			level: player[1],
			name: player[2],
			clanId: player[3],
			genderId: player[4],
			raceId: player[5],
			clan: app.json.clans[player[3]],
			gender: app.json.verbose.genders[player[4]],
			race: app.json.verbose.races[player[5]]
		};
		return app.tmpl['utils/player'](data);
	};

	app.draw.playerShort = function drawPlayerShort(id) {
		//(hero, level, name, clanId, genderId, raceId)
		var player = app.json.players[id];
		if (!player) return '<a target="_blank" href="http://the-tale.org/game/heroes/' + id +'">игрок ' + id + '</a>';
		var data = {
			id: id,
			hero: player[0],
			level: player[1],
			name: player[2],
			clanId: player[3],
			genderId: player[4],
			raceId: player[5],
			clan: app.json.clans[player[3]],
			gender: app.json.verbose.genders[player[4]],
			race: app.json.verbose.races[player[5]]
		};
		return app.tmpl['utils/player-short'](data);
	};

	app.draw.playerEvent = function(playerId, councilId, isFriend, isAdded, placeId) {
		var data = {
			player: app.draw.playerShort(playerId),
			isFriend: isFriend,
			isAdded: isAdded,
			councilId: councilId
		};
		if (councilId) {
			data.council = app.draw.councilShort(councilId);
		}
		if (placeId) {
			data.place = app.draw.placeShort(placeId);
		}
		return app.tmpl['utils/player-event'](data);
	};
	app.draw.playerEventByPlayer = function(playerId, councilId, isFriend, isAdded, placeId) {
		var data = {
//			player: app.draw.playerShort(playerId),
			isFriend: isFriend,
			isAdded: isAdded,
			councilId: councilId
		};
		if (councilId) {
			data.council = app.draw.councilShort(councilId);
		}
		if (placeId) {
			data.place = app.draw.placeShort(placeId);
		}
		return app.tmpl['utils/player-event'](data);
	};
	app.draw.playerEventByPlace = function(playerId, councilId, isFriend, isAdded) {
		var data = {
			player: app.draw.playerShort(playerId),
			isFriend: isFriend,
			isAdded: isAdded,
			councilId: councilId
		};
		if (councilId) {
			data.council = app.draw.councilShort(councilId);
		}
		return app.tmpl['utils/player-event'](data);
	};
	app.draw.playerEventByCouncil = function(playerId, councilId, isFriend, isAdded) {
		var data = {
			player: app.draw.playerShort(playerId),
			isFriend: isFriend,
			isAdded: isAdded,
			councilId: councilId
		};
		return app.tmpl['utils/player-event'](data);
	};

	app.draw.placeShort = function(placeId) {
		var place = app.json.places[placeId];
		var data = {
			id: placeId,
			name: place.name
		};
		return app.tmpl['utils/place-short'](data);
	};


	app.draw.playersLog = function drawLog(logs) {
		var lastDateStr;
		var html = logs.map(function(log) {
			var date = moment(log.date);
			var events = log.events;
			var result = '';
			var dateStr = date.format('D MMMM');
			if (!lastDateStr || lastDateStr !== dateStr) {
				result += '<dt class="date">' + dateStr + '</dt>';
				lastDateStr = dateStr
			}
			result += '<dt>' + date.format('HH:mm') + '</dt><dd>' + events.join('</dd><dd>') + '</dd>';
			return result;
		}).join('');

		if (!html) html += '<i>Нет записей</i>';
		return '<dl class="history-list dl-horizontal">' + html + '</dl>';
	};
	/* eo templates */


	/* filter func */
	app.utils.addFilterHandlers = function addFilterHandlers() {
		var $filter = $('#filter');
		$filter.on('change', 'input', function() {
			var params = getFilter();
			applyFilter(params);
		});
		var filterCols = $('#table').find('thead th').map(function() {return $(this).data('filter')||''; }).get();
		function applyFilter(params) {
			var $trs = $('#table').find('tbody tr');
			var count = 0;
			$trs.each(function() {
				var isInFilter = true;
				var $tr = $(this);
				var $tds = $tr.children();
				params.forEach(function(param) {
					if (!param.values.length) return;
					var col = filterCols.indexOf(param.filter);
					var val = $tds.eq(col).data('value');
					isInFilter = isInFilter && param.values.indexOf(val) >= 0;
				});
				$tr.toggle(isInFilter);
				if (isInFilter) count++;
			});
			$('#filter-count').html('всего: ' + count);
		}
		function getFilter() {
			return $('#filter').children('.form-group').map(function() {
				var $group = $(this);
				var values = $group.find('input:checked').map(function() {
					return $(this).data('value');
				}).get();
				if (values == 'all') values = [];
				return {
					filter: $group.data('filter'),
					values: values
				}
			}).get();
		}
	};
	/* eo filter func */






	app.ready(function() {
		$(window).on('hashchange', function() {
			route();
		});
	});

	$('body').on('mouseenter', 'a', function() {
		var $a = $(this);
		var href = $a.attr('href');
		$('a[href="' + href + '"]').not($a).addClass('hover');
		$a.on('mouseleave.hovershine', function() {
			$a.off('.hovershine');
			$('a[href="' + href + '"]').removeClass('hover');
		})
	});

	return app;
})(window.app || {});
//console.log(app)
