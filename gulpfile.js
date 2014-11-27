var gulp = require('gulp');
var ghpages = require('gulp-gh-pages');
var ghpagesOptions = {cacheDir: '../gh-cache'};

gulp.task('deploy', function () {
	return gulp.src(['./data-json/**/*', './static/**/*', './tpl/**/*', './index.html'], {base: './'})
		.pipe(ghpages(ghpagesOptions));
});
