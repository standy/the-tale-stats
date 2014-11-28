var gulp = require('gulp');
var ghpages = require('gulp-gh-pages');
var ghpagesOptions = {cacheDir: '../gh-cache'};

gulp.task('deploy', function () {
	return gulp.src(['./data-json/**/*', './static/**/*', './tpl/**/*', './index.html'], {base: './'})
		.pipe(ghpages(ghpagesOptions));
});



var swig = require('gulp-swig');
var fs = require('fs');
//var watch = require('gulp-watch');
//var rm = require('gulp-rimraf');
var places = require('./data-json/places.json');
var themes = fs.readdirSync('static/css/themes');
var options = {
	defaults: {cache: false},
	data: {
		places: places,
		themes: themes
	}
};

gulp.task('template',  function() {
	return gulp.src(['./index.swig'])
		.pipe(swig(options))
		.pipe(gulp.dest('./'));
});
gulp.task('start', function() {
	return gulp.src('./index.swig')
        .pipe(watch('./index.swig', function(files) {
			console.log('watch');
			return files.pipe(swig(options));
		}))
});
gulp.task('clean', function() {
	return gulp.src(['./index.html'])
		.pipe(rm());
});

gulp.task('watch', function() {
	gulp.watch('./index.swig', ['template']);
});
