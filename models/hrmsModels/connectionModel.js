const { options } = require('joi');
const Joi = require('joi');
const mongoose  = require('mongoose');

const configurationSchema = new mongoose.Schema({
userID:{
    required:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
},
server: {
    required:true,
    type:String,
    minlength:3,
    maxlength:50
},
authentication:{
    type: {
        required:true,
        type: String       
    },
    options:{
        userName: {
            required:true,
            type:String,
            minlength:3,
            maxlength:50
        },
        password: {
            required:true,
            type:String,
            minlength:3,
            maxlength:50
        },
    }
},
options:{
    encrypt: {
        required:true,
        type:Boolean
    },
    database: {
        required:true,
        type:String,
        minlength:3,
        maxlength:50
    },
    rowCollectionOnRequestCompletion:{
        required:true,
        type:Boolean
    }
}

})
const connection=mongoose.model('HRMS-database-connection',configurationSchema)

function validateConfig(config){
const schema=Joi.object({
    server:Joi.string().min(3).required(),
    userName:Joi.string().min(3).required(),
    password:Joi.string().min(3).required(),
    database:Joi.string().min(3).required()
})
return schema.validate(config)
}

exports.validate=validateConfig
exports.connectionSchema=connection