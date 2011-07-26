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
 * TODO: consider jshint
 * TODO: some way of not referring to the component global inside a task.
 * 
 * Relevant samey projects:
 * https://github.com/dsimard/ready.js
 * https://github.com/balupton/buildr.npm <- especially this one
 * 
 */
// boy i hate putting things in global scope but here it is for now

// Dependencies
var fs = require('fs'),
path = require('path'),
iniparser = require('iniparser'), // Used for backwards compatibility with ANT build.properties
prop = iniparser.parseSync('build.properties'),
Mustache = require('Mustache'),

// Directories
basedir = '.',
jsbasedir = basedir + '/js',

// This specification should be converted to an object.
component = {
    component : prop['component'] || 'component', // TODO: fail if not specified
    builddir : prop['component.builddir'] || basedir + '/build_tmp',
    rollup : prop['component.rollup'] == 'true' ? true : false,
    skip : {
        clean : prop['clean.skip'] == 'true' ? true : false,
        register : prop['register.skip'] == 'true' ? true : false,
        lint : prop['lint.skip'] == 'true' ? true : false,
        logger : prop['component.logger.regex.skip'] ? true : false // TODO: this
    },
    jsfiles : prop['component.jsfiles'] ? 
        prop['component.jsfiles'].split(',').map(function(v) {
            return jsbasedir + '/' + v;
        }) : fs.readdirSync(jsbasedir),
    jsfilesbasedir : jsbasedir, // ./js
    filenames : {
        core : prop['component'] + '.js',
        debug : prop['component'] + '-debug.js',
        min : prop['component'] + '-min.js'
    },
    // Strings which will hold the code, allocated as an in-memory string.
    // Buffer might seem more appropriate but is actually a lot less performant.
    files : {
        concat : "", // concat
        registered : "", // register
        raw : "", // take away logger
        min : "" // reduce size
    },
    assets : {
        base : "./assets",
        csslintoptions : {}
    },
    
    // Task definitions for file() type tasks, which ensure that we are only building changes.
    filetasks : {
        debug : {}, 
        min : {}, 
        raw : {}
    },
    requires : prop['component.requires'] ? prop['component.requires'].split(',') : [],
    version : '1.0.0', // TODO: read from properties
    details : {
        // Automatically load these components
        use : prop['component.use'],
        
        // Modules that the component supersedes
        supersedes : prop['component.supersedes'],
        
        // Modules required before this one
        requires : prop['component.requires'],
        
        // Optional modules
        optional : prop['component.optional'],
        
        // Modules that should be loaded before this one
        after : prop['component.after'],
        
        // Array of i18n tags that this module has bundles for
        lang : prop['component.lang'],
        
        // Auto load skin assets?
        // NOTE: this is the only non-array details property, so don't convert to array literal
        skinnable : prop['component.skinnable'] == 'true' ? true : false
    },
    details_arrays : ['use', 'supersedes', 'requires', 'optional', 'after', 'lang'] // Which details to process as comma separated arrays
};

/**
 * The default task will build and deploy the module located in the current working directory.
 */
desc('Default : build all');
task({
    'default' : [
        'build:clean'
      , 'build:concat'
      , 'build:lint'
      , 'build:register'
      , 'build:removelogging'
      , 'build:minify'
      , 'build:skins'
    ]}, function() {
    
    // Changes before this are not committed to the file system, now we write out the files.
    fs.writeFileSync(component.builddir + '/' + component.filenames.core, component.files.raw, 'utf8');
    fs.writeFileSync(component.builddir + '/' + component.filenames.debug, component.files.registered, 'utf8');
    fs.writeFileSync(component.builddir + '/' + component.filenames.min, component.files.min, 'utf8');
    
    console.log('Module has been built');
});

desc('Create temporary build directory to hold build files at each stage of the process.');
directory(component.builddir);

// TODO: maybe re-instate file tasks to detect which files need to be built

/**
 * Each build task corresponds to a utils:task.
 * 
 * Here we just wrap those tasks to prevent them knowing about the specific
 * paths or configuration names of the build file.
 */
