var child_process = require('child_process'),
    path = require('path'),
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
    'test skip' : function(beforeExit, assert) {
        var test_dir = path.resolve(path.join(__dirname, './fixtures/skip'));

        var ybuild = child_process.spawn('node', [cli_path, '.'], { cwd: test_dir, env: process.env });
        attachConsole(ybuild);

        ybuild.on('exit', function (code) {
            beforeExit(function() {
                assert.equal(1, code, 'exit status was ok (' + code + ')');
            })
        });
    }
}