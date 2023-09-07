const mongoose = require('mongoose');

const couponsSchema = new mongoose.Schema({
    coupon: {
        type: String,
        required: true
    },
    start: {
        type: Date,
        default: Date.now, 
        required: true 
    },
    validity: {
        type: Date,
        required: true 
    },
    percentage: {
        type: Number, 
        required: true 
    },
    description: {
        type: String,
        required: false 
    },
    usedBy: {
        type: [String], 
        required: false 
    },
    active: {
        type: Boolean,
        default: true, 
        required: true 
    },
    minprice: {
      type: Number,
      required: true 
   },
   maxprice: {
      type: Number,
      required: true 
  },
});

const CouponsModel = mongoose.model('coupons', couponsSchema);

module.exports = CouponsModel;
