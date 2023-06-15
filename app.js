const express = require('express');


const sequelize = require('./app/config/db');
const Router = require('./app/routes/userRoutes');

const errorController=require('./app/controllers/errorControllers')
const app = express();

app.use(express.json());

sequelize.sync({alter:true})
  .then(() => {
    console.log('db connection successfull');
  })
  .catch(() => {
    console.log('error to connecct db');
  });

app.use(Router)

app.use(errorController)

app.listen(4000, () => {
  console.log('app running on the port 4000');
});