const sunConnection = require('../constants')
const mongoose = require('mongoose');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
const schedule = require('node-schedule');
const { PMSLog } = require('../models/pmsModels/logs');
const {sunConfig}=require('../models/pmsModels/configuration');
const { vars } = require('../models/pmsModels/variables');
const { fileDetails } = require('../models/pmsModels/fileDetails');
const parser = require('../utils/parser');
const Watcher = require('../utils/fileWatcher');
const fs = require("fs");


let forceTransFlag = new Boolean(false);
let forcedMonth, forcedDay;

//This function will run every day at 12 AM
const job = schedule.scheduleJob('0 0 * * *', async () => {
    try {
        let sunConn = await databaseConnect(sunConnection['sunConnection']);
        const pms = await getPMSData();
        deleteFile(path, file_name);
    } catch (err) {
        console.log(err.message)
    }
});

//This function will be called if the day was retrieved 
//and the client wanted to transform data of a pervious day again
//-------------------------------------------------
async function forceTransform(requiredDay, requiredMonth, userId) {
    try {
        forcedMonth = requiredMonth
        forceTransFlag = true
        let sunConn = await databaseConnect(sunConnection['sunConnection'])
        let hrmsConnection = await connectionModel.findOne({
            userID: userId
        }).select({
            "_id": 0,
            "__v": 0
        })
        delete hrmsConnection['userID']
        let trans = await sunConfig.find({
            userID: userId
        }).select({
            "trans": 1,
            "_id": 0
        })
        trans = trans[0]['trans']
        const val = await getPMSData(sunConn, trans, userId)
    } catch (err) {
        console.log(err.message)
    }
}



// This function is responsible for fetching the data from PMS file
function getPMSData(sunConn, userId) {
    try {
        let d = new Date();
        //Filling positions and lengths arrays
        let pos = [];
        let len = [];
        let variables = await vars.find({
            userID: userId
        }).select({
            "variables": 1,
            "_id": 0
        });
        variables = variables[0]['variables'];
        variables.forEach(element => {
            pos.push(element.startPosition);
            len.push(element.length);
        });
        console.log(`pos array: ${pos}`);
        console.log(`len array: ${len}`);
        //Forming the file path
        let details = await fileDetails.find({
            userID: userId
        }).select({
            "path": 1,
            "fileName": 1,
            "extension": 1,
            "_id": 0
        });
        file = details[0]['path'] + "/" + details[0]['fileName'] + details[0]['extension'];
        console.log(`file is ${file}`);
        //Getting transformation
        let trans = await sunConfig.find({
            userID: userId
        }).select({
            "trans": 1,
            "_id": 0
        });
        trans = trans[0]['trans'];
        return new Promise((resolve, reject) => {
            if (err) {  
                reject(err.message);
                console.log(err);
            }
            else{
                const headerID = await insertIntoSunHeaders(sunConn);
                values = parser(file, pos, len);
                values.then(function (result) {
                    rowsCount = result[0];
                    rows = result.slice(1); 
                });
                if (forceTransFlag == false) {
                    const detailsInsertion = await insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userID, d.getMonth(), d.getDay());
                } else {
                    const detailsInsertion = await insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userID, forcedMonth, forcedDay);
                }
            }
        });
    } catch (err) {
        console.log(err.message)
    }
}

//This function responsible for insertion into SUN database headers (one row per transformation)
function insertIntoSunHeaders(sunConn) {
    let requestString = "INSERT INTO PK1_PSTG_HDR (UPDATE_COUNT,LAST_CHANGE_USER_ID,LAST_CHANGE_DATETIME) VALUES (0,'sss',20) select @@identity"
    console.log(requestString)
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

function insertIntoSunDetails(sunConn, trans, rows, rowsCount, headerID, userID, month, day) {
    let requestString = "INSERT INTO PK1_PSTG_DETAIL (PSTG_HDR_ID,"
    trans.forEach(element => {
        requestString += `${element.sunColumn},`
    })
    requestString = requestString.substring(0, requestString.length - 1);
    requestString += ')'
    let remainString = ` VALUES`
    let i;
    rows.forEach(row => {
        i = 0;
        remainString += `('${headerID}','${rowsCount}',`
        rowsCount -= 1;
        trans.forEach(element => {
            if (element.isConst === false) {
                remainString += `'${row[i][1]}',` 
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
                createLog(userID, month, day);
            } else {
                updateLog(userID, month, day);
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
            //To handle: If a file with different name was uploaded...
            //Had to comment the error
            //if (err) throw err;
        });
    });
    mywatcher.start();
}


// create and upload log when the data is transformed 
async function createLog(userId, month, day) {
    let log = new PMSLog({
        userID: userId,
        status: 'posted',
        month: month,
        year: '2021',
        day: day
    })
    await log.save()
}

//Note: Year!!!
// update log when the status was retrieved then transform happens 
async function updateLog(userId, month, day) {
    let PMSLog = await PMSLog.findOne({
        userID: userId,
        month: month,
        year: '2021',
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
exports.forceTransform = forceTransform
