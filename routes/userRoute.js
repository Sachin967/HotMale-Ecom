const express = require('express')
const userController = require('../controller/userController')
const user = express()
const session = require('express-session')

require('dotenv').config()

const Cart = require('../model/cartModel')
const productControl = require('../controller/productController')
const profileControl = require('../controller/profileController')
const userWare = require('../middlewares/userWare')

user.use(session({
  secret: 'key',
  resave: false,
  saveUninitialized: false,
}))


user.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});


user.set('view engine','ejs')
user.set('views','./views/user')
user.use(express.static('views/user'))
user.use(express.static('public')) 

user.get('/',userController.loadHome)

user.get('/login',userWare.forLogin,userController.loadLogin)
user.post('/login',userWare.forLogin,userController.loginPost)
user.post('/otp-login',userWare.forLogin,userController.otpLoginPost)
user.post('/otp-verify',userWare.forLogin,userController.otpVerifyPost)
user.get('/logout',userController.logout)

user.get('/signup',userWare.forLogin,userController.loadSignup)
user.post('/signup',userWare.forLogin,userController.signupPost)
user.get('/forgetpassword',userWare.forLogin,(req,res)=>res.render('forgetpassword'))
user.post('/forgetpassword',userWare.forLogin,userController.forgotpass)
user.post('/forgetpasswordverify',userController.forgotpassVerify)
user.post('/setnewpassword',userController.setNewPassword)


user.get('/products',userWare.reEstablish,userController.viewProducts)
user.get('/productdetails',userWare.reEstablish,userController.productDetails)

user.get('/my-profile',userWare.restrict,profileControl.ProfileGet)
user.post('/my-profile',userWare.restrict,profileControl.Editprofile)
user.get('/getaddress',userWare.restrict,profileControl.getAllAddresses)
user.post('/postaddress',userWare.restrict,profileControl.addAddress)
user.get('/editaddress/:id',userWare.restrict,profileControl.getEditAddressPage)
user.post('/editaddress/:id',userWare.restrict,profileControl.editAddress)
user.get('/deleteaddress',userWare.restrict,profileControl.deleteAddress)


user.get('/loadcart',userWare.restrict,userController.loadCart)
user.post('/addtocart',userWare.restrict,userController.addToCart)
user.put('/changeproductquantity',userWare.restrict,userController.updateQuantity)
user.delete("/deleteproductcart",userWare.restrict,userController.deleteProduct);

user.get('/checkout',userWare.restrict,userWare.cartNotEmptyMiddleware,userController.loadCheckout)
user.post('/checkout',userWare.restrict,userController.processCheckout)

user.get('/order-details',userWare.restrict,userController.orderdetails)
user.post('/cancel-order/:orderId',userWare.restrict,userController.cancelOrder)
user.get('/viewdetails',userWare.restrict,userController.orderHistory)
user.post('/add-to-wishlist',userWare.restrict,productControl.addtoWishlist)

module.exports = user
