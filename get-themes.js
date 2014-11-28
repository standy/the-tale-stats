process.title = 'the-tale-stats';
require('colors');
var extend = require('extend');
var fs = require('fs');
var util = require('util');
var Q = require('q');
var cheerio = require('cheerio');
var proxy = 'http://proxy.ozon.ru:3128/';
//var request = require('request');
var request = require('request').defaults({proxy: proxy});
//request.debug = true;

var host = 'http://bootswatch.com/';
requestPage(host)
	.then(function(body) {
		var $ = cheerio.load(body);
//		console.log(123, $('a').eq(1).attr('href'));
		var que = Q();
		$('a:contains("Download")').siblings('.dropdown-menu').each(function(i) {
			var $ul = $(this);
			var $a = $ul.find('a').eq(1);
			var href = $a.attr('href');
			var name = href.split('/')[0];
			que = que.then(function() {
				return requestPage(host + href)
					.then(function(body) {
						fs.writeFile('static/css/themes/bootstrap.' + name + '.min.css', body);
					})
			})
		})
	});


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


function j(obj) {
	return util.inspect(obj, {colors: true}).replace(/\s+/g, ' ');
}