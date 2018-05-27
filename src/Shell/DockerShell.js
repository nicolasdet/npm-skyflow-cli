'use strict';

const resolve = require('path').resolve,
    Output = Skyflow.Output,
    Input = Skyflow.Input,
    Helper = Skyflow.Helper,
    Shell = Skyflow.Shell,
    Style = Skyflow.Style,
    Command = require(resolve(__dirname, '..', 'Command', 'DockerCommand')),
    shellText = Style.setColor('gray').addStyle('bold').apply('[docker shell]');

function runShell() {

    Input.input(
        {
            message: shellText,
            prefix: ''
        }, answer => {

            const response = answer.response.trim();

            if(response === 'exit'){
                process.exit(0);
            }

            let options = response.split(' ');

            if(Helper.isFunction(Command[options[0]])){
                Command[options.shift()].apply(null, [options]);
            }else {
                Shell.run('docker-compose', options);
                if(Shell.hasError()){
                    Output.error("'"+options.shift()+"' command not found.", false)
                }else {
                    Output.writeln(Shell.getResult());
                }
            }

            runShell();
        }
    );

}

class DockerShell {

    getDescription() {
        return 'Enter into docker shell.'
    }

    run(options) {

        runShell();

    }

}

module.exports = new DockerShell();