/**
 * @link https://www.npmjs.com/package/chalk
 */
class ConsoleStyle {

    constructor() {
        this.styles = {};
        this.bg = {type: null, value: null};
        this.color = {type: null, value: null};
    }

    /**
     * Set color.
     * @param {string} color Values can be 'redBright' 'green' ...
     * @returns {ConsoleStyle}
     */
    setColor(color) {
        if (!color) {
            this.color = {type: null, value: null};
            return this
        }
        let c = ('' + color).slice(0, 1);
        if (c === '#') {
            this.color.type = 'hex';
            this.color.value = color;
            return this
        } else {
            this.color.type = null;
            this.color.value = color;
        }
        return this
    }

    /**
     * Add style.
     * @param {string} style Format can be 'inverse' 'bold.underline' 'bold hidden'
     * @returns {ConsoleStyle}
     */
    addStyle(style) {
        if (!style) {
            this.styles = {};
            return this
        }
        const styles = ('' + style).split(/[ \.]/);
        styles.forEach((style) => {
            this.styles[style] = true;
        });
        return this
    }

    /**
     * Remove style.
     * @param {string} style Format can be 'inverse' 'bold' 'underline'
     * @returns {ConsoleStyle}
     */
    removeStyle(style) {
        delete this.styles[style];
        return this
    }

    /**
     * Set background.
     * @param {string} color Values can be 'cyan' 'magentaBright' ...
     * @returns {ConsoleStyle}
     */
    setBackground(color) {
        if (!color) {
            this.bg = {type: null, value: null};
            return this
        }
        let c = ('' + color).slice(0, 1);
        if (c === '#') {
            this.bg.type = 'bgHex';
            this.bg.value = color;
            return this
        } else {
            this.bg.type = null;
            this.bg.value = 'bg' + c.toUpperCase() + ('' + color).slice(1);
        }
        return this
    }

    /**
     * Apply style to text.
     * @param text Text to format
     * @returns {string}
     */
    apply(text) {
        const chalk = require('chalk');
        // Apply style
        for (let style in this.styles) {
            if (this.styles.hasOwnProperty(style)) {
                text = chalk[style] ? chalk[style](text) : text
            }
        }
        // Apply colors
        if (this.color.type) {
            text = chalk[this.color.type](this.color.value)(text)
        } else {
            text = chalk[this.color.value] ? chalk[this.color.value](text) : text
        }
        // Apply background colors
        if (this.bg.type) {
            text = chalk[this.bg.type](this.bg.value)(text)
        } else {
            text = chalk[this.bg.value] ? chalk[this.bg.value](text) : text
        }
        return text
    }

}

module.exports = new ConsoleStyle();