const { Sequelize, DataTypes, Model } = require('sequelize');

// Create an instance of Sequelize and establish a connection to your database
const sequelize = new Sequelize('kar', 'root', 'root123', {
  host:'localhost',
  dialect: 'mysql', // or any other supported database dialect
});

module.exports=sequelize;