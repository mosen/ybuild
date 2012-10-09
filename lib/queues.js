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
exports._createSourceQueue = function (component, queueOpts) {

    var q = new Queue('build source', queueOpts);

    q.task('files', component.files())// all of these synchronous
        .task('jslint')
        .task('concat')
        .task('handlebars', {
            template_file: path.resolve(path.join(__dirname, '..', 'templates', 'module.handlebars')), // use build spec
            values: {
                yuivar: 'Y',
                component: component.name(),
                version: component.version(),
                details: ",'TODO IMPLEMENTATION'"// TODO: proper details implementation component_details
            }
        })
        .task('dump')
        .task('fork', {
            'debug code': function () {
                this.task('write', { dest: component.filename('debug') })
                    .task('log', { message: 'wrote debug code to: ' + component.filename('debug') })
                    .run();
            },
            'core code': function () {
                this.task('replace', {
                    regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
                    replace: '',
                    flags: 'mg'
                })
                .task('fork', {
                    'write core': function (b) {
                        this.task('write', {
                            dest: component.filename('core')
                            })
                            .task('log', { message: 'wrote raw code to: ' + component.filename('core') })
                            .run();
                    },
                    'minified code': function (b) {
                        this.task('uglify')

                            .task('dump')
                            .task('write', {
                                dest: component.filename('min')
                            })
                            .task('log', { message: 'wrote minified code to: ' + component.filename('min') })
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
