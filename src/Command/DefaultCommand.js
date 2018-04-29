'use strict';

const fs = require('fs'), resolve = require('path').resolve;

class DefaultCommand {

    version() {

        // Name
        Skyflow.Output.write(Skyflow.Package.name, 'green')
        // Version
            .write(' v' + Skyflow.Package.version, 'green')
            // License
            .writeln(' (' + Skyflow.Package.license + ')', 'green')
            // Author
            .write('Franck DIOMANDE <fkdiomande@gmail.com>', 'gray');

        return Skyflow
    }

    help(command) {

        let commands = [
            Skyflow.getConfig('commands') || {},
            require(resolve(__dirname, '..', '..', 'resources', 'defaultCommands'))
        ];

        if(command){
            if(commands[0].hasOwnProperty(command)){
                let c = [{}, {}];
                c[0][command] = commands[0][command];
                commands = c;
            }
            if(commands[1].hasOwnProperty(command)){
                let c = [{}, {}];
                c[0][command] = commands[1][command];
                commands = c;
            }
        }

        Skyflow.Output.newLine()

        // Display Title
            .writeln(
                Skyflow.Package.name.toUpperCase() +
                ' v' + Skyflow.Package.version +
                ' - ' + Skyflow.Package.author,
                'magenta'
            )
            .writeln('-'.repeat(100), 'magenta', null, 'bold')
            .newLine();

        if(!command){
            // Help
            Skyflow.Output.writeln('-h | --help', 'green', null, 'bold')
                .writeln('Display help for skyflow CLI')
                // Version
                .writeln('-v | --version', 'green', null, 'bold')
                .writeln('Display version of current skyflow CLI')
                .newLine();
        }

        commands.forEach((command) => {

            for (let c in command) {

                Skyflow.Output.write(c, 'green', null, 'bold');

                // Since
                if (command[c]['since']) {
                    Skyflow.Output.writeln(' - since ' + command[c]['since'], 'gray')
                }

                // Description
                if (command[c]['description']) {
                    Skyflow.Output.writeln(command[c]['description'])
                }

                // Options
                const options = command[c]['options'];
                if (Skyflow.Helper.isObject(options) && !Skyflow.Helper.isEmpty(options)) {
                    Skyflow.Output.writeln('Options:', 'cyan', null, 'underline');
                    for (let o in options) {
                        Skyflow.Output.write(o, 'magenta').space(2).writeln(options[o]);
                    }
                }

                Skyflow.Output.newLine()

            }

        });

        return Skyflow
    }

    init(options) {

        if(Skyflow.File.exists(Skyflow.CONFIG_FILE_NAME)){
            Skyflow.Output.info(Skyflow.CONFIG_FILE_NAME + ' file already exists.');
            return Skyflow
        }

        let s = resolve(__dirname, '..', '..', 'resources', Skyflow.CONFIG_FILE_NAME);
        fs.createReadStream(s).pipe(fs.createWriteStream(resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME)));
        Skyflow.Output.success(Skyflow.CONFIG_FILE_NAME + ' was successfully created.');
        return Skyflow
    }

}

module.exports = new DefaultCommand();