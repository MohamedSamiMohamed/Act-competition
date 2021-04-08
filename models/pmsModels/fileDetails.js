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
extension:{
    required:true,
    type:String
   
}
})

const fileDetails=mongoose.model('pms-file-details',fileDetailsSchema)

function validateFileDetails(details){
    const schema=Joi.object({
        path:Joi.string().min(3).required(),
        fileName:Joi.string().min(1).required(),
        extension:Joi.string().min(2).required(),
    })
    return schema.validate(details)
}
exports.FileDetails=fileDetails
exports.validateFileDetails=validateFileDetails
