// include gulp
var gulp = require('gulp');
 
// include plug-ins
var changed = require('gulp-changed');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-minify-css');
 
// JS minify
gulp.task('scripts', function() {
  gulp.src(['./js/*.js'])
    .pipe(uglify())
    .pipe(gulp.dest('./build/js/'));
});

// CSS concat and minify
gulp.task('styles', function() {
  gulp.src(['./css/*.css'])
    .pipe(concat('styles.css'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('./build/css/'));
});

// default gulp task
gulp.task('default', ['scripts', 'styles'], function() {
});
