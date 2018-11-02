// https://www.npmjs.com/package/inquirer

const Helper = Skyflow.Helper,
    inquirer = require('inquirer'),
    fuzzy = require('fuzzy');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

function resolveOptions(options) {
    if (Helper.isString(options)) {
        options = {message: options}
    }
    if (!Helper.isObject(options)) {
        options = {}
    }
    return options
}

function resolveQuestion(question, options) {
    if (options['suffix'] !== undefined) {
        question['suffix'] = options['suffix']
    }
    if (options['prefix'] !== undefined) {
        question['prefix'] = options['prefix']
    }
    if (options['default'] !== undefined) {
        question['default'] = options['default']
    }
    question['message'] = (options['message'] === undefined) ? '' : options['message'];

    const validator = options['validator'],
        validatorType = Helper.getType(validator);
    if (validatorType === 'Validator') {
        question['validate'] = value => {
            if (validator.isValid(value)) {
                return true
            }
            return validator.getErrorMessage()
        };
    }

    if (validatorType === 'Function') {
        question['validate'] = validator;
    }

    return question
}

/**
 * https://www.npmjs.com/package/inquirer
 */
class ConsoleInput {

    /**
     * Input values
     * @param {Object|String|Array} options
     * @param {Function} callback
     * @returns {ConsoleInput}
     */
    input(options, callback) {

        if(!Helper.isArray(options)){options = [options]}

        options = options.map((option)=>{
            option = resolveOptions(option);
            let question = {type: (option.type ? option.type : 'input'), name: (option.name ? option.name : 'response')};
            question = resolveQuestion(question, option);
            return question;
        });

        inquirer.prompt(options).then(callback);

        return this
    }

    /**
     * Make a choice
     * @param {Object|String} options Configuration object: {message: '...', multiple: true}
     * @param {Array} choices
     * @param {Function} callback
     * @returns {ConsoleInput}
     */
    choices(options, choices = [], callback) {

        options = resolveOptions(options);
        let question = {
            type: (options['multiple'] === true) ? 'checkbox' : 'list',
            name: 'response',
            choices: choices
        };
        question = resolveQuestion(question, options);
        inquirer.prompt([question]).then(callback);

        return this
    }

    /**
     * Confirms a choice
     * @param {String} message
     * @param {Boolean} defaultValue
     * @param {Function} callback
     * @returns {ConsoleInput}
     */
    confirm(message, defaultValue = true, callback) {
        let question = {type: 'confirm', name: 'response', message: message, default: defaultValue};
        inquirer.prompt([question]).then(callback);

        return this
    }

    /**
     * Input hidden values
     * @param {Object|String} options Configuration object: {message: '...', default: '...', validator: new Validator()}
     * @param {Function} callback
     * @param {String} mask
     * @returns {ConsoleInput}
     */
    hidden(options, callback, mask = '*') {

        options = resolveOptions(options);
        let question = {type: 'password', name: 'response'};
        question = resolveQuestion(question, options);
        question['mask'] = mask;
        inquirer.prompt([question]).then(callback);

        return this
    }

    /**
     * Input with autocomplete
     * @param {Object|String} options Configuration object: {message: '...'}
     * @param {Array} data
     * @param {Function} callback
     * @returns {ConsoleInput}
     */
    autocomplete(options, data = [], callback) {

        options = resolveOptions(options);
        let question = {
            type: 'autocomplete',
            name: 'response',
            suggestOnly: false,
        };
        question = resolveQuestion(question, options);

        question['source'] = (answers, input) => {
            input = input || '';
            return new Promise(function (resolve) {
                setTimeout(function () {
                    let fuzzyResult = fuzzy.filter(input, data);
                    resolve(fuzzyResult.map(function (el) {
                        return el.original;
                    }));
                }, 30);
            });
        };

        inquirer.prompt([question]).then(callback);

        return this
    }

}

module.exports = new ConsoleInput();