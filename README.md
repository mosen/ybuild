Summary
=======

yuibuild is a community contributed build system for creating YUI3.x components.

It builds javascript and css components to fit the YUI3 Loader,
which is part of the YUI Framework (http://yuilibrary.com/).

*Documentation under heavy construction*

Usage
=====

`yuibuild gallery-module-name` to build a gallery module *OR*
`yuibuild *` to build all modules in the current directory.

See `yuibuild -h` for detailed command line options.

Setup
=====

In order to build your component for yui3, your files should be organised as following:

Directory structure
-------------------

The directory structure is the same as YUI Builder (https://github.com/yui/builder) with the exception of the
build.xml and build.properties files. yuibuild uses a *build.json* file instead.

```
/moduleroot
    /src
        /yui-module-name
            build.json
            /js
                module.js
            /assets
                yui-module-name-core.css
                /skins
                    /sam
                        yui-module-name-skin.css
    /build
```

Assets can be omitted if your component won't be skinnable.

build.json format
-----------------

The build.json file format describes a YUI3.x component in JSON format. It replaces the
build.xml and build.properties files used with YUI Builder.

_Example_

Almost all of the build.json parts are optional, but you should
only remove the "skip" and "tools" properties if you don't need them.

```javascript

{
    "name"    : "yui-module-name",
    "type"    : "js",
    "version" : "1.0.0",
    "skip"    : {
        "clean"    : false,
        "register" : false,
        "lint"     : false,
        "logger"   : false
    },
    "sourceDir"   : "js",
    "sourceFiles" : [
        "module.js"
    ],
    "buildDir"  : "../../build/yui-module-name",
    "assetsDir" : "assets",
    "tools"     : {
        "jslint"  : {
            "jslint option" : null
        },
        "csslint" : {
            "csslint option" : null
        }
    },
    "details" : {
        "use"        : null,
        "supersedes" : null,
        "requires"   : ["base"],
        "optional"   : null,
        "after"      : null,
        "after_map"  : {},
        "skinnable"  : true
    }
}

```

build.json properties reference
-------------------------------

* `name`

Name of the YUI module. Will be used in YUI().add() so this is what
the loader will refer to.

Note that this is the same name you will use inside a YUI().use('modulename'... statement also.


* `type`

One of "js" or "css". The type of component we are building.


* `version`

Normally filled with the string "@VERSION@", might be used in building yui itself? *Needs clarification*


* `skip`

A list of tasks to skip in the build process.


* `sourceDir`

Relative directory to the source files.


* `sourceFiles`

Array of filenames to include when building the module.


* `buildDir`

Directory where the built files will reside (relative to the module directory).


* `assetsDir`

Relative directory to the module assets.


* `tools`

Hash containing options passed to specific tasks.
Eg. lint options, minify options.

* `details`

Details which the loader will use to determine the loading order and requirements.
