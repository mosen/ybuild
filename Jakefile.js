/* Replicate the behaviour of YUI-Builder using nodejs modules */

// boy i hate putting things in global scope but here it is for now

// Dependencies
var fs = require('fs'),
    path = require('path'),
    iniparser = require('iniparser'),
    prop = iniparser.parseSync('build.properties'),
    mu = require('mu'),

// Directories
    basedir = '.',
    jsbasedir = basedir + '/js',

// Component properties (from build.properties)
    component = {
        component : prop['component'] || 'component', // TODO: determine better default if not specified
        builddir : prop['component.builddir'] || basedir + '/build_tmp',
        skip : {
            clean : prop['clean.skip'] == 'true' ? true : false,
            register : prop['register.skip'] == 'true' ? true : false
        },
        jsfiles : prop['component.jsfiles'] ? prop['component.jsfiles'].split(',') : fs.readdirSync(jsbasedir),
        jsfilesbasedir : jsbasedir,
        files : {
            core : "",
            debug : "",
            min : ""
        },
        requires : prop['component.requires'] ? prop['component.requires'].split(',') : [],
        version : '1.0.0' // TODO: read from properties
    };

/**
 * Default build task
 * Invokes module:local to build and deploy the module
 */
desc('Default');
task('default', [], function() {
    jake.Task['module:local'].invoke(component);
});

/**
 * Generic build tasks common to modules and rollups
 */
namespace('utils', function() {
    
    /**
     * Concatenate a number of files to a destination file.
     * 
     * The first argument is an array of source files.
     * The second argument is the destination file.
     * 
     * TODO: this task can't be executed as a subtask from within a dependency due to a node-jake bug.
     * The source remains here for use when the bug has been fixed or a workaround found.
     */
    desc('Concatenate files');
    task('concat', [], function() {
       var concatData = "",
           outputFile = arguments[1],
           sourceFiles = arguments[0];

       console.log('Concatenating');
       console.log('\tSource files: ' + sourceFiles.join(','));
       console.log('\tTo: ' + outputFile);

       for (var i = 0; i < sourceFiles.length; i++) {
           concatData += fs.readFileSync(sourceFiles[i]);
       }

       fs.writeFileSync(outputFile, concatData);
    });
    
    /**
     * Register the module with a YUI.add() statement
     * 
     * of course we may need to find a templating library in order to
     * do some more sophisticated builds, but for now the string join works.
     */
    desc('Wrap module in YUI.add statement');
    task('addmodule', [], function() {

        var filebasename = component.builddir + '/' + component.component,
            filesuffix = '.js',
            corename = filebasename + filesuffix,
            debugname = filebasename + '-debug' + filesuffix,
            minifiedname = filebasename + '-min' + filesuffix;
        
        fs.readFile(corename, 'utf8', function(err, data) {
            var requiresQuoted = [];
            
            if (err) throw err;
            
            // Below requires ECMAScript5, TODO: add prototype methods to support ES4
            component.requires.forEach(function(e) {
                requiresQuoted.unshift("'" + e.trim() + "'");
            }, this);
            
            //console.log(data);
            
            // TODO: find a suitable tiny templating library, maybe mustache.js
            var tmpl = [
                "YUI.add('",
                component.component,
                "', function(Y) {\n\n",
                data,
                "\n\n",
                "}, '",
                component.version, // TODO: add component.details such as skinnable/requires etc.
                "', {requires:[",
                requiresQuoted.join(","),
                "]});"
                ],
                addedmodule = tmpl.join(''),
                writelocker = {
                    count : 0,
                    numprocesses : 3,
                    finished : function() {
                        this.count++;
                        
                        if (this.count >= this.numprocesses) {
                            complete();
                        }
                    }
                },
                createWriteHandler = function(filename, invokeWhenFinished) {
                    return function(err) {
                       if (err) throw err;

                       console.log('Wrote registered module to ' + filename);
                       writelocker.finished.apply(writelocker);
                       if (invokeWhenFinished !== undefined) {
                           jake.Task[invokeWhenFinished].invoke();
                       }
                    }
                };
            
            fs.writeFile(corename, addedmodule, 'utf8', createWriteHandler(corename, 'utils:loggerregex'));
            fs.writeFile(debugname, addedmodule, 'utf8', createWriteHandler(debugname));
            fs.writeFile(minifiedname, addedmodule, 'utf8', createWriteHandler(minifiedname));
        });    
    }, true);
    
    /**
     * Replace all logging statements in the raw source file.
     * 
     * TODO: use passed parameters instead of var outside scope
     */
    desc('Replace logger statements');
    task('loggerregex', [], function() {
       console.log('Replacing Logger Statements in ' + component.builddir + '/' + component.component + '.js');
       
       var logger = {
           regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
           replace : "",
           flags : "mg"
       },
       logger_regex = new RegExp(logger.regex, logger.flags);

       // component.files.core = component.files.debug.replace(logger_regex, '$1', logger.replace);
       fs.readFile(component.builddir + '/' + component.component + '.js', 'utf8', function(err, data) {
           if (err) throw err;
           
           var replaced = data.replace(logger_regex, logger.replace);
           console.log(replaced);
       })
    }, true);
});

/**
 * Build tasks
 */
namespace('build', function() {
   
   desc('concatenate component.js');
   task('concat', [], function() {
      var destFile = component.builddir + '/' + component.component + '.js',
          concatData;
       
      console.log('Concatenating');
      console.log('\tSource files: ' + component.jsfiles.join(','));
      console.log('\tTo: ' + destFile);
      
      for (i = 0; i < component.jsfiles.length; i++) {
          // We respect the synchronous order here because variables might be introduced in the first build file
          concatData += fs.readFileSync(component.jsfilesbasedir + '/' + component.jsfiles[i]); 
      }
      
      fs.writeFile(destFile, concatData, 'utf8', function(err) {
          if (err) throw err;
          console.log('Finished concatenating component.js');
          complete();
      });
   }, true);
   
   desc('Prepend to component.js');
   task('prepend', [], function() {
        console.log('Prepending to component.js'); 
   });
   
   desc('Append to component.js');
   task('append', [], function() {
       console.log('Appending to component.js');
   });
   
   desc('Register component.js');
   task('register', ['utils:addmodule'], function() {
       console.log('Registered component with YUI.add()');
   });
   
   desc('Create component.js');
   task('create', ['build:concat', 'build:register', 'build:prepend', 'build:append'], function() {
       console.log('Created component.js,component-debug.js,component-min.js');
   });
   
   desc('Process component parts');
   task('process', [], function() {
       console.log('Processing files');
       
       jake.Task['utils:loggerregex'].invoke();
       // strip logger from core
       // minify min
   });
});

namespace('module', function() {
    desc('Build and Deploy to Local Build Directory');
    task('local', ['module:clean', 'module:init', 'module:lint', 'module:build'], function() { // Depends: clean, init, build, minify, lint
        console.log('Built and deployed to local build directory');
    });

    desc('Clean Local Build Directory');
    task('clean', [], function() {
        // TODO: needs clean implementation of rm -rf, maybe? see npm/lib/utils/rm-rf.js
        var rm = function(d) {
            try {
                if (path.exists(component.builddir)) {
                    var files = fs.readdirSync(component.builddir);

                    for (i = 0; i < files.length; i++) {
                        fs.unlink(component.builddir + '/' + files[i]);
                    }
                }
            } catch (e) {
                console.log('Couldnt clean build directory');
            }
        };
        
        console.log('Cleaning ' + component.builddir);
        component.skip.clean || rm(component.builddir);
    });


    desc('Initialize Local Build Directory');
    task('init', [], function() {

       // create timestamp
       
       console.log('Initializing local build directory');
       
       if (!path.exists(component.builddir)) {
           console.log('Creating ' + component.builddir);
           //fs.mkdir(component.builddir);
       }

       // createdetails
    });

    desc('Build Component');
    task('build', ['build:create', 'build:process'], function() {
       console.log('Built component');
       // depends:  buildcore, -rollupjs, buildskins, buildlangs
    });

    desc('Run jslint over the local build files (default settings)');
    task('lint', [], function() {
       // unless lint.skip
       // use try catch block
        var linter = require('jslint/lib/linter.js'),
            reporter = require('jslint/lib/reporter.js'),
            i = 0, sourceFile;

        console.log('Running jsLint on source file(s)');

        for (; i < component.jsfiles.length; i++) {
            sourceFile = component.jsfiles[i];

            fs.readFile(component.jsfilesbasedir + '/' + sourceFile, 'utf8', function (err, data) {
                if (err) {
                    throw err;
                }
                data = data.toString("utf8");
                var parsed = {};
                var lint = linter.lint(data, parsed); // No Options
                if (parsed.json) {
                    console.log(JSON.stringify([file, lint]));
                } else {
                    reporter.report(file, lint);
                }
            });
        }   
    });
});
