Summary
-------

yuibuild is a community contributed build system for creating YUI3.x components.
It relies on https://github.com/mosen/buildy to do the heavy lifting, but defines
its own file format for specifying how a component should be built.

*Documentation under construction*

Directory structure
-------------------

The directory structure is the same as YUI Builder with the exception of the
build.xml and build.properties files. yuibuild has been written with backwards
compatibility for these files, but also establishes a new file *build.json*

Build.json format
-----------------

The build.json file format describes a YUI3.x component in JSON format.

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