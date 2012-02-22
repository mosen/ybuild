"use strict";

/**
 * YUI Module default build specification.
 *
 * These options will be the default values when values are not supplied as part of the build.json
 *
 * @var defaultBuildSpecification
 * @type Object
 */
var defaultBuildSpecification = module.exports = {
    name : "component",
    type : "js",
    version : "@VERSION@",
    skip : {
        clean : false,
        register : false,
        lint : false,
        logger: false
    },
    sourceDir : "js",
    sourceFiles : ["component.js"],
    buildDir : "../build",
    assetsDir : "assets",
    tools : {
        template : {
            yuivar : "Y",
            module_template : "../templates/moduletemplate.handlebars"
        },
        replace : {
            regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
            replace: '',
            flags: 'mg'
        }
    },
    details : {
        use : null,
        supersedes : null,
        requires : ["base"],
        optional : null,
        after : null,
        after_map : {},
        lang : ["en-US"],
        skinnable : false
    }
};