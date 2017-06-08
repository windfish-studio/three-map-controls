var path = require('path');
var extend = require("node.extend");
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var request = require('request');
var q = require('q');
var gutil = require('gulp-util');
var resolve = require('resolve-file');
var del = require('del');
var gulp = require('gulp');
var babelify = require('babelify');

//Detect production/development environment from system environment vars.
//Defaults to 'development'.
var environment = process.env.NODE_ENV || "development";

var npm_deps = Object.keys(require('../package.json').dependencies);

var make_bundle = function(opts){

    if(opts === undefined){
        opts = {};
    }

    if(opts.use_watchify === undefined){
        opts.use_watchify = (environment == "development");
    }

    if(opts.bsfy_opts === undefined){
        opts.bsfy_opts = {};
    }

    var prms_dirname = path.dirname(opts.out_file);
    var out_filename = (opts.out_file)? path.basename(opts.out_file) : path.basename(opts.bsfy_opts.entries);
    var out_dirname = (!opts.out_file || prms_dirname == '.')? 'app/dist' : prms_dirname;

    var bsfy_opts_common = {
        debug: (environment == "development"),
        paths: ["app"],
        cache: {},
        packageCache: {}
    };

    var bsfy_opts = extend(bsfy_opts_common, opts.bsfy_opts);

    var b = browserify(bsfy_opts);

    if(opts.require){
        for(key in opts.require){
            var npm_name = opts.require[key];
            var npm_path = resolve(npm_name);
            b.require(npm_path, {expose: npm_name});
        }
    }

    if(opts.external){
        for(key in opts.external){
            var npm_name = opts.external[key];
            b.external(npm_name);
        }
    }


    b.transform("babelify", {presets: ["es2015"]})


    if(opts.use_watchify){
        b = watchify(b);
        b.on('update', rebundle);
    }

    function rebundle () {
        gutil.log("Bundling "+out_filename+"...");
        return b.bundle()
            .on('error', function (err) {
                //On bundler errors print out the message in red and then continue (don't want to break the watchers)
                gutil.log(gutil.colors.red('Browserify Bundling ERROR: ' + err.message));
                this.emit('end');
            })
            .pipe(source(out_filename))
            .pipe(gulp.dest(out_dirname));
    }

    return rebundle();

};


//note: we store the shaders in the app instead of the assets to avoid having to rebuild the assets bundle (which is heavy)
gulp.task("bsfy-app", function(){
    var deferred = q.defer();
    del(['dist/three-map-controls.js']).then(function () {
        make_bundle({
            out_file: "dist/three-map-controls.js",
            bsfy_opts: {entries: "src/three-map-controls.js"},
            require: npm_deps
        }).on('end', deferred.resolve);
    });
    return deferred.promise;
});

gulp.task("bsfy", ["bsfy-app"]);