const asyncMiddleWare=require('../../middleware/asyncMiddleware')
const {authMiddleWare} =require('../../middleware/auth')
const mongoose = require('mongoose');
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {FileDetails,validateFileDetails}=require('../../models/pmsModels/fileDetails')
const {Variables,validateVariables}=require('../../models/pmsModels/variables')
const {validateConfiguration,sunConfig}=require('../../models/pmsModels/configuration')
const {PmsLog}=require('../../models/pmsModels/logs')
const Joi = require('joi');
router.use(authMiddleWare)


router.post('/fileDetails',asyncMiddleWare(async(req,res)=>{

    const {error} =validateFileDetails(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    let fileDetails= await FileDetails.findOne({userID:req.user._id})
    if(fileDetails){
        return res.status(400).send('This user already uploaded file details before')

    }
    else{
        const fileDetails= new FileDetails({
            userID: req.user._id,
            path: req.body.path,
            fileName: req.body.fileName,
            extension: req.body.extension
        })
           await fileDetails.save()
           res.send(fileDetails)


    }
}))

router.get('/fileDetails',asyncMiddleWare(async(req,res)=>{
        let fileDetails=await FileDetails.findOne({userID:req.user._id})
        if(!fileDetails){
            return res.send(false)
        }
        else{
            return res.send(true)
        }
    }
))

router.post('/variables',async(req,res)=>{
    const {error} =validateVariables(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    let variables=await Variables.findOne({userID:req.user._id})
    if(variables){
     return res.status(400).send('This user already uploaded file details before')
  
    }
    else{
        let variablesArr=[]
        req.body.variables.forEach(element=>{
            variablesArr.push({
                fieldName: element.fieldName,
                startPosition: element.startPosition,
                length: element.length
            })
        })
        let variables= new Variables({
            skippedLines:req.body.skippedLines,
            userID: req.user._id,
            variables:variablesArr
        })
           await variables.save()
           res.send(variables)
    }
}
)


router.get('/variables',asyncMiddleWare(async(req,res)=>{
        let variables=await Variables.findOne({userID:req.user._id})
        if(!variables){
            return res.send(false)
        }
        else{
            return res.send(true)
        }
    }))

router.get('/variablesDetails',asyncMiddleWare(async(req,res)=>{
        let variables=await Variables.findOne({userID:req.user._id})
        if(!variables){
            return res.status(404).send('This user has not configured the values yet.')
        }
        else{
            let variablesFields=[]
            variables.variables.forEach((element)=>{
                variablesFields.push(element.fieldName);
            })
            return res.send(variablesFields)
        }
    }
))

router.post('/configuration',asyncMiddleWare(async(req, res) => {
    const {error} =validateConfiguration(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    let config=await sunConfig.findOne({userID:req.user._id})
    if(config){
        return res.status(400).send('this user already has a configuration before')

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
}
))


router.get('/configuration',asyncMiddleWare(async (req,res)=>{
        let configured=await sunConfig.findOne({userID: req.user._id})
        if(!configured){
        return res.status(200).send(false)
    }
    else{
        return res.status(200).send(true)
    }
}))

router.get('/daysStatus',asyncMiddleWare(async (req,res)=>{

    let logs=await PmsLog.find({userID:req.user._id,month:req.query.month,year:req.query.year}).select({"day":1,"status":1,"_id":0})
        if(logs.length==0){
            return res.status(404).send("There is no logs for this user in the given month and year")
        }
       else{
           return res.send(logs)
       }

    }
))

router.post('/acceptTrans',asyncMiddleWare(async(req,res)=>{
    const {error}=validateLogReqBody(req.body)
    if(error){
       return res.status(400).send(error.message)
    }
            let pmsLog=await PmsLog.findOne({userID:req.user._id,month:req.body.month,day:req.body.day,year:req.body.year})
            if(!pmsLog){
                return res.status(400).send('This day has not transformed yet')
            }
            else{
                if(pmsLog.status!='posted'){
                    return res.status(400).send('This day is must be posted first before hard-posting it.')   
                }
                pmsLog.status='hard-posted',
                pmsLog.timeStamp= Date.now()
                await pmsLog.save()
                res.send('This transformation is accepted successfully.')
            }

    }
))

router.post('/retrieve',asyncMiddleWare(async(req,res)=>{
    const {error}=validateLogReqBody(req.body)
    if(error){
        return res.status(400).send(error.message)
    }
        let pmsLog=await PmsLog.findOne({userID:req.user._id,month:req.body.month,day:req.body.day,year:req.body.year})
        if(!pmsLog){
                return res.status(400).send('this day has not transformed yet')
            }
            else{
                if(pmsLog.status==='hard-posted'){
                    return res.status(400).send('this day is hard-posted, sorry you can not retrive it')   
                }
                pmsLog.status='missed',
                pmsLog.timeStamp= Date.now()
                await pmsLog.save()
                return res.send('This transformation is retrieved successfully.')
            }

    }
))


router.post('/forceTrans',asyncMiddleWare(async(req,res)=>{
    const {error}= validateLogReqBody(req.body)
    if(error){
        return res.status(400).send(error.message)
    }

        let pmsLog=await PmsLog.findOne({userID:req.user._id,month:req.body.month,day:req.body.day,year:req.body.year})
            if(!pmsLog){
                return res.status(400).send('this day has not transformed yet')
            }
            else{
                if(pmsLog.status==='missed'){
                    // await forceTransform(month,userId) //TODO impelement this procedure in transformation/pms.js
                    res.send('Transformation is done and this month is currently posted, check to hard-post it.')
                    
                }
                else{
                    res.status(400).send('This day is not missed to be transformed by forcing')
                }
            

    }
}
))

function validateLogReqBody(req){
    const schema=Joi.object({
        day:Joi.number().integer().min(1).max(31).required(),
        month:Joi.number().integer().min(1).max(12).required(),
        year:Joi.number().integer().required(),
    })
    return schema.validate(req)
}
module.exports=router

