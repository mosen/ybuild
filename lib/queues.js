"use strict";

/**
 * Queue definitions for building Yui3 modules
 */
var Queue = require('buildy/lib/queue').Queue;

/**
 * Create a task chain for building yui3 modules from source.
 *
 * @param component {Object} Component specification.
 * @return {Queue} Instance of a queue with component build tasks added.
 */
exports._createSourceQueue = function(component) {
    var q = new Queue(),

        component_sourcefiles = component.sourcefiles,
        component_buildfiles = component.buildfiles,
        component_name = component.name,
        component_version = component.version,
        component_details = component.details;

    q.task('files', component_sourcefiles) // all of these synchronous
        .task('concat')
        .task('jslint')
        .task('template', {
            templateFile: module_template,
            model: {
                yuivar    : 'Y',
                component : component_name,
                version   : component_version,
                details   : component_details
            }
        })
        .task('fork', {
            'debug code' : function(b) {
                this.task('write', { name: component_buildfiles.debug })
                    .task('log')
                    .run(b);
            },
            'core code' : function(b) {
                this.task('replace', {
                    regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
                    replace: '',
                    flags: 'mg'
                })
                .task('fork', {
                    'write core' : function(b) {
                        this.task('write', {
                            name: component_buildfiles.core
                        })
                            .run(b);
                    },
                    'minified code' : function(b) {
                        this.task('minify')
                            .task('write', {
                                name: component_buildfiles.min
                            })
                            .run(b);
                    }
                }).run(b);
            }
        });

    return q;
};

/**
 * Create a task chain for building yui3 skins(css) from source.
 *
 * @param component {Object} Component specification.
 * @return {Queue} Instance
 */
exports._createSkinsQueue = function(component) {
    var q = new Queue(),

        component_skin_sourcefile = component.skins.sam.source,
        component_skin_buildfile = component.skins.sam.build,
        component_skin_corefile = component.skins.core;

    q.task('files', [component_skin_sourcefile, component_skin_corefile])
        .task('concat')
        .task('csslint')
        .task('cssminify')
        .task('write', {
            name: component_skin_buildfile
        });

    return q;
};

/**
 * Create a task chain for building yui3 assets(images, etc) from source.
 *
 * @param component {Object} Component specification.
 * @return {Queue} Instance
 */
exports._createAssetsQueue = function(component) {
    var q = new Queue(),

        component_assets_sourcedir = component.assets.source,
        component_assets_builddir = component.assets.build;


        q.task('copy', {
            src: [
                component_assets_sourcedir + '/*'
            ],
            dest: component_assets_builddir,
            recursive: true,
            excludes: [
                path.join(component.sourcedir, 'assets/skins/')
            ]
        });

    return q;
};

/**
 * Create a task chain for building yui3 documentation from source.
 *
 * @param component {Object} Component specification.
 * @return {Queue} Instance
 */
exports._createDocsQueue = function(component) {
    // TODO: documentation generation via yuidocjs
};
