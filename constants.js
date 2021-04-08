var sunConnectionString = {  
    server: "localhost",  
    authentication: {
        type: "default",
        options: {
            userName: "sa", 
            password: "P@ssw0rd"  
        }
    },
    options: {
        port:1433,
        encrypt: false,
        instancename: "SQLEXPRESS",
        database: "SunSystemsData",
        rowCollectionOnRequestCompletion: true
    }
};

// var sunConnectionString = {  
//     server: 'mohamedsamy.database.windows.net',  
//     authentication: {
//         type: 'default',
//         options: {
//             userName: 'mohamedsamy', 
//             password: 'abc12345!'  
//         }
//     },
//     options: {
//         encrypt: true,
//         database: 'testing',
//         rowCollectionOnRequestCompletion: true
//     }
// };

let headersHrmsQuery="INSERT INTO PK1_PSTG_HDR (UPDATE_COUNT,LAST_CHANGE_USER_ID,LAST_CHANGE_DATETIME,CREATED_BY,CREATED_DATETIME,CREATION_TYPE ,DESCR,LAST_STATUS,POST_TYPE,POST_WRITE_TO_HOLD,POST_ROUGH_BOOK,POST_ALLOW_BAL_TRANS,POST_SUSPENSE_ACNT,POST_OTHER_ACNT,POST_BAL_BY,POST_DFLT_PERD,POST_RPT_ERR_ONLY,POST_SUPPRESS_SUB_MSG,POST_RPT_FMT,JRNL_TYPE,POST_RPT_ACNT,CNT_ORIG,CNT_REJECTED,CNT_BAL,CNT_REVERSALS,CNT_POSTED,CNT_SUBSTITUTED,CNT_PRINTED,POST_LDG,POST_ALLOW_OVER_BDGT,POST_ALLOW_SUSPNS_ACNT,CNT_ZERO_VAL_ENTRIES,JNL_NUM,NUM_OF_IMBALANCES,DR_AMT_POSTED,CR_AMT_POSTED,POST_TXN_REF_BAL) VALUES ('0','OFS',GETDATE() ,'OFS',GETDATE(),'LI','HRMS','0','2','1','0','0','999999999','999999999','',0,1,1,'LIALL', 'From (PMS File)' ,'999999999','0','0','0','0','0','0','0','A','0','0','0','0','0','0.000','0.000','0') select @@identity"
exports.sunConnection=sunConnectionString
