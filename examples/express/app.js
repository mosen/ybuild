/**
 * ybuild-express
 * A YUI toolkit module developer application
 *
 * The aim of this subproject is to provide an example module developers environment.
 * The express app should do the following:
 * - exist as middleware at a specified mount point (which will be the same as the loader config root).
 * - determine based on the subdirectory of that mount point, which module the loader wants to load.
 * - determine based on the file name and extension, what to build:
 *  - name.js will build and send a non-logging module in the response body.
 *  - name-debug.js will build and send a logging module in the response body.
 *  - name-min.js will build and send a minified module in the response body.
 *  - name.css will build and send a CSS stylesheet (css module)
 *  - name-min.css will build and send a minified CSS stylesheet (css module).
 *  - assets/name-core.css will build and send a widget's core stylesheet
 *  - assets/skins/skinname/name-skin.css will build and send the skin stylesheet.
 *  - assets/skins/skinname/name.css will build and send the core+skin minified stylesheet.
 *  - assets/^css will serve content statically.
 *
 *  The sources for this example are located in the src directory. These are the modules that will be dynamically
 *  built.
 *
 *  There should be a special route for YUI_config.js to do global module configuration based upon the modules
 *  available in src/
 */

var express = require('express');
var app = express();
var path = require('path');
var util = require('util');
var fs = require('fs');

var source_directory = path.join(__dirname, 'src');
var Component = require(path.join(__dirname, '..', '..', 'lib', 'component.js'));

app.use('/build', function(req, res, next) {

    var uri_parts = req.path.split('/');
    uri_parts.splice(0, 1); // Leading item is zero length string

    var module_name = uri_parts.shift();

    // Firstly, if the requested file exists at the source, serve it up unchanged.
    // This allows assets to be served from their original location.

    var static_file_path = path.join.apply(path, [source_directory, module_name].concat(uri_parts));

    if (fs.existsSync(static_file_path)) {
        res.sendfile(static_file_path);
    } else {
        // This file doesn't exist, so it might match a build product.

        var mod = Component(path.join(source_directory, module_name, 'build.json'));

        // If the first element after the module name matches the js or css pattern, its a core build product
        if (path.extname(uri_parts[0]) === 'js' || path.extname(uri_parts[1]) === 'css') {

        }
    }




//    res.send('done');
    // If module/uri path exists at the source, serve it statically.

//    var module_name = uri_parts[1];
//    var module_release = uri_parts[2].split('-')[1];
//    var source_directory = path.join(__dirname, 'src');
//    var module_sources = path.join(source_directory, module_name, 'js', '*');
//
//    var buildy = require('buildy');
//    var Queue = buildy.Queue;
//
//    var q = new Queue('building ' + module_name, { logger: console })
//        .task('files', [module_sources]) // all of these synchronous
//        .task('jslint')
//        .task('concat');
//
//    q.run(function(err, state) {
//        util.log('Finished running build queue');
//        var output = "";
//        state.forEach(function(key, value) {
//            output += value.string;
//        }, this);
//
//        res.send(output);
//    });

});

app.use('/ybuild/YUI_config.js', function(req, res, next) {});

app.listen(3000);
console.log('ybuild-express listening on port 3000');