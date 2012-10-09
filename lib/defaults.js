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
    type : "js", // js | css | lang
    version : "@VERSION@",
    skip : [],
    sourceDir : "js",
    sourceFiles : ["component.js"], // By default this should be replaced with component name.js
    buildDir : "../build",
    assetsDir : "assets",
    tasks : {
        template : {
            yuivar : "Y",
            module_template : "../templates/moduletemplate.handlebars",
            lang_template : "../templates/lang.handlebars",
            rollup_template : "../templates/rollup.handlebars"
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