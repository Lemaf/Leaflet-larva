var gulp = require('gulp');

var SOURCES = {
	JS: [
		'L.larva.js',
		'handler/Polyline.Rotate.js',
		'handler/Polyline.Move.js',
		'handler/Polyline.Resize.js',
		'handler/Polyline.Edit.js',
		'handler/Polygon.Edit.js',
		'handler/New.Polyline.js',
		'handler/New.Polygon.js'

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

gulp.task('clean:jsdoc', function () {
	var del = require('del');

	return del([
		'dist/doc'
	]);
});

gulp.task('copy:images', function () {

	var copy = require('gulp-copy');

	return gulp.src(['*.png'], {cwd: 'imgs'})
		.pipe(copy('dist/'));
});

gulp.task('concat:javascript', ['lint:javascript'], function () {

	var concat = require('gulp-concat'),
	resolveDeps = require('gulp-resolve-dependencies'),
	sourcemaps = require('gulp-sourcemaps'),
	wrapJS = require('gulp-wrap-js'),
	path = require('path');

	return gulp.src(SOURCES.JS, {cwd: 'src/js', base: 'src/js'})
		.pipe(resolveDeps())
		.pipe(sourcemaps.init())
		.pipe(concat('leaflet-larva.js'))
		.pipe(wrapJS('(function () {%= body %})();', {
			newline: '\n',
			indent: {
				adjustMultilineComment: true,
				style: '\t',
			}
		}))
		.pipe(sourcemaps.write('./', {sourceRoot: 'l.larva'}))
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

gulp.task('jsdoc', ['clean:jsdoc'], function (cb) {

	var jsdoc = require('gulp-jsdoc3');

	gulp.src('src/js/**/*.js')
		.pipe(jsdoc({

			tags: {
				"allowUnknownTags": true
			},

			source: {
				excludePattern: "(^|\\/|\\\\)_"
			},

			opts: {
				destination: "dist/doc"
			},

			plugins: [
				"plugins/markdown"
			],

			templates: {

				cleverLinks: false,

				monospaceLinks: true,

				"default": {
					outputSourceFiles: true
				},

				path: "ink-docstrap",

				theme: "journal",

				navType: "vertical",

				linenums: true,

				dateFormat: "D/M/YYYY HH:mm:ss Z"
			}}, cb));

});

gulp.task('bower', function () {
	var bower = require('gulp-bower');

	return bower();
});

gulp.task('serve', ['concat:javascript', 'less:less', 'copy:images', 'bower'], function () {

	var connect = require('gulp-connect'),
	connectJade = require('connect-jade'),
	url = require('url');

	gulp.watch(['src/js/**/*.js'], ['concat:javascript']);
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

					if (path.lastIndexOf(".jade"	) === path.length - 5)
						res.render(path.substring(1, path.length -5));
					else
						next();
				}
			]
		}
	});

});

gulp.task('build', ['test:javascript', 'uglify:javascript']);