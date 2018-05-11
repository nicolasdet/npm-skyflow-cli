'use strict';

const resolve = require('path').resolve;

const Directory = Skyflow.Directory,
    Output = Skyflow.Output;

class StyleModule {

    getDescription() {
        return 'This module installs the Skyflow style library.'
    }

    install(options) {

        let styleDir = resolve(process.cwd(), 'Style');

        if (!Directory.exists(styleDir)) {Directory.create(styleDir)}

        Directory.copy(resolve(__dirname, '..', '..', 'resources', 'style'), styleDir);

        Output.success('Success !', false);

    }

}

module.exports = new StyleModule();