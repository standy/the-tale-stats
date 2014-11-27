var gulp = require('gulp');
var ghpages = require('gulp-gh-pages');


gulp.task('prepare', function () {
	return gulp.src(['data-json/**/*', 'static/**/*', 'tpl/**/*', 'index.html'], {base: './'})
		.pipe(gulp.dest('gh-pages'));
});
gulp.task('deploy2', ['prepare'], function () {
	return gulp.src('gh-pages/**/*')
		.pipe(ghpages());
});
gulp.task('deploy', function () {
	return gulp.src(['data-json/**/*', 'static/**/*', 'tpl/**/*', 'index.html'], {base: './', maxBuffer: 64 * 1024 * 1024})
		.pipe(ghpages());
});
