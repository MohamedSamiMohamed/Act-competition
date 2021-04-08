const _=require('lodash')
const mongoose = require('mongoose');
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');
const {FileDetails,validateFileDetails}=require('../../models/pmsModels/fileDetails')
const {Variables,validateVariables}=require('../../models/pmsModels/variables')
const {validateConfiguration,sunConfig}=require('../../models/pmsModels/configuration')

router.post('/fileDetails',async(req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
    const {error} =validateFileDetails(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
    }
    else{
        const fileDetails= new FileDetails({
            userID: userId,
            path: req.body.path,
            fileName: req.body.fileName,
            extension: req.body.extension
        })
        try{
           await fileDetails.save()
           res.send(fileDetails)
        }
        catch(err){
            return res.status(400).send('This user already uploaded file details before')
        }
    }
}
}
})

router.get('/fileDetails',async(req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
        let fileDetails=await FileDetails.findOne({userID:userId})
        if(!fileDetails){
            return res.send(false)
        }
        else{
            return res.send(true)
        }
    }
}
})

router.post('/variables',async(req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
    const {error} =validateVariables(req.body)
    if(error){
        res.status(400).send(error.details[0].message)
        return 
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
            userID: userId,
            variables:variablesArr
        })

        try{
           await variables.save()
           res.send(variables)
        }
        catch(err){
            return res.status(400).send('This user already uploaded file details before')
        }
    }
}
}
})


router.get('/variables',async(req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
        let variables=await Variables.findOne({userID:userId})
        if(!variables){
            return res.send(false)
        }
        else{
            return res.send(true)
        }
    }
}
})

router.get('/variablesDetails',async(req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else {
        let user=await User.findOne({_id: userId})
        if(!user){
        return res.status(400).send('No such user with the given ID')
    }
    else{
        let variables=await Variables.findOne({userID:userId})
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
        conf = new sunConfig({
            userID: userId,
            trans
        })
        try{
        await conf.save();
        return res.send('Configuration Settings Uploaded Successfully!');
    }
    catch(err){
        return res.status(400).send('this user already has a configuration before')
    }
    }
}
}
})


router.get('/configuration',async (req,res)=>{
    const userId = req.header('x-userID');
    if (!userId) return res.status(401).send('Access denied. No userID provided.');
    else{
        let configured=await sunConfig.findOne({userID: userId})
        if(!configured){
        return res.status(200).send(false)
    }
    else{
        return res.status(200).send(true)
    }
}
})



module.exports=router

