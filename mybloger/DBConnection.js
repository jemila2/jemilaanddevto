const mongoose = require("mongoose")
const CategoryModel = require('./models/categoryModel'); 
const PostModel = require('./models/PostModel'); 
const connect_db =async () =>{
  
    try {
       await mongoose.connect('mongodb://localhost:27017/NEW_BLOG') 
       console.log('databage connection successful');
       
       
    } catch (err) {
      
        console.log('error in dataconnection');
        
    }
}

module.exports = connect_db



