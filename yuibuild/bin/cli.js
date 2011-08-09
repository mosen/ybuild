#!/usr/bin/env node

var path   = require('path'),
    fs     = require('fs'),
    util   = require('util'),
    events = require('events'),
    component = require('../lib/component.js'),
    Builder = require('../lib/builder.js').Builder;

var buildFileName = /build\.json$/;

var help = [
    "usage: yuibuild [options]",
    "",
    "options:",
    "  -v, --verbose     Verbose output",
    "  -h, --help        This is it"
].join('\n');

var arg, 
    args = [], 
    argv = process.argv.slice(2),
    options;

if (args.length === 0 || options.watch) {
    console.log('yuibuild alpha');
    
    var buildPaths = paths('.');
    buildPaths.forEach(function(f) {
        var buildComponent = component.factory('json', { buildFile: f });
        console.log(buildComponent);
        var builder = new Builder(buildComponent);
        builder.run();
    })
}


// Modified from vowsjs
// 
// Recursively traverse a hierarchy, returning
// a list of all relevant .js files.
//
function paths(dir) {
    var paths = [];

    try { fs.statSync(dir) }
    catch (e) { return [] }

    (function traverse(dir, stack) {
        stack.push(dir);
        fs.readdirSync(stack.join('/')).forEach(function (file) {
            var path = stack.concat([file]).join('/'),
                stat = fs.statSync(path);

            if (file[0] == '.' || file === 'vendor') {
                return;
            } else if (stat.isFile() && buildFileName.test(file)) {
                paths.push(path);
            } else if (stat.isDirectory()) {
                traverse(file, stack);
            }
        });
        stack.pop();
    })(dir || '.', []);

    return paths;
}