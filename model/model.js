const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastname:{
    type:String,
    required:false
  },gender:{
    type:String,
    required:false
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  mobile:{
    type:String,
    required:false
  },
  password: {
    type: String,
    required: false,
  },
  isBlocked:{
    type:Boolean,
    default:false
  }, 
  
  gender: { 
    type: String,
    enum: ['male', 'female', 'other'], 
    required: false },
    
 
});

const User =new mongoose.model("User", UserSchema);

module.exports = User;
