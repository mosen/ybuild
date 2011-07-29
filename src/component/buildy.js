/**
 * Idea: this is how i would like the build file to look.
 */

var Buildy = require('buildy').Buildy,
    buildy = new Buildy(),
    jsDir = './js',
    buildDir = './build_tmp',
    name = 'component',
    ext = '.js',
    debugName = name + '-debug' + ext,
    minName = name + '-min' + ext,
    rawName = name + ext,
    component = {
        component : 'component',
        yuivar : 'Y',
        version : '1.0.0',
        details : ''
    };

buildy.files([ jsDir + '/component.js']).concat().template('../../builder/files/moduletemplate.mustache', component).fork([
   function(buildy, cb) {
       buildy.jslint();
       buildy.write('component.js')
       cb();
   },
   function(buildy, cb) {
       console.log('Replacing logger statements, writing -debug');
       buildy.replace().fork([
          function(b, c) {
              //console.log(b);
              b.write('component-debug.js');
              c();
          },
          function(b, c) {
              console.log('minify, write min');
              b.minify().write('component-min.js');
              c();
          }
       ]);
       cb();
   }
]);

buildy.files([ './assets/component-core.css', './assets/skins/sam/component-skin.css' ]).concat().fork([
    function(b,c) {
        b.csslint();
        c();
    },
    function(b,c) {
//        b.cssminify().write('component-min.css');
        c();
    }
]);