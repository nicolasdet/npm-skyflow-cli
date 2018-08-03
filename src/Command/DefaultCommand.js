'use strict';

const fs = require('fs'), resolve = require('path').resolve;

const File = Skyflow.File,
    Directory = Skyflow.Directory,
    Package = Skyflow.Package,
    Helper = Skyflow.Helper,
    Output = Skyflow.Output;

class DefaultCommand {

    version() {

        Output.write(Package.name, 'green')
            .write(' v' + Package.version, 'green')
            .writeln(' (' + Package.license + ')', 'green');

        return 0
    }

    help(module = null) {

        let file = "default";

        if (module) {file = Skyflow.Helper.lowerFirst(module)}

        let commands = [
            require(resolve(__dirname, '..', '..', 'help', file + 'Help'))
        ];

        let title = Package.name.toUpperCase() + ' v' + Package.version;

        if(module){title = "Help for " + Skyflow.Helper.upperFirst(module) + " module"}

        Output.newLine()

        // Display Title
            .writeln(title, 'magenta')
            .writeln('-'.repeat(100), 'magenta', null, 'bold')
            .newLine();

        commands.forEach((command) => {

            for (let c in command) {

                Output.write(c, 'green', null, 'bold').space(2);

                // Since
                if (command[c]['since']) {
                    Output.writeln(' - since ' + command[c]['since'], 'gray')
                }

                // Description
                if (command[c]['description']) {
                    Output.writeln(command[c]['description'])
                }

                // Options
                const options = command[c]['options'];
                if (Helper.isObject(options) && !Helper.isEmpty(options)) {
                    Output.writeln('Options:', 'cyan', null, 'underline');
                    for (let o in options) {
                        Output.write(o, 'magenta').space(2).writeln(options[o]);
                    }
                }

                Output.newLine()
            }

        });

        return 0
    }

    init(options) {

        if (File.exists(Skyflow.CONFIG_FILE_NAME)) {
            Output.info(Skyflow.CONFIG_FILE_NAME + ' file already exists.', false);
            return 0
        }

        let s = resolve(__dirname, '..', '..', 'resources', Skyflow.CONFIG_FILE_NAME);
        let dest = resolve(process.cwd(), Skyflow.CONFIG_FILE_NAME);
        File.copy(s, dest);
        if (Skyflow.isInux()) {
            fs.chmodSync(dest, '777');
        }
        Output.success(Skyflow.CONFIG_FILE_NAME + ' was successfully created.');
        return 0
    }

    install(options) {

        if (options['list']) {

            Output.newLine();
            Output.writeln('Available modules:', 'blue', null, 'bold');
            Output.writeln('-'.repeat(50), 'blue', null, 'bold');
            // Output.newLine();

            let modulesPath = resolve(__dirname, '..', 'Module');
            let modules = Directory.read(modulesPath);
            modules.map((module) => {

                let name = module.replace(/Module\.js$/, '');
                Output.write(name, null, null, 'bold');
                Output.writeln(' -> skyflow install ' + name.toLowerCase());
                module = require(resolve(modulesPath, module));
                if (Helper.isFunction(module['getDescription'])) {
                    Output.writeln(module.getDescription(), 'gray')
                }
            });

            return 0
        }

        let moduleName = Object.keys(Skyflow.Request.getCommands())[1];

        if (!moduleName) {
            Output.error('Can not install empty module.', false);
            return 1
        }

        moduleName = Helper.upperFirst(moduleName);
        let modulePath = resolve(__dirname, '..', 'Module', moduleName + 'Module.js');

        if (!File.exists(modulePath)) {
            Output.error('Module ' + moduleName + ' not found.', false);
            return 1
        }

        let module = require(modulePath);

        if (!Helper.isFunction(module['install'])) {
            Output.error('Install method not found in ' + moduleName + ' module.', false);
            return 1
        }

        module['install'].apply(null, [options]);

    }

}

module.exports = new DefaultCommand();