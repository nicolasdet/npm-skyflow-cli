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
            .writeln('Franck DIOMANDE <fkdiomande@gmail.com>', 'gray');

        return Skyflow
    }

    help(command) {

        let commands = [
            Skyflow.getConfig('commands') || {},
            require(resolve(__dirname, '..', '..', 'resources', 'defaultCommands'))
        ];

        if (command) {
            if (commands[0].hasOwnProperty(command)) {
                let c = [{}, {}];
                c[0][command] = commands[0][command];
                commands = c;
            }
            if (commands[1].hasOwnProperty(command)) {
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
                ' - Franck DIOMANDE <fkdiomande@gmail.com>',
                'magenta'
            )
            .writeln('-'.repeat(100), 'magenta', null, 'bold')
            .newLine();

        if (!command) {
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

        if (Skyflow.File.exists(Skyflow.CONFIG_FILE_NAME)) {
            Skyflow.Output.info(Skyflow.CONFIG_FILE_NAME + ' file already exists.');
            process.exit(1);
        }

        let s = resolve(__dirname, '..', '..', 'resources', Skyflow.CONFIG_FILE_NAME);
        let dest = resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME);
        fs.createReadStream(s).pipe(fs.createWriteStream(dest));
        if(Skyflow.isLinux()){
            fs.chmodSync(dest, '777');
        }
        Skyflow.Output.success(Skyflow.CONFIG_FILE_NAME + ' was successfully created.');
        process.exit(0);
    }

    install(options) {

        let moduleName = Object.keys(Skyflow.Request.getCommands())[1];

        if (!moduleName) {
            Skyflow.Output.error('Can not install empty module.');
            process.exit(1);
        }

        moduleName = Skyflow.Helper.upperFirst(moduleName);
        let modulePath = resolve(__dirname, moduleName + 'Command.js');

        if (!Skyflow.File.exists(modulePath)) {
            Skyflow.Output.error('Module \'' + moduleName + '\' not found.');
            process.exit(1);
        }

        let module = require(modulePath);

        if(!Skyflow.Helper.isFunction(module['install'])){
            Skyflow.Output.error('Install method not found in \'' + moduleName + '\' module.');
            process.exit(1);
        }

        module['install'].apply(null, [options]);

    }

}

module.exports = new DefaultCommand();