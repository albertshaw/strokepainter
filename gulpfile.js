var gulp = require('gulp');
var less = require('gulp-less');
var mincss = require('gulp-mini-css');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var through = require('through');
var gutil = require('gulp-util');
var path = require('path');
var minifyHTML = require('gulp-minify-html');

gulp.task('default', [ 'less', 'uglify', 'view' ]);

gulp.task('less', function() {
  gulp.src('src/less/strokepainter.less').pipe(less()).pipe(
      gulp.dest('src/css')).pipe(mincss()).pipe(gulp.dest('./css'));
});

gulp.task('watch', function() {
  var watcher = gulp.watch('src/less/*.less', ['less']);
  watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});

gulp.task('uglify', function() {
  gulp.src('src/js/*').pipe(uglify()).pipe(gulp.dest('./js'));
});

gulp.task('view', function() {
  gulp.src([ 'src/view/index.html', 'src/view/svgdefs.svg' ]).pipe(
      (function() {
        var view = null, defs = {}, content = "", reg = /\{\{([\s\S]+?)\}\}/g;
        return through(function(file, enc, cb) {
          if (file.isNull())
            return; // ignore
          if (file.isStream())
            return this.emit('error', new PluginError('my-view-test',
                'Streaming not supported'));
          if (!view) {
            view = file;
            content = view.contents.toString();
          } else {
            defs[path.basename(file.path)] = file.contents.toString();
          }
        }, function() {
          content = content.replace(reg, function(match, matchgroup) {
            return defs[matchgroup];
          });
          view.contents = new Buffer(content);
          this.emit('data', view);
          this.emit('end');
        });
      })()).pipe(gulp.dest('src')).pipe(minifyHTML({
    comments : false,
    spare : true
  })).pipe(gulp.dest('./'));

});

gulp.task('clean', function() {
  gulp.src('./*').pipe(clean({
    force : true
  }));
  gulp.src('src/css/*').pipe(clean({
    force : true
  }));
});