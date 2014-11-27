var gulp = require('gulp');
var fs = require('fs');

var shell = require('gulp-shell');
//var es = require('event-stream');
//var rseq = require('gulp-run-sequence');
//var ghpages = require('gulp-gh-pages');


gulp.task('generate', shell.task([
	'node generate.js'
]));

gulp.task('watch', function() {
	gulp.watch('./tpl/*.swig', ['generate']);
	gulp.watch('./generate.js', ['generate']);
});


gulp.task('deploy', function () {
	return gulp.src('./example/**/*')
		.pipe(ghpages());
});

gulp.task('min', function() {
    return gulp.src(['./jquery.custom-scroll.js'])
        .pipe(uglify({
            preserveComments: function(node, comment) {
                return comment.pos === 0;
            }
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./'));
});




/* examples build */
gulp.task('copy-js', function() {
	return es.merge(
		pipe(['./jquery.custom-scroll.js'], './example-src/js'),
		pipe(['./jquery.custom-scroll.js'], './example/js')
	);
});

gulp.task('copy-css', function() {
	return es.merge(
		pipe(['./jquery.custom-scroll.css'], './example-src/css'),
		pipe(['./jquery.custom-scroll.css'], './example/css')
	);
});


var sizes = {};
function saveSizes(newSizes)  {
	for (var key in newSizes) if (newSizes.hasOwnProperty(key)) {
		sizes[key] = newSizes[key].pretty;
	}
}
gulp.task('sizes', ['min'], function() {
	return gulp.src(['./jquery.custom-scroll.css', './jquery.custom-scroll.js', './jquery.custom-scroll.min.js'])
		.pipe(size({showFiles: true, gzip: false}, saveSizes))
		.pipe(size({showFiles: true, gzip: true}, saveSizes))
});


gulp.task('copy', function() {
	return es.merge(
		pipe(['./example-src/css/**'], './example/css'),
		pipe(['./example-src/js/**'], './example/js')
	);
});
gulp.task('index', ['min', 'sizes'], function() {
	var data = {
		sizes: sizes,
		files: {}
	};
	var types = {
		js: 'javascript',
		css: 'css',
		html: 'markup'
	};
	[
		'code-block/include.html',
		'code-block/how-it-works.html',
		'code-block/init.js',
		'code-block/api.js',
		'css/jquery.custom-scroll-tiny.css',
		'js/example-advanced.js'
	]
		.forEach(function(filename) {
			var file = fs.readFileSync('./example-src/' + filename, 'utf8');
			var type = filename.split('.').pop();
			var filePrism = prism.highlight(file, prism.languages[types[type]]);
			var filePrismNum = '<ol><li>' + filePrism.split('\n</span>').join('</span>\n').split('\n').join('</li><li>') + '</li></ol>';
			data.files[filename] = filePrismNum;
		});
	return gulp.src('./example-src/index.html')
		.pipe(template(data))
		.pipe(rename('index.html'))
		.pipe(gulp.dest('./example/'));
});





function pipe(src, transforms, dest) {
	if (typeof transforms === 'string') {
		dest = transforms;
		transforms = null;
	}

	var stream = gulp.src(src);
	transforms && transforms.forEach(function(transform) {
		stream = stream.pipe(transform);
	});

	if (dest) {
		stream = stream.pipe(gulp.dest(dest));
	}

	return stream;
}
