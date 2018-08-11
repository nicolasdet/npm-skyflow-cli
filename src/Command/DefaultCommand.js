'use strict';

const resolve = require('path').resolve,
    _ = require('lodash'),
    Helper = Skyflow.Helper,
    Output = Skyflow.Output;

class DefaultCommand {

    version() {

        Output.write(_.upperFirst(Skyflow.Package.name), 'green')
            .write(' v' + Skyflow.Package.version, 'green')
            .writeln(' (' + Skyflow.Package.license + ')', 'green');

        return 0
    }

    help(module = null) {

        let file = "default";

        if (module) {file = _.lowerFirst(module)}

        let commands = [
            require(resolve(__dirname, '..', '..', 'help', file + 'Help'))
        ];

        let title = _.upperFirst(Skyflow.Package.name) + ' v' + Skyflow.Package.version;

        if(module){title = "Help for " + _.upperFirst(module) + " module"}

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

}

module.exports = new DefaultCommand();