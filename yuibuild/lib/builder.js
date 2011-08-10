var Queue = require('buildy/lib/queue').Queue,
    Buildy = require('buildy').Buildy,
    path = require('path'),
    module_path = __dirname;

function Builder(component) {
    this._component = component;
    
    this._buildy = new Buildy();
    
    var jsQueue = new Queue('build source:' + this._component._config.name);
    this._createSourceQueue(jsQueue);
    this._taskQueues.push(jsQueue);
    
    var cssQueue = new Queue('build assets:' + this._component._config.name);
    this._createSkinQueue(cssQueue);
    this._taskQueues.push(cssQueue);
}

Builder.prototype = {
    
    _template : path.resolve(path.join(module_path, '/../templates/moduletemplate.mustache')),
    
    _component : null,
    
    _taskQueues : [],
    
    _buildy : null,
    
    _createSourceQueue : function(q) {
        var component       = this._component,
            filename_debug  = component.getFilename('debug'),
            filename_core   = component.getFilename('core'),
            filename_min    = component.getFilename('min'),
            module_template = this._template;
            
        console.log('Outputting files:');
        console.log("\tdebug: " + filename_debug);
        console.log("\tcore: " + filename_core);
        console.log("\tmin: " + filename_min);
        
       q.task('files', component.getSourceFiles()) // all of these synchronous
        .task('concat')
        .task('jslint')
        .task('template', {templateFile: module_template, model: { 
            yuivar    : 'Y',
            component : component._config.name,
            version   : component._config.version,
            details   : component.getAllDetailsString()
        }})
        .task('fork', {
            'debug:' : function(b) {
                this.task('write', {name: filename_debug})
                    .run(b);
            },
            'raw:' : function(b) {
                this.task('replace', { 
                        regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n', 
                        replace: '', 
                        flags: 'mg'
                    })
                    .task('fork', {
                        'raw:write' : function(b) {
                           this.task('write', {name: filename_core})
                               .run(b);
                        },
                        'minify:' : function(b) { 
                           this.task('minify')
                               .task('write', {name: filename_min})
                               .run(b);
                        }
                    }).run(b);
            }          
        });
    },
    
    _createSkinQueue : function(q) {
        var component = this._component,
            filename_skin = component.getSkinFilename('sam'),
            filename_core = component.getSkinCoreFilename(),
            filename_out = 'test.css';
        
        console.log('Outputting files:');
        console.log("\tcore: " + filename_core);
        console.log("\tmin: " + filename_skin);
        
        q.task('files', [filename_skin, filename_core])
         .task('concat')
         .task('csslint')
         .task('fork', {
             'raw' : function(b) {
                 //this.task('write', { name: filename_core})
             },
             'minified' : function(b) {
                 this.task('cssminify').task('write', {name: filename_out}).run(b);
             }
          });
        
        
//            nq.task('files', ['./css/test1.css', './css/test2.css'])
//        .task('concat')
//        .task('csslint')
//        .task('fork', {
//            'raw css version' : function(b) {
//                this.task('write', { name: './build/test.css' }).run(b);
//            },
//            'minified css version' : function(b) {
//                this.task('cssminify').task('write', { name: './build/test-min.css' }).run(b);
//            }
//        }).run(new Buildy());
    },
    
    run : function() {
        this._taskQueues.forEach(function(q) {
            q.run(this._buildy);
        }, this);
    }
};

exports.Builder = Builder;