
const asyncMiddleWare=require('../middleware/asyncMiddleware')
const config=require('dotenv').config()
const jwt =require('jsonwebtoken')
const _=require('lodash')
const Joi=require('joi')
const bcrypt=require('bcrypt')
const {User}= require('../models/user');
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
   if(!user){
       return res.status(400).send('Invalid email or password')
   }
   else{
     const validPassword=  await bcrypt.compare(req.body.password,user.password)
     if(!validPassword){
        return res.status(400).send('Invalid email or password')
     }
     else{
         const token =jwt.sign({_id:user._id,userName:user.userName},process.env.JWT_PRIVATE_KEY)
         res.send({
             token:token,
             _id:user._id,
             userName:user.userName,
             companyName:user.companyName
         })
     }
   }
}
}))
function validate(req){
    const schema = Joi.object({
        userName: Joi.string().required().min(3).max(50),
        password: Joi.string().required().min(5).max(255)
      });
      return schema.validate(req)
}

module.exports=router