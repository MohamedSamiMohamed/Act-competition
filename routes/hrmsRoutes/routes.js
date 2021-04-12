const _=require('lodash')
const asyncMiddleWare=require('../../middleware/asyncMiddleware')
const {authMiddleWare} =require('../../middleware/auth')
const {validate,connectionModel}= require('../../models/hrmsModels/connection');
const mongoose = require('mongoose');
const {validateConfiguration,sunConfig}=require('../../models/hrmsModels/configuration')
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {HrmsLog}= require('../../models/hrmsModels/logs');
const { func } = require('joi');
const {forceTransform}=require('../../transformation/hrms');
router.use(authMiddleWare)

router.post('/connection',asyncMiddleWare(async(req,res)=>{
const result=validate(req.body)
if(result.error){
    return res.status(400).send(result.error.details[0].message)
     
}
let config=await connectionModel.findOne({userID: req.user._id})
if(config){
    return res.status(400).send('This user already uploaded connection string before')
}
else{
const config=new connectionModel({
    userID: req.user._id,
    server: req.body.server,  
    authentication: {
        type: 'default',
        options: {
            userName: req.body.userName, 
            password: req.body.password  
        }
    },
    options: {
        port:1433,
        encrypt: false,
        instancename: "SQLEXPRESS",
        database: req.body.database,
        rowCollectionOnRequestCompletion: true
    }
})
const result=await config.save()
return res.send(config)
}
}))


router.get('/connection',asyncMiddleWare(async (req,res)=>{
    let connection=await connectionModel.findOne({userID: req.user._id})
    console.log(connection)
    if(connection){
    return res.send({
        server:connection.server,
        userName:connection.authentication.options.userName,
        password:connection.authentication.options.password,
        database:connection.options.database
    })
}
else{
    return res.status(400).send("This user hasn't uploaded a connection string yet")
}
}))

router.put('/connection',asyncMiddleWare(async (req,res)=>{
    const result=validate(req.body)
    if(result.error){
        return res.status(400).send(result.error.details[0].message)
        
    }
    let connection=await connectionModel.findOne({userID: req.user._id})
    if(connection){
        connection.server=req.body.server,
        connection.userName=req.body.userName,
        connection.database= req.body.database,
        connection.password=req.body.password
        return res.send("Connection string has been updated successfully"+ connection)
    }
else{
    return res.status(400).send("This user hasn't uploaded a connection string yet")
}
}))


router.delete('/connection',asyncMiddleWare(async(req,res)=>{
    const connection= await connectionModel.findOneAndDelete({userID:req.user._id})
    if(!connection){
        return res.status(404).send('This user does not have connection string, try to upload a connection string')
    }
    else{
        return res.send(`This connection string has been deleted successfully ${connection}`)
    }    
}))



router.post('/configuration',asyncMiddleWare(async(req, res) => {
    const {error} =validateConfiguration(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    let config=await sunConfig.findOne({userID: req.user._id})
if(config){
    return res.status(400).send('This user already uploaded connection string before')
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
        conf = new sunConfig({
            userID: req.user._id,
            trans
        })
        await conf.save();
        return res.send('Configuration Settings Uploaded Successfully!');
    }
}))

router.get('/configuration',asyncMiddleWare(async (req,res)=>{
    let configured=await sunConfig.findOne({userID: req.user._id})
    if(configured){
        return res.send(_.pick(configured,['trans']))
    }
    else{
        return res.status(400).send("This user hasn't uploaded a configuration yet")

    }
}))


router.put('/configuration',asyncMiddleWare(async (req,res)=>{
    const result=validateConfiguration(req.body)
    if(result.error){
        return res.status(400).send(result.error.details[0].message)
        
    }
    let configured=await sunConfig.findOne({userID: req.user._id})
    if(configured){
        configured.trans=req.body.trans
        return res.send("Configuration has been updated successfully")
    }
else{
    return res.status(400).send("This user hasn't uploaded a connection string yet")
}
}))

router.delete('/configuration',asyncMiddleWare(async (req,res)=>{
    let configuration=await sunConfig.findOneAndDelete({userID: req.user._id})
    if(!configuration){
    return res.status(404).send('This user does not have configuration, try to upload a configuration mapping')
}
else{
    return res.send(`This user's configuration has been deleted successfully`)
}
}))

router.get('/userStatus',asyncMiddleWare(async(req,res)=>{
    let userStatus={};
    let connectionString=await connectionModel.findOne({userID:req.user._id})
    if(!connectionString){
        userStatus.connectionString=false
    }
    else{
        userStatus.connectionString=true
    }
    let configuration=await sunConfig.findOne({userID: req.user._id})
    if(!configuration){
        userStatus.configuration=false
    }
    else{
        userStatus.configuration=true
    }
    return res.send(userStatus);

}))

router.post('/forceTrans',asyncMiddleWare(async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body['month']
    }
    else{
        return res.status(400).send('request body must contain month')
    }

        let hrmsLog=await HrmsLog.findOne({userID:req.user._id,month:month})
            if(!hrmsLog){
                return res.status(400).send('this month has not transformed yet')
            }
            else{
                if(hrmsLog.status==='missed'){
                    await forceTransform(month,req.user._id)
                    return res.send('Transformation is done and this month is currently posted, check to hard-post it.')
                    
                }
                else{
                    return res.status(400).send('This month is not missed to be transformed by forcing')
                }
            

    }
}))



router.post('/retrieve',asyncMiddleWare(async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body.month
    }
    else{
        return res.status(400).send('request body must have month property.')

    }
    
            let hrmsLog=await HrmsLog.findOne({userID:req.user._id,month:month})
            if(!hrmsLog){
                return res.status(400).send('this month has not transformed yet')
            }
            else{
                if(hrmsLog.status==='hard-posted'){
                    return res.status(400).send('this month is post-harded, sorry you can not retrive it')   
                }
                hrmsLog.status='missed',
                hrmsLog.timeStamp= Date.now()
                await hrmsLog.save()
                return res.send('This transformation is retrieved successfully.')
            }

    }))


router.post('/acceptTrans',asyncMiddleWare(async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body.month
    }
    else{
        return res.status(400).send('request body must have month property.')

    }

            let hrmsLog=await HrmsLog.findOne({userID:req.user._id,month:month})
            if(!hrmsLog){
                return res.status(400).send('this month has not transformed yet')
            }
            else{
                if(hrmsLog.status!='posted'){
                    return res.status(400).send('this month is must be posted first before hard-posting it.')   
                }
                hrmsLog.status='hard-posted',
                hrmsLog.timeStamp= Date.now()
                await hrmsLog.save()
                return res.send('This transformation is accepted successfully.')
            }

    }))

router.get('/monthsStatus',asyncMiddleWare(async (req,res)=>{
        let logs=await HrmsLog.find({userID:req.user._id}).select({"month":1,"status":1,"_id":0})
        if(logs.length==0){
            return res.status(404).send("There is no logs for this user")
        }
       else{
           return res.send(logs)
       }

    }))


module.exports=router