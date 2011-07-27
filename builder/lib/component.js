/**
 * component build specification object
 * 
 * @method factory
 * @param sourceType {String} One of 'ant', 'json'
 * @param sourceOptions {Object} Constructor information, dependent on type
 * @public
 * 
 * sourceOptions (ant) {
 *  buildFile : 'build.xml',
 *  buildProperties : 'build.properties',
 *  baseDir : '/path/to/module'
 * }
 * 
 * sourceOptions (json) {
 *  buildFile : 'build.json',
 *  baseDir : '/path/to/module'
 * }
 * 
 */
exports.factory = function(sourceType, sourceOptions) {
    switch(sourceType.toLowerCase()) {
        case 'ant':
            // read build.xml
            // read build.properties
            var iniparser = require('iniparser');
            
            // 
            // new component, set values
            // return new component
            break;
        
        case 'json':
            // read build.json
            // new component, set values
            // return new component
            break;
    }
}

var Component = function() {
    
};

Component

Component.prototype = {
    
};

/*
 * // Directories
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

 */