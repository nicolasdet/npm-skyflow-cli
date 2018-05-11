const path = require('path'), resolve = path.resolve, fs = require('fs');

const File = Skyflow.File, Helper = Skyflow.Helper,
    Validator = Skyflow.Validator, Directory = Skyflow.Directory,
    Input = Skyflow.Input, Output = Skyflow.Output;


class MakeCommand {

    makeContainer(options, type = 'Container') {

        let lType = type.toLowerCase();

        Input.input(
            {
                message: 'Enter React ' + lType + ' name:',
                validator: new Validator(/^[\w]+[\w\d]*$/i, type + ' name is not valid.')
            }, answer => {

                let containerDir = Skyflow.get('directory.' + lType);

                let name = Helper.upperFirst(answer.response);

                let dirname = resolve(containerDir, name);

                if (Directory.exists(dirname)) {
                    Output.error("'" + name + "' " + type + " already exists.");
                    process.exit(1);
                }

                let styleExtension = '.' + Skyflow.getConfig("app.style.extension");

                let sample = Skyflow.React.sample();
                sample = sample.replace(/{{importStyle}}/g, name + type + styleExtension);
                sample = sample.replace(/{{name}}/g, name + type);
                sample = sample.replace('{{id}}', name.toLowerCase() + '-' + lType);

                Directory.create(dirname);

                // Create container or component class
                let filename = resolve(dirname, name + type + '.js');
                File.create(filename);
                if (Skyflow.isInux()) {
                    fs.chmodSync(filename, '777');
                }
                File.write(filename, sample);
                Output.write(name + path.sep + name + type + '.js');
                Output.success(' created', false);

                // Create event class
                filename = resolve(dirname, name + type + 'Event.js');
                File.create(filename);
                if (Skyflow.isInux()) {
                    fs.chmodSync(filename, '777');
                }
                let eventContent = 'class ' + name + type + "Event {\n\n}\n\n" +
                    "export default (new " + name + type + "Event());";
                File.write(filename, eventContent);
                Output.write(name + path.sep + name + type + 'Event.js');
                Output.success(' created', false);

                let styleContent = '#' + (name.toLowerCase()) + '-' + lType + " {\n\n}";
                filename = resolve(dirname, name + type + styleExtension);
                File.create(filename);
                if (Skyflow.isInux()) {
                    fs.chmodSync(filename, '777');
                }
                File.write(filename, styleContent);
                Output.write(name + path.sep + name + type + styleExtension);
                Output.success(" created", false);

                Output.write(name + type + styleExtension);
                Output.success(" imported", false);

            }
        );
    }

    makeStyle(options) {

        Input.input(
            {
                message: 'Enter style name:',
                validator: new Validator(/^[\w]+[\d]*(\/[\w]+[\d]*)?\.[\w\d]+$/i, 'Style name is not valid (e.g.:' +
                    ' index.scss, page/show.less)')
            }, answer => {

                let styleDir = Skyflow.get('directory.style'),
                    dirname = path.dirname(answer.response),
                    basename = Helper.upperFirst(path.basename(answer.response)),
                    response = (dirname === '.') ? basename : (dirname + path.sep + basename),
                    filename = resolve(styleDir, dirname, basename);

                if (File.exists(filename)) {
                    Output.error("'" + response + "' already exists.");
                    process.exit(1);
                }

                Directory.create(resolve(styleDir, dirname));

                File.create(filename, '');
                if (Skyflow.isInux()) {
                    fs.chmodSync(filename, '777');
                }
                Output.write(response);
                Output.success(" created", false);

                let importFile = resolve(styleDir, 'ImportStyle.js');
                File.newLine(importFile);
                File.write(importFile, "import './" + response + "';");
                Output.write(response);
                Output.success(" imported", false);

                process.exit(0);

            }
        );

    }

}

module.exports = MakeCommand;