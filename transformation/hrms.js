const sunConnection=require('../constants')
const mongoose = require('mongoose');
var Connection = require('tedious').Connection;  
var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;  
const schedule = require('node-schedule');
const {sunConfig}=require('../models/hrmsModels/configuration')
const {connectionModel}= require('../models/hrmsModels/connection');
const { HrmsLog } = require('../models/hrmsModels/logs');


let forceTransFlag=new Boolean (false);
let forcedMonth;
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

//'0 * 30 3 *'
//This function initiates transformation process by getting connection of hrms database for each user and his mapping configuration
//then starting connection to SUN and his HRMS database and transform data between them according to the mapping configuration


//This version will be run every month at 12 AM
const job = schedule.scheduleJob('0 0 1 * *', async()=>{
    try{
        let sunConn=await databaseConnect(sunConnection['sunConnection'])
        let hrmsConnection=await connectionModel.find().select({"_id":0,"__v":0})
        if(hrmsConnection.length==0){
            return
        }
        hrmsConnection.forEach(async (element)=>{
            let userId=element.userID
            delete element['userID']
            let hrmsConn=await databaseConnect(element)
            let trans=await sunConfig.find({userID:userId}).select({"trans":1,"_id":0})
            trans=trans[0]['trans']
            const val=await getHrmsData(sunConn,hrmsConn,trans,userId)
        })
        }
        catch(err){
            console.log(err.message)
        }    
})


//This function will be called if the month was retrieved and the client wanted to transform data of a pervious month again
async function forceTransform(requiredMonth,userId){
try{
forcedMonth=requiredMonth
forceTransFlag=true
let sunConn=await databaseConnect(sunConnection['sunConnection'])
let hrmsConnection=await connectionModel.findOne({userID:userId}).select({"_id":0,"__v":0})
if(!hrmsConnection){
    return
}
    delete hrmsConnection['userID']
    let hrmsConn=await databaseConnect(hrmsConnection)
    let trans=await sunConfig.find({userID:userId}).select({"trans":1,"_id":0})
    trans=trans[0]['trans']
    const val=await getHrmsData(sunConn,hrmsConn,trans,userId)
}
catch(err){
    console.log(err.message)
}
}



// This function is responsible of fetching data from HRMS databse
function getHrmsData(sunConn,hrmsConn,trans,userID){
try{
    
    let requestString='SELECT *'
    if(forceTransFlag==false){
    let d=new Date()
    requestString+=` FROM JV_Report_Details_Tbl WHERE The_Month=${ d.getMonth()} AND User_ID=${1};`
    }
    else{
    requestString+=` FROM JV_Report_Details_Tbl WHERE The_Month=${forcedMonth} AND User_ID=${1};`
    }
    console.log(requestString)
    return new Promise((resolve,reject)=>{
        request = new Request(requestString,async (err,rowCount,rows)=> {  
        if (err) {  
            reject(err.message)
            console.log(err);
        }
        else{
            console.log(rowCount+' rows selected')
            const headerID=await insertIntoSunHeaders(sunConn)
            if(forceTransFlag==false){
            const detailsInsertion=await insertIntoSunDetails(sunConn,trans,rows,headerID,userID,d.getMonth())
            }
            else{
                const detailsInsertion=await insertIntoSunDetails(sunConn,trans,rows,headerID,userID,forcedMonth)
            }
        }
        });  
        request.on('requestCompleted', function() {  
            resolve(1)
        });  
        hrmsConn.execSql(request);  
    })
}
catch(err){
    console.log(err.message)
}
}


