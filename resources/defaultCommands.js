'use strict';

const resolve = require('path').resolve;

const DefaultCommand = require(resolve(__dirname, '..','src','Command', 'DefaultCommand'));

module.exports = {

    init: {
        description: "Generate skyflow configuration file",
        since: '1.0.0',
        callback: DefaultCommand.init
    },

    install: {
        description: "Install modules or plugins.",
        options: {
            '--list': 'List modules or plugins can be installed.',
        },
        since: '1.0.0',
        callback: DefaultCommand.install
    },

    shell: {
        description: "Enter in shell mode.",
        options: {
            '--list': 'List shell can be used.',
        },
        since: '1.0.0',
        callback: DefaultCommand.shell
    },

};