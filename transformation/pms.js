const sunConnection = require('../constants')
const mongoose = require('mongoose');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
const schedule = require('node-schedule');
const {PmsLog}= require('../models/pmsModels/logs');
const {sunConfig}=require('../models/pmsModels/configuration');
const { Variables } = require('../models/pmsModels/variables');
const { fileDetails } = require('../models/pmsModels/fileDetails');
const parser = require('../utils/parser');
const Watcher = require('../utils/fileWatcher');
const fs = require("fs");

let mapping={};
let forceTransFlag = new Boolean(false);
let forcedMonth, forcedDay,forcedYear;

//This function will run every day at 12 AM
const job = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        let sunConn = await databaseConnect(sunConnection['sunConnection']);

        let details = await fileDetails.find({
        }).select({
            "userID": 1,
            "path": 1,
            "fileName": 1,
            "extension": 1,
            "_id": 0
        });
        details.forEach(async (element)=>{
            userId = element.userID;
            path = element.path
            file_name = element.fileName + element.extension
            let trans = await sunConfig.findOne({
                userID: userId
            }).select({
                "trans": 1,
                "_id": 0
            });
            trans_array = trans.trans;
            let pms = await getPMSData(sunConn, trans_array, userId, path, element.fileName, element.extension);
          //  deleteFile(path, file_name);
        });

    } catch (err) {
        console.log(err.message)
    }
});

//This function will be called if the day was retrieved 
//and the client wanted to transform data of a past day again
async function forceTransform(requiredDay, requiredMonth,requiredYear, userId, path, filename, extension, skipped) {
    try {
        forcedMonth = requiredMonth
        forcedDay = requiredDay
        forcedYear= requiredYear
        forceTransFlag = true
        let sunConn = await databaseConnect(sunConnection['sunConnection'])
        let trans = await sunConfig.findOne({
            userID: userId
        }).select({
            "trans": 1,
            "_id": 0
        })
        trans_array = trans.trans
        const val = await getPMSData(sunConn, trans_array, userId, path, filename, extension, skipped)
        //deleteFile(path, filename+extension);
    } catch (err) {
        console.log(err.message)
    }
}



// This function is responsible for fetching the data from PMS fil
async function getPMSData(sunConn, trans, userId, path, filename, extension, skipped) {
    try {
        let d = new Date();
        //Filling positions and lengths arrays
        let pos = [];
        let len = [];
        let variables = await Variables.find({
            userID: userId
        }).select({
            "variables": 1,
            "_id": 0
        });
        variables = variables[0]['variables'];
        i=0;
        variables.forEach(element => {
            pos.push(element.startPosition);
            len.push(element.length);
            mapping[`${element.fieldName}`]=i
            i++;
        });
        file = path + "/" + filename + extension;
        return new Promise(async(resolve, reject) => {
            let rowsCount, rows
            const headerID = await insertIntoSunHeaders(sunConn);
            values = await parser(file, pos, len, skipped);
            rowsCount = values[0] - skipped;
            rows = values.slice(1);
            if (forceTransFlag == false) {
                const detailsInsertion = await insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userId, d.getMonth(), d.getDate(),d.getFullYear());
            } else {
                const detailsInsertion = await insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userId, forcedMonth, forcedDay,forcedYear);
            }
            resolve(1);
            
        });
    } catch (err) {
        console.log(err.message)
    }
}

//This function responsible for insertion into SUN database headers (one row per transformation)
async function insertIntoSunHeaders(sunConn) {
    //let requestString = "INSERT INTO PK1_PSTG_HDR (UPDATE_COUNT,LAST_CHANGE_USER_ID,LAST_CHANGE_DATETIME) VALUES (0,'sss',20) select @@identity"
    let requestString="INSERT INTO PK1_PSTG_HDR (UPDATE_COUNT,LAST_CHANGE_USER_ID,LAST_CHANGE_DATETIME,CREATED_BY,CREATED_DATETIME,CREATION_TYPE ,DESCR,LAST_STATUS,POST_TYPE,POST_WRITE_TO_HOLD,POST_ROUGH_BOOK,POST_ALLOW_BAL_TRANS,POST_SUSPENSE_ACNT,POST_OTHER_ACNT,POST_BAL_BY,POST_DFLT_PERD,POST_RPT_ERR_ONLY,POST_SUPPRESS_SUB_MSG,POST_RPT_FMT,JRNL_TYPE,POST_RPT_ACNT,CNT_ORIG,CNT_REJECTED,CNT_BAL,CNT_REVERSALS,CNT_POSTED,CNT_SUBSTITUTED,CNT_PRINTED,POST_LDG,POST_ALLOW_OVER_BDGT,POST_ALLOW_SUSPNS_ACNT,CNT_ZERO_VAL_ENTRIES,JNL_NUM,NUM_OF_IMBALANCES,DR_AMT_POSTED,CR_AMT_POSTED,POST_TXN_REF_BAL) VALUES ('0','OFS',GETDATE() ,'OFS',GETDATE(),'LI','HRMS','0','2','1','0','0','999999999','999999999','1',0,1,1,'LIALL', 'HRM' ,'999999999','0','0','0','0','0','0','0','A','0','0','0','0','0','0.000','0.000','0') select @@identity"
  
    let headerID;
    return new Promise((resolve, reject) => {
        request = new Request(requestString, (err, rowCount) => {
            if (err) {
                console.log(err);
            } else {
                console.log(rowCount + ' rows inserted')
            }
        });
        request.on('row', (columns) => {
            headerID = columns[0].value
        });
        request.on('requestCompleted', function () {
            resolve(headerID)
        });
        sunConn.execSql(request);
    })

}

//This function responsible for the insertion the rows from PMS file in the SUN Database

function insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userID, month, day,year) {
    let requestString = "INSERT INTO PK1_PSTG_DETAIL"
    let remainString = " VALUES"
    let i;
    let position;
    rows.forEach(row => {
        i = 0;
        remainString += `('${headerID}','${rowsCount}',`
        rowsCount -= 1;
        trans.forEach(element => {
            if (element.isConst === false) {
                position=mapping[element.mappedVal]
                remainString += `'${row[position]}',` 
                i += 1
            } else {
                remainString += `'${element.mappedVal}',`
            }
        });
        remainString = remainString.substring(0, remainString.length - 1);
        remainString += '),'
    });
    remainString = remainString.substring(0, remainString.length - 1);
    remainString += ';'
    requestString += remainString
    return new Promise((resolve, reject) => {
        request = new Request(requestString, (err, rowCount) => {
            if (err) {
                console.log(err);
            } 
            else {
                console.log(rowCount + ' rows inserted');
            }
        });
        request.on('requestCompleted', function () {
            console.log('transformation done')
            if (forceTransFlag == false) {
                createLog(userID, month, day,year);
            } else {
                updateLog(userID, month, day,year);
            }
            resolve(1)
        });
        sunConn.execSql(request);
    })
}

//This function deletes the PMS file after data insertion
function deleteFile(file_path, file_name) {
    let mywatcher = new Watcher(file_path);

    mywatcher.on("process", function process(file) {
        const watchFile = file_path + '/' + file_name;
        fs.unlink(watchFile, function (err) {
        });
    });
    mywatcher.start();
}


// create and upload log when the data is transformed 
async function createLog(userId, month, day,year,) {
    let log = new PmsLog({
        userID: userId,
        status: 'posted',
        month: month,
        year: year,
        day: day,
        timeStamp: Date.now(),
    })
    await log.save()
}

// update log when the status was retrieved then transform happens 
async function updateLog(userId, month, day,year) {
    let PMSLog = await PmsLog.findOne({
        userID: userId,
        month: month,
        year: year,
        day: day
    })
    PMSLog.status = 'posted'
    PMSLog.timeStamp = Date.now()
    await PMSLog.save()
}

// this function create connection to SQL server
function databaseConnect(config) {
    return new Promise((resolve, reject) => {
        var connection = new Connection(config);
        connection.on('connect', (err) => {
            if (err) {
                console.log(err.message)
            } else {
                console.log('connection to database done successfully')
                resolve(connection)
            }
        });
        connection.connect();
    })
}
exports.forceTransformPMS = forceTransform
exports.createLog=createLog