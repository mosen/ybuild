/* 
 * YUI Builder process emulated using node-jake and friends.
 * 
 * This build process tries to stay as close to the original Ant based
 * builder as possible, while eliminating some tasks where deemed reasonable.
 * 
 * It has backwards compatibility with the build.properties file used with Ant.
 * 
 * TODO: evaluate the possibility of using SOME asynchronous tasks.
 * TODO: prepend / append tasks
 */
// boy i hate putting things in global scope but here it is for now

// Dependencies
var fs = require('fs'),
path = require('path'),
iniparser = require('iniparser'), // Used for backwards compatibility with ANT build.properties
prop = iniparser.parseSync('build.properties'),
//mu = require('mu'),

// Directories
basedir = '.',
jsbasedir = basedir + '/js',

/**
     * Component build specification
     * 
     * There are a few properties here which are just for convenience in later build tasks.
     */
component = {
    component : prop['component'] || 'component', // TODO: fail if not specified
    builddir : prop['component.builddir'] || basedir + '/build_tmp',
    skip : {
        clean : prop['clean.skip'] == 'true' ? true : false,
        register : prop['register.skip'] == 'true' ? true : false,
        lint : prop['lint.skip'] == 'true' ? true : false
    },
    jsfiles : prop['component.jsfiles'] ? 
    prop['component.jsfiles'].split(',').map(function(v) {
        return jsbasedir + '/' + v;
    }) : 
    fs.readdirSync(jsbasedir),
    jsfilesbasedir : jsbasedir, // ./js
    filenames : {
        core : prop['component'] + '.js',
        debug : prop['component'] + '-debug.js',
        min : prop['component'] + '-min.js'
    },
    // Strings which will hold the code, allocated as an in-memory string.
    files : {
        core : "",
        debug : "",
        min : ""
    },
    // Task definitions for file() type tasks, which ensure that we are only building changes.
    filetasks : {
        debug : {}, 
        min : {}, 
        raw : {}
    },
    requires : prop['component.requires'] ? prop['component.requires'].split(',') : [],
    version : '1.0.0' // TODO: read from properties
};
    
component.filetasks.debug[component.filenames.debug] = component.jsfiles.slice();
component.filetasks.debug[component.filenames.debug].unshift(component.builddir); // Debug concat depends on builddir
    
component.filetasks.min[component.filenames.min] = component.jsfiles.slice();
component.filetasks.min[component.filenames.min].unshift(component.builddir); // Debug concat depends on builddir
    
component.filetasks.raw[component.filenames.raw] = component.jsfiles.slice();
component.filetasks.raw[component.filenames.raw].unshift(component.builddir); // Debug concat depends on builddir

// TODO: instead of building these 3 separately, build concat, then register, then fork at nologger then fork at minify

/**
 * The default task will build and deploy the module located in the current working directory.
 */
desc('Default : build all');
task({
    'default' : [
    component.filenames.debug
    , component.filenames.min
//    , component.filenames.raw
    ]
    }, function() {
    console.log('Module has been built');
});

desc('Create temporary build directory to hold build files at each stage of the process.');
directory(component.builddir);

// Task : Build the -debug.js file (if the source files are newer)
desc('Build file -debug.js');
file(component.filetasks.debug, function() {
    console.log('Building ' + component.filenames.debug);
    
    // Concat debug file if this file task qualifies to run (source files newer than build file)
    var t_concat = jake.Task['utils:concat'],
    t_add = jake.Task['utils:register'],
    t_lint = jake.Task['utils:lint'];
        
    jake.Task['utils:concat'].execute.apply(t_concat, [component.builddir + '/' + component.filenames.core, component.jsfiles]);
    
    // JSLint will execute asynchronously, builder will continue to build output files.
    if (!component.skip.lint) {
        jake.Task['utils:lint'].execute.apply(t_lint, [component.builddir + '/' + component.filenames.core]);
    }
    
    if (!component.skip.register) {
        jake.Task['utils:register'].execute.apply(t_add, [component.builddir + '/' + component.filenames.debug, component.builddir + '/' + component.filenames.core]); 
    }
}, true);

// Task : Build the -min.js file (if the source files are newer)
desc('Build file -min.js');
file(component.filetasks.min, function() {
    
    console.log('Creating minified file');
    
    // Concat debug file if this file task qualifies to run (source files newer than build file)
    var t_concat = jake.Task['utils:concat'],
    t_add = jake.Task['utils:register'],
    t_logger = jake.Task['utils:removelogging'],
    t_min = jake.Task['utils:minify'];
        
    // TODO: asynchronous executed tasks do not return synchronously (duh) so there needs to be another facility to account for those tasks
    // returning and then execute the next task upon that event
    jake.Task['utils:concat'].execute.apply(t_concat, [component.builddir + '/' + component.filenames.min, component.jsfiles]);

    if (!component.skip.register) {
        jake.Task['utils:register'].execute.apply(t_add, [component.builddir + '/' + component.filenames.min + 'wrapped', component.builddir + '/' + component.filenames.min]);
    }
    
    jake.Task['utils:removelogging'].execute.apply(t_logger, [component.builddir + '/' + component.filenames.min, component.builddir + '/' + component.filenames.min + 'wrapped']);
    
    // TODO: uglify throws an exception when the javascript is just unparseable, handle this nicely.
    jake.Task['utils:minify'].execute.apply(t_min, [component.builddir + '/' + component.filenames.min + '-min', component.builddir + '/' + component.filenames.min])

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
    desc('Concatenate files (SYNC)');
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

        fs.writeFileSync(outputFile, output, 'utf8');
        console.log('Wrote: ' + outputFile);  
    });

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
        requiresQuoted = component.requires.map(function(v) {
            return "'" + v.trim() + "'";
        }),
        data, template;
           
        data = fs.readFileSync(inputFile, 'utf8');
           
        // TODO: consider a tiny templating engine to take care of registration?
        // this would be closer to the YUI Builder implementation
        template = [
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
        output = template.join('');  
                
        fs.writeFileSync(outputFile, output, 'utf8');

        console.log('Registered: ' + outputFile);
    });
    
    /**
     * Replace all logging statements in the raw source file.
     * 
     * TODO: use passed parameters instead of var outside scope
     */
    desc('Replace logger statements');
    task('removelogging', function() {
        var outputFile = arguments[0],
        inputFile = arguments[1],
        data,
        logger = {
            regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
            replace : "",
            flags : "mg"
        },
        logger_regex = new RegExp(logger.regex, logger.flags);
        
        console.log('Replacing log statements in: ' + inputFile);

        data = fs.readFileSync(inputFile, 'utf8');

        var replaced = data.replace(logger_regex, logger.replace);
           
        fs.writeFileSync(outputFile, replaced, 'utf8');
        console.log('Wrote: ' + outputFile);
    });
    
    desc('Run JSLint on source file (default settings)');
    task('lint', function() {
        
        // use try catch block to detect feature availability
        var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        inputFile = arguments[0];

        console.log('Running JSLint on: ');
        console.log('\t\t' + inputFile);

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
    
    desc('Minify the source using UglifyJS');
    task('minify', function() {
        var outputFile = arguments[0],
        inputFile = arguments[1],
        jsp = require("uglify-js").parser,
        pro = require("uglify-js").uglify,
        data, ast;
        
        data = fs.readFileSync(inputFile, 'utf8');

        try {
            ast = jsp.parse(data); // parse into syntax tree
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
        } catch (e) {
            fail('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
        }
       
        fs.writeFileSync(outputFile, pro.gen_code(ast), 'utf8');
    });
    
    desc('Clean the build directory');
    task('clean', function() {
        if (path.exists(component.builddir)) {
            fs.unlink(component.builddir);
        }
        
        console.log('Removed: ' + component.builddir);
    });
});