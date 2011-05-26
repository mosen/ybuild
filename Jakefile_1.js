/* Replicate the behaviour of YUI-Builder using nodejs modules */

// boy i hate putting things in global scope but here it is for now
var fs = require('fs'),
    path = require('path'),
    iniparser = require('iniparser'),
    prop = iniparser.parseSync('build.properties'),
    mu = require('mu'),
    
    basedir = '.',
    jsbasedir = basedir + '/js',
    
    component = {
        component : prop['component'] || 'component', // TODO: determine better default if not specified
        builddir : prop['component.builddir'] || basedir + '/build_tmp',
        skip : {
            clean : prop['clean.skip'] == 'true' ? true : false,
            register : prop['register.skip'] == 'true' ? true : false
        },
        jsfiles : prop['component.jsfiles'] ? prop['component.jsfiles'].split(',') : fs.readdirSync(jsbasedir),
        jsfilesbasedir : jsbasedir,
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
     * TODO: this task can't be executed as a subtask from within a dependency due to a jake bug.
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
     */
    desc('Wrap module in YUI.add statement');
    task('addmodule', [], function() {

        var destFile = component.builddir + '/' + component.component + '.js';
        
        console.log('Register component.js [ASYNC]');
        
        fs.readFile(destFile, 'utf8', function(err, data) {
            if (err) throw err;
            
            // TODO: find a suitable tiny templating library, maybe mustache.js
            var tmpl = [
                "YUI.add('",
                component.component,
                "', function(Y) {\n\n",
                data,
                "\n\n",
                "}, '",
                component.version,
                "');"
                ],
                addedmodule = tmpl.join('');
            
            fs.writeFile(destFile, addedmodule, 'utf8', function(err) {
               if (err) throw err;
               
               console.log('Wrote registered module to ' + destFile);
               complete();
            });
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
           regex : "^.*?(?:logger|YAHOO.log).*?(?:;|\).*;|(?:\r?\n.*?)*?\).*;).*;?.*?\r?\n",
           replace : "",
           flags : "mg"
       };

       
    });
});

/**
 * Build tasks
 */
namespace('build', function() {
   desc('Concat component-debug.js');
   task('concatdebug', [], function() {
       console.log('Concatenating source to component-debug.js');
       var sourceFiles = [],
           concatData = "",
           destFile = component.builddir + '/' + component.component + '-debug.js';
       
       for (i = 0; i < component.jsfiles.length; i++) {
           sourceFiles.unshift(component.jsfilesbasedir + '/' + component.jsfiles[i]);
       }
       
       //jake.Task['utils:concat'].execute(sourceFiles, destFile);
       // Temporary CopyPasta, node-jake has a problem with executing subtasks in a dependency.
       // Do not merge for loops, this will be split into a subtask
       console.log('Concatenating');
       console.log('\tSource files: ' + sourceFiles.join(','));
       console.log('\tTo: ' + destFile);

       for (var i = 0; i < sourceFiles.length; i++) {
           concatData += fs.readFileSync(sourceFiles[i]);
       }

       fs.writeFileSync(destFile, concatData);
   });
   
   desc('concatenate component.js [ASYNC]');
   task('concat', [], function() {
      var destFile = component.builddir + '/' + component.component + '.js',
          concatData;
       
      console.log('Concatenating [ASYNC]');
      console.log('\tSource files: ' + component.jsfiles.join(','));
      console.log('\tTo: ' + destFile);
      
      for (i = 0; i < component.jsfiles.length; i++) {
          // We respect the synchronous order here because variables might be introduced in the first build file
          concatData += fs.readFileSync(component.jsfilesbasedir + '/' + component.jsfiles[i]); 
      }
      
      fs.writeFile(destFile, concatData, 'utf8', function(err) {
          if (err) throw err;
          console.log('Concatenated component.js');
          complete();
      });
   }, true);
   
   desc('Prepend to component-debug.js');
   task('prependdebug', [], function() {
      console.log('Prepending to component-debug.js'); 
   });
   
   
   desc('Append to component-debug.js');
   task('appenddebug', [], function() {
       
   });
   
   desc('Register component-debug.js');
   task('registerdebug', ['utils:addmodule'], function() {
       console.log('Registered component');
   });
   
   // NEW
   desc('Register component.js');
   task('register', ['utils:addmodule'], function() {
       console.log('Registered component [ASYNC]');
   });   
   
   desc('Create component-debug.js');
   task('builddebug', ['build:concatdebug', 'build:registerdebug', 'build:prependdebug', 'build:appenddebug'], function() {
        // transform crlf to desired ending
        console.log('Created and registered component-debug.js');
   });   
   
   desc('Create component.js');
   task('createcore', [], function() {
       console.log('Create component.js');
   });
   
   desc('Create component.js');
   task('buildcore', ['build:builddebug', 'build:createcore', 'utils:loggerregex'], function() {
       
       console.log('Finished buildcore');
       //, 'createcore', 'loggerregex'
       // transform crlf to desired ending
       // the eof parameter should be specified, default to using lf (buildfiles.eol in props) 
   });
   
   // NEW
   desc('Create component.js but try to be asynchronous');
   task('asyncbuildcore', ['build:concat', 'build:register'], function() {
       //, 'build:register', 'build:prepend', 'build:append'
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
    task('build', ['build:asyncbuildcore'], function() {
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

    desc('Create component-min.js from component.js');
    task('minify', [], function() {
        // compress source to source-min.js
        // if /lang available, compress each lang with same output name
    });
});
