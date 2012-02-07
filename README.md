Summary
=======

ybuild is a community contributed build system for creating YUI3.x components.

It builds javascript and css components to fit the YUI3 Loader,
which is part of the YUI Framework (http://yuilibrary.com/).

It depends on mosen/buildy to execute all of the build tasks.

*Documentation under heavy construction*

Usage
=====

`ybuild gallery-module-name` to build a gallery module *OR*
`ybuild *` to build all modules in the current directory.

See `ybuild -h` for detailed command line options.

Setup
=====

In order to build your component for yui3, your files should be organised as following:

Directory structure
-------------------

The directory structure is the same as YUI Builder (https://github.com/yui/builder) with the exception of the
build.xml and build.properties files. ybuild uses a *build.json* file instead to describe all the same parameters.

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

Assets can be omitted if your component won't be skinnable. (i.e there's no stylesheets OR images).

build.json format
-----------------

The build.json file format describes a YUI3.x component in JSON format. It replaces the
build.xml and build.properties files used with YUI Builder.

_Example_

All parts of the json spec are optional except where noted as required.
The following is an example where most of the possible options are set...

```javascript

{
    "name"    : "yui-module-name",
    "description" : "An example module",
    "type"    : "js",
    "version" : "1.0.0",
    "skip"    : ["template", "jslint"],
    "sourceDir"   : "js",
    "sourceFiles" : [
        "module.js"
    ],
    "buildDir"  : "../../build/yui-module-name",
    "assetsDir" : "assets",
    "tasks" : {
        "jslint" : {
            "jslint_option" : "jslint_value"
        },
        "template" : {
            "template_option" : "template_value"
        }
    },
    "details" : { // Loader.addModule()
        "requires"   : ["base"],
        "optional"   : [],
        "supersedes" : [],
        "after"      : [],
        "after_map"  : {},
        "rollup"     : undefined,
        "skinnable"  : true,
        "submodules" : {},
        "group"      : "",
        "lang"       : ["en-US"],
        "condition"  : {
            "trigger" : "testmodule",
            "test" : function(),
            "when" : "before|after|instead"
        },
        "use"        : null // Not documented, gets munged into supersedes anyway.
    }
}

```

build.json properties reference
-------------------------------

*   __name__ *required*
    Name of the YUI module. Will be used in YUI().add() so this is what
    the loader will refer to when you include the name in YUI().use('name').

*   __type__ *required*
    One of "js" or "css". The type of component we are building.
    "css" implies that "sourceFiles" will only contain stylesheets.
    You should also set "sourceDir" to "css".

*   __version__
    Normally filled with the string "@VERSION@", might be used in building yui itself? *Needs clarification*

*   __skip__
    Array of tasks to skip, identified by their name in buildy.

*   __sourceDir__
    Relative directory to the source files. If omitted, defaults to a subdirectory
    named after the "type" option.

*   __sourceFiles__
    Array of filenames to include when building the module (with extensions).

*   __buildDir__
    Directory where the built files will reside (relative to the module directory).
    In a YUI build tree structure this will be "../../build/yui-module-name"

*   __assetsDir__
    Relative directory to the module assets.

*   __tasks__
    Hash containing options passed to specific tasks.
    Eg. lint options, minify options.

*   __details__
    Details which the loader will use to determine the loading order and requirements.

ybuild vs. yui builder tool
=============================

Why switch build tools?

* No java dependencies, no ant, no jars.
* All node.js! several other yui tools already run on node.
* Just plain faster. Eg:

Building one of my own modules - gallery-datatable-ml

+ ant: *3.258s*
+ ybuild: *0.200s*

TODO
====

* Separate logging from every object.
* Language pack support.
* YUI Builder Tests target.
* Handle error where one part of the skin exists, and the other doesn't (core without skin etc).

Options not yet handled by ybuild
-----------------------------------

in yui3
-------

+ srcdir
different than implied source directory

+ component.prependfiles / component.appendfiles
mostly for license additions?

+ component.logger.regex
set log removal regex per example

+ tests.requires / tests.* in async-queue
tests target in general, builds a test module

+ global.build.component or global.* in widget-modality
top level directories for build/assets

+ component.rollup and rollup related functionality.
check loader still uses rollups?

+ yui.core / yui.rls / loader.tnt / loader.yui2
custom build tasks inside yui seed.

+ component._lang in datatype
used to populate each datatype module with a list of languages.

in yui-gallery
--------------

+ yui.variable
A in AlloyUI stuff

+ component.assets.flatten
take nested assets and flatten into one target directory

+ component.details.auipath and auitype in AlloyUI
looks like the details are simply amended to YUI().add details line.

+ component.assets.base in aui-skin-classic
alter the base assets directory, normally ./assets

+ component.assets.files = images/**/*,css/**/* at aui-skin-classic
files to match in assets, normally **/*

+ component.optionals in gallery-slider-window (optional?)
can't find documentation with this property.