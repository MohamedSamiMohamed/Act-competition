const Joi = require('joi');
const mongoose = require('mongoose');
const userSchema=new mongoose.Schema({
companyName:{
    type:String,
    required:true,
    minlength:3,
    maxlength:50
},
userName:{
    type:String,
    required:true,
    unique:true,
    minlength:5,
    maxlength:50
},
password:{
    type: String,
    required:true,
    minlength:5,
    maxlength:1024

},
})
const user=mongoose.model('users',userSchema)

function validateUser(user){
    const schema = Joi.object({
        companyName: Joi.string().min(3).max(50).required(),
        userName: Joi.string().required().min(5).max(50),
        password: Joi.string().required().min(5).max(255)
      });
      return schema.validate(user)
}
exports.User=user
exports.validate=validateUser