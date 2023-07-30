const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  name: { type:String, required : true},
  mobile: {type:String, required : true},
  landmark: { type: String, required: false },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  district: { type: String, required: true },
  address: { type: String, required: true },
});

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
  address: [addressSchema],
  
  gender: { 
    type: String,
    enum: ['male', 'female', 'other'], 
    required: false },
});

const User =new mongoose.model("User", UserSchema);

module.exports = User;
