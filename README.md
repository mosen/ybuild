Summary
-------

yuibuild is a community contributed build system for creating YUI3.x components.

It relies on buildy (http://github.com/mosen/buildy) to do all the work, but builds
modules specifically to fit the YUI3 Loader.

*Documentation under construction*

directory structure
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

* The sam skin is the only valid skin at the moment.
* You may choose to omit the skin.css file.

build.json format
-----------------

The build.json file format describes a YUI3.x component in JSON format.

_Example_

The following is an example from a gallery module i wrote.
Note that not all properties are required, notably you can omit skip, tools and details.
(Though you will probably want to keep the requires and skinnable properties around)

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

build.json reference
--------------------

`name`

Name of the YUI module. Will be used in YUI().add() so this is what
the loader will refer to.

`type`

One of "js" or "css". The type of component we are building.

`version`

Normally filled with the string "@VERSION@", might be used in building yui itself? *Needs clarification*

`skip`

A list of tasks to skip in the build process.

`sourceDir`

Relative directory to the source files.

`sourceFiles`

Array of filenames to include when building the module.

`buildDir`

Directory where the built files will reside (relative to the module directory).

`assetsDir`

Relative directory to the module assets.

`tools`

Hash containing options passed to specific tasks.
Eg. lint options, minify options.

`details`

Details which the loader will use to determine the loading order and requirements.

Use
---

yuibuild can be used in one of two ways, to build a single module, to a local
directory, or to build a group of modules.

The two use cases will be:

*cwd = module-name*

> yuibuild
Builds the current module into ./build

OR

*cwd = parent directory*

> yuibuild *

OR

> yuibuild gallery-*

Or some glob, to get matching directories containing build files.