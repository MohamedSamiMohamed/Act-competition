const _=require('lodash')
const asyncMiddleWare=require('../../middleware/asyncMiddleware')
const {authMiddleWare} =require('../../middleware/auth')
const {forceTransformPMS}=require('../../transformation/pms');
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
            scheduledTime: req.body.scheduledTime,
            path: req.body.path,
            fileName: req.body.fileName,
            extension: req.body.extension
        })
           await fileDetails.save()
           return res.send(fileDetails)


    }
}))

router.get('/fileDetails',asyncMiddleWare(async(req,res)=>{
        let fileDetails=await FileDetails.findOne({userID:req.user._id})
        if(!fileDetails){
            return res.status(400).send("This user hasn't uploaded file details yet.")
        }
        else{
            return res.send(_.pick(fileDetails,['scheduledTime',"path","fileName","extension"]))
        }
    }
))

router.put('/fileDetails',asyncMiddleWare(async(req,res)=>{
    console.log(req.body)
    const {error} =validateFileDetails(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    let fileDetails=await FileDetails.findOne({userID:req.user._id})
    console.log(fileDetails)
    if(!fileDetails){
        return res.status(400).send("This user hasn't uploaded file details yet.")
    }
    else{
        fileDetails.scheduledTime=req.body.scheduledTime,
        fileDetails.path=req.body.path,
        fileDetails.fileName=req.body.fileName,
        fileDetails.extension=req.body.extension
        await fileDetails.save()
        return res.send("user's file details has been updated successfully")
    }
}
))

router.delete('/fileDetails',asyncMiddleWare(async(req,res)=>{
    let fileDetails=await FileDetails.findOneAndDelete({userID:req.user._id})
    if(!fileDetails){
        return res.status(404).send("This user hasn't uploaded file details yet")
    }
    else{
        return res.send("User's file details has been deleted successfully")
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
           return res.send(variables)
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

router.delete('/variables',asyncMiddleWare(async(req,res)=>{
    let variables=await Variables.findOneAndDelete({userID:req.user._id})
    if(!variables){
        return res.status(404).send("This user hasn't uploaded variables yet")
    }
    else{
        let config=await sunConfig.findOneAndDelete({userID:req.user._id})
        if(!config){
            return res.send("User's variables has been deleted successfully")
        }
        else{
            return res.send("User's variables and configuration has been deleted successfully")
        }
    }
}
))
    

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

router.delete('/configuration',asyncMiddleWare(async(req,res)=>{
    let config=await sunConfig.findOneAndDelete({userID:req.user._id})
    if(!config){
        return res.status(404).send("This user hasn't uploaded configuration yet")
    }
    else{
        return res.send("User's configuration has been deleted successfully")
    }
}
))

router.get('/userStatus',asyncMiddleWare(async(req,res)=>{
    let userStatus={};
    let fileDetails=await FileDetails.findOne({userID:req.user._id})
    if(!fileDetails){
        userStatus.fileDetails=false
    }
    else{
        userStatus.fileDetails=true
    }
    let configuration=await sunConfig.findOne({userID: req.user._id})
    if(!configuration){
        userStatus.configuration=false
    }
    else{
        userStatus.configuration=true
    }
    let variables=await Variables.findOne({userID:req.user._id})
    if(!variables){
        userStatus.variables=false
    }
    else{
        userStatus.variables=true
    }
    return res.send(userStatus);

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
                return res.send('This transformation is accepted successfully.')
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
                if(pmsLog.status==='retrieved'){
                    return res.status(400).send('this day is already retrieved, sorry you can not retrive it')   
                }
                pmsLog.status='missed',
                pmsLog.timeStamp= Date.now()
                await pmsLog.save()
                return res.send('This transformation is retrieved successfully.')
            }

    }
))


router.post('/forceTrans',asyncMiddleWare(async(req,res)=>{
    const {error}= validateForceReqBody(req.body)
    if(error){
        return res.status(400).send(error.message)
    }
        let variables=await Variables.findOne({userID:req.user._id})
        let skippedLines=variables.skippedLines
        let pmsLog=await PmsLog.findOne({userID:req.user._id,month:req.body.month,day:req.body.day,year:req.body.year})
            if(!pmsLog){
                return res.status(400).send('this day has not transformed yet')
            }
            else{
                if(pmsLog.status==='missed'){
                    await forceTransformPMS(req.body.day,req.body.month,req.body.year,req.user._id,req.body.path,req.body.fileName,req.body.extension,skippedLines)
                    return res.send('Transformation is done and this month is currently posted, check to hard-post it.')
                    
                }
                else{
                   return res.status(400).send('This day is not missed to be transformed by forcing')
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

function validateForceReqBody(req){
    const schema=Joi.object({
        day:Joi.number().integer().min(1).max(31).required(),
        month:Joi.number().integer().min(1).max(12).required(),
        year:Joi.number().integer().required(),
        path:Joi.string().min(3).required(),
        fileName:Joi.string().min(1).required(),
        extension:Joi.string().min(2).required()
    })
    return schema.validate(req)
}
module.exports=router

