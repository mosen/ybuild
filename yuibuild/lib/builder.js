var Queue = require('buildy/lib/queue').Queue,
    Buildy = require('buildy').Buildy,
    path = require('path'),
    module_path = __dirname;

function Builder(component) {
    this._component = component;
    
    this._buildy = new Buildy();
    this._taskQueue = new Queue('build:' + this._component._config.name);
    this._createQueue();
}

Builder.prototype = {
    
    _template : path.resolve(module_path + '/../templates/moduletemplate.mustache'),
    
    _component : null,
    
    _taskQueue : null,
    
    _buildy : null,
    
    _createQueue : function() {
        var component = this._component,
            filename_debug = component.getFilename('debug'),
            filename_core = component.getFilename('core'),
            filename_min = component.getFilename('min'),
            module_template = this._template;
        
        console.log(module_template);
        
        this._taskQueue
            .task('files', component.getSourceFiles()) // all of these synchronous
            .task('concat')
            .task('jslint')
            .task('template', { templateFile: module_template, model: { 
                yuivar : 'Y',
                component : component._config.name,
                version : component._config.version,
                details : component.getAllDetailsString()
            }})
            .task('fork', {
                'debug:' : function(b) {
                    this
                    .task('write', { name: filename_debug })
                    .run(b);
                },
                'raw:' : function(b) {
                    this.task('replace', {regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n', replace: '', flags: 'mg'})
                        .task('fork', {
                            'raw:write' : function(b) {
                               this                             
                                   .task('write', {name: filename_core})
                                   .run(b);
                            },
                            'minify:' : function(b) { 
                               this
                                   .task('minify')
                                   .task('write', {name: filename_min})
                                   .run(b);
                            }
                        }).run(b);
                }          
            });
    },
    
    run : function() {
        this._taskQueue.run(this._buildy);
    }
};

exports.Builder = Builder;