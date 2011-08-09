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
var globals = require('./defaults').config;
var path   = require('path');

exports.factory = function(sourceType, sourceOptions) {
    
    switch(sourceType.toLowerCase()) {
        case 'ant':
            // read build.xml
            var iniparser = require('iniparser'),
                p = iniparser.parseSync(sourceOptions.buildProperties);
                component = new Component();
            
            component._config.name = p['component'];
            component._config.version = p['version'] || '1.0.0';
            component._config.buildDir = p['component.builddir'] || buildDir;
            component._config.isRollup = (p['component.rollup'] === 'true') ? true : false;
            
            // Skip stuff
            for (var prop in component.skip) {
                if (component.hasOwnProperty(prop)) {
                    component._config.skip[prop] = (p[prop+'.skip'] === 'true') ? true : false;
                }
            }
            
            component._config.sourceFiles = p['component.jsfiles'] ? p['component.jsfiles'].split(',') : fs.readdirSync(component.sourceBaseDir);
            
            // Process these as comma separated arrays in build.properties
            for (var detail in component.details_arrays) {
                component._config.details[detail] = (p['component.' + detail]) ? p['component.' + detail].split(',') : null;
            }
            
            component._config.details.skinnable = (p['component.skinnable'] === 'true') ? true : false;
            
            return component;
            break;
        
        case 'json':
            var fs = require('fs'),
                buildfile, buildspec,
                component = new Component();
                
            buildfile = fs.readFileSync(sourceOptions.buildFile);
            buildspec = JSON.parse(buildfile);

            component._config = buildspec;
            component._baseDir = path.dirname(sourceOptions.buildFile);
            return component;
            break;
        
        // Just return the component build specification, allow the end user script to modify properties
        default:
            var component = new Component();
            return component;
            break;
    }
}

var Component = function(config) {
    this._config = config;
};

Component.prototype = {
    
    // Base Dir, determined by the location of the build spec file
    _baseDir : './',
    
    // Component configuration
    _config : {},
    
    getFilename : function(type) {
        switch (type) {
            case 'core':
                return this._baseDir + '/' + this._config.buildDir + '/' + this._config.name + '.js';
                break;
            case 'debug':
                return this._baseDir + '/' + this._config.buildDir + '/' + this._config.name + '-debug.js';
                break;
            case 'min':
                return this._baseDir + '/' + this._config.buildDir + '/' + this._config.name + '-min.js';
                break;
        }
    },
    
    getDetailString : function(detail) {
        if (this._config.details[detail] !== null && this._config.details[detail].length > 0) {
            var quotedList = this._config.details[detail].map(function(v) {
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
                details.push(this.arrayDetails[prop] + ': [' + detail + ']');
            }
        }
        
        if (this._config.details.skinnable === true) {
            details.push('skinnable: true');
        }
        
        // Prefixed with a comma due to the version number before it not having a trailing comma
        return ', {' + details.join(', ') + '}';
    },
    
    // Grab source files with relative paths appended
    getSourceFiles : function() {
        var dirPrefix = this._baseDir || './',
            sourceDir = this._config.sourceDir,
            relativeSources = this._config.sourceFiles.map(function(v) {
                return dirPrefix + '/' + sourceDir + '/' + v; 
            });
        
        return relativeSources;
    },
    
    getSkinFilename : function(prefix) {
        var dirPrefix = prefix || './';
        
        return dirPrefix + this._config.assetsDir + '/skins/sam/' + this.name + '-skin.css';
    },
    
    getSkinCoreFilename : function(prefix) {
        var dirPrefix = prefix || './';
        
        return dirPrefix + this._config.assetsDir + '/' + this.name + '-core.css';
    },
    
    // These details are treated as arrays
    arrayDetails : ['use', 'supersedes', 'requires', 'optional', 'after', 'lang']
};