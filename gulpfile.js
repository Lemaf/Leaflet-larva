var gulp = require('gulp');

var SOURCES = {
	JS: [
		'L.larva.js',
		'handler/Polyline.Resize.js',
		'handler/Polyline.Move.js'
	]
};

gulp.task('lint:javascript', function () {

	var jshint = require('gulp-jshint');

	return gulp.src('src/js/**/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter('default', {verbose: true}))
		.pipe(jshint.reporter('fail'));

});

gulp.task('clean:javascript', function () {

	var del = require('del')

	return del([
		'dist/*.js',
		'dist/*.js.map'
	]);
});

gulp.task('concat:javascript', ['lint:javascript'], function () {

	var cached = require('gulp-cached'),
	concat = require('gulp-concat'),
	remember = require('gulp-remember'),
	resolveDeps = require('gulp-resolve-dependencies'),
	sourcemaps = require('gulp-sourcemaps'),
	wrapJS = require('gulp-wrap-js'),
	path = require('path');

	var baseDir = path.join(process.cwd(), 'src', 'js');

	return gulp.src(SOURCES.JS, {cwd: 'src/js'})
		.pipe(resolveDeps())
		.pipe(sourcemaps.init())
		.pipe(cached('js'))
		.pipe(remember('js'))
		.pipe(concat('leaflet-larva.js'))
		.pipe(wrapJS('(function() {%= body %})()', {
			newline: '\n',
			indent: {
				adjustMultilineComment: true,
				style: '\t',
			}
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('dist/'));
});

gulp.task('uglify:javascript', ['concat:javascript'], function () {
	var rename = require('gulp-rename'),
	uglify = require('gulp-uglify');

	return gulp.src('dist/leaflet-larva.js')
		.pipe(uglify())
		.pipe(rename({extname: '-min.js'}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('test:javascript', ['lint:javascript'], function (done) {

	var karma = require('karma');

	new karma.Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
});

gulp.task('less:less', function () {

	var less = require('gulp-less'),
	path = require('path');

	return gulp.src('*.less', {cwd: 'src/less'})
		.pipe(less({
			paths: [path.join(__dirname, 'src', 'less', 'includes')]
		}))
		.pipe(gulp.dest('dist/'));
});

gulp.task('serve', ['concat:javascript', 'less:less'], function () {

	var connect = require('gulp-connect'),
	connectJade = require('connect-jade'),
	remember = require('gulp-remember'),
	url = require('url');

	var watcher = gulp.watch(['src/js/**/*.js'], ['concat:javascript']);

	var cached = require('gulp-cached');

	watcher.on('change', function (evt) {
		if (evt.type === 'deleted') {
			delete cached.caches.js[evt.path];
			remember.forget('js', evt.path);
		}
	});

	gulp.watch(['src/less/**/*.less'], ['less:less']);

	return connect.server({
		root: ['demos/', 'dist', 'bower_components'],
		port: 8090,
		middleware: function (connect, opt) {
			return [
				connectJade({
					root: __dirname + '/demos'
				}),

				function (req, res, next) {
					var path = url.parse(req.url).pathname;

					if (path.lastIndexOf(".jade") === path.length - 5)
						res.render(path.substring(1, path.length -5));
					else
						next();
				}
			]
		}
	});

});

gulp.task('build', ['test:javascript', 'uglify:javascript']);