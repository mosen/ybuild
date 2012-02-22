"use strict";

/**
 * Queue definitions for building Yui3 modules
 */
var path = require('path'),
    Queue = require('buildy').Queue;

/**
 * Create a task chain for building yui3 modules from source.
 *
 * @param component {Object} Component specification.
 * @return {Queue} Instance of a queue with component build tasks added.
 */
exports._createSourceQueue = function(component, queueOpts) {
    var q = new Queue('collect source files', queueOpts),

        component_sourcefiles = component.sourcefiles,
        component_buildfiles = component.buildfiles,
        component_name = component.component,
        component_version = component.version,
        component_details = component.details;

    q.task('files', component_sourcefiles) // all of these synchronous
        .task('jslint')
        .task('concat')
        .task('template', {
            template_file: path.resolve(__dirname + '/../templates/moduletemplate.handlebars'), // use build spec
            template_vars: {
                yuivar    : 'Y',
                component : component_name,
                version   : component_version,
                details   : component_details
            }
        })
        .task('fork', {
            'debug code' : function() {
                this.task('write', { name: component_buildfiles.debug })
                    .task('log', { message: 'wrote debug code to: ' + component_buildfiles.debug })
                    .run();
            },
            'core code' : function() {
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
                            .task('log', { message: 'wrote raw code to: ' + component_buildfiles.core })
                            .run();
                    },
                    'minified code' : function(b) {
                        this.task('jsminify')
                            .task('write', {
                                name: component_buildfiles.min
                            })
                            .task('log', { message: 'wrote minified code to: ' + component_buildfiles.min })
                            .run();
                    }
                }).run();
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
exports._createSkinsQueue = function(component, queueOpts) {
    var q = new Queue('collect stylesheets', queueOpts),

        component_skin_sourcefile = component.skins.sam.source,
        component_skin_buildfile = component.skins.sam.build,
        component_skin_corefile = component.skins.core.source;

    q.task('files', [component_skin_sourcefile, component_skin_corefile])
        .task('concat')
        .task('csslint')
        .task('cssminify')
        .task('log', { message: 'wrote stylesheet (minified) to: ' + component.skins.sam.build })
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
exports._createAssetsQueue = function(component, queueOpts) {
    var q = new Queue('collect assets', queueOpts),

        component_skin_sourcefile = component.skins.sam.source,
        component_skin_corefile = component.skins.core.source,
        component_assets_sourcedir = component.assets.source,
        component_assets_builddir = component.assets.build;

        q.task('copy', {
            src: [
                component_assets_sourcedir
            ],
            dest: path.dirname(component_assets_builddir),
            recursive: true,
            excludes: [
                path.join(component.sourcedir, 'assets/skins/', component_skin_corefile),
                path.join(component.sourcedir, 'assets/skins/sam/', component_skin_sourcefile)
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
exports._createDocsQueue = function(component, queueOpts) {
    // TODO: documentation generation via yuidocjs
};
