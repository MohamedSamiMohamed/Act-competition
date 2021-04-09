const {authMiddleWare} =require('../../middleware/auth')
const {validate,connectionModel}= require('../../models/hrmsModels/connection');
const mongoose = require('mongoose');
const {validateConfiguration,sunConfig}=require('../../models/hrmsModels/configuration')
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {HrmsLog}= require('../../models/hrmsModels/logs');
const { func } = require('joi');
const {forceTransform}=require('../../transformation/hrms')
router.use(authMiddleWare)

router.post('/configStr',async(req,res)=>{
const result=validate(req.body)
if(result.error){
    return res.status(400).send(result.error.details[0].message)
     
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
try{
await config.save()
res.send(config)
}
catch(err){
    res.status(400).send('This user already uploaded connection string before')
}
}
})

router.post('/configuration',async(req, res) => {
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
        conf = new sunConfig({
            userID: req.user._id,
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
})

router.post('/forceTrans',async(req,res)=>{
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
                    try{
                    await forceTransform(month,req.user._id)
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
})


router.get('/isClient',async (req,res)=>{
        let connection=await connectionModel.findOne({userID: req.user._id})
        if(!connection){
        return res.status(200).send(false)
    }
    else{
        return res.status(200).send(true)
    }
}
)

router.get('/configured',async (req,res)=>{
        let configured=await sunConfig.findOne({userID: req.user._id})
        if(!configured){
        return res.status(200).send(false)
    }
    else{
        return res.status(200).send(true)
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

    })


router.post('/acceptTrans',async(req,res)=>{
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
                res.send('This transformation is accepted successfully.')
            }

    })

router.get('/monthsStatus',async (req,res)=>{
        let logs=await HrmsLog.find({userID:req.user._id}).select({"month":1,"status":1,"_id":0})
        if(logs.length==0){
            return res.status(404).send("There is no logs for this user")
        }
       else{
           return res.send(logs)
       }

    }
)


module.exports=router