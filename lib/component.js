/**
 * YUI component build specification object
 */
var path    = require('path');

/**
 * Component specification
 *
 * The function can be invoked two ways:
 *
 * 1. As a constructor:
 * var c = new Component([config]);
 *
 * 2. As a factory, when specifying a build json file:
 * var c = Component([buildfile]);
 *
 * @class Component
 * @constructor
 * @public
 */
var Component = function() {

    if (this instanceof Component) {
        this._config = arguments[0] || {};
    } else {
        try {
            var fs = require('fs'),
                buildfile, buildspec,
                component = new Component();

            buildfile = fs.readFileSync(arguments[0]);
            buildspec = JSON.parse(buildfile);

            component._config = buildspec;
            component._baseDir = path.dirname(arguments[0]);

            return component;
        } catch (e) {
            // TODO: better handling of invalid build file
            return null;
        }
    }
};

Component.prototype = {
    
    // Base Dir, determined by the location of the build spec file
    _baseDir : './',
    
    // Component configuration
    _config : {},
    
    /**
     * Get the output filename for a given build type.
     * 
     * @method getFilename
     * @param type {String} Type of file, usually one of "core", "debug", "min"
     * @return {String} Absolute path to the build file
     * @public
     */
    getFilename : function(type) {
        switch (type) {
            case 'core':
                return path.join(this._baseDir, this._config.buildDir, this._config.name + '.js');
                break;
            default:
                return path.join(this._baseDir, this._config.buildDir, this._config.name + '-' + type + '.js');
        }
    },
    
    // Get component details as single-quoted, comma-delimited string
    getDetailString : function(detail) {
        if (this._config.details.hasOwnProperty(detail) &&
            this._config.details[detail] !== null && 
            this._config.details[detail].length > 0) {
            return this._config.details[detail].map(function(v) {
               return "'" + v.trim() + "'"; 
            }).join(', ');
        } else {
            return null;
        }
    },
    
    getAllDetailsString : function() {
        var details = [],
            detail;
        
        this.arrayDetails.forEach(function(v) {
            detail = this.getDetailString(v);
            
            if (detail !== null) {
                details.push(v + ': [' + detail + ']');
            }
        }, this);
        
        if (this._config.details.skinnable === true) {
            details.push('skinnable: true');
        }
        
        // Prefixed with a comma due to the version number before it not having a trailing comma
        return ', {' + details.join(', ') + '}';
    },
    
    // Grab source files with relative paths appended
    getSourceFiles : function() {
        return this._config.sourceFiles.map(function(v) {
            return path.join(this._baseDir, this._config.sourceDir, v); 
        }, this);
    },
    
    // Grab named skin filename location, or default to 'sam'
    // build = true means, prepend build directory
    getSkinFilename : function(skin, build) {
        skin = skin || 'sam';
        
        return path.join(this._baseDir, 
                        (!build || this._config.buildDir), 
                        this._config.assetsDir, 
                        'skins', 
                        skin, 
                        this._config.name + '-skin.css');
    },
    
    // Grab core skin filename
    getSkinCoreFilename : function(build) {
        return path.join(this._baseDir,
                         (!build || this._config.buildDir),
                         this._config.assetsDir, 
                         this._config.name + '-core.css');
    },
    
    getAssetsDir : function(build) {
        return path.join(this._baseDir,
                        (!build || this._config.buildDir),
                        this._config.assetsDir);
    },
    
    // TODO: copy other assets via cprf
    
    // These details are treated as javascript arrays
    arrayDetails : ['use', 'supersedes', 'requires', 'optional', 'after', 'lang']
};

exports.Component = Component;