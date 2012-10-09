var Component = require('component').Component,
    assert    = require('assert'),
    path      = require('path');

module.exports = {
    'create component from build file does not throw error' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json');
    },

    'create component with no arguments does not throw error' : function(beforeExit, assert) {
        assert.throws(function() {
            var c = Component();
        }, Error);
    },

    'test sourcefiles returns full paths to source files specified in test build' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            files = c.sourcefiles;

        assert.equal(files[0], 'test/fixtures/js/component.js', 'test sourcefiles returns relative path to source files');
    },

    'test version matches build file version' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            version = c.version;

        assert.equal(version, '@VERSION@', 'test version matches build file version');
    },

    'test details string matches build file details' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            details = c.details,
            expected = ", { requires: ['base'], lang: ['en-US'], skinnable: true }";

        assert.equal(details, expected, 'test details string matches build details');
    },

    'test sourcedir matches expected sourcedir' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            sourcedir = c.sourcedir,
            expected = "./test/fixtures";

        assert.equal(sourcedir, expected, 'test sourcedir matches expected sourcedir');
    },

    'test skin name is included in path to skins directory' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            skins = c.skins;

        assert.equal(skins.core.source, 'test/fixtures/assets/component-core.css', 'test core source css is correct');
        assert.equal(skins.sam.source, 'test/fixtures/assets/skins/sam/component-skin.css', 'test sam skin css is correct');
    },

    'test assets build directory matches expected build directory' : function(beforeExit, assert) {
        var c = Component('./test/fixtures/build.json'),
            assets = c.assets;

        assert.equal(assets.source, 'test/fixtures/assets');
        assert.equal(assets.build, 'test/build/assets');
    }

    //'test absence of one skin file does not abort skins queue'
};