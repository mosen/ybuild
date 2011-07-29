#!/usr/bin/env node
/*
 * Modified from jake cli.js. This is really just a front end to the Jake runner.
 * The original was never designed with multiple Jakefiles or recursive builds in mind.
 * This iterates through or walks directory trees to discover new jake tasks.
 */


var args = process.argv.slice(2)
  , fs = require('fs')
  , sys = require('sys')
  , jake = require('jake/lib/jake')
  , api = require('jake/lib/api')
  , Program = require('jake/lib/program.js').Program
  , program = new Program()
  , Loader = require('jake/lib/loader.js').Loader
  , loader = new Loader()
  , opts
  , envVars
  , events = require('events')
  , Validator = require('../lib/validator').Validator
  , validator = new Validator()
  , jakeFilename = 'Jakefile.js';

jake.version = 'yuibuild';

global.jake = jake;

process.addListener('uncaughtException', function (err) {
  program.handleErr(err);
});

//console.log(args);

//validator.on('validated', function(dirs) {
//   console.log('Building:');
//   dirs.forEach(function(d) {
//      console.log('\t'+d); 
//   });
//});
//
//
//if (args.length === 0) {
//    
//} else {

    
    // iterate args
    // exclude non-folders
    // exclude folders that don't have a build specification
}

//program.parseArgs(args);
//
//if (!program.preemptiveOption()) {
//  opts = program.opts
//  envVars = program.envVars;
//
//  // Globalize top-level API methods (e.g., `task`, `desc`)
//  for (var p in api) {
//    global[p] = api[p];
//  }
//
//  // Enhance env with any env vars passed in
//  for (var p in envVars) { process.env[p] = envVars[p]; }
//
//  loader.load(opts.jakefile);
//
//  // Set working dir
//  var dirname = opts.directory;
//  if (dirname) {
//    process.chdir(dirname);
//  }
//
//  jake.parseAllTasks();
//
//  if (opts.tasks) {
//    jake.showAllTaskDescriptions(opts.tasks);
//  }
//  else {
//    jake.runTask(program.taskName || 'default', program.taskArgs, true);
//  }
//}