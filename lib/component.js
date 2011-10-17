"use strict";
/**
 * YUI component build specification object
 */
var path      = require('path'),
    buildspec = require('./buildspec.js');

/**
 * Component - wraps the build specification (build.json) and provides convenience
 * methods for determining filenames.
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
        this._buildSpec = arguments[0] || {};
    } else {
        try {
            var fs = require('fs'),
                buildfile, buildspec,
                component = Object.create(Component.prototype, ATTRS);

            if (arguments[0] !== undefined && path.existsSync(arguments[0])) {
                buildfile = fs.readFileSync(arguments[0]);
                component._buildSpec = JSON.parse(buildfile);
                component._sourceDir = path.dirname(arguments[0]);
            } else {
                buildspec = buildspec.defaultSpec;
            }

            component._initFileNames();

            return component;
        } catch (e) {
            throw new TypeError('The build spec file was not readable or parseable: ' + arguments[0] + ' Original error: ' + e);
        }
    }
};

/**
 * Get the build filename for a given build type.
 *
 * @method _getBuildFileName
 * @param type {String} Type of file, usually one of "core", "debug", "min"
 * @return {String} Absolute path to the build file
 * @protected
 */
Component.prototype._getBuildFileName = function(type) {
    switch (type) {
        case 'core':
            return path.join(this._sourceDir, this._buildSpec.buildDir, this._buildSpec.name + '.js');
            break;
        default:
            return path.join(this._sourceDir, this._buildSpec.buildDir, this._buildSpec.name + '-' + type + '.js');
    }
};

Component.prototype._getAssetsDirectory = function(isBuildFile) {
    return path.join(this._sourceDir,
                (!isBuildFile || this._buildSpec.buildDir),
                this._buildSpec.assetsDir);
};

/**
 * Get the skin source/build filename for a given skin.
 * 
 * @method _getSkinFilename
 * @param name {String} Name of the skin, default is 'sam'
 * @param isBuildFile {Boolean} Is the returned filename for the output version?
 * @return {String} Absolute path to the skin (css) file.
 * @protected
 */
Component.prototype._getSkinFilename = function(name, isBuildFile) {
    var cssSuffix = isBuildFile ? '' : '-skin';
    name = name || 'sam';

    
    return path.join(this._sourceDir,
                    (!isBuildFile || this._buildSpec.buildDir),
                    this._buildSpec.assetsDir, 
                    'skins',
                    name, 
                    this._buildSpec.name + cssSuffix + '.css');
};

/**
 * Get the core css filename.
 *
 * @method _getSkinCoreFilename
 * @param isBuildFile {Boolean} Is the returned filename for the output version?
 * @return {String} Absolute path to the skin (css) file.
 * @protected
 */
Component.prototype._getSkinCoreFilename = function(isBuildFile) {
    return path.join(this._sourceDir,
                     (!isBuildFile || this._buildSpec.buildDir),
                     this._buildSpec.assetsDir, 
                     this._buildSpec.name + '-core.css');
};

/**
 * Get the specified detail as a hash element string, for the loader
 * template.
 *
 * @method _getDetailString
 * @param detail {String} Name of the detail property.
 * @return {String} Comma separated, and quoted values.
 * @protected
 */
Component.prototype._getDetailString = function(detail) {
    if (this._buildSpec.details.hasOwnProperty(detail) &&
        this._buildSpec.details[detail] !== null &&
        this._buildSpec.details[detail].length > 0) {
        return this._buildSpec.details[detail].map(function(v) {
           return "'" + v.trim() + "'";
        }).join(', ');
    } else {
        return null;
    }
};

/**
 * Pre-generate component filenames so that they are available
 * as hash/array properties.
 *
 * @method _initFileNames
 * @return undefined
 * @protected
 */
Component.prototype._initFileNames = function() {
    this._buildFiles = {};

    this._buildFiles.core = this._getBuildFileName('core');
    this._buildFiles.debug = this._getBuildFileName('debug');
    this._buildFiles.min = this._getBuildFileName('min');

    this._skins = {};

    this._skins.core = {
        source : this._getSkinCoreFilename(false),
        build : this._getSkinCoreFilename(true)
    };

    this._skins.sam = {
        source : this._getSkinFilename('sam', false),
        build : this._getSkinFilename('sam', true)
    };

    this._assets = {
        source : this._getAssetsDirectory(false),
        build : this._getAssetsDirectory(true)
    };

};

// Details with these names are treated as javascript arrays in the output template.
Component.prototype._arrayDetails = ['use', 'supersedes', 'requires', 'optional', 'after', 'lang'];

// es5 properties
var ATTRS = {

    /**
     * @property skinnable
     * @type Boolean
     */
    skinnable : {
        get : function() {
            return this._buildSpec.details.skinnable;
        }
    },

    /**
     * @property assets
     * @type Object
     */
    assets : {
        get : function() {
            return this._assets;
        }
    },

    /**
     * @property sourcedir
     * @type String
     */
    sourcedir : {
        get : function() { return this._sourceDir; }
    },

    /**
     * @property name
     * @type String
     */
    component : {
        get : function() { return this._buildSpec.name; },
        set : function(v) { this._buildSpec.name = v; }
    },

    /**
     * @property sourcefiles
     * @type Array
     */
    sourcefiles : {
        get : function() {
            // Get sourcefiles with the relative path prefixed.
            return this._buildSpec.sourceFiles.map(function(v) {
                return path.join(this._sourceDir, this._buildSpec.sourceDir, v);
            }, this);
        },
        set : function(v) {
            // TODO: validation and munging
            this._buildSpec.sourceFiles = v;
        }
    },

    /**
     * @property buildfiles
     * @type Array
     */
    buildfiles : {
        get : function() { return this._buildFiles; }
        // no setter, use individual file accessor
    },

    /**
     * @property skins
     * @type Object
     */
    skins : {
        get : function() { return this._skins; }
    },

    /**
     * @property version
     * @type String
     */
    version : {
        get : function() {
            return this._buildSpec.version;
        },
        set : function(v) {
            this._buildSpec.version = v;
        }
    },

    /**
     * @property details
     * @type String
     */
    details : {
        get : function() {
            var details = [],
                detail;

            this._arrayDetails.forEach(function(v) {
                detail = this._getDetailString(v);

                if (detail !== null) {
                    details.push(v + ': [' + detail + ']');
                }
            }, this);

            if (this._buildSpec.details.skinnable === true) {
                details.push('skinnable: true');
            }

            // Prefixed with a comma due to the version number before it not having a trailing comma
            return ', { ' + details.join(', ') + ' }';
        }
        // no setter, use individual detail accessor
    }

};

exports.Component = Component;