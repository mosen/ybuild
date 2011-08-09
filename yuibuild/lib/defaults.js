/**
 * Options which are global to the build system
 */
exports.config = {
    component : {
        "name" : "component",
        "type" : "js",
        "version" : "1.0.0",
        "skip" : {
            "clean" : false,
            "register" : false,
            "lint" : false,
            "logger" : false
        },
        "sourceDir" : "js",
        "assetsDir" : "assets",
        "details" : {
            "use" : null,      
            "supersedes" : null,
            "requires" : null,
            "optional" : null,
            "after" : null,
            "after_map" : {},
            "lang" : ["en-US"],
            "skinnable" : false
        }
    },
    global : {
        sourceBaseDir : '/src', 
        buildBaseDir : '/build',
        eol : '\n',
        encoding : 'utf8',
        logger : {
            regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
            replace : '',
            flags : 'mg'
        }        
    }
};