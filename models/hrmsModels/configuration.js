const Joi = require('joi');
const mongoose = require('mongoose');


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
                    type: mongoose.Schema.Types.Mixed,
                    required: true
                },
                isConst: {
                    type: Boolean,
                    required: true
                } 
            }
    ]
});

const Configuration = mongoose.model('hrms-configuration', confSchema);

function validateConf(Configuration){
    const validSchema = Joi.object({
        trans: Joi.array().min(144).items(Joi.object({
            sunColumn: Joi.string().uppercase().trim().required(),
            mappedVal: Joi.required(),
            isConst: Joi.boolean().required()
        }))
    });
    return validSchema.validate(Configuration)
}


exports.validateConfiguration = validateConf;
exports.sunConfig=Configuration
