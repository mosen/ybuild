var child_process = require('child_process'),
    path = require('path'),
    fs = require('fs'),
    cli_path = path.resolve(path.join(__dirname, '../bin/cli.js'));

function attachConsole(child) {
    child.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
    });

    child.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
    });
}


module.exports = {
    'test write task is skipped by skip feature' : function(beforeExit, assert) {
        var test_dir = path.resolve(path.join(__dirname, './fixtures/test_skip')),
            build_dir = path.resolve(path.join(__dirname, './fixtures/build'));

        console.log("Spawning ybuild as a child process");
        console.log("node " + cli_path);
        console.log("CWD: " + test_dir);
        var ybuild = child_process.spawn('node', [cli_path, '.'], { cwd: test_dir, env: process.env });
        attachConsole(ybuild);

        ybuild.on('exit', function (code) {
            beforeExit(function() {
                assert.equal(0, code, 'exit status was ok (' + code + ')');
                assert.ok(!path.existsSync(path.join(build_dir, '/component.js')), build_dir + '/component.js should not exist');
                assert.ok(!path.existsSync(path.join(build_dir, '/component-min.js')), build_dir + '/component-min.js should not exist');
                assert.ok(!path.existsSync(path.join(build_dir, '/component-debug.js')), build_dir + '/component-debug.js should not exist');
            });
        });
    },

    'test defaults are supplied to jslint task (using bitwise as example)' : function(beforeExit, assert) {
        var test_dir = path.resolve(path.join(__dirname, './fixtures/test_defaults')),
            build_dir = path.resolve(path.join(__dirname, './fixtures/build'));

        console.log("Spawning ybuild as a child process");
        console.log("node " + cli_path);
        console.log("CWD: " + test_dir);
        var ybuild = child_process.spawn('node', [cli_path, '.'], { cwd: test_dir, env: process.env });
        attachConsole(ybuild);

        ybuild.on('exit', function (code) {
            // TODO: test for output related to "Unexpected '&'"
        });
    }
}