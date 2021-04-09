require('dotenv').config()
var sunConnectionString = {  
    server: process.env.SUN_CONNECTION_SERVER_NAME,  
    authentication: {
        type: "default",
        options: {
            userName: process.env.SUN_CONNECTION_USERNAME, 
            password: process.env.SUN_CONNECTION_PASSWORD  
        }
    },
    options: {
        port:1433,
        encrypt: false,
        instancename: "SQLEXPRESS",
        database: process.env.SUN_CONNECTION_DATABASE_NAME,
        rowCollectionOnRequestCompletion: true
    }
};

// var sunConnectionString = {  
//     server: 'mohamedsamy.database.windows.net',  
//     authentication: {
//         type: 'default',
//         options: {
//             userName: 'mohamedsamy', 
//             password: '*******'  
//         }
//     },
//     options: {
//         encrypt: true,
//         database: 'testing',
//         rowCollectionOnRequestCompletion: true
//     }
// };

exports.sunConnection=sunConnectionString
