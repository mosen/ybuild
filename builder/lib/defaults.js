/**
 * Options which are global to the build system
 */
exports.config = {
    // Globals
    srcDir : '/src', 
    buildDir : '/build',
    eol : '\n',
    charset : 'utf8',
    csslint : {},
    jslint : {},
    logger : {
        regex : '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
        replace : '',
        flags : 'mg'
    }
};