const Joi = require('joi');
const mongoose  = require('mongoose');

const variablesSchema = new mongoose.Schema({
userID:{
    required:true,
    unique:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
},
skippedLines:{
    required:true,
    type:Number,
},
variables:[{
    fieldName: {
        required:true,
        type:String
    },
    startPosition:{
        required:true,
        type:Number
    },
    length:{
        required:true,
        type:Number
    }
}
]
})

const variables=mongoose.model('pms-variables',variablesSchema)

function validateVariables(variables){
    const validSchema = Joi.object({
        skippedLines:Joi.number().required(),
        variables: Joi.array().items(Joi.object({
            fieldName: Joi.string().required(),
            startPosition: Joi.number().required(),
            length: Joi.number().required()
        }))
    });
    return validSchema.validate(variables)
}
exports.Variables=variables
exports.validateVariables=validateVariables
