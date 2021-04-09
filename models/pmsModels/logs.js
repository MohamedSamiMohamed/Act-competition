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
timeStamp:{
    required:true,
    type: Date,
    default: Date.now()
},
day:{
    required:true,
    type:Number //[Saturday:0,Sunday:1,Monday:2...Friday:6]
},
month:{
    required:true,
    type: Number
},
year:{
    required : true,
    type:Number
}

})
const logModel=mongoose.model('pms-logs',logSchema)
exports.PmsLog=logModel