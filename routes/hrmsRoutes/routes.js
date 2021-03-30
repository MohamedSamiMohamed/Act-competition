const {validate,connectionModel}= require('../../models/hrmsModels/connection');
const sunConnection=require('../../models/sunModel')
const mongoose = require('mongoose');
const {validateConfiguration,sunHrmsConfig}=require('../../models/hrmsModels/configuration')
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {Log}= require('../../models/hrmsModels/logs');
const schedule = require('node-schedule');
var Connection = require('tedious').Connection;  
var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;  
const hrmsTableName='JV_Report_Details_Tbl'

router.post('/configStr',async(req,res)=>{
const result=validate(req.body)
if(result.error){
    res.status(400).send(result.error.details[0].message)
    return 
}
else{
const userId = req.header('x-userID');
if (!userId) return res.status(401).send('Access denied. No userID provided.');
else{
    let user=await User.findOne({_id: userId})
    if(!user){
        return res.status(400).send('No such user with the given ID')
    }
else{
const config=new connectionModel({
    userID: userId,
    server: req.body.server,  
    authentication: {
        type: 'default',
        options: {
            userName: req.body.userName, 
            password: req.body.password  
        }
    },
    options: {
        encrypt: true,
        database: req.body.database,
        rowCollectionOnRequestCompletion: true
    }
})
try{
await config.save()
res.send(config)
}
catch(err){
    res.status(400).send('This user already uploaded connection string before')
}
}
}
}
})


router.post('/connect',async (req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else{
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
        let connectionString=await connectionModel.find({userID:userId}).select({"_id":0,"userID":0,"__v":0})
        var connection = new Connection(connectionString[0]); 
        connection.on('connect',(err)=> {  
            if(err) return res.status(400).send(err.message)
            else{
            res.send('connection done successfully, the connection string is'+connectionString[0])
            //execute your queries here 
            }
        });
        connection.connect();
    }   
}
})

router.get('/isClient',async (req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else{
        let connection=await connectionModel.findOne({userID: userId})
        console.log(connection)
        if(!connection){
        return res.send(false)
    }
    else{
        res.send(true)
    }
}
})


router.post('/configuration',async(req, res) => {
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
    const {error} =validateConfiguration(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    else{
        let trans=[]
        req.body.trans.forEach(element=>{
            trans.push({
                sunColumn: element.sunColumn,
                mappedVal: element.mappedVal,
                isConst: element.isConst
            })
        })
        conf = new sunHrmsConfig({
            userID: userId,
            trans
        })
        try{
        await conf.save();
        res.send('Configuration Settings Uploaded Successfully!');
    }
    catch(err){
        res.status(400).send('this user already has a configuration before')
    }
    }
}
}
})




async function uploadLog(date,status,userId){
    let log=new Log({
        userID:userId,
        date: date,
        status:status
    })
    await log.save()
}

function databaseConnect(config) {
    return new Promise((resolve,reject)=>{
    var connection = new Connection(config); 
    connection.on('connect',(err)=> {  
        if(err) {
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



// const job = schedule.scheduleJob('0 * 30 3 *', async()=>{
//let sunConn=databaseConnect(sunConnection)
async function transform(){
let hrmsConnection=await connectionModel.find().select({"_id":0,"__v":0})
hrmsConnection.forEach(async (element)=>{
    let userId=element.userID
    delete element['userID']
    console.log('hrms connection string element'+element)
    let hrmsConn=await databaseConnect(element)
    let trans=await sunHrmsConfig.find({userID:userId}).select({"trans":1,"_id":0})
    trans=trans[0]['trans']
    console.log(trans)
    const val=await executeTransformation(hrmsConn,trans)
})
}
function executeTransformation(hrmsConn,trans){
    let requestString='SELECT '
    trans.forEach(element=>{
        if(element.isConst==false){
        requestString+=element.mappedVal+','
        }
    })
    requestString = requestString.substring(0, requestString.length - 1);
    let d=new Date()
    requestString+=` FROM ${hrmsTableName} WHERE The_Month=${ d.getMonth()+2} AND User_ID=${1};`
    console.log(requestString)
    return new Promise((resolve,reject)=>{
        request = new Request(requestString, (err,rowCount,rows)=> {  
        if (err) {  
            console.log(err);
        }
        else{
            console.log(rowCount+' rows selected')
        }
        });
    
        // var result = "";
        // request.on('row',(columns)=> {
        //     let x=0;
        //     columns.forEach(function(column) { 
        //       if (column.value === null) {  
        //         console.log('NULL');  
        //       } else {  
        //         result+= column.value + " ";
        //       }  
        //     });  
        //     console.log(result);  
        //     result ="";  
        // });  
     
        request.on('requestCompleted', function() {  
            resolve(1)
        });  
        hrmsConn.execSql(request);  
    } 
)}
transform()
module.exports=router