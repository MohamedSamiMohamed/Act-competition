const Joi = require('joi');
const mongoose = require('mongoose');
let type;
const confSchema = new mongoose.Schema({
    userID:{
        required:true,
        unique:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
  trans: 
    [
            { 
                sunColumn: {
                    type: String,
                    required: true
                },
                mappedVal: {
                    type: String,
                    required: true
                },
                isConst: {
                    type: Boolean,
                    required: true
                } 
            }
    ]
});

const Configuration = mongoose.model(type, confSchema);

function validateConf(Configuration){
    const validSchema = Joi.object({
        trans: Joi.array().min(145).items(Joi.object({
            sunColumn: Joi.string().uppercase().trim().required(),
            mappedVal: Joi.string().trim().required(),
            isConst: Joi.boolean().required()
        }))
    });
    return validSchema.validate(Configuration)
}
exports.validateConfiguration = validateConf;
exports.sunConfig=Configuration
exports.type=type
