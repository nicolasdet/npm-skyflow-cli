'use strict';

const resolve = require('path').resolve,
    Output = Skyflow.Output,
    Input = Skyflow.Input,
    Helper = Skyflow.Helper,
    Shell = Skyflow.Shell,
    Style = Skyflow.Style,
    Command = require(resolve(__dirname, '..', 'Command', 'DockerCommand')),
    shellText = Style.setColor('gray').addStyle('bold').apply('docker@shell');

function runShell() {

    Input.input(
        {
            message: shellText,
            prefix: ''
        }, answer => {

            // Todo : Check if docker is running

            const response = answer.response.trim();

            if(response === 'exit' || response === ''){
                process.exit(0);
            }

            let options = response.split(' ');

            if(Helper.isFunction(Command[options[0]])){
                let cmd = options.shift();
                Command[cmd].apply(null, [options]);
            }else {

                let m = options[0].match(/^([a-z]+):([a-z]+)/i);

                if(m){
                    let cmd = 'run' + Helper.upperFirst(m[2]);
                    if(Helper.isFunction(Command[cmd])){
                        options.shift();
                        Command[cmd].apply(null, [m[1], options]);
                    }

                }else {
                    Shell.run('docker-compose', options);
                    if(Shell.hasError()){
                        Output.error("'"+options.shift()+"' command not found.", false)
                    }else {
                        Output.writeln(Shell.getResult());
                    }
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