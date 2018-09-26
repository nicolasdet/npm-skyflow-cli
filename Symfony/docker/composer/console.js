'use strict';

// composer

module.exports = {

	questions: [
		{
			message: "Application directory. Relative to the current directory.",
			name: "application_dir",
			default: "./",
            validator: (value)=>{
                if(!Skyflow.Directory.exists(value)){
                    return 'Directory not found.'
                }
                return true
            }
		},
	],

};
