var gulp = require('gulp');

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
		'dist/*.js'
	]);
});

gulp.task('concat:javascript', ['lint:javascript', 'clean:javascript'], function () {

	var concat = require('gulp-concat'),
	resolveDeps = require('gulp-resolve-dependencies'),
	sourcemaps = require('gulp-sourcemaps');

	return gulp.src(['L.larva.js', 'handler/**/$*.js', 'handler/**/!($)*.js'], {cwd: 'src/js'})
		.pipe(resolveDeps())
		.pipe(sourcemaps.init())
		.pipe(concat('leaflet-larva.js', {newLine: '\n\n// ##### \n\n'}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('dist/'));

});

gulp.task('uglify:javascript', ['concat:javascript'], function () {

	var rename = require('gulp-rename'),
	uglify = require('gulp-uglify');

	return gulp.src('dist/*.js')
		.pipe(uglify())
		.pipe(rename({extname: '-min.js'}))
		.pipe(gulp.dest('dist'));
});

gulp.task('test:javascript', ['lint:javascript'], function (done) {

	var karma = require('karma');

	new karma.Server({
		configFile: __dirname + '/karma.conf.js',
		singleRun: true
	}, done).start();
});

gulp.task('serve', ['concat:javascript'], function () {

	var connect = require('gulp-connect'),
	connectJade = require('connect-jade'),
	url = require('url');

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
					if (path.endsWith(".jade"))
						res.render(path.substring(1, path.length -5));
					else
						next();
				}
			]
		}
	});

});