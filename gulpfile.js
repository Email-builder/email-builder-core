var gulp = require('gulp');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var es = require('event-stream');
var EmailBuilder = require('./lib/emailBuilder');
var emailBuilder = new EmailBuilder({});

// Run this task to create the `output` fixtures 
// to test against the `input` fixtures
gulp.task('inline', function(){
  return gulp.src(['test/fixtures/input/*.html'])
    .pipe(es.map(function(data, cb){
      emailBuilder.inlineCss(data.path)
        .then(function(html){
          data.contents = new Buffer(html);
          cb(null, data);
        })

    }))
    .pipe(gulp.dest('./test/fixtures/output'))
});


gulp.task('lint', function(){
  return gulp.src(['./lib/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('test', ['lint'] ,function () {
    return gulp.src(['test/specs/*.js'], {read: false})
        .pipe(mocha({reporter: 'spec'}));
});