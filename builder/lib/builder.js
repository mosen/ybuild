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
    ju = require('./jake_utils.js'),
    componentFactory = require('./component.js'),
    component = componentFactory.factory('ant', {buildProperties: './build.properties'});

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
    fs.writeFileSync('./' + component.buildDir + '/' + component.getFilename('core'), component.buildStrings.raw, 'utf8');
    fs.writeFileSync('./' + component.buildDir + '/' + component.getFilename('debug'), component.buildStrings.registered, 'utf8');
    fs.writeFileSync('./' + component.buildDir + '/' + component.getFilename('min'), component.buildStrings.min, 'utf8');
    
    console.log('Module has been built');
});

desc('Create temporary build directory to hold build files at each stage of the process.');
directory('./' + component.buildDir);

//desc('Create assets directory to hold module assets.');
//directory({ './' + component.buildDir + '/' + component.assetsBaseDir : [ './' + component.buildDir ]});

desc('Create skin directory to hold module skin assets.');
directory('./' + component.buildDir + '/' + component.assetsBaseDir + '/' + component.skinBaseDir);

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
        console.log('Cleaning local build directory...');
        
        if (path.exists(component.buildDir)) {
            fs.unlink(component.buildDir);
        }
    });
    
    desc('Build:concat (SYNC)');
    task('concat', function() {
        console.log('Concatenating files:');
        console.log('\t' + component.getSourceFiles().join(', '));
        
        component.buildStrings.concat = ju.concatSync(null, component.getSourceFiles());
    });
    
    desc('Build:lint (ASYNC)');
    task('lint', function() {
        console.log('Linting source...');
        
        var i = 0,
            sourceFiles = component.getSourceFiles(),
            fileCount = sourceFiles.length,
            fileComplete = function() {
                i++;
                if (i >= fileCount) {
                    complete();
                }
            };
        
        sourceFiles.forEach(function(v) {
            ju.lint({sourceFile: v}, null, fileComplete);
        });
    }, true);
    
    desc('Build:register (SYNC)');
    task('register', function() {
        var componentDetails = component.getAllDetailsString(),
            view = {
                component : component.name,
                yuivar : 'Y',
                version : component.version,
                code : component.buildStrings.concat,
                details : (componentDetails && componentDetails.length > 0) ? ', {' + componentDetails + '}' : ''
            };
        console.log('Registering module ' + component.name + '...');
        
        component.buildStrings.registered = ju.applyTemplateSync(null, '../../builder/files/moduletemplate.mustache', view); // TODO: template part of configuration
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
        var data,
            logger = {
                regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
                replace : "",
                flags : "mg"
            },
            logger_regex = new RegExp(logger.regex, logger.flags);
            
        console.log('Removing logger statements...');

        data = component.buildStrings.registered;
        component.buildStrings.raw = data.replace(logger_regex, logger.replace);
    });
    
    desc('Build:minify (SYNC)');
    task('minify', function() {
        console.log('Minifying composited source...');
        
        component.buildStrings.min = ju.minifySync({
            source: component.buildStrings.raw
        });
    });
    
    // build:skins
    desc('Build:skins (ASYNC)');
    task('skins', function() {
        var destFile = './' + component.buildDir + '/' + component.name + '.css',
            coreFile = component.getSkinCoreFilename(),
            skinFile = component.getSkinFilename();
            
        console.log('Writing skins...');
        console.log('\t' + coreFile);
        console.log('\t' + skinFile);
  
        var cssConcat = ju.concatSync(null, [
            coreFile, skinFile         
        ]);
    
        // copy core to core in dest
        // TODO: parse this and make pretty?
        ju.copy(component.getSkinCoreFilename(), component.buildDir + '/' + component.component + '-core.css')
    
        // CSS Lint (ASYNC)
        ju.cssLint({source: cssConcat}, null, function(result) {
           console.log('CSSLint done, results:');
           console.log(result);
        });
    
        // CSS Minify + Write (ASYNC)
        ju.cssMinify({source: cssConcat, destFile: destFile}, function(result) {
           console.log('CSS minified.');
           complete();
        });
    }, true);
    
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