process.title = 'the-tale-stats';
require('colors');
var extend = require('extend');
var fs = require('fs');
var util = require('util');
var Q = require('q');
var cheerio = require('cheerio');
var request = require('request');

var config = extend(require('./config.json'), require('./config-local.json'));

var moment = require('moment');
moment.locale('ru');

var readFile = Q.denodeify(fs.readFile);
var writeFile = Q.denodeify(fs.writeFile);
var removeFile = Q.denodeify(fs.unlink);
var mkdir = Q.denodeify(fs.mkdir);
var readdir = Q.denodeify(fs.readdir);

var FILE_ISO = 'YYYY-MM-DD[T]HH.mm.ss.SSS';
var humanFormatISO = 'YYYY.MM.DD HH:mm:ss:SSS';
//var map_version = '7292812-1414428095';
var map_version = '7306565-1414569899.651703';
var root = './data-json/';
var rootRaw = './data-json-raw/';
var places = JSON.parse(fs.readFileSync(root + 'places.json', 'utf-8'));
var verbose = JSON.parse(fs.readFileSync(root + 'verbose.json', 'utf-8'));
var players = JSON.parse(fs.readFileSync(root + 'players.json', 'utf-8'));
var clans = JSON.parse(fs.readFileSync(root + 'clans.json', 'utf-8'));
var councils = JSON.parse(fs.readFileSync(root + 'councils.json', 'utf-8'));



for (var placeId in places) {
	mkdir(rootRaw + 'cell/' + placeId + '/').catch(function() {});
	mkdir(rootRaw + 'place/' + placeId + '/').catch(function() {});
}


var GENDERS = verbose.genders;
var RACES = verbose.races;
var PROFS = verbose.profs;
var MASTERIES = verbose.masteries;


var startTimeMinutes = 50;
var wait = (startTimeMinutes - moment().minutes() + 60) % 60;

console.log('wait %s minutes', wait);
start();
setTimeout(function() {
	start();
	setInterval(start, 60*60*1000);
}, wait * 60 * 1000);

//processCells();
//processPlaces();

//var id = '13';
//var place = places[id];
//processCell(id, place)
//processPlace(id, place)
var processStartMoment;
var processStartTimeStr;
var lastLog;
function start() {
	processStartMoment = moment().second(0).millisecond(0);
	processStartTimeStr = processStartMoment.format(FILE_ISO);
	lastLog = {
		date: processStartTimeStr,
		placeLog: {},
		cellLog: {}
	};
	return Q()
		.then(processCells)
		.then(processPlaces)
		.then(function() {
			return writeFile(root + 'lastLog.json', JSON.stringify(lastLog));
		})
		.catch(logAppError('process'))
		.done();
}

function processCells() {
	console.log(time(), 'processCells'.green);
	var start = moment();
	var que = Q();
	for (var id in places) if (places.hasOwnProperty(id)) {
		//id = '17';
		var place = places[id];
		(function(id, place) {
			que = que.then(function() {
				return processCell(id, place);
			});
		}(id, place));
		//break;
	}
	que.then(function() {
		console.log(time(), 'processCells'.cyan, ' done in', moment().diff(start, 's'), 'seconds')
	});
	que.catch(logAppError('processCells'));
	return que;
}
function processPlaces() {
	console.log(time(), 'processPlaces'.green);
	var start = moment();
	var que = Q();
	for (var id in places) if (places.hasOwnProperty(id)) {
		//id = '13';
		var place = places[id];
		(function(id, place) {
			que = que.then(function() {
				return processPlace(id, place);
			});
		}(id, place));
		//break;
	}
	que.then(function() {
		return Q.all([
			writeFile(root + 'players.json', JSON.stringify(players)),
			writeFile(root + 'clans.json', JSON.stringify(clans)),
			writeFile(root + 'councils.json', JSON.stringify(councils)),
			writeFile(root + 'places.json', JSON.stringify(places))
		])
			.then(function() {
				console.log('players, clans, councils updated'.grey)
			})
			.catch(logAppError('wr'));
	});
	que.then(function() {
		console.log(time(), 'processPlaces'.cyan, ' done in', moment().diff(start, 's'), 'seconds')
	});
	return que;
}

