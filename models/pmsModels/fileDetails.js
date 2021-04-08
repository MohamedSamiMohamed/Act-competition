const Joi = require('joi');
const mongoose  = require('mongoose');


const fileDetailsSchema = new mongoose.Schema({
userID:{
    required:true,
    unique:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
},
path:{
    required:true,
    type:String,
},
fileName:{
    required:true,
    type: String,
},
extention:{
    required:true,
    type:String
   
}
})

const fileDetails=mongoose.model('pms-file-details',logSchema)

function validateFileDetails(details){
    const schema=Joi.object({
        path:Joi.string().min(3).required(),
        fileName:Joi.string().min(1).required(),
        extention:Joi.string().min(2).required(),
    })
    return schema.validate(config)
}
exports.FileDetails=fileDetails
exports.validateFileDetails=validateFileDetails
