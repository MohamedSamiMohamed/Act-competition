const Joi = require('joi');
const mongoose = require('mongoose');

const confSchema = new mongoose.Schema({
    name: {
        type: Boolean,
        required: true
    },
  trans: 
    [
        {
            field: { 
                sun_column: {
                    type: String,
                    required: true
                },
                mapped_val: {
                    type: String,
                    required: true
                },
                isConst: {
                    type: Boolean,
                    required: true
                } 
            }
        }
    ]
});

const Configuration = mongoose.model('Configuration', confSchema);

function validateConf(Configuration){
    const validSchema = Joi.object({
        name: Joi.string().trim().required(),
        trans: Joi.array().items([{
            sun_column: Joi.string().uppercase().trim().required(),
            mapped_val: Joi.string().trim().required(),
            isConst: Joi.Boolean().required()
        }])
    });
    return validSchema.validate(Configuration)
}

module.exports = validateConf(Configuration);