'use strict';

const fs = require("fs"), resolve = require("path").resolve;

const Directory = Skyflow.Directory,
    File = Skyflow.File,
    Api = Skyflow.Api,
    Request = Skyflow.Request,
    Output = Skyflow.Output;

const _ = require('lodash');

class ReactModule {

    // Require
    dispatcher() {

        let method = '__react__' + Object.values(arguments).join('__');

        let args = Object.keys(Request.getCommands()).slice(1);

        if (this[method]) {
            return this[method].apply(this, [args]);
        }

        Output.error('Command not found in React module.', false);

        return 1
    }

    __react__create__component(components) {

        if (!components[0]) {
            Output.error('Invalid component name.', false);
            process.exit(1);
        }

        let sampleDir = resolve(Skyflow.getUserHome(), '.skyflow', 'react', 'sample', 'component');

        function runAfterPull() {

            let dir = './';
            if(Request.hasOption('dir')){
                dir = Request.getOption('dir')
            }

            dir = resolve(process.cwd(), dir);
            Directory.create(dir);

            components.map((name)=>{

                name = _.upperFirst(_.camelCase(_.deburr(name)));

                let tmpDir = resolve(dir, name);
                if(Directory.exists(tmpDir) && !Request.hasOption('force')){
                    Output.error(name + ' component already exists. Use --force option to force creation.', false);
                    return 1;
                }

                let styleName = _.kebabCase(name);

                Directory.create(tmpDir);

                // Component file
                let contents = File.read(resolve(sampleDir, 'component.js.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                let filename = resolve(tmpDir, name + 'Component.js');
                File.create(filename, contents);
                if (Skyflow.isInux()) {fs.chmodSync(filename, '777')}

                // Style file
                contents = File.read(resolve(sampleDir, 'component.scss.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                filename = resolve(tmpDir, name + 'Component.scss');
                File.create(filename, contents);
                if (Skyflow.isInux()) {fs.chmodSync(filename, '777')}

                // Event file
                contents = File.read(resolve(sampleDir, 'componentEvent.js.sample'));
                contents = contents.replace(/\{\{ *name *\}\}/g, name).replace(/\{\{ *style *\}\}/g, styleName);
                filename = resolve(tmpDir, name + 'ComponentEvent.js');
                File.create(filename, contents);
                if (Skyflow.isInux()) {fs.chmodSync(filename, '777')}

                Output.success(name + 'Component');

            });

        }

        if (Directory.exists(sampleDir)) {
            runAfterPull()
        } else {
            Api.getReactComponentSamples(runAfterPull);
        }

        return 0
    }

}

module.exports = new ReactModule();