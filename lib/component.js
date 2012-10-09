var fs = require('fs');
var path = require('path');
var defaults = require('./defaults.js');

// Treat these loader options as arrays instead of object literals.
var ARRAY_DETAILS = ['use', 'supersedes', 'requires', 'optional', 'after', 'lang'];

/**
 * The component is a model for the information contained within the build.json instructions.
 * It describes all of the available build options.
 *
 * It verifies build options and provides basic getter methods for module paths and information.
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
 */
var Component = module.exports = function () {

    if (this instanceof Component) {
        this.options = arguments[0] || {};
    } else {
        if (arguments[0] === undefined || !fs.existsSync(arguments[0])) {
            throw new TypeError('Cannot find the build file: ' + arguments[0]);
        }

        try {
            var component = new Component();
            var build_file = fs.readFileSync(arguments[0]);

            component.options = JSON.parse(build_file);
            component.root_directory = path.dirname(arguments[0]);

            return component;
        } catch (e) {
            throw new TypeError('The build file was unparseable: ' + arguments[0] + ' Original exception: ' + e);
        }
    }
};

/**
 * Get an output filename for the given product type.
 * Product type can be null|undefined, "debug", or "min".
 * The default output filename is the "core" or "raw" version. Only debugger statements are stripped.
 *
 * @param {String} product_type The product type to retrieve a filename for.
 */
Component.prototype.filename = function (product_type) {

    var out_path = path.join(this.root_directory, this.options.build_directory);

    switch (product_type) {
        case 'debug':
        case 'min':
            return path.join(out_path, this.options.name + '-' + product_type + '.js');
        default:
            return path.join(out_path, this.options.name + '.js');
    }

};

/**
 * Get a list of skins that are available to build for this module.
 *
 * @return {Array} Array of skin names available to build in the source directory.
 */
Component.prototype.skins = function () {
    var skins = ['core'];

    // TODO: Scan source directory for available skins

    return skins;
};

/**
 * Get the skin CSS filename for the named skin, from the source
 * directory or for the directory specified as the second parameter.
 *
 * @param {String} name Skin name
 * @param {String} [relative="."] Relative path to resolve instead of source directory
 * @return {String} Path to the source skin file, or to the skin file of the relative path supplied.
 */
Component.prototype.skin = function (name, relative) {
    if (name === 'core') {
        return path.join(
            this.root_directory,
            relative || '.',
            this.options.assets_directory,
            this.options.name + '-core.css'
        );
    } else {
        return path.join(
            this.root_directory,
            relative || '.',
            this.options.assets_directory,
            'skins',
            name,
            this.options.name + '.css'
        );
    }
};

/**
 * Get the module assets directory (source assets or destination).
 *
 * @param {String} [relative="."] Relative path to resolve instead of source directory
 * @return {String} Path to the source assets directory, or to the assets directory of the relative path supplied.
 */
Component.prototype.assets = function (relative) {
    return path.join(this.root_directory,
        relative || '.',
        this.options.assets_directory);
};

/**
 * Get the loader option/detail with the specified name.
 *
 * @param {String} name Name of the detail to convert to string
 * @return {String} String version of object to append to the template.
 */
Component.prototype.details = function (name) {
    if (this.options.details &&
        this.options.details.hasOwnProperty(name) &&
        this.options.details[name] !== null &&
        this.options.details[name].length > 0) {
        return this.options.details[name].map(function (v) {
            return "'" + v.trim() + "'";
        }).join(', ');
    } else {
        return null;
    }
};

Component.prototype.alldetails = function() {
    var details = [],
        detail;

    Object.keys(this.options.details).forEach(function(name) {
        detail = this.details(name);

        if (detail !== null) {
            details.push(v + ': [' + detail + ']');
        }
    }, this);

    if (this.options.details &&
        this.options.details.skinnable === true) {
        details.push('skinnable: true');
    }

    // Prefixed with a comma due to the version number before it not having a trailing comma
    return ', { ' + details.join(', ') + ' }';
};

/**
 * Determine whether this module is skinnable.
 *
 * @return {Boolean} Whether the module is skinnable.
 */
Component.prototype.isSkinnable = function () {
    if (this.options.details &&
        this.options.details.skinnable) {
        return true;
    } else {
        return false;
    }
};

/**
 * Get the source directory for this module.
 *
 * @return {String} Source directory.
 */
Component.prototype.sourceDir = function (name) {
    return this.root_directory;
};

Component.prototype.name = function () {
    return this.options.name;
};

/**
 * Get a list of the javascript files in this module.
 */
Component.prototype.files = function () {
    if (this.options.hasOwnProperty('sourceFiles') && this.options.sourceFiles.length > 0) {
        return this.options.sourceFiles.map(function (v) {
            return path.join(this.root_directory, this.options.sourceDir, v);
        }, this);
    } else {
        return [];
    }
};

/**
 * Get the version number of this module.
 *
 * @return {String} The module version number.
 */
Component.prototype.version = function () {
    return this.options.version;
};
