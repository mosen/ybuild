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
 * TODO: consider csslint
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

/**
     * Component build specification
     * 
     * There are a few properties here which are just for convenience in later build tasks.
     */
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
        base : "./assets"
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
    ]}, function() {
    
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
        var t_concat = jake.Task['utils:concat'];
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
        var t_concat = jake.Task['utils:concat'];
        t_concat.execute.apply(t_concat, [component.builddir + '/assets/skins/sam/' + component.component + '.css', [
                component.assets.base + '/' + component.component + '-core.css',
                component.assets.base + '/skins/sam/' + component.component + '.css'
        ]]);
    
        // CSS minify output
    });
    
    // 
    // 
    // build:rollup
    // build:langs
    // build:prepend - after register (usually for license?)
    // build:append - after register
    // build:fixcrlf ?
});

/**
 * Generic build tasks common to modules and rollups
 */
namespace('utils', function() {
    
    /**
     * Concatenate a number of files to a destination file.
     * 
     * The first argument is the destination variable (string).
     * The second argument is the array of source files, using fully qualified paths.
     * 
     * TODO: make concat work for files or strings
     */
    desc('Concatenate files (SYNC)');
    task('concat', function() {
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
     * Register the module with a YUI.add() statement
     * 
     * of course we may need to find a templating library in order to
     * do some more sophisticated builds, but for now the string join works.
     */
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
    
    
// before mustache    
//    task('register', function() {
//        var output,
//        requiresQuoted = component.requires.map(function(v) {
//            return "'" + v.trim() + "'";
//        }),
//        data = component.files.concat, template;
//           
//        // TODO: consider a tiny templating engine to take care of registration?
//        // this would be closer to the YUI Builder implementation
//        template = [
//            "YUI.add('",
//            component.component,
//            "', function(Y) {\n\n",
//            data,
//            "\n\n",
//            "}, '",
//            component.version, // TODO: add component.details such as skinnable/requires etc.
//            "', { requires : [",
//            requiresQuoted.join(","),
//            "] });"
//        ],
//        output = template.join('');  
//
//        component.files.registered = output;
//
//        console.log('Registered module');
//    });

    
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
});