const morgan=require('morgan')
const Joi = require('joi');
const mongoose = require('mongoose');
const pmsRouter= require('./routes/pmsRoutes/routes');
const hrmsRouter= require('./routes/hrmsRoutes/routes');
const users=require('./routes/users')
const auth=require('./routes/auth')
const express = require('express');
const cors=require('cors')
const app = express();
const {forceTransform}=require('./transformation/hrms')
let localDB='mongodb://localhost/Act'
let clusterDB='mongodb+srv://Mohamed:Abc12345!@cluster0.no0ea.mongodb.net/test'
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
app.use(express.json());
app.use('/api/hrms',hrmsRouter);
app.use('/api/users',users)
app.use('/api/auth',auth)

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
