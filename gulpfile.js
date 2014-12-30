var gulp = require('gulp');
var less = require('gulp-less');
var mincss = require('gulp-mini-css');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var through = require('through');
var gutil = require('gulp-util');
var path = require('path');
var minifyHTML = require('gulp-minify-html');
var browserSync = require('browser-sync');
var filter = require('gulp-filter');

gulp.task('default', [ 'less', 'uglify', 'view' ]);

gulp.task('browser-sync', function() {
  browserSync({
    server : {
      baseDir : "./"
    }
  });
});

gulp.task('less', function() {
  gulp.src('src/less/strokepainter.less').pipe(less()).pipe(gulp.dest('src/css')).pipe(mincss()).pipe(
      gulp.dest('./css')).pipe(filter('**/*.css')).pipe(browserSync.reload({
    stream : true
  }));
});

gulp.task('uglify', function() {
  gulp.src('src/js/*').pipe(uglify()).pipe(gulp.dest('./js')).pipe(filter('**/*.js')).pipe(browserSync.reload({
    stream : true
  }));
});

gulp.task('view', function() {
  gulp.src([ 'src/view/index.html', 'src/view/svgdefs.svg' ]).pipe((function() {
    var view = null, defs = {}, content = "", reg = /\{\{([\s\S]+?)\}\}/g;
    return through(function(file, enc, cb) {
      if (file.isNull())
        return; // ignore
      if (file.isStream())
        return this.emit('error', new PluginError('my-view-test', 'Streaming not supported'));
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
  })).pipe(gulp.dest('./')).pipe(browserSync.reload({
    stream : true
  }));

});

gulp.task('clean', function() {
  gulp.src('./*').pipe(clean({
    force : true
  }));
  gulp.src('src/css/*').pipe(clean({
    force : true
  }));
});

gulp.task('watch', [ 'browser-sync' ], function() {
  gulp.watch('src/less/*.less', [ 'less' ]).on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });

  gulp.watch('src/view/*', [ 'view' ]).on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });

  gulp.watch('src/js/*', [ 'uglify' ]).on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
  });
});