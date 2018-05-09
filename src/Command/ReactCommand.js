'use strict';

const resolve = require('path').resolve;

const File = Skyflow.File,
    Directory = Skyflow.Directory,
    Output = Skyflow.Output;

class ReactCommand {

    install(options) {

        Directory.copy(resolve(__dirname, '..', '..', 'resources', 'react'), process.cwd());
        File.remove(resolve(process.cwd(), 'sample'));

        const {execSync} = require('child_process');
        Output.newLine();
        execSync('skyflow install webpack', {stdio: [0, 1, 2]});

    }

}

module.exports = new ReactCommand();