// product.js

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  pname: {
    type: String,
    required: true
  },
  category: {
    type: String,
    ref: 'Category', // This refers to the Category model
    required: true,
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  images: [String],
  stock: {
    type: Number,
    required: true
  },
  isListed:{
    type:Boolean,
    default:true
  },
  offerPrice: {
    type: Number,
    default: 0 
  },
  offerPercentage: {
    type: Number,
    default: 0 
  },
  offerValidUntil: {
    type: Date,
    default: null 
  },
  offerValidFrom: {
    type: Date,
    default: null // No offer start date by default
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;


