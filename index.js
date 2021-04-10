
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
const {forceTransformPMS}=require('./transformation/pms')
let localDB=process.env.MONGODB_CONNECTION_STRING_LOCAL
let clusterDB=process.env.MONGODB_CONNECTION_STRING
mongoose.connect(clusterDB,
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
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

forceTransformPMS(1, 4, "6071f458740cd81fa4b453d2", "C:/Users/Administrator/Desktop", "RV0301 (003)", ".SUN", 2)