function processPlace(id, place) {
	//console.log('processPlace', id, place.name);
	//process.stdout.write('processPlace ' + id + ' ' + place.name + '\r');
	process.stdout.write(id + ' ');
	var folder = rootRaw + 'place/' + id + '/';
	return requestPage('http://the-tale.org/game/map/places/' + id)
		.then(parsePlaceHtml)
//		.catch(logAppError('parsePlaceHtml'))
		.then(function(json) {
			lastLog.placeLog[id] = json;
			return writeFile(folder + processStartTimeStr + '.json', JSON.stringify(json));
		})
//		.catch(logAppError('32'))
		.then(function() {
			return compilePlaces(id);
		})
		.catch(logAppError('processPlace'))
}
function processCell(id, place) {
	//console.log('processCell', id, place.name);
	//process.stdout.write('processCell ' + id + ' ' + place.name + '\r');
	process.stdout.write(id + ' ');
	var pos = place.pos;
	var folder = rootRaw + 'cell/' + id + '/';
	return requestPage('http://the-tale.org/game/map/cell-info?x=' + pos.x + '&y=' + pos.y + '&_=' + (+new Date()))
		.then(parseCellHtml)
//		.catch(logAppError('parseCellHtml'))
		.then(function(json) {
			lastLog.cellLog[id] = json;
			return writeFile(folder + processStartTimeStr + '.json', JSON.stringify(json));
		})
//		.catch(logAppError('32'))
		.then(function() {
			return compileCells(id);
		})
		.catch(logAppError('processCell'))
}

function compilePlaces(id) {
	return compileFiles(rootRaw + 'place/', root + 'place/', id);
}
function compileCells(id) {
	return compileFiles(rootRaw + 'cell/', root + 'cell/', id);
}
//compileFiles('7');
function compileFiles(folderFrom, folderTo, id) {
	//console.log('compileFiles', folderFrom, folderTo, id)
	var folder = folderFrom + id + '/';
	return readdir(folder)
		.then(function(files) {
			var que = Q();
			var allData = [];
			files.sort().reverse();
			files.forEach(function(file) {
				que = que
					.then(function() { return readFile(folder + file) })
					//.catch(function(e) {console.log(41, e)})
					.then(function(data) {
						if (!data.toString() || data.toString() == 'undefined') {
							console.log('empty useless file'.red, folder + file);
							return removeFile(folder + file);
						}
						//console.log('then', folder + file)

						var json = JSON.parse(data);

						json.date = moment(file.replace('.json', ''), FILE_ISO).format();
						allData.push(json);
					})
			});
			que.then(function() {
				//console.log('ad', allData)
				return writeFile(folderTo + id + '.json', JSON.stringify(allData));
			})
				.catch(logAppError('compileFilesQue'));
			return que;
		});
}


function requestPage(url) {
	var defer = Q.defer();
	var options = {
		url: url
	};
	request(options, function(err, res, body) {
		if (err) {
			console.error('err', err);
			defer.reject(err);
		} else {
			defer.resolve(body);
		}
	});

	return defer.promise;
}


function parseCellHtml(body) {
	var $ = cheerio.load(body);
	var parameters = parseTable('parameters', '#pgf-cell-place-parameters');
	var modifiers = parseTable('modifiers', '#pgf-cell-place-modifiers');
	var data = {
		parameters: parameters,
		modifiers: modifiers
	};
	var spec = parseSpec('#pgf-cell-place-modifiers .pgf-current-modifier-marker');
	if (spec>=0) data.spec = spec;
//	console.log('parseCellHtml', data)
	return data;

	function parseSpec(selector) {
		var specText = $(selector).parent().text().trim();
		//console.log(specText);
		return verbose.modifiers.indexOf(specText);
	}
	function parseTable(type, selector) {
		var $cityParamsRows = $(selector).find('tr');
		var data = {};
		$cityParamsRows.each(function(index, item) {
			var $row = $(item);
			var key = $row.children('th').first().text().trim();
			data[key] = parseFloat($row.children('td').first().text());
		});

		var result = [];
		verbose[type].forEach(function(key) {
			var val = data[key];
			if (val === undefined) console.log(type, ': not found "', key, '" in : ', data);
			result.push(val);
		});

		return result;
	}
}


function parsePlaceHtml(body) {
	var $ = cheerio.load(body);
	var isFrontier = $('.pgf-frontier-message').length;

	var result = {};
	var placeId = +$('.accordion-toggle').eq(0).attr('href').replace('#pgf-place-', '');
	$('.accordion-group').each(function() {
		var $group = $(this);
		var $body = $group.find('.accordion-body');
		var id = $body.attr('id').replace('pgf-person-', '') | 0;
		var $tds = $group.find('.table-condensed tbody td');
		if (id) {
			var council = parseCouncil($group.find('.accordion-toggle'), id);
		} else {
			var council = parseTown($group.find('.accordion-toggle'))
		}
		var friends = parsePlayersList($tds.filter(':nth-child(1)'));
		var enemies = parsePlayersList($tds.filter(':nth-child(2)'));
		if (friends.length) council.friends = friends;
		if (enemies.length) council.enemies = enemies;
		result[id] = council;

		$tds.each(parsePlayer);});

	//console.log(players);
	//console.log(clans);
	//console.log(councils);

//	console.log('parsePlaceHtml', result);
	return result;

	function parseTown($div) {
		var id = $div.attr('href').replace('#pgf-place-', '');
		if (isFrontier) {
			places[id].frontier = 1;
		} else {
			delete places[id].frontier;
		}
		var $a = $div.children('a');
		var info = $a.children('small').text().trim();
		var split = info.replace(/[^\d\.]+/g, ',').split(',');
		var plus = +split[2];
		var minus = +split[3];
		return {
			plus: plus,
			minus: minus
		}
	}
	function parseCouncil($div, id) {
		var $a = $div.children('a');
		var name = $a.contents().eq(0).text().trim();
		var info = $a.children('small').text().trim();
		var split = info.replace(' и ', ',').replace('соратников/противников', ',').replace(/[%\s]+/g, '').split(/[-,:]/);
		var race = split[0];
		var prof = split[1];
		var mastery = split[2];
		var inf = +split[4];
		var plus = +split[6];
		var minus = +split[7];
		councils[id] = [name, placeId, RACES.indexOf(race), PROFS.indexOf(prof), MASTERIES.indexOf(mastery)];
		return {
			inf: inf,
			plus: plus,
			minus: minus
		}
	}

	function parsePlayer(index, td) {
		var $td = $(td);
		var $a = $td.children('a');
		if (!$a.length) return;
		var id = +$a.eq(0).attr('href').replace('/game/heroes/', '');
		var $content = $td.contents();
		var kind = $content.eq(0).text().trim().split('-');
		var gender = kind[0];
		var race = kind[1];
		var hero = $a.eq(0).text().trim();
		var level = parseInt($content.eq(2).text());
		var name = $a.eq(1).text().trim();
		var clanId = 0;
		if ($a.eq(2).length) {
			clanId = +$a.eq(2).attr('href').replace('/accounts/clans/', '');
			clans[clanId] = $a.eq(2).text().trim();
		}

		if (!players[id]) console.log(hero, level, name, clans[clanId] || '', GENDERS.indexOf(gender), RACES.indexOf(race));
		players[id] = [hero, level, name, clanId, GENDERS.indexOf(gender), RACES.indexOf(race)];
	}
	function parsePlayersList($tds) {
		var list = [];
		$tds.each(function() {
			var href = $(this).children('a').first().attr('href');
			if (!href) return;
			list.push(+href.replace('/game/heroes/', ''));
		});
		return list;
	}
}



function logAppError(label) {
	return function(e) {
		console.log(time(), label.gray, e.message.red, '\n', e.stack.gray);
	}
}

function time() {
	return ('[' + moment().format('MMM DD HH:mm:ss') + ']').grey;
}

//remapStart();
//var id = '13';
//var place = places[id];
//remap(id, place)
//compileFiles(rootRaw + 'cell/', root + 'cell/', id);

function remapStart() {
	var start = moment();
	var que = Q();
	for (var id in places) if (places.hasOwnProperty(id)) {
//		id = '13';
		id = +id;
//		if (!(id>1 && id<10)) continue;

		var place = places[id];
		(function(id, place) {
			que = que.then(function() {
				return remap(id, place);
			});
		}(id, place));
//		break;
	}

	que.catch(logAppError('remap'));
	return que;
}

//remap(17, places[17]);

function remap(id, place) {
	console.log('remap', id);
	var folder = rootRaw + 'place/' + id + '/';
	var lastModifiers;
	var order;
	return readdir(folder)
		.then(function(files) {
			var que = Q();
			files.sort();//.reverse();
			var lastDate;
			var lastSaved = moment([1900]);
			files.forEach(function(file) {
				que = que
					.then(function() { return readFile(folder + file) })
					//.catch(function(e) {console.log(41, e)})
					.then(JSON.parse)
					.then(function(json) {
						var date = moment(file.replace('.json', ''), FILE_ISO);
						var lastUpdated = moment(date).minute(50).second(0).millisecond(0);
						if (date.minute() < startTimeMinutes) lastUpdated.add(-1, 'h');

						var diff = lastDate ? date.diff(lastDate, 'm') : 0;
						var toSave = lastUpdated.diff(lastSaved, 'm') > 0;
						date.second(0).millisecond(0);
						if (toSave) {
							fs.renameSync(folder + file, folder + date.format(FILE_ISO) + '.json')
						} else {
							fs.unlinkSync(folder + file);
						}
//						console.log(date.format(humanFormatISO)[toSave ? 'red' : 'white'], lastSaved.format(humanFormatISO), lastUpdated.format(humanFormatISO), diff)
//						console.log(date.isBefore('2014-11-03T17'), '>', modifiers.join(', '))
//						return writeFile(folder + file, JSON.stringify(json));
						lastSaved = lastUpdated;
						lastDate = date;
					})
					.catch(logAppError('42'));
			});
			que.then(function() {
				//console.log('ad', allData)
//				return writeFile(folderTo + id + '.json', JSON.stringify(allData));
			})
				.catch(logAppError('43'));
			return que;
		});
}

//var brokeDateStr = '2014-11-03T17:00';
//var brokeDate = moment(brokeDateStr);

//var id = 8;
//resort(id, places[id])
//setTimeout(function() {
//	compileCells(id)
//		.then(function() {
//			console.log('compile done')
//		});
//}, 5000);
function resort(id, place) {
	console.log('remap', id);
	var folder = rootRaw + 'cell/' + id + '/';
	var lastModifiers;
	var order;
	return readdir(folder)
		.then(function(files) {
			files.sort().reverse();
			var lastDate;
			var okDate;
			var okFile;
			var order;
			var order1;
			files.some(function(file) {
				var date = moment(file.replace('.json', ''), FILE_ISO);
				if (date.diff(brokeDate) > 0) {
					okFile = file;
					okDate = date;
					return;
				}
				if (!order) {
					var dataOrder = JSON.parse(fs.readFileSync(folder + okFile, 'utf8'));
					var modifiers = dataOrder.modifiers;
					order1 = modifiers.map(function(item, i) { return {i: i, item: item}});
					order1.sort(function(a,b) {return b.item - a.item});
					console.log('order1', j(order1));
					order = [];
					order1.forEach(function(ord, i) { order[ord.i] = {i: i, item: ord.item}; });
					console.log('order', j(order));
					console.log(j(order));
					console.log('ok', j(modifiers));
					console.log('sr', (modifiers.sort(function(a,b) { return b-a}) + '').gray);
				}
				var data = JSON.parse(fs.readFileSync(folder + file, 'utf8'));
				modifiers = data.modifiers;
				modifiers.sort(function(a,b) { return b-a});
				var newModifiers = order.map(function(ord) { return modifiers[ord.i]; });
				console.log('orig', (modifiers + '').gray);
				console.log('res ', j(newModifiers), date.format());
				data.modifiers = newModifiers;
				fs.writeFile(folder + file, JSON.stringify(data));
			});
		})
		.catch(logAppError('resort'));
}

function j(obj) {
	return util.inspect(obj, {colors: true}).replace(/\s+/g, ' ');
}