namespace('build', function() {

    desc('Build:clean (SYNC)');
    task('clean', function() {
        jake.Task['utils:clean'].execute();
    });
    
    desc('Build:concat (SYNC)');
    task('concat', function() {
        var t_concat = jake.Task['utils:stringconcat'];
        t_concat.execute.apply(t_concat, [component.files.concat, component.jsfiles]);
    });
    
    desc('Build:lint (SYNC)');
    task('lint', function() {
        var t_lint = jake.Task['utils:lint'];
        t_lint.execute.apply(t_lint, [component.jsfiles]);
    });
    
    desc('Build:register (SYNC)');
    task('register', function() {
        jake.Task['utils:register'].execute();
    });
    
    desc('Build:prepend (SYNC)');
    task('prepend', function() {
        // string concat?
    });
    
    desc('Build:append (SYNC)');
    task('append', function() {
        // string concat?
    });
    
    desc('Build:removelogging (SYNC)');
    task('removelogging', function() {
        jake.Task['utils:removelogging'].execute();
    });
    
    desc('Build:minify (SYNC)');
    task('minify', function() {
        jake.Task['utils:minify'].execute();
    });
    
    // build:skins
    desc('Build:skins (SYNC)');
    task('skins', function() {
        console.log('Writing skins');
        // dest = component.builddir + '/assets/skins/sam/' + component.component + '.css'
        var destFile = component.builddir + '/' + component.component + '.css';
        
        var t_concat = jake.Task['utils:fileconcat'];
        t_concat.execute.apply(t_concat, [destFile, [
                component.assets.base + '/' + component.component + '-core.css',
                component.assets.base + '/skins/sam/' + component.component + '-skin.css'
        ]]);
    
        // CSS Lint (ASYNC)
        var t_csslint = jake.Task['utils:csslint'];
        t_csslint.execute.apply(t_csslint, [destFile]);
    
        var t_cssminify = jake.Task['utils:cssminify'];
        t_cssminify.execute.apply(t_cssminify, [destFile]);
        
        fs.writeFileSync(component.builddir + '/' + component.component + '-min.css', component.assets.min, 'utf8');
    });
    
    desc('Build:langs (SYNC)');
    task('langs', function() {
        // build:langs
        // if="component.langs.exist"
        // <mkdir dir="${component.builddir}/lang" />
        // foreach (<addlang dir="${component.lang.base}" module="${component}" lang="@{lang}" dest="${component.builddir}/lang" />)
        // <addlang dir="${component.lang.base}" module="${component}" lang="" dest="${component.builddir}/lang/" />
        // see -> addlang        
    });
    
    // build:rollup


    // build:fixcrlf ?
});

/**
 * Generic build tasks common to modules and rollups
 */
