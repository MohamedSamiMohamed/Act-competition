const {validate,connectionModel}= require('../../models/hrmsModels/connectionModel');
const sunConnection=require('../../models/sunModel')
const mongoose = require('mongoose');
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
var Connection = require('tedious').Connection;  
var Request = require('tedious').Request;  
var TYPES = require('tedious').TYPES;  


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
await config.save()
res.send(config)
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



function sunDatabaseConnect(config) {

    var connection = new Connection(config); 
    connection.on('connect',(err)=> {  
        if(err) {
            console.log(err.message)
        }
        else{
            console.log('connection to SUN database done successfully')
            //execute your queries here 
        }
    });
    connection.connect();    
}

module.exports=router