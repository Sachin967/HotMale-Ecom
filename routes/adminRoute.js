const express = require('express')
const admin = express()
const path=require("path")
const multer = require('multer')

const adminControl = require('../controller/adminController')
const productControl = require('../controller/productController')

admin.set('view engine','ejs')
admin.set('views','./views/admin')
admin.use(express.static('views/admin'))


admin.use(express.static('public')) 

const adminLoginCheck = ((req,res,next)=>{

  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  if(!req.session.loggedIn)
      res.redirect('adminlogin')
  else if(!req.session.admin)
      res.redirect('/')
  else
      next();
})


const forLogin =  ((req,res,next)=>{
  if(req.session.loggedIn&&req.session.admin)
      res.redirect('/users')
  else if(req.session.loggedIn &&  !req.session.admin)
      res.redirect('/')
  else
      next();
}) 



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

admin.get('/adminlogin',forLogin,adminControl.adminloginView)
admin.post('/adminlogin',forLogin,adminControl.adminloginPost)
admin.get('/adminlogout',adminLoginCheck,adminControl.adminLogout)
admin.get('/addmin',adminLoginCheck,adminControl.addminGet);
admin.post('/addmin',adminLoginCheck,adminControl.addminPost)


admin.get('/dashboard',adminLoginCheck,adminControl.dashboardView)
admin.get('/users',adminLoginCheck,adminControl.usersView)
admin.get('/blockuser',adminLoginCheck, adminControl.blockUsers);
admin.get('/unblockuser',adminLoginCheck,adminControl.unblockUsers);

admin.get('/viewproducts',adminLoginCheck,adminControl.viewProducts)
admin.get('/addproduct',adminLoginCheck,adminControl.productAddget)
admin.post('/addproduct',adminLoginCheck,uploadPrdt.array('image1',4),adminControl.productAddpost)

admin.get('/deleteproduct',adminLoginCheck,productControl.deleteProduct)
admin.get('/listproduct',adminLoginCheck,productControl.listProduct)
admin.get('/unlistproduct',adminLoginCheck,productControl.unlistProduct)
admin.get('/editproduct',adminLoginCheck,productControl.geteditProduct)
admin.post('/editproduct',adminLoginCheck,uploadPrdt.array('image1', 4),productControl.editProduct)

admin.get('/viewcategory',adminLoginCheck,productControl.categoryLoad)
// admin.get('/addcategory',adminLoginCheck,productControl.getaddCategory)
admin.post('/addcategory',adminLoginCheck,productControl.addCategory)
admin.get('/editcategory',adminLoginCheck,productControl.geteditCategory)
admin.post('/editcategory',adminLoginCheck,productControl.editCategoryName)
admin.get('/deletecategory',adminLoginCheck,productControl.deleteCategory)

admin.get('/ordermanage',adminLoginCheck,adminControl.orderGet)


module.exports = admin