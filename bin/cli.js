#!/usr/bin/env node

/*
 * yuibuild
 * https://github.com/mosen/yuibuild
 */

var path      = require('path'),
    fs        = require('fs'),
    util      = require('util'),
    events    = require('events'),
    Queue     = require('buildy/lib/queue').Queue,
    Buildy    = require('buildy').Buildy,
    Component = require('../lib/component.js').Component,
    queues    = require('../lib/queues.js');
//    Builder   = require('../lib/builder.js').Builder;

var buildFileName = "build.json";

var header = "yuibuild v0.0.2";
var usage = [
    "usage: yuibuild [options] <component directory ...>",
    "",
    "options:",
    "  -h, --help        Display this help message",
    "  -r, --recursive   Search recursively for components to build",
    "  -v, -vv, -vvv     Verbosity level (Warnings, Info, Debug)",
    ""
].join('\n');

var arg, 
    buildDirs = [], // Any non matching arg becomes build directory
    argv = process.argv.slice(2),
    options = {
        recursive : false,
        logging : {
            warnings : true,
            info : true,
            debug : false,
            ludicrous : false
        }
    };

while (arg = argv.shift()) {
    if (arg === __filename) { continue; }

    switch(arg) {
         case '-h':
         case '--help':
            console.log(usage);
            process.exit(1);
            break;

         case '-r':
         case '--recursive':
            // recurse into subdirectories to discover more build files.
            options.recursive = true;
            break;

         case '-v':
            // display warnings

         case '-vv':
            // display info

         case '-vvv':
            // display debug

         case '-vvvv':
            // rediculous dump of information

         default:
            buildDirs.push(arg);
    }
}

console.log(header);

if (buildDirs.length === 0) {
    console.log(usage);
    process.exit(0);

} else {
    console.log('Attempting to build components in: ' + buildDirs.join(', '));

    if (options.recursive === true) {
        // recurse into subdirectories, looking for buildFileName
        console.log('Recursive option not yet supported.')
    } else {
        buildDirs.forEach(function(dir) {
           var buildFilePath = path.join(dir, buildFileName);

           path.exists(buildFilePath, function(exists) {
               if (exists) {
                    var c = Component(buildFilePath);
//                    var builder = new Builder(buildComponent);
//                    builder.run();
                    console.log('Starting build for component: ' + c.component);
                    build(c);
               } else {
                   console.log('Couldnt find a build file at ' + buildFilePath + ', skipping...');
               }
           });
        }, this);
    }
}

function build(component) {
    var taskQueues = [];

    taskQueues.push(queues._createSourceQueue(component));

    if (component.skinnable) {
        taskQueues.push(queues._createSkinsQueue(component));
        taskQueues.push(queues._createAssetsQueue(component));
    }
    //taskQueues.push(queues._createDocsQueue(component));

    taskQueues.forEach(function each_queue(moduleQueue) {
       var worker = new Buildy();
       moduleQueue.run(worker);
    }, this);
}

// Modified from vowsjs
// 
// Recursively traverse a hierarchy, returning
// a list of all relevant .js files.
//
//function paths(dir) {
//    var paths = [];
//
//    try { fs.statSync(dir) }
//    catch (e) { return [] }
//
//    (function traverse(dir, stack) {
//        stack.push(dir);
//        fs.readdirSync(stack.join('/')).forEach(function (file) {
//            var path = stack.concat([file]).join('/'),
//                stat = fs.statSync(path);
//
//            if (file[0] == '.' || file === 'vendor') {
//                return;
//            } else if (stat.isFile() && file === buildFileName) {
//                paths.push(path);
//            } else if (stat.isDirectory()) {
//                traverse(file, stack);
//            }
//        });
//        stack.pop();
//    })(dir || '.', []);
//
//    return paths;
//}