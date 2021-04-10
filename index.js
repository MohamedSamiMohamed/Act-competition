
const morgan=require('morgan')
const Joi = require('joi');
const mongoose = require('mongoose');
const pmsRouter= require('./routes/pmsRoutes/routes');
const hrmsRouter= require('./routes/hrmsRoutes/routes');
const users=require('./routes/users')
const auth=require('./routes/auth')
const express = require('express');
const error=require('./middleware/error')
const cors=require('cors')
const app = express();
const {forceTransform}=require('./transformation/hrms')
let localDB=process.env.MONGODB_CONNECTION_STRING_LOCAL
let clusterDB=process.env.MONGODB_CONNECTION_STRING
mongoose.connect(localDB,
{useNewUrlParser: true, 
useUnifiedTopology: true,
useFindAndModify: false,
useCreateIndex: true
})
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...'));
app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use('/api/hrms',hrmsRouter);
app.use('/api/users',users)
app.use('/api/auth',auth)
app.use('/api/pms',pmsRouter)
app.use(error)

process.on('uncaughtException',(ex)=>{
  console.log('WE GOT UNCAUGHT EXCEPTION: '+ex)
  process.exit(1)
})

process.on('unhandledRejection',(ex)=>{
  console.log('WE GOT UNHANDELED REJECTION: '+ex.message)
  process.exit(1)
})

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));