const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({

  categorytitle:{
    type:String,
    required:true
  }
})

const Category = new mongoose.model('Category',CategorySchema)

module.exports = Category