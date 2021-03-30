const Joi = require('joi');
const mongoose  = require('mongoose');


const logSchema = new mongoose.Schema({
userID:{
    required:true,
    type:mongoose.Schema.Types.ObjectId,
    ref:'users'
},
status:{
    required:true,
    type:String,
    enum:['posted','hard-posted','missed','pending'],
    default:'pending'
},
date:{
    required:true,
    type: Date,
    default: Date.now()
}
})
const logModel=mongoose.model('HRMS-logs',logSchema)

    
//exports.validate=validateConfig
exports.Log=logModel