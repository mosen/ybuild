/**
 * The purpose of this class is to validate the command line parameters passed
 * to the yuibuild command line utility.
 */
var fs = require('fs'),
    util = require('util'),
    events = require('events');

var Validator = function() {
    
};

util.inherits(Validator, events.EventEmitter);

Validator.prototype = {
    
    validDirectories : [],
    
    /**
     * Validate an array of directories to make sure that they are valid
     * build directory structures with build files present. (Do not actually
     * validate the build files themselves).
     * 
     * @param dirs {Array} Build directories
     * @return Array of valid entries
     */
    validate : function(dirs) {
        var dirsToProcess = dirs.length,
            dirsProcessed = 0,
            validDirectories = this.validDirectories;
        
        dirs.forEach(function(d) {
            fs.stat(d, function(err, stats) {
                if (!err && stats.isDirectory()) {
                   validDirectories.push(d);
                }
                
                dirsProcessed++;
                
                if (dirsProcessed >= dirsToProcess) {
                    this.emit('validated', validDirectories);
                }
            });
        });
    }
};

exports.Validator = Validator;