//This function responsible for insertion into SUN database headers (one row per transformation)
function insertIntoSunHeaders(sunConn){
let requestString="INSERT INTO PK1_PSTG_HDR (UPDATE_COUNT,LAST_CHANGE_USER_ID,LAST_CHANGE_DATETIME,CREATED_BY,CREATED_DATETIME,CREATION_TYPE ,DESCR,LAST_STATUS,POST_TYPE,POST_WRITE_TO_HOLD,POST_ROUGH_BOOK,POST_ALLOW_BAL_TRANS,POST_SUSPENSE_ACNT,POST_OTHER_ACNT,POST_BAL_BY,POST_DFLT_PERD,POST_RPT_ERR_ONLY,POST_SUPPRESS_SUB_MSG,POST_RPT_FMT,JRNL_TYPE,POST_RPT_ACNT,CNT_ORIG,CNT_REJECTED,CNT_BAL,CNT_REVERSALS,CNT_POSTED,CNT_SUBSTITUTED,CNT_PRINTED,POST_LDG,POST_ALLOW_OVER_BDGT,POST_ALLOW_SUSPNS_ACNT,CNT_ZERO_VAL_ENTRIES,JNL_NUM,NUM_OF_IMBALANCES,DR_AMT_POSTED,CR_AMT_POSTED,POST_TXN_REF_BAL) VALUES ('0','OFS',GETDATE() ,'OFS',GETDATE(),'LI','HRM','0','2','1','0','0','999999999','999999999','1',0,1,1,'LIALL', 'HRM' ,'999999999','0','0','0','0','0','0','0','A','0','0','0','0','0','0.000','0.000','0') select @@identity"
let headerID;
return new Promise((resolve,reject)=>{
    request = new Request(requestString, (err,rowCount)=> {  
    if (err) {  
        reject(err.message)
        console.log(err);
    }
    else{
        console.log(rowCount+' rows inserted in headers')
    }
    });

    request.on('row', (columns)=>{
        headerID=columns[0].value
    });
    request.on('requestCompleted', function() {  
        resolve(headerID)
    });  
    sunConn.execSql(request); 
})

}


//This function responsible of insertion the rows from HRMS database in the SUN Database

function insertIntoSunDetails(sunConn,trans,rows,headerID,userID,month){
let requestString="INSERT INTO PK1_PSTG_DETAIL "
let reaminString=" VALUES"
let rowsNum=rows.length
rows.forEach(row=>{
    console.log(row);
reaminString+=`('${headerID}','${rowsNum}',`
rowsNum-=1
trans.forEach(element=>{
    if(element.isConst===false){
        let position=mapping[element.mappedVal]
        reaminString+=`'${row[position].value}',`
    }
    else{
        reaminString+=`'${element.mappedVal}',`
    }
})
reaminString = reaminString.substring(0, reaminString.length - 1);
reaminString+='),'

})
reaminString = reaminString.substring(0, reaminString.length - 1);
reaminString+=';'
requestString+=reaminString
console.log(requestString);

return new Promise((resolve,reject)=>{
    request = new Request(requestString, (err,rowCount,rows)=> {  
    if (err) {  
        reject(err.message)
        console.log(err.message);
    }
    else{
        console.log(rowCount+' rows inserted')
    }
    });
    request.setTimeout(300000);
    request.on('requestCompleted', function() {  
        console.log('transformation done')
        if(forceTransFlag==false){
        createLog(userID,month)
        }
        else{
        updateLog(userID,month)
        }
        resolve(1)
    });  
    sunConn.execSql(request); 
})
}


// creat and upload log when the data is transformed from hrms to sun
async function createLog(userId,month){
    console.log('here')
    try{
    let log=new HrmsLog({
        userID:userId,
        timeStamp: Date.now(),
        status:'posted',
        month:month
    })
    await log.save()
}
catch(err){
    console.log(err.message)
}
}


// update log when the status was retrieved then trnasforced happens 
async function updateLog(userId,month){
    let hrmsLog=await HrmsLog.findOne({userID:userId,month:month})
    hrmsLog.status='posted'
    hrmsLog.timeStamp=Date.now()
    await hrmsLog.save()
}

// this function create connection to SQL server
function databaseConnect(config) {
    return new Promise((resolve,reject)=>{
    var connection = new Connection(config); 
    connection.on('connect',(err)=> {  
        if(err) {
            reject(err.message)
            console.log(err.message)
        }
        else{
            console.log('connection to database done successfully')
            resolve(connection)
        }
    });
    connection.connect(); 
})
}

exports.forceTransform=forceTransform

