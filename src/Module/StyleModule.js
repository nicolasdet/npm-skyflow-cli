'use strict';

const fs = require("fs"),
    path = require("path"),
    resolve = require("path").resolve,
    Directory = Skyflow.Directory,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output;

function listStyle() {

    let styleListFileName = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style', 'style.list.js');

    function displayStyleList() {

        let styles = require(styleListFileName);

        Output.newLine();
        Output.writeln('Available style:', 'blue', null, 'bold');
        Output.writeln('-'.repeat(50), 'blue', null, 'bold');

        styles.map((style)=>{

            Output.write(style, null, null, 'bold');
            Output.writeln(' >>> style:add ' + style);

        });

    }

    if (!File.exists(styleListFileName)) {

        Output.writeln('Pulling style list from ' + Api.protocol + '://' + Api.host + ' ...', false);

        Api.get('style', (response) => {

            if (response.statusCode !== 200) {
                Output.error('Can not pull style list from ' + Api.protocol + '://' + Api.host + '.', false);
                process.exit(1)
            }

            let data = response.body.data,
                styles = [];

            Directory.create(resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style'));

            data.map((d)=>{
                styles.push(d.filename.replace(/^_+|\.scss$/g, ''));
            });

            File.create(styleListFileName, "'use strict';\n\nmodule.exports = "+JSON.stringify(styles));
            if (Skyflow.Helper.isInux()) {fs.chmodSync(styleListFileName, '777')}

            displayStyleList()

        });

        return 0
    }

    displayStyleList();

    return 0
}

class StyleModule {

    // Require
    dispatcher() {

        let method = '__style__' + Object.values(arguments).join('__'),
            args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in Style module.', false);

        return 1
    }

    style(){

        if(Request.hasOption("list")){
            return listStyle();
        }

        return 1
    }

    __style__add(styles) {

        if (!styles[0]) {
            Output.error('Invalid style name.', false);
            process.exit(1);
        }

        let styleDir = resolve(Skyflow.Helper.getUserHome(), '.skyflow', 'style');

        function runAfterPull(name) {

            if(!File.exists(resolve(styleDir, '_' + name + '.scss'))){
                Output.error(name + ' style not found.', false);
                return 1
            }

            let dir = './';
            if(Request.hasOption('dir')){
                dir = Request.getOption('dir')
            }

            let tmpDir = dir;
            dir = resolve(process.cwd(), dir);
            Directory.create(dir);

            name = '_' + name + '.scss';

            if(File.exists(resolve(dir, name))){
                Output.info(tmpDir + path.sep + name + ' already exists.', false);
                return 1
            }

            File.copy(resolve(styleDir, name), resolve(dir, name));
            if (Skyflow.Helper.isInux()) {fs.chmodSync(resolve(dir, name), '777')}

            Output.success(name);
        }

        styles.push('variables');

        styles.map((name)=>{

            if (File.exists(resolve(styleDir, '_' + name + '.scss'))) {
                runAfterPull(name)
            } else {
                Api.getStyleByName(name, runAfterPull);
            }

        });

        return 0
    }

}

module.exports = new StyleModule();