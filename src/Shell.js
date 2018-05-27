'use strict';

const {execSync, spawnSync} = require('child_process');

const Helper = Skyflow.Helper;

class Shell {

    constructor(){
        this.result = "";
        this.arrayResult = [];
        this.error = false;
    }

    run(command, options){

        let spawn = spawnSync(command + '', options);
        this.error = spawn.stderr.toString().trim();

        if (!this.error) {this.error = false}

        this.result = spawn.stdout.toString().trim();

        this.arrayResult = this.result.split("\n");

        if(this.arrayResult[0] === ''){
            this.arrayResult = [];
        }

        return this;
    }

    exec(command){
        execSync(command, {stdio: [process.stdin, process.stdout, process.stderr]});
    }

    hasError(){
        return this.error !== false;
    }

    getError(){
        return this.error;
    }

    getResult(){
        return this.result;
    }

    getArrayResult(){
        return this.arrayResult;
    }

}

module.exports = new Shell();