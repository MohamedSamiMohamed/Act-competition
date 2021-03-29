
var sunConnectionString = {  
    server: '.SUN',  
    authentication: {
        type: 'default',
        options: {
            userName: 'sa', 
            password: 'P@ssw0rd'  
        }
    },
    options: {
        encrypt: true,
        database: 'SunSystemsData',
        rowCollectionOnRequestCompletion: true
    }
};

exports.sunConnection=sunConnectionString

