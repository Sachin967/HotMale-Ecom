const mongoose = require("mongoose");

const WalletTransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['Credited', 'Debited'],
    required: true,
  },
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
  referralCode: {
    type: String,
    unique: true,
    required: true,
  },
  referrals: [{
    referredUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User collection
    },
    dateReferred: {
      type: Date,
      default: Date.now,
    },
  }],
  
  gender: { 
    type: String,
    enum: ['male', 'female', 'other'], 
    required: false },
    
   wallet: [WalletTransactionSchema],

   totalBalance: {
    type: Number,
    default: 0, // Initial total balance is 0
  },
});

UserSchema.pre('save', async function(next) {
  try {
    console.log('Calculating totalBalance...');

    const totalBalance = this.wallet.reduce((total, transaction) => {
      if (transaction.type === 'Credited') {
        return total + transaction.amount;
      } else if (transaction.type === 'Debited') {
        return total - transaction.amount;
      }
      return total;
    }, 0);

    

    this.totalBalance = totalBalance;

    next();
  } catch (error) {
    console.error('Error in pre-save hook:', error.message);
    next(error);
  }
});


const User =new mongoose.model("User", UserSchema);

module.exports = User;
