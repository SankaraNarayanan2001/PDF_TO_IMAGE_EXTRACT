const {Sequelize, DataTypes}=require('sequelize');
const sequelize=require('../config/db');
const Image=require('./imageTable');


const User=sequelize.define('User',{
    User_id:{
        type:DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true,
        allowNull:false,
        unique:true
    },
    Email:{
        type:DataTypes.STRING,
        allowNull:false,
        unique:true
    },
    Password:{
        type:DataTypes.STRING,
        allowNull:false,
    }
    
},{
    freezeTableName:true,
    timestamps:false
});

User.hasMany(Image,{foreignKey:'UserId'});


module.exports=User;