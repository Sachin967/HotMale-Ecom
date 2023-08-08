const Address = require('../model/address')
const User = require('../model/model')

const profileControl={

 
   ProfileGet :async (req, res) => {
    try {
      
      let userDetails = await User.findOne({ email: req.session.userEmail })
  
      if (userDetails == null) throw 'user not logined'
  
      // const addresses = await AddressModel.find({ userId: userDetails._id }).sort({ date: -1 })
      // res.status(200).json({ success: true, data: userDetails });
      res.render('userprofile', { user: userDetails });
    } catch (error) {
      res.redirect('/login')
    }
  },
  
  Editprofile : async (req, res) => {
    try {
      let userDetails = await User.findOne({ email: req.session.userEmail })
      if (userDetails == null) throw 'User not loggedin'
  
      let emailCount = await User.countDocuments({
        _id: { $ne: userDetails._id },
        email: req.body.email,
      });
  
      if (emailCount > 0) {
        throw 'Email already exists';
      }
  
      const updated = await User.updateOne({ _id: userDetails._id }, {
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile
      })
  
      res.status(200).json({
        success: true,
        message: 'Edited Successfully',
        data: updated
      })
  
    } catch (error) {
      res.status(200).json({ success: true, message: error })
    }
  },
  
 addAddress: async (req,res)=>{
    try {
        const {checkout} = req.query;
        const id=req.session.userId
        const {name,mobile,landmark,city,district,state,pincode,address}=req.body
        const data =new Address({
            name,
            mobile,
            landmark,
            district,
            state,
            pincode,
            address,
            city,
            userId:id
        });
        await data.save();
        res.json({ message: 'Address added successfully.' });
  
    } catch (error) {
        console.log(error.message)
    }
  },
  
  
   getAllAddresses : async (req, res) => {
    try {
      let id = req.session.userId
      const addresses = await Address.find({userId:id});
      res.render('viewaddress',{ addresses });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  
   getEditAddressPage : async (req, res) => {
    try {
      const addressId= req.params.id;
      const address = await Address.findById(addressId);
      if (!address) {
        return res.status(404).json({ success: false, message: 'Address not found.' });
      }
      res.render('editaddress', { address });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  
  editAddress : async (req, res) => {
    try {
      const addressId  = req.params.id;
      const { name, mobile, landmark, city, district, state, pincode,address } = req.body;
      const updatedAddress = await Address.findByIdAndUpdate(addressId, {
        name,
        mobile,
        landmark,
        city,
        district,
        state,
        pincode,
        address
      }, { new: true });
  
      if (!updatedAddress) {
        return res.status(404).json({ success: false, message: 'Address not found.' });
      }
      res.status(200).json({ success: true, message: 'Address updated successfully.' });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },


  deleteAddress: async (req, res) => {
    try {
              
      const {addressId}= req.query
     
      await Address.deleteOne({_id:addressId})
      res.status(200).json({success:true})
    } catch (error) {
        console.log(error.message);
        // Send an error response as JSON if there is an error
        res.status(500).json({ success: false, message: 'Failed to delete the address.' });
    }
  },
  
}


module.exports = profileControl