namespace('utils', function() {
    
    /**
     * Concatenate a number of files to a string.
     * 
     * The first argument is the destination variable (string).
     * The second argument is the array of source files, using fully qualified paths.
     * 
     * TODO: make concat work for files or strings
     */
    desc('Concatenate files to string (SYNC)');
    task('stringconcat', function() {
        var output = "",
        outputFile = arguments[0],
        inputFiles = arguments[1]; // Input files require full path
        
        console.log('Concatenating');
        console.log('\tSource files: ' + inputFiles.join(','));
        console.log('\tTo: buffer');

        for (var i = 0; i < inputFiles.length; i++) {
            output += fs.readFileSync(inputFiles[i]); 
        }

        component.files.concat = output;
        
        //fs.writeFileSync(outputFile, output, 'utf8');
        console.log('Done concatenating');  
    });
    
    /**
     * Concatenate a number of files to a destination file.
     * 
     * The first argument is the destination file.
     * The second argument is the array of source files, using fully qualified paths.
     */
    desc('Concatenate files to string (SYNC)');
    task('fileconcat', function() {
        var output = "",
        outputFile = arguments[0],
        inputFiles = arguments[1]; // Input files require full path
        
        console.log('Concatenating');
        console.log('\tSource files: ' + inputFiles.join(','));
        console.log('\tTo: ' + outputFile);

        for (var i = 0; i < inputFiles.length; i++) {
            output += fs.readFileSync(inputFiles[i]); 
        }
        
        fs.writeFileSync(outputFile, output, 'utf8');
        console.log('Done concatenating');  
    });

    desc('Wrap module in YUI.add statement');
    task('register', function() {
        var propToDetail = function(key, values) {
                values = values.split(',').map(function(v){ return "'" + v.trim() + "'";});
                return key + ':[' + values.join(',') + ']' 
            },
            //data = component.files.concat, 
            template = fs.readFileSync('../../builder/files/moduletemplate.mustache', 'utf8'),
            view = {
                component : component['component'],
                yuivar : 'Y',
                version : component['version'],
                code : component['files']['concat'],
                details : []
            },
            i, detail;
            
        for (i in component.details_arrays) {
            detail = component.details_arrays[i];

            if (component.details[detail] !== undefined) {
                view.details.unshift(propToDetail(detail, component.details[detail]));
            }
        }
        
        view.details = ',{' + view.details.join(', ') + '}';
        if (component.details.skinnable === true) {
            view.details += ', skinnable:true';
        }

        component.files.registered = Mustache.to_html(template, view);
        console.log('Registered module');
    });
    
    /**
     * Replace all logging statements in the raw source file.
     * 
     * TODO: use passed parameters instead of var outside scope
     */
    desc('Replace logger statements');
    task('removelogging', function() {
        var data,
            logger = {
                regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
                replace : "",
                flags : "mg"
            },
            logger_regex = new RegExp(logger.regex, logger.flags);

        data = component.files.registered;
        component.files.raw = data.replace(logger_regex, logger.replace);

        console.log('Removed logger statements');
    });
    
    desc('Run JSLint on source file(s) (default settings)');
    task('lint', function() {
        
        // use try catch block to detect feature availability
        var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        inputFiles = arguments[0],
        i = 0,
        lint_options = {};

        for (; i < inputFiles.length; i++) {
            console.log('Running JSLint on: ');
            console.log('\t' + inputFiles[i]);
            
            fs.readFile(inputFiles[i], 'utf8', function (err, data) {
                if (err) {
                    throw err;
                }

                data = data.toString("utf8");
                var result = linter.lint(data, lint_options); // No Options

                reporter.report(inputFiles[i], result);
                complete();
            });            
        }
    }, true);
    
    desc('Minify the source using UglifyJS');
    task('minify', function() {
        var jsp = require("uglify-js").parser,
            pro = require("uglify-js").uglify,
            data, ast;
        
        data = component.files.raw;

        try {
            ast = jsp.parse(data); // parse into syntax tree
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
        } catch (e) {
            console.log(e.stack);
            fail('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
        }
       
        component.files.min = pro.gen_code(ast);
        
        console.log('Created minified version');
    });
    
    desc('Clean the build directory');
    task('clean', function() {
        if (path.exists(component.builddir)) {
            fs.unlink(component.builddir);
        }
        
        console.log('Removed: ' + component.builddir);
    });
    
    desc('Lint css file ASYNC');
    task('csslint', function() {
        var inputFile = arguments[0],
            cssfile,
            csslint = require('csslint').CSSLint,
            result;
                
        fs.readFile(inputFile, 'utf8', function(err, data) {
            if (err) {
                throw err;
            }
            
            data = data.toString('utf8');
            result = csslint.verify(data, component.assets.csslintoptions);
            console.log(result);
            
            complete();
        });
    }, true);

    desc('Minify css file');
    task('cssminify', function() {
        var inputFile = arguments[0],
            cssString = fs.readFileSync(inputFile, 'utf8');
            less = require('less'),
            lessParser = new less.Parser;
            
        console.log(cssString);
            
        lessParser.parse(cssString, function(err, tree) {
           var result;
           
           if (err) {
               throw err;
           }
           
           component.assets.min = tree.toCSS({ compress: true });
           
           complete();
        });
    }, true);
});