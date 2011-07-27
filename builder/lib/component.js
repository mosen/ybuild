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
    var buildDir = '/build_tmp';
    
    switch(sourceType.toLowerCase()) {
        case 'ant':
            // read build.xml
            // read build.properties
            var iniparser = require('iniparser'),
                p = iniparser.parseSync(sourceOptions.buildProperties);
                component = new Component();
            
            component.name = p['component'];
            component.version = p['version'] || '1.0.0';
            component.buildDir = p['component.builddir'] || buildDir;
            component.isRollup = (p['component.rollup'] === 'true') ? true : false;
            
            // Skip stuff
            for (prop in component.skip) {
                if (component.hasOwnProperty(prop)) {
                    component.skip[prop] = (p[prop+'.skip'] === 'true') ? true : false;
                }
            }
            
            component.sourceFiles = p['component.jsfiles'] ? p['component.jsfiles'].split(',') : fs.readdirSync(component.sourceBaseDir);
            
            // Process these as comma separated arrays in build.properties
            for (detail in component.details_arrays) {
                component.details[detail] = (p['component.' + detail]) ? p['component.' + detail].split(',') : null;
            }
            
            component.details.skinnable = (p['component.skinnable'] === 'true') ? true : false;
            
            return component;
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

Component.prototype = {
    
    name : '',
    
    version : '',
    
    buildDir : '',
    
    isRollup : false,
    
    skip : {
        clean : false,
        register : false,
        lint : false,
        logger: false
    },
    
    sourceFiles : [],
    
    sourceBaseDir : 'js',
    
    assetsBaseDir : 'assets',
    
    skinBaseDir : 'skins/sam',
    
    // Built files, in string format
    buildStrings : {
        concat : "",
        registered : "",
        raw : "",
        min : ""
    },
    
    // Tool specific options / invocations
    tools : {
        jslint : {
            options : {}
        },
        csslint : {
            options : {}
        }
    },
    
    getFilename : function(type) {
        switch (type) {
            case 'core':
                return this.name + '.js';
                break;
            case 'debug':
                return this.name + '-debug.js';
                break;
            case 'min':
                return this.name + '-min.js';
                break;
        }
    },
    
    getDetailString : function(detail) {
        if (this.details[detail] !== null && this.details[detail].length > 0) {
            var quotedList = this.details[detail].map(function(v) {
               return "'" + v.trim() + "'"; 
            });
            
            return quotedList.join(', ');
        } else {
            return null;
        }
    },
    
    getAllDetailsString : function() {
        var details = [],
            detail;
        
        for (var prop in this.arrayDetails) {
            detail = this.getDetailString(this.arrayDetails[prop]);
            
            if (detail !== null) {
                details.push(this.arrayDetails[prop] + ':[' + detail + ']');
            }
        }
        
        if (this.details.skinnable === true) {
            details.push('skinnable:true');
        }
        
        return details.join(',');
    },
    
    // Grab source files with relative paths appended
    getSourceFiles : function(prefix) {
        var dirPrefix = prefix || './',
            sourceBaseDir = this.sourceBaseDir,
            relativeSources = this.sourceFiles.map(function(v) {
                return dirPrefix + sourceBaseDir + '/' + v; 
            });
        
        return relativeSources;
    },
    
    getSkinFilename : function(prefix) {
        var dirPrefix = prefix || './';
        
        return dirPrefix + this.assetsBaseDir + '/' + this.skinBaseDir + '/' + this.name + '-skin.css';
    },
    
    getSkinCoreFilename : function(prefix) {
        var dirPrefix = prefix || './';
        
        return dirPrefix + this.assetsBaseDir + '/' + this.name + '-core.css';
    },
    
    details : {
        // Automatically load these components
        use : null,
        
        // Modules that the component supersedes
        supersedes : null,
        
        // Modules required before this one
        requires : null,
        
        // Optional modules
        optional : null,
        
        // Modules that should be loaded before this one
        after : null,
        
        // Array of i18n tags that this module has bundles for
        lang : null,
        
        // Auto load skin assets?
        // NOTE: this is the only non-array details property, so don't convert to array literal
        skinnable : false        
    },
    
    // These details are treated as arrays
    arrayDetails : ['use', 'supersedes', 'requires', 'optional', 'after', 'lang']
};