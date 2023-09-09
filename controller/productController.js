const product = require("../model/product");
const Category = require("../model/categorymodel");
const Wishlist = require("../model/wishlist");

const productControl = {
  categoryLoad: async (req, res) => {
    try {
      let search = "";
      if (req.query.search) {
        search = req.query.search;
      }
      const categories = await Category.find({
        $or: [
          { categorytitle: { $regex: ".*" + search + ".*", $options: "i" } },
        ],
      });
      

      res.render("viewcategory", { categories });
    } catch (error) {
      console.log(error.message);
    }
  },

  addCategory: async (req, res) => {
    try {
      const { categorytitle, offerPercentage } = req.body;
      console.log(req.body.categorytitle);
      const existingCategory = await Category.findOne({ categorytitle });
        console.log(existingCategory);
        if (existingCategory) {
          const categories = await Category.find({})
            return res.render('viewcategory',{error:true,categories,msg:"Category already exists"})
        }
      // Create a new category with the given name
      const newCategory = new Category({
        categorytitle: categorytitle,
        offerPercentage: offerPercentage || 0, // Set default if no offerPercentage is provided
      });

      await newCategory.save();

      const productsInCategory = await product.find({
        category: newCategory._id,
      });

      for (const product of productsInCategory) {
        const individualDiscountedPrice =
          product.price * (1 - product.offerPercentage / 100);
        const categoryDiscountedPrice =
          product.price * (1 - newCategory.offerPercentage / 100);

        if (individualDiscountedPrice < categoryDiscountedPrice) {
          // Individual offer is more valuable, apply it
          product.offerPrice = individualDiscountedPrice;
          product.offerPercentage = product.offerPercentage;
        } else {
          // Category offer is more valuable, apply it
          product.offerPrice = categoryDiscountedPrice;
          product.offerPercentage = newCategory.offerPercentage;
        }

        await product.save();
      }

      res.redirect('/viewcategory')
    } catch (error) {
      console.log(error.message);    
      
    }
  },

  geteditCategory: async (req, res) => {
    try {
      const id = req.query.id;
      const category = await Category.findOne({ _id: id });
      res.render("editcategory", { category: category });
    } catch (error) {
      console.log("editc");
    }
  },

   listCategory : async (req,res) => {
    try {
      const categoryId = req.query.id
      // Find the category document based on the categoryId
      const category = await Category.findByIdAndUpdate(
        categoryId,
        { isListed: true },
        { new: true }
      );
  
      if (!category) {
        return null; // Category not found
      }
  
     res.redirect('/viewcategory')
    } catch (error) {
      throw error; // Handle the error in the calling function
    }
  },
  // Function to unlist a category
 unlistCategory : async (req,res) => {
  try {
    const categoryId = req.query.id
    // Find the category document based on the categoryId
    const category = await Category.findByIdAndUpdate(
      categoryId,
      { isListed: false },
      { new: true }
    );

    if (!category) {
      return null; // Category not found
    }

   res.redirect('/viewcategory')
  } catch (error) {
    throw error; // Handle the error in the calling function
  }
},


  // deleteCategory: async (req, res) => {
  //   try {
  //     const id = req.query.id;
  //     await Category.deleteOne({ _id: id });
  //     res.redirect("/viewcategory");
  //   } catch (error) {}
  // },

  editCategoryName: async (req, res) => {
    try {
      const { categorytitle } = req.query;
      
      const { updatedName, offerPercentage } = req.body;

      await Category.updateOne(
        { _id: categorytitle },
        { $set: { categorytitle: updatedName } }
      );
      const category = await Category.findOne({ categorytitle: updatedName });

      if (offerPercentage !== undefined) {
        await Category.updateOne(
          { _id: categorytitle },
          { $set: { offerPercentage: offerPercentage } },
          { upsert: true } // Add the field if it doesn't exist
        );
        
        const productsInCategory = await product.find({
          category: updatedName,
        });
        
        for (const product of productsInCategory) {
          const individualDiscountedPrice =
            Math.round(product.price * (100 - product.offerPercentage)) / 100;
          const categoryDiscountedPrice =
            Math.round(product.price * (100 - category.offerPercentage)) / 100;
          console.log(categoryDiscountedPrice);
          if (individualDiscountedPrice < categoryDiscountedPrice) {
            // Individual offer is more valuable, apply it
            product.offerPrice = individualDiscountedPrice;
            product.offerPercentage = product.offerPercentage;
          } else {
            // Category offer is more valuable, apply it
            product.offerPrice = categoryDiscountedPrice;
            product.offerPercentage = category.offerPercentage;
          }

          await product.save();
        }
      }

      res.redirect("/viewcategory");
    } catch (error) {
      console.log(error.message);
    }
  },

  listProduct: async (req, res) => {
    try {
      console.log(req.query.id);
      const id = req.query.id;
      await product.updateOne({ _id: id }, { $set: { isListed: true } });
      res.redirect("/viewproducts");
    } catch (error) {
      console.log(error);
    }
  },

  unlistProduct: async (req, res) => {
    try {
      const id = req.query.id;
      await product.updateOne({ _id: id }, { $set: { isListed: false } });
      res.redirect("/viewproducts");
    } catch (error) {}
  },

  deleteProduct: async (req, res) => {
    try {
      const id = req.query.id;
      console.log(id);
      await product.deleteOne({ _id: id });
      res.redirect("/viewproducts");
    } catch (error) {
      console.log(error);
    }
  },

  geteditProduct: async (req, res) => {
    try {
      const id = req.query.id;
      //  console.log(id);
      const products = await product.findOne({ _id: id });

      console.log(products);
      const categories = await Category.find();

      res.render("editproduct", { products, categories });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  editProduct: async (req, res) => {
    const id = req.query.id;

    try {
      var existingImages = req.body.existingImages || [];
      const removedImages = req.body.removedImages || [];
      var newImages = [];

      for (let i = 0; i < req.files.length; i++) {
        if (req.files[i] !== undefined) {
          newImages.push(req.files[i].filename);
        }
      }
      const remainingImages = existingImages.filter(
        (image) => !removedImages.includes(image)
      );

      const category = await Category.findOne({ _id: req.body.categorytitle });

      const price = parseFloat(req.body.price);
      const discountPercentage = parseFloat(req.body.discountPercentage);
      const offerPrice = price - price * (discountPercentage / 100);

      const updatedProduct = await product.findByIdAndUpdate(
        id,
        {
          pname: req.body.pname,
          category: category.categorytitle,
          price: price,
          description: req.body.description,
          images: remainingImages.concat(newImages),
          stock: req.body.stock,
          offerPercentage: discountPercentage,
          offerPrice: offerPrice || 0,
          offerValidFrom: req.body.offerValidFrom || null,
          offerValidUntil: req.body.offerValidUntil || null,
        },
        { new: true }
      );

      res.redirect("/viewproducts");
    } catch (error) {
      // Handle any errors that occurred during the update process
      console.error("Error updating product:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  getWishlist: async (req, res) => {
    try {
      res.render("wishlist");
    } catch (error) {
      console.log(error.message);
    }
  },

  addtoWishlist: async (req, res) => {
    try {
      const productId = req.query.productId;
      const userId = req.session.userId;
      console.log(productId);
      // Check if the product already exists in the user's wishlist
      const wishlist = await Wishlist.findOneAndUpdate(
        { user: userId },
        { $addToSet: { products: productId } },
        { upsert: true, new: true }
      );
      console.log(wishlist);

      res
        .status(200)
        .json({ success: true, message: "Product added to wishlist" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: error.message });
    }
  },

  removefromWishlist: async (req, res) => {
    try {
      const productId = req.query.productId;
      const userId = req.session.userId;

      const wishlist = await Wishlist.findOneAndUpdate(
        { user: userId },
        { $pull: { products: productId } },
        { new: true }
      );

      if (!wishlist) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found in wishlist" });
      }

      res
        .status(200)
        .json({ success: true, message: "Product removed from wishlist" });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};

module.exports = productControl;
