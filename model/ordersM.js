// order.js

const mongoose = require('mongoose');
// const productSchema = require('./product'); // Import the Product model


const productSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped','Delivered','Cancelled','Returned'],
    default: 'Pending',
  },
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userAddress: {
    type: Object,
    required: true,
  },
  products: [productSchema], // Use the imported Product model schema here
  total: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus:{
    type:String,
    required:false
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
