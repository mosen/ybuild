Notes regarding the YUI Builder process
---------------------------------------

This is just for my benefit to work out how we can create a build process that mimics (closely enough) several of the
YUI Builder features.

Bootstrap
---------

- Set Y.version 3
- Set Yuivar = Y
- Set logger regex
- Read in default properties

Module
------

'''build'''
depends on: buildcore, -rollupjs, buildskins, buildlangs

'''buildskins'''
depends on: -buildskins, -rollupcss

'''buildlangs'''
depends on: -buildlangs, -rolluplangs

'''buildcore'''
depends on: builddebug, -createcore, -loggerregex
fixcrlf, eol=buildfiles.eol

'''-buildlangs'''
component.lang=comma separated bcp47 codes, trimmed

if component.langs.exist
- mkdir component/lang
- iterate component.lang, once with each i18n code, run addlang target
- run addlang for non-suffixed language file lang.js

'''addlang'''
if component.pres available
- mkdir lang/build
- run yrb2console, yrb2json (Note: none of the current modules use yrb)
- copy langtemplate.txt to the language fullname .js, overwriting
- template substitute variables:


Roll-up
-------

main target: build
depends on: -buildmodules, -registerall, -prependall, -appendall, -rollupjs, -rolluplangs
then: fixcrlf eol=buildfiles.eol

'''-buildmodules'''
check property "rollup"
fail if rollup.sub (too many nested rollups)

if no "rollup" property:
subant with target component.rollup.target
set these for subant:
                    <property name="rollup" value="true" />
                    <property name="rollup.builddir" value="${component.builddir}" />
                    <property name="rollup.component" value="${component}" />
                    <property name="rollup.component.basefilename" value="${component.basefilename}" />

'''-registerall'''
call target addrollup
module="${component.module}" file="${component.builddir}/${component.basefilename}-debug.js" details="${component.details.hash}"
and same for non-debug version.

if builddir/lang/ exists, addlangrollup

'''-prependall'''
if component.prependfiles, -prepend, -prependdebug targets

'''-rollupjs'''
if rollup=true
- concatenate component-raw file into rollup-raw file.
- concatenate component-debug file into rollup-debug file.

'''-rolluplangs'''
if rolluplangs=true
- iterate through component.rollup.lang (each i18n code)
- concatenate *_lang.js from component build dir, to rollupname_lang.js
- concatenate lang/component.js (no specific lang code) to rollup/lang/rollup.js