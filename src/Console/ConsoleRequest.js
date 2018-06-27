class ConsoleRequest {

    constructor() {
        this.commands = {
            // commandName: "index from minimist module"
        };
        this.options = {};
        this.registeredCommands = {};
        this.parse();
    }

    /**
     * Parse process.argv array;
     * @returns {ConsoleRequest}
     */
    parse(){
        const args = require('minimist')(process.argv.slice(2));
        // Store commands
        args['_'].forEach((name, index) => {
            this.commands[name] = index
        });
        delete args['_'];
        // Store options
        for (let arg in args){
            if(args.hasOwnProperty(arg)){
                this.options[arg] = args[arg]
            }
        }
        return this
    }

    /**
     * @param {string} option
     * @returns {boolean}
     */
    hasOption(option){
        if(option === undefined){
            for (let o in this.options){
                if(this.options.hasOwnProperty(o)){
                    return true
                }
            }
            return false
        }
        return this.options.hasOwnProperty(option)
    }

    /**
     * @param {string} option
     * @returns {string|array}
     */
    getOption(option){
        return this.options[option]
    }

    /**
     * @param {string} option
     * @param value
     * @returns {ConsoleRequest}
     */
    setOption(option, value = true){
        this.options[option] = value;
        return this;
    }

    /**
     * @returns {object}
     */
    getOptions(){
        return this.options
    }

    /**
     * @param {string} command
     * @returns {boolean}
     */
    hasCommand(command){
        if(command === undefined){
            for (let c in this.commands){
                if(this.commands.hasOwnProperty(c)){
                    return true
                }
            }
            return false
        }
        return this.commands.hasOwnProperty(command)
    }

    /**
     * @returns {object}
     */
    getCommands(){
        return this.commands
    }

    /**
     *
     * @param {string} command
     * @param {function} callback
     * @returns {ConsoleRequest}
     */
    registerCommand(command, callback){
        this.registeredCommands[command] = callback;
        return this
    }

    /**
     * @returns {number}
     */
    dispatchCommands(){

        for (let c in this.commands){
            if(this.commands.hasOwnProperty(c) && this.registeredCommands.hasOwnProperty(c)){
                return this.registeredCommands[c].apply(null, [this.options])
            }
        }

        return 0
    }

}

module.exports = new ConsoleRequest();