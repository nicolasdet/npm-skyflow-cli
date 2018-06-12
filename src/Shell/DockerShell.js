'use strict';

const resolve = require('path').resolve,
    Output = Skyflow.Output,
    Input = Skyflow.Input,
    Helper = Skyflow.Helper,
    Shell = Skyflow.Shell,
    Style = Skyflow.Style,
    Command = require(resolve(__dirname, '..', 'Command', 'DockerCommand')),
    shellText = Style
    // .setColor('gray')
        .addStyle('bold')
        .apply('docker@shell');

class DockerShell {

    getDescription() {
        return 'Enter into docker shell.'
    }

    run(commands, options) {

        Skyflow.currentConfMiddleware();

        commands = Object.keys(commands);

        if(commands.length === 0){
            commands = ['help']
        }

        if (Helper.isFunction(Command[commands[0]])) {
            let cmd = commands.shift();
            return Command[cmd].apply(null, [commands, options]);
        } else {

            let m = commands[0].match(/^([a-z]+):([a-z]+)/i);

            if (m) {

                // Run compose
                let cmd = '__' + m[1] + '__' + m[2];
                if (Helper.isFunction(Command[cmd])) {
                    commands.shift();
                    return Command[cmd].apply(Command, [commands, options]);
                }

                // Run container
                cmd = '__' + m[2];
                if (Helper.isFunction(Command[cmd])) {
                    commands.shift();
                    return Command[cmd].apply(null, [m[1], commands]);
                }

            } else {
                Shell.run('docker', commands);
                if (Shell.hasError()) {
                    Output.error(commands.shift() + " command not found.", false)
                } else {
                    Output.writeln(Shell.getResult());
                }
            }

        }

    }

}

module.exports = new DockerShell();