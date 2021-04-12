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


let mapping={
    "JV_Report_Details_ID":0,
    "Property_ID":1,
    "User_ID":2,
    "The_Year":3,
    "The_Month":4,
    "Account_Number":5,
    "Account_Number_JV_Description":5,
    "Jornal_Type":6,
    "JV_Type":7,
    "Amount_D":8,
    "Amount_C":9,
    "T0":10,
    "T1":11,
    "T2":12,
    "T3":13,
    "T4":14,
    "T5":15,
    "T6":16,
    "T7":17,
    "T8":18,
    "T9":19,
    "Cost_Center":20
}

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
exports.hrmsColumns=mapping