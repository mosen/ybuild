// YUI Component class test suite.
var path = require('path');
var should = require('should');

var Component = require(path.join(__dirname, '..', 'lib', 'component'));

describe('Default component', function() {

    var mod = Component(path.join(__dirname, 'fixtures', 'test_defaults', 'build.json'));

    describe('when retrieving filenames', function() {
        it('should produce the correct core js filename', function() {
            mod.filename().should.eql(path.join(__dirname, 'fixtures', 'build', 'component.js'));
        });

        it('should produce the correct minified js filename', function() {
            mod.filename('min').should.eql(path.join(__dirname, 'fixtures', 'build', 'component-min.js'));
        });

        it('should produce the correct debugger js filename', function() {
            mod.filename('debug').should.eql(path.join(__dirname, 'fixtures', 'build', 'component-debug.js'));
        });
    });

    describe('when retrieving skins', function() {
        it('should produce a single skin called "core"', function() {
            mod.skins().should.be.an.instanceOf(Array);
            mod.skins().should.have.lengthOf(1);
            mod.skins().should.include("core");
        });

    });

    describe('when retrieving skin filenames', function() {
        it('should produce the correct core skin source filename', function() {
            mod.skin('core').should.eql(path.join(mod.root_directory, 'assets', 'component-core.css'));
        });

        it('should produce the correct core skin build filename', function() {
            mod.skin('core', '../build').should.eql(path.resolve(path.join(mod.root_directory, '../build', 'assets', 'component-core.css')));
        });
    });

    describe('when retrieving assets directories', function() {
        it('should produce the correct source assets directory', function() {
            mod.assets().should.eql(path.join(mod.root_directory, 'assets'));
        });

        it('should produce the correct build assets directory', function() {
            mod.assets('../build').should.eql(path.resolve(path.join(mod.root_directory, '../build', 'assets')));
        });
    });

    describe('when retrieving the `requires` detail', function() {
        it('should be an array containing only `base`', function() {
            mod.details('requires').should.eql("'base'");
        });
    });

    describe('when determining if the component is skinnable', function() {
        it('should return boolean false for the default component', function() {
            mod.isSkinnable().should.be.false;
        });
    });

    describe('when retrieving the component name', function() {
        it('should equal the component name in the build file', function() {
            mod.name().should.eql('component');
        });
    });

    describe('when retrieving the component version', function() {
        it('should equal the component version in the build file', function() {
            mod.version().should.eql('@VERSION@');
        });
    });

});