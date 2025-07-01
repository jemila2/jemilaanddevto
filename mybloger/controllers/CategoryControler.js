const CategoryModel = require("../models/categoryModel");

const createCategory = async (req, res) => {
    try {
        const new_Category = { name: req.body.name };
        const my_data = await new CategoryModel(new_Category).save();
        res.status(200).send({ success: true, message: "category created", data: my_data });
    } catch (err) {
        res.status(500).send({ success: false, message: "can't create", errorMsg: err });
    }
};

const getAllCategory = async (req, res) => {
  try {
    const all_category = await CategoryModel.find();
    res.status(200).send({ 
      success: true, 
      data: all_category 
    });
  } catch (error) {
    res.status(500).send({ 
      success: false, 
      message: "can't fetch categories", 
      errorMsg: error 
    });
  }
};

const deleteCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const deletedCategory = await CategoryModel.findByIdAndDelete(category_id);

        if (!deletedCategory) {
            return res.status(404).send({ success: false, message: "Category not found" });
        }

        res.status(200).send({ success: true, message: "Category deleted successfully", data: deletedCategory });
    } catch (error) {
        res.status(500).send({ success: false, message: "An error occurred while deleting the category", errorMsg: error });
    }
};

// New update category function
const updateCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        const { name } = req.body;

        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).send({ 
                success: false, 
                message: "Category name is required and must be a non-empty string" 
            });
        }

        const updatedCategory = await CategoryModel.findByIdAndUpdate(
            category_id,
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).send({ 
                success: false, 
                message: "Category not found" 
            });
        }

        res.status(200).send({ 
            success: true, 
            message: "Category updated successfully", 
            data: updatedCategory 
        });
    } catch (error) {
        res.status(500).send({ 
            success: false, 
            message: "An error occurred while updating the category",
            errorMsg: error.message 
        });
    }
};

module.exports = { 
    createCategory, 
    getAllCategory, 
    deleteCategory, 
    updateCategory 
};