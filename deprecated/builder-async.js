/* Replicate the behaviour of YUI-Builder using nodejs modules */

// This is an older version of builder in which i attempted to complete ALL tasks
// asynchronously, but there is no event/callback system in Jake to allow for that
// kind of architecture.

// boy i hate putting things in global scope but here it is for now

// Dependencies
var fs = require('fs'),
    path = require('path'),
    iniparser = require('iniparser'),
    prop = iniparser.parseSync('build.properties'),
    //mu = require('mu'),

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
        jsfiles : prop['component.jsfiles'] ? 
            prop['component.jsfiles'].split(',').map(function(v) { return jsbasedir + '/' + v; }) : 
            fs.readdirSync(jsbasedir),
        jsfilesbasedir : jsbasedir,
        filenames : {
            core : prop['component'] + '.js',
            debug : prop['component'] + '-debug.js',
            min : prop['component'] + '-min.js'
        },
        files : {
            core : "",
            debug : "",
            min : ""
        },
        filetasks : {
            debug : {}, min : {}, raw : {}
        },
        requires : prop['component.requires'] ? prop['component.requires'].split(',') : [],
        version : '1.0.0' // TODO: read from properties
    };
    
    component.filetasks.debug[component.filenames.debug] = component.jsfiles.slice();
    component.filetasks.debug[component.filenames.debug].unshift(component.builddir); // Debug concat depends on builddir
    
    component.filetasks.min[component.filenames.min] = component.jsfiles.slice();
    component.filetasks.min[component.filenames.min].unshift(component.builddir); // Debug concat depends on builddir

/**
 * Default build task
 * Invokes module:local to build and deploy the module
 */
desc('Default');
task({ 'default' : [
    component.filenames.debug,
    component.filenames.min
]}, function() {
    console.log('Executing default task which depends on file tasks');
});

desc('Test');
task('test', function() {
   console.log('Testing Jake Tasks...'); 
});

desc('Create temporary build directory to hold build files.');
directory(component.builddir);

// Task : Build the -debug.js file (if the source files are newer)
desc('Build file -debug.js');
file(component.filetasks.debug, function() {
    console.log('Creating debug file');
    
    // Concat debug file if this file task qualifies to run (source files newer than build file)
    var t_concat = jake.Task['utils:concat'],
        t_add = jake.Task['utils:register'];
        
    jake.Task['utils:concat'].execute.apply(t_concat, [component.builddir + '/' + component.filenames.debug, component.jsfiles]);
    
    if (!component.skip.register) {
        jake.Task['utils:register'].execute.apply(t_add, [component.builddir + '/' + component.filenames.debug, component.builddir + '/' + component.filenames.debug]); 
    }
    
           // unless lint.skip run lint
}, true);

// Task : Build the -min.js file (if the source files are newer)
desc('Build file -min.js');
file(component.filetasks.min, function() {
    console.log('Creating minified file');
    
    // Concat debug file if this file task qualifies to run (source files newer than build file)
    var t_concat = jake.Task['utils:concat'],
        t_add = jake.Task['utils:register'],
        t_logger = jake.Task['utils:removelogging'],
        t_lint = jake.Task['utils:lint'];
        
    // TODO: asynchronous executed tasks do not return synchronously (duh) so there needs to be another facility to account for those tasks
    // returning and then execute the next task upon that event
    jake.Task['utils:concat'].execute.apply(t_concat, [component.filenames.min, component.jsfiles]);
    jake.Task['utils:removelogging'].execute.apply(t_logger, [component.filenames.min + 'raw', component.filenames.min]);
    
    if (!component.skip.register) {
        jake.Task['utils:register'].execute.apply(t_add, [component.filenames.min + 'wrapped', component.filenames.min + 'raw']);
    }
    
    jake.Task['utils:lint'].execute.apply(t_lint, [component.filenames.min]);
}, true);

/**
 * Generic build tasks common to modules and rollups
 */
namespace('utils', function() {
    
    /**
     * Concatenate a number of files to a destination file.
     * 
     * The first argument is the destination file.
     * The second argument is the array of source files, using fully qualified paths.
     */
    desc('Concatenate files');
    task('concat', function() {
       var output = "",
           outputFile = arguments[0],
           inputFiles = arguments[1]; // Input files require full path
        
       console.log('Concatenating');
       console.log('\tSource files: ' + inputFiles.join(','));
       console.log('\tTo: ' + outputFile);

       for (var i = 0; i < inputFiles.length; i++) {
           // TODO investigate using buffer/stream instead of string concatenation?
           output += fs.readFileSync(inputFiles[i]); 
       }

       fs.writeFile(outputFile, output, 'utf8', function() {
           console.log('Wrote: ' + outputFile);
           complete();
       });        
    }, true);

    /**
     * Register the module with a YUI.add() statement
     * 
     * of course we may need to find a templating library in order to
     * do some more sophisticated builds, but for now the string join works.
     */
    desc('Wrap module in YUI.add statement');
    task('register', function() {
       var output,
           outputFile = arguments[0],
           inputFile = arguments[1],
           requiresQuoted = component.requires.map(function(v) { return "'" + v.trim() + "'"; });
       
       fs.readFile(inputFile, 'utf8', function(err, data) {
           if (err) {
               throw err;
           }
           
            var tmpl = [
                "YUI.add('",
                component.component,
                "', function(Y) {\n\n",
                data,
                "\n\n",
                "}, '",
                component.version, // TODO: add component.details such as skinnable/requires etc.
                "', { requires : [",
                requiresQuoted.join(","),
                "] });"
                ],
                output = tmpl.join('');  
                
            fs.writeFile(outputFile, output, 'utf8', function(err) {
               if (err) {
                   console.log('Cannot write: ' + outputFile);
                   throw err;
               }

               console.log('Wrote: ' + outputFile);
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
    task('removelogging', function() {
       var outputFile = arguments[0],
           inputFile = arguments[1],
           logger = {
                regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
                replace : "",
                flags : "mg"
           },
           logger_regex = new RegExp(logger.regex, logger.flags);
        
       console.log('Replacing log statements in: ' + inputFile);

       // component.files.core = component.files.debug.replace(logger_regex, '$1', logger.replace);
       fs.readFile(inputFile, 'utf8', function(err, data) {
           if (err) throw err;
           
           var replaced = data.replace(logger_regex, logger.replace);
           
           fs.writeFile(outputFile, replaced, 'utf8', function(err) {
              if (err) throw err;
              
              console.log('Wrote: ' + outputFile);
              complete();
           });
       })
    }, true);
    
    
    desc('Run JSLint on source file (default settings)');
    task('lint', function() {
        
        // use try catch block to detect feature availability
        var linter = require('jslint/lib/linter.js'),
            reporter = require('jslint/lib/reporter.js'),
            inputFile = arguments[0],
            i = 0;

        console.log('Running JSLint on source file');


        fs.readFile(inputFile, 'utf8', function (err, data) {
            if (err) {
                throw err;
            }

            data = data.toString("utf8");
            var opts = {};
            var result = linter.lint(data, opts); // No Options

            reporter.report(inputFile, result);
            
            complete();
        });
    }, true);
});


//    desc('Clean Local Build Directory');
//    task('clean', [], function() {
//        // TODO: needs clean implementation of rm -rf, maybe? see npm/lib/utils/rm-rf.js
//        var rm = function(d) {
//            try {
//                if (path.exists(component.builddir)) {
//                    var files = fs.readdirSync(component.builddir);
//
//                    for (i = 0; i < files.length; i++) {
//                        fs.unlink(component.builddir + '/' + files[i]);
//                    }
//                }
//            } catch (e) {
//                console.log('Couldnt clean build directory');
//            }
//        };
//        
//        console.log('Cleaning ' + component.builddir);
//        component.skip.clean || rm(component.builddir);
//    });

