var Queue       = require('buildy/lib/queue').Queue,
    Buildy      = require('buildy').Buildy,
    path        = require('path'),
    module_path = __dirname;

/**
 * The builder wraps several yui specific task chains, taking a component object and then
 * executing these chains against the object.
 *
 * @class Builder
 * @constructor
 * @param component {Component} component object.
 */
function Builder(component) {
    this._component = component;

    this._buildy = new Buildy();
    this._taskQueues = [];

    var jsQueue = new Queue('build source:' + this._component._config.name);
    this._createSourceQueue(jsQueue);
    this._taskQueues.push(jsQueue);

    if (this._component._config.details.skinnable === true) {
        var cssQueue = new Queue('build assets:' + this._component._config.name);
        this._createSkinQueue(cssQueue);
        this._taskQueues.push(cssQueue);

        var assetsQueue = new Queue('copy extra assets:' + this._component._config.name);
        this._createAssetsQueue(assetsQueue);
        this._taskQueues.push(assetsQueue);
    }
}

Builder.prototype = {

    _template : path.resolve(path.join(module_path, '/../templates/moduletemplate.handlebars')),

    _component : null,

    _taskQueues : null,

    _buildy : null,

    _createSourceQueue : function(q) {
        var component       = this._component,
            filename_debug  = component.getFilename('debug'),
            filename_core   = component.getFilename('core'),
            filename_min    = component.getFilename('min'),
            module_template = this._template,
            component_name  = component._config.name,
            component_ver   = component._config.version,
            component_detail= component.getAllDetailsString();

        console.log('Building component: ' + component_name + ' v' + component_ver);
        //console.log(component_detail);
        console.log('Outputting files:');
        console.log("\tdebug: " + filename_debug);
        console.log("\tcore: " + filename_core);
        console.log("\tmin: " + filename_min);
        console.log("Builder output follows...");

        q.task('files', component.getSourceFiles()) // all of these synchronous
            .task('concat')
            .task('jslint')
            .task('template', {
                templateFile: module_template,
                model: {
                    yuivar    : 'Y',
                    component : component._config.name,
                    version   : component._config.version,
                    details   : component.getAllDetailsString()
                }
            })
            .task('fork', {
                'debug code' : function(b) {
                    this.task('write', { name: filename_debug })
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
                                    name: filename_core
                                })
                                    .run(b);
                            },
                            'minified code' : function(b) {
                                this.task('minify')
                                    .task('write', {
                                        name: filename_min
                                    })
                                    .run(b);
                            }
                        }).run(b);
                }
            });
    },

    _createSkinQueue : function(q) {
        var component     = this._component,
            filename_skin     = component.getSkinFilename('sam'),
            filename_core     = component.getSkinCoreFilename(),
            filename_min_out  = component.getSkinFilename('sam', true);

        console.log('Outputting files:');
        console.log("\tmin: " + filename_min_out);

        q.task('files', [filename_skin, filename_core])
            .task('concat')
            .task('csslint')
            .task('cssminify')
            .task('write', {
                name: filename_min_out
            });
    },

    _createAssetsQueue : function(q) {
        var component     = this._component,
            assets_source = component.getAssetsDir(),
            assets_dest   = component.getAssetsDir(true);

        console.log('Copying assets:');
        console.log("\tfrom: " + assets_source);
        console.log("\tto: " + assets_dest);

        q.task('copy', {
            src: [
                assets_source + '/*'
            ],
            dest: assets_dest,
            recursive: true,
            excludes: [
                path.join(component._baseDir, 'assets/skins/')
            ]
        });
    },

    run : function() {
        this._taskQueues.forEach(function(q) {
            var worker = Buildy.factory(Buildy.TYPES.STRING, '');
            q.run(worker);
        }, this);
    }
};

exports.Builder = Builder;