const express = require('express')
const userController = require('../controller/userController')
const user = express()
const session = require('express-session')

require('dotenv').config()

const Cart = require('../model/cartModel')
const productControl = require('../controller/productController')
const profileControl = require('../controller/profileController')
const ordercartControl = require('../controller/ordercartController')
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

user.get('/products',userController.viewProducts)
user.get('/productdetails',userController.productDetails)

user.get('/my-profile',userWare.restrict,profileControl.ProfileGet)
user.post('/my-profile',userWare.restrict,profileControl.Editprofile)
user.get('/getaddress',userWare.restrict,profileControl.getAllAddresses)
user.post('/postaddress',userWare.restrict,profileControl.addAddress)
user.get('/editaddress/:id',userWare.restrict,profileControl.getEditAddressPage)
user.post('/editaddress/:id',userWare.restrict,profileControl.editAddress)
user.get('/deleteaddress',userWare.restrict,profileControl.deleteAddress)
user.get('/wallet',userWare.restrict,userController.walletGet)

user.get('/loadcart',userWare.restrict,ordercartControl.loadCart)
user.post('/addtocart',userWare.userisBlocked,ordercartControl.addToCart)
user.put('/changeproductquantity',userWare.restrict,ordercartControl.updateQuantity)
user.delete("/deleteproductcart",userWare.restrict,ordercartControl.deleteProduct);

user.get('/checkout',userWare.restrict,userWare.cartNotEmptyMiddleware,ordercartControl.loadCheckout)
user.post('/checkout',userWare.restrict,ordercartControl.processCheckout)

user.get('/order-details',userWare.restrict,ordercartControl.orderdetails)
user.get('/viewdetails',userWare.restrict,ordercartControl.orderHistory)
user.post('/cancel-order/:orderId/:productId',userWare.restrict,ordercartControl.cancelOrder)
user.post('/return-order/:orderId/:productId',userWare.restrict,ordercartControl.returnProduct)


// user.post('/add-to-wishlist',userWare.restrict,productControl.addtoWishlist)
user.get('/confirmation',userWare.restrict,ordercartControl.orderSuccessView)
user.post('/verify-payment',userWare.restrict,ordercartControl.verifyPayment)
user.post('/paymentfailed',userWare.restrict,ordercartControl.paymentFailed)

user.post('/redeem-coupon',userWare.restrict,userController.applyCoupon)
user.get('/download-invoice/:orderId/:productIndex',userWare.restrict,userController.downloadInvoice)


module.exports = user
