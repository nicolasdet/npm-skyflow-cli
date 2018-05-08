'use strict';

const fs = require('fs'),
    resolve = require('path').resolve,
    File = Skyflow.File,
    Helper = Skyflow.Helper,
    CurrentPackage = Skyflow.CurrentPackage,
    Directory = Skyflow.Directory,
    Input = Skyflow.Input,
    Output = Skyflow.Output,
    Validator = Skyflow.Validator;

function askInfo(object, callback) {

    Input.input(
        {
            message: object.message,
            default: object.default,
            validator: new Validator(/[\w]+/, 'This value is required.')
        }, callback
    );

}

function askScriptName(object, callback) {

    Input.input(
        {
            message: object.message,
            default: object.default,
            validator: (response)=>{
                if(!/^[a-z][a-z0-9]*\-?[a-z0-9]+$/i.test(response)){
                    return "Invalid script name."
                }
                if(CurrentPackage['scripts'][response]){

                    return "Script name already exists."
                }
                return true
            }
        }, callback
    );

}

function installDependencies() {

    let devDependencies = [
        "clean-webpack-plugin@^0.1.19",
        "css-loader@^0.28.11",
        "extract-text-webpack-plugin@^4.0.0-beta.0",
        "file-loader@^1.1.11",
        "html-webpack-plugin@^3.2.0",
        "node-sass@^4.8.3",
        "sass-loader@^6.0.7",
        "style-loader@^0.20.3",
        "webpack@^4.3.0",
        "webpack-cli@^2.0.13"
    ];
    devDependencies = devDependencies.sort();
    let dependencies = [
        "@babel/core@^7.0.0-beta.42",
        "@babel/preset-env@^7.0.0-beta.42",
        "@babel/preset-react@^7.0.0-beta.42",
        "babel-loader@^8.0.0-beta.2",
        "react@^16.2.0",
        "react-dom@^16.2.0",
        "skyflow-core"
    ];
    dependencies = dependencies.sort();
    const {execSync} = require('child_process');
    // Install dependencies
    Output.newLine();
    Output.info('Installing dependencies...', false); Output.newLine();
    execSync('npm install ' + dependencies.join(' '), {stdio:[0,1,2]});
    // Install dependencies
    Output.newLine();
    Output.info('Installing dev dependencies...', false); Output.newLine();
    execSync('npm install --save-dev ' + devDependencies.join(' '), {stdio:[0,1,2]});

}

class WebpackCommand {

    install(options) {

        if (!File.exists(resolve(process.cwd(), 'package.json'))) {
            Output.error('package.json file not found in current directory.');
            process.exit(1);
        }

        let devScriptName = null,
            prodScriptName = null,
            watchScriptName = null;

        if(!Helper.isObject(CurrentPackage['scripts'])){
            CurrentPackage['scripts'] = {};
        }

        let content = File.read(resolve(__dirname, '..', '..', 'resources', 'webpack', 'webpack.config.dev')),
            prodContent = File.read(resolve(__dirname, '..', '..', 'resources', 'webpack', 'webpack.config.prod'));

        askInfo({
            message: 'Entry point',
            default: 'index.js',
        }, (answer) => {

            content = content.replace('{{entry-point}}', answer.response);
            prodContent = prodContent.replace('{{entry-point}}', answer.response);

            askInfo({
                message: 'Output directory',
                default: 'dist',
            }, (answer) => {

                content = content.replace('{{output-dir}}', answer.response);
                prodContent = prodContent.replace('{{output-dir}}', answer.response);

                content = content.replace('{{output-dir}}', answer.response);
                prodContent = prodContent.replace('{{output-dir}}', answer.response);

                askInfo({
                    message: 'JavaScript output file name',
                    default: 'app.js',
                }, (answer) => {

                    content = content.replace('{{js-output}}', answer.response);
                    prodContent = prodContent.replace('{{js-output}}', answer.response);

                    askInfo({
                        message: 'Style output file name',
                        default: 'app.css',
                    }, (answer) => {

                        content = content.replace('{{style-output}}', answer.response);
                        prodContent = prodContent.replace('{{style-output}}', answer.response);

                        askScriptName({
                            message: 'Development script name',
                            default: 'dev',
                        }, (answer)=>{
                            devScriptName = answer.response;

                            askScriptName({
                                message: 'Production script name',
                                default: 'build',
                            }, (answer)=>{
                                prodScriptName = answer.response;

                                askScriptName({
                                    message: 'Watch script name',
                                    default: 'watch',
                                }, (answer)=>{
                                    watchScriptName = answer.response;

                                    let dir = resolve(process.cwd(), 'webpack');

                                    if (!Directory.exists(dir)) {Directory.create(dir)}

                                    let configFile = resolve(dir, 'webpack.config.dev.js');
                                    File.create(configFile);
                                    if(Skyflow.isLinux()){
                                        fs.chmodSync(configFile, '777');
                                    }
                                    File.write(configFile, content);

                                    let prodConfigFile = resolve(dir, 'webpack.config.prod.js');
                                    File.create(prodConfigFile);
                                    if(Skyflow.isLinux()){
                                        fs.chmodSync(prodConfigFile, '777');
                                    }
                                    File.write(prodConfigFile, prodContent);

                                    CurrentPackage['scripts'][devScriptName] = "./node_modules/.bin/webpack" +
                                        " --mode=development --config=webpack/webpack.config.dev.js";
                                    CurrentPackage['scripts'][prodScriptName] = "./node_modules/.bin/webpack" +
                                        " --mode=production --config=webpack/webpack.config.prod.js";
                                    CurrentPackage['scripts'][watchScriptName] = "./node_modules/.bin/webpack --mode=development" +
                                        " --config=webpack/webpack.config.dev.js --watch";

                                    File.createJson(resolve(process.cwd(), 'package.json'), CurrentPackage);

                                    installDependencies();

                                    Output.newLine();

                                    Output.success('Success !', false);

                                    Output.newLine();
                                    Output.write('npm run ' + devScriptName);
                                    Output.success(' ✓', false);

                                    // Output.newLine();
                                    Output.write('npm run ' + prodScriptName);
                                    Output.success(' ✓', false);

                                    // Output.newLine();
                                    Output.write('npm run ' + watchScriptName);
                                    Output.success(' ✓', false);

                                });

                            });

                        });

                    });

                });

            });

        });

    }

}

module.exports = new WebpackCommand();