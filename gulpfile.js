var gulp = require('gulp');
var ghpages = require('gulp-gh-pages');


gulp.task('deploy', function () {
	return gulp.src(['./data-json/**/*', './static/**/*', './tpl/**/*', 'index.html'])
		.pipe(ghpages());
});
