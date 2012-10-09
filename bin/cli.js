#!/usr/bin/env node

/*
 * ybuild, a tool for building YUI modules.
 * https://github.com/mosen/ybuild
 *
 * See http://yuilibrary.com for more information about the YUI framework.
 */

var fs = require('fs');
var path = require('path');
var nopt = require('nopt');
var pkginfo = require('pkginfo')(module);
var Component = require(path.join(__dirname, '..', 'lib', 'component')),
    queues = require(path.join(__dirname, '..', 'lib', 'queues')),
    knownOpts = { "help": Boolean, "recursive": Boolean, "buildfile": String, "color": Boolean },
    shortHands = { "h": ["--help"], "r": ["--recursive"], "f": ["--buildfile"], "c": ["--color"] },
    parsed = nopt(knownOpts, shortHands, process.argv, 2),
    srcDirs = parsed.argv.remain,
    header = "ybuild " + module.exports.version,
    usage = [
        "usage: ybuild [options] <dirname ...>",
        "",
        "options:",
        "  -h, --help            Display this help message",
        "  -r, --recursive       Search recursively for components to build (looks for buildfiles in subdirs)",
        "  -f, --buildfile       Use this filename to read build options (default \"build.json\")",
        "  -c, --color           Colorize the console output",
        ""
    ].join('\n');

console.log(header);

if (parsed.help || parsed.argv.remain.length === 0) {
    console.log(usage);
    process.exit(1);
}

parsed.buildfile = parsed.buildfile || "build.json";

if (parsed.recursive) {
    // recurse into subdirectories, looking for buildFileName
    console.log('Recursive option not yet supported.');
} else {
    srcDirs.forEach(function (dir) {
        var buildFilePath = path.join(dir, parsed.buildfile);

        fs.exists(buildFilePath, function (exists) {
            if (exists) {
                var c = Component(buildFilePath);

                console.log('info', 'Building ' + c.component + '...');
                build(c);
            } else {
                console.log('warn', 'Couldn\'t find a build file at ' + buildFilePath + ', skipping...');
            }
        });
    }, this);
}

function build(component) {
    var taskQueues = [],
        queueOpts = {
            logger: console
        };

//    if (component.skip.length > 0) {
//        queueOpts.skip = component.skip;
//    }

//    if (Object.keys(component.tasks).length > 0) {
//        queueOpts.defaults = component.tasks;
//    }

    taskQueues.push(queues._createSourceQueue(component, queueOpts));

    if (component.skinnable) {
        taskQueues.push(queues._createSkinsQueue(component, queueOpts));
        taskQueues.push(queues._createAssetsQueue(component, queueOpts));
    }

    taskQueues.forEach(function each_queue(moduleQueue) {
        moduleQueue.run();
    }, this);
}
