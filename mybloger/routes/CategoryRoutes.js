const express = require('express');
const router = express.Router();
const {createCategory, getAllCategory, deleteCategory, updateCategory}= require("../controlers/CategoryControler")

router.post("/api/category/create", createCategory)
router.get("/api/category/all", getAllCategory)
router.put('/api/category/:id', updateCategory);
router.delete('/api/category/:id', deleteCategory);
module.exports=router