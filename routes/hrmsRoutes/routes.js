const {validate,connectionSchema}= require('../../models/hrmsModels/connectionModel');
const mongoose = require('mongoose');
const express = require('express')
const router = express.Router()
const {User}= require('../../models/user');


router.post('/connection',async(req,res)=>{
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
const config=new connectionSchema({
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
module.exports=router