
var gulp = require('gulp');
var gls = require('gulp-live-server');
gulp.task('server', function() {
    var server = gls.static('.', 9191);
    server.start();
});