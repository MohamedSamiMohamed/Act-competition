const asyncMiddleWare=require('../middleware/asyncMiddleware')
const config=require('dotenv').config()
const jwt =require('jsonwebtoken')
const _=require('lodash')
const bcrypt=require('bcrypt')
const {User,validate}= require('../models/user');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router()


router.post('/',asyncMiddleWare(async (req,res)=>{
const {error} =validate(req.body)
if(error){
    res.status(400).send(error.details[0].message)
    return 
}
else{
   let user=await User.findOne({userName: req.body.userName})
   if(user){
       return res.status(400).send('This user already registered')
   }
   else{
       user= new User({
           companyName:req.body.companyName,
           userName:req.body.userName,
           password:req.body.password
       })
       const salt=await bcrypt.genSalt(10)
       user.password=await bcrypt.hash(user.password,salt)
       await user.save()
       const token =jwt.sign({_id:user._id,userName:user.userName},process.env.JWT_PRIVATE_KEY)
       res.send({
        token:token,
        _id:user._id,
        userName:user.userName,
        companyName:user.companyName
    })
   }
}
}))

module.exports=router