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

    run() {

        let commands = process.argv.slice(2);

        if(commands.length === 0){
            commands = ['help']
        }

        let first = commands[0];

        commands = commands.slice(1);

        if (Helper.isFunction(Command[first])) {
            return Command[first].apply(Command, [commands]);
        } else {

            let m = first.match(/^([a-z]+):([a-z]+)/i);

            if (m) {

                // Run compose
                let cmd = '__' + m[1] + '__' + m[2];
                if (Helper.isFunction(Command[cmd])) {
                    // commands.shift();
                    return Command[cmd].apply(Command, [commands]);
                }

                // Run container
                cmd = '__' + m[2];
                if (Helper.isFunction(Command[cmd])) {
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