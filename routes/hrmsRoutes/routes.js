const {validate,connectionModel}= require('../../models/hrmsModels/connection');
const mongoose = require('mongoose');
const {validateConfiguration,sunHrmsConfig}=require('../../models/hrmsModels/configuration')
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {HrmsLog}= require('../../models/hrmsModels/logs');
const { func } = require('joi');
const {forceTransform}=require('../../transformation/hrms')



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
        port:1433,
        encrypt: false,
        instancename: "SQLEXPRESS",
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

router.post('/forceTrans',async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body['month']
    }
    else{
        return res.status(400).send('request body must contain month')
    }
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{

        let hrmsLog=await HrmsLog.findOne({userID:userId,month:month})
            if(!hrmsLog){
                return res.status(400).send('this month has not transformed yet')
            }
            else{
                if(hrmsLog.status==='missed'){
                    try{
                    await forceTransform(month,userId)
                    res.send('Transformation is done and this month is currently posted, check to hard-post it.')
                    }
                    catch(err){
                        res.status(400).send(`something went wrong, ${err.message}`)
                    }
                    
                }
                else{
                    res.status(400).send('This month is not missed to be transformed by forcing')
                }
            

    }
}
}
})


// router.post('/connect',async (req,res)=>{
//     const userId = req.header('x-userID');
//     if (!userId) return res.status(401).send('Access denied. No userID provided.');
//     else{
//         let user=await User.findOne({_id: userId})
//         if(!user){
//         return res.status(400).send('No such user with the given ID')
//     }
//     else{
//         let connectionString=await connectionModel.findOne({userID:userId}).select({"_id":0,"userID":0,"__v":0})
//         var connection = new Connection(connectionString); 
//         connection.on('connect',(err)=> {  
//             if(err) return res.status(400).send(err.message)
//             else{
//             res.send('connection done successfully, the connection string is'+connectionString[0])
//             //execute your queries here 
//             }
//         });
//         connection.connect();
//     }   
// }
// })

router.get('/isClient',async (req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else{
        let connection=await connectionModel.findOne({userID: userId})
        //console.log(connection)
        if(!connection){
        return res.send(false)
    }
    else{
        res.send(true)
    }
}
})


router.post('/retrieve',async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body.month
    }
    else{
        return res.status(400).send('request body must have month property.')

    }
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
            let hrmsLog=await HrmsLog.findOne({userID:userId,month:month})
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
                res.send('This transformation is retrieved successfully.')
            }

    }
}
})


router.post('/acceptTrans',async(req,res)=>{
    let month;
    if(req.body['month']){
        month=req.body.month
    }
    else{
        return res.status(400).send('request body must have month property.')

    }
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
            let hrmsLog=await HrmsLog.findOne({userID:userId,month:month})
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
                res.send('This transformation is accepted successfully.')
            }

    }
}
})

module.exports=router