var gulp = require('gulp');
var jscs = require('gulp-jscs');
var gutil = require('gulp-util');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var es = require('event-stream');

var options = {
  emailTest : {
    email : process.env.GMAIL_USER,
    subject : 'Email Subject',
    nodemailer: {
      transporter: {
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS
        }
      }
    }
  },
  litmus : {
    subject : 'Custom subject line',
    username : process.env.LIT_USER,
    password : process.env.LIT_PASS,
    url : process.env.LIT_URL,
    applications : ['gmailnew', 'hotmail', 'outlookcom', 'ol2000', 'ol2002', 'ol2003', 'ol2007', 'ol2010','ol2011', 'ol2013', 'appmail8', 'iphone5', 'ipad3']
  },
  encodeSpecialChars: true,
};

var EmailBuilder = require('./lib/emailBuilder');


gulp.task('email', function() {
  var emailBuilder = new EmailBuilder(options);
  return gulp.src(['test/fixtures/input/embedded_styles_inlined.html'])
    .pipe(es.map(function(data, cb) {

      emailBuilder.sendEmailTest(data.contents)
        .then(function() {
          cb(null, data);
        });

    }));
});

gulp.task('litmus', function() {
  var emailBuilder = new EmailBuilder(options);
  return gulp.src(['test/fixtures/input/embedded_styles_inlined.html'])
    .pipe(es.map(function(data, cb) {
      emailBuilder.sendLitmusTest(data.contents)
        .then(function() {
          cb(null, data);
        });

    }));
});

// Run this task to create the `output` fixtures
// to test against the `input` fixtures
gulp.task('inline', function() {
  var emailBuilder = new EmailBuilder(options);
  return gulp.src(['test/fixtures/input/*.html'])
    .pipe(es.map(function(data, cb) {

      emailBuilder.inlineCss(data.path)
        .then(function(html) {
          data.contents = new Buffer(html);
          cb(null, data);
        });

    }))
    .pipe(gulp.dest('./test/fixtures/output'));
});

gulp.task('lint', function() {
  return gulp.src(['./lib/**/*.js', 'gulpfile.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jscs());
});

gulp.task('test', ['lint'], function() {
  return gulp.src(['test/specs/*.js'], {read: false})
        .pipe(mocha({reporter: 'spec'}));
});

gulp.task('watch', function() {
  return gulp.watch(['./lib/**/*.js', 'gulpfile.js'], ['test']);
});
