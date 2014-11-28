var gulp = require('gulp');
var ghpages = require('gulp-gh-pages');


gulp.task('deploy', function () {
	return gulp.src(['**/*', '!node_modules', '!node_modules/**/*', '!data-json-raw', '!data-json-raw/**/*', '!gulpfile.js', '!get-data.js', '!package.json'])
		.pipe(ghpages());
});
