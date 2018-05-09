'use strict';

const resolve = require('path').resolve;

module.exports = {

    init: {
        description: "Generate skyflow configuration file",
        options: {
            '-y': 'Generate without interactive',
        },
        since: '1.0.0',
        callback: require(resolve(__dirname, '..','src','Command', 'DefaultCommand')).init
    },

    install: {
        description: "Install modules or plugins.",
        options: {
            '--list': 'List modules or plugins can be installed.',
        },
        since: '1.0.0',
        callback: require(resolve(__dirname, '..','src','Command', 'DefaultCommand')).install
    },

};