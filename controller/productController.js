const product = require('../model/product')
const Category = require('../model/categorymodel')


const productControl ={

  categoryLoad : async(req,res)=>{
    try {
      let search = ''
      if(req.query.search){
        search = req.query.search
      }
      const categories= await Category.find({
        $or: [

            {categorytitle:{$regex:'.*'+search+'.*',$options:'i'}},
        ]
    });

      res.render('viewcategory',{categories})
    } catch (error) {
      console.log(error);
    }
  },



  addCategory : async (req, res) => {
    try {
      const { categorytitle } = req.body;
  
      // Create a new category with the given name
      const newCategory = new Category({
        categorytitle: categorytitle,
      });
  
      await newCategory.save();
  
      res.redirect('/viewcategory');
    } catch (error) {
      console.log(error.message);
    }
  },



  geteditCategory : async(req,res)=>{
    try {
      const id = req.query.id
      const category = await Category.findOne({_id:id})
      res.render('editcategory',{category:category})
    } catch (error) {
      console.log('editc');
    }
  },



  deleteCategory : async(req,res)=>{
    try {
      const id = req.query.id
      await Category.deleteOne({_id:id})
      res.redirect('/viewcategory')
    } catch (error) {
      
    }
  },

  editCategoryName: async (req,res)=>{
   try {
      const {categorytitle} =req.query
      console.log(req.query);
       const {updatedName}=req.body;
    
       await Category.updateOne(
           {_id:categorytitle},
           {$set:{categorytitle:updatedName}}
       );
       res.redirect('/viewcategory')
   } catch (error) {
       console.log(error.message)
      }
    },

  listProduct : async(req,res)=>{
    try {
      console.log(req.query.id);
    const id = req.query.id
    await product.updateOne({_id:id},{$set:{isListed:true}})
    res.redirect('/viewproducts')
    } catch (error) {
      console.log(error);
    }
  },


  unlistProduct : async(req,res)=>{
    try {
      const id = req.query.id
    await product.updateOne({_id:id},{$set:{isListed:false}})
    res.redirect('/viewproducts')
    } catch (error) {
      
    }
  },


  deleteProduct : async(req,res)=>{
   try {
    const id = req.query.id
    console.log(id);
    await product.deleteOne({_id:id})
    res.redirect('/viewproducts')
   } catch (error) {
    console.log(error);
   }
  },


  geteditProduct: async (req, res) => {
    try {
      const id = req.query.id;
    //  console.log(id);
    const products = await product.findOne({_id:id})
     const categories = await Category.find()
     console.log(typeof categories);
  
      res.render('editproduct.ejs',{products,categories});

    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  


  editProduct: async (req, res) => {
   const id = req.query.id

    try {
      var img1, img2, img3, img4

      if (req.files[0] != undefined) img1 = req.files[0].filename
      if (req.files[1] != undefined) img2 = req.files[1].filename
      if (req.files[2] != undefined) img3 = req.files[2].filename
      if (req.files[3] != undefined) img4 = req.files[3].filename

      
      const category = await Category.findOne({ _id: req.body.categorytitle });

  
    
      const updatedproducts = await product.findByIdAndUpdate(id,{
        pname: req.body.pname,
        category:category.categorytitle,
        price: req.body.price,
        description: req.body.description,
        img1: img1,
        img2: img2,
        img3: img3,
        img4: img4,
        stock: req.body.stock
      },{new:true})
     
      res.redirect('/viewproducts')
    // await product.updateOne({_id:id},{$set:{
    //   pname:req.body.pname,
    //   category:req.body.category,
    //   price:req.body.price,
    //   description:req.body.description,
    //   stock:req.query.stock,
    //   img1:req.body.img1,
    // }})


    } catch (error) {
      // Handle any errors that occurred during the update process
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }, 



}

module.exports = productControl








