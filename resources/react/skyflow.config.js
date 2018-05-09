'use strict';

const resolve = require('path').resolve;

let config = {

    commands: {
        'make:container': {
            description: "Create React Container",
            since: "1.0.0",
            callback: (options) => {
                let command = new (Skyflow.get('command.make'));
                command.makeContainer.apply(null, options)
            }
        },
        'make:component': {
            description: "Create React Component",
            since: "1.0.0",
            callback: (options) => {
                let command = new (Skyflow.get('command.make'));
                command.makeContainer.apply(null, [options, 'Component'])
            }
        },
        'make:style': {
            description: "Create new stylesheet",
            since: "1.0.0",
            callback: (options) => {
                let command = new (Skyflow.get('command.make'));
                command.makeStyle.apply(null, options)
            }
        }
    },

    container: {
        invokable: {
            // Use Skyflow.invoke() method to get values from this array
            // Stores only callable functions
        },
        service: {
            // Use Skyflow.get() method to get values from this array
            directory: {
                command: resolve(__dirname, 'Command'),
                container: resolve(__dirname, 'Container'),
                component: resolve(__dirname, 'Component'),
                style: resolve(__dirname, 'Style'),
            },
            command: {
                make: require('./Command/MakeCommand.js')
            }
        }
    },
    app: {
        style: {
            extension: 'scss'
        }
    }

};

module.exports = config;