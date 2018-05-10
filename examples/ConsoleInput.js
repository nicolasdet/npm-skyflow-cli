const resolve = require('path').resolve,
    Input = require(resolve(__dirname, '...', 'src', 'Console', 'ConsoleInput')),
    Validator = require(resolve(__dirname, '...', 'src', 'Validator'));

// Ask
Input.input(
    {
        message: 'Enter a number',
        default: 0,
        validator: new Validator(/[\d]/, 'You must enter a number')
    }, answer => {
        console.log(answer);
    }
);

Input.input(
    {
        message: object.message,
        default: object.default,
        validator: (response)=>{
            if(!/^[a-z][a-z0-9]*\-?[a-z0-9]+$/i.test(response)){
                return "Invalid name."
            }
            return true
        }
    }, answer => {
        console.log(answer);
    }
);

// Choices
Input.choices(
    {
        message: 'What size do you need?',
    },
    ['Jumbo', 'Large', 'Standard', 'Medium', 'Small', 'Micro'],
    answer => {
        console.log(answer);
    }
);

// Multiple choices
Input.choices(
    {
        message: 'What size do you need?',
        multiple: true
    },
    [
        {name: 'Jumbo'},
        {name: 'Large', value: 'Large value'},
        {name: 'Standard', checked: true,},
        {name: 'Medium'},
    ],
    answer => {
        console.log(answer);
    }
);

// Confirm
Input.confirm('Confirm your choice?', false, answer => {
    console.log(answer);
});

// Hidden
Input.hidden(
    {
        message: 'Enter a password',
        default: 'myPassword',
        validator: new Validator(/[a-z0-9]{4, }/, 'Enter valid password')
    }, answer => {
        console.log(answer);
    }
);