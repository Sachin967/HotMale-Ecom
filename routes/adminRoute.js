const express = require('express')
const admin = express()
const path=require("path")
const multer = require('multer')
const session = require('express-session')

const adminControl = require('../controller/adminController')
const productControl = require('../controller/productController')
const adminWare = require('../middlewares/adminWare')

admin.set('view engine','ejs')
admin.set('views','./views/admin')
admin.use(express.static('views/admin'))


admin.use(session({
    secret: 'key',
    resave: false,
    saveUninitialized: true
  }))

admin.use(express.static('public')) 


const productStorage = multer.diskStorage({
  destination: (req,file,callback)=>{
      callback(null,'./public/uploads/products')
  },
  //extention
  filename: (req,file,callback)=>{
      callback(null,Date.now()+file.originalname)
  }
})

//upload parameters for multer
const uploadPrdt = multer({
  storage: productStorage,
  limits:{
      fieldSize: 1024*1024*5
  }
})

admin.get('/adminlogin',adminWare.forLogin,adminControl.adminloginView)
admin.post('/adminlogin',adminWare.forLogin,adminControl.adminloginPost)
admin.get('/adminlogout',adminWare.adminLoginCheck,adminControl.adminLogout)
admin.get('/addmin',adminWare.adminLoginCheck,adminControl.addminGet);
admin.post('/addmin',adminWare.adminLoginCheck,adminControl.addminPost)


admin.get('/dashboard',adminWare.adminLoginCheck,adminControl.dashboardView)
admin.get('/users',adminWare.adminLoginCheck,adminControl.usersView)
admin.get('/blockuser',adminWare.adminLoginCheck, adminControl.blockUsers);
admin.get('/unblockuser',adminWare.adminLoginCheck,adminControl.unblockUsers);

admin.get('/viewproducts',adminWare.adminLoginCheck,adminControl.viewProducts)
admin.get('/addproduct',adminWare.adminLoginCheck,adminControl.productAddget)
admin.post('/addproduct',adminWare.adminLoginCheck,uploadPrdt.array('image1',4),adminControl.productAddpost)

admin.get('/deleteproduct',adminWare.adminLoginCheck,productControl.deleteProduct)
admin.get('/listproduct',adminWare.adminLoginCheck,productControl.listProduct)
admin.get('/unlistproduct',adminWare.adminLoginCheck,productControl.unlistProduct)
admin.get('/editproduct',adminWare.adminLoginCheck,productControl.geteditProduct)
admin.post('/editproduct',adminWare.adminLoginCheck,uploadPrdt.array('image1', 4),productControl.editProduct)

admin.get('/viewcategory',adminWare.adminLoginCheck,productControl.categoryLoad)
// admin.get('/addcategory',adminLoginCheck,productControl.getaddCategory)
admin.post('/addcategory',adminWare.adminLoginCheck,productControl.addCategory)
admin.get('/editcategory',adminWare.adminLoginCheck,productControl.geteditCategory)
admin.post('/editcategory',adminWare.adminLoginCheck,productControl.editCategoryName)
admin.get('/deletecategory',adminWare.adminLoginCheck,productControl.deleteCategory)

admin.get('/ordermanage',adminWare.adminLoginCheck,adminControl.orderGet)
admin.post('/update-status/:orderId',adminWare.adminLoginCheck,adminControl.updateOrderStatus)

module.exports = admin