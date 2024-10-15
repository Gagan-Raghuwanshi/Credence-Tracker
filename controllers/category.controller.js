import { Category } from "../models/category.model.js";


export const createCategory = async (req, res) => {
     const { categoryName } = req.body;
     try {
       const findCategory = await Category.findOne({ categoryName })

       if (findCategory) return res.status(409).json({ message: "Category Already Exist" });
       const newCategory = new Category({
          categoryName
       });
       await newCategory.save();
       res.status(201).json({
         message: 'Category created successfully',
         Category: newCategory
       });
     } catch (error) {
       res.status(500).json({
         message: 'Error creating Category',
         error: error.message
       });
     }
   };


  //  export const getAllCategory = async (req, res) => {


  //    const cacheKey = 'allCategory';
   
  //    const cachedCategory = cache.get(cacheKey);
  //    if (cachedCategory) {
  //      console.log('Cache hit');
  //      return res.status(200).json(cachedCategory);
  //    }
   
  //    try {
          
  //         const category = await Category.find();
  //         return res.status(200).json(category);
      
  //    } catch (error) {
  //      res.status(500).json({
  //        message: 'Error fetching Category',
  //        error: error.message,
  //      });
  //    }
  //  };


  export const getAllCategory = async (req, res) => {
    try {
      const category = await Category.find();
  
      return res.status(200).json(category);
    } catch (error) {
      res.status(500).json({
        message: 'Error fetching Category',
        error: error.message,
      });
    }
  };
  




   export const updateCategory = async (req, res) => {
     const { id } = req.params;
     const updates = req.body;
     console.log("AAAAAAAAAAA",updates, id);
     
     try {
       const updatedcategory = await Category.findOneAndUpdate(
         { _id:id },
         updates,
         { new: true, runValidators: true }
       );
       if (!updatedcategory) {
         return res.status(404).json({ message: 'Category not found' });
       }
       res.status(200).json(updatedcategory);
     } catch (error) {
       res.status(500).json({
         message: 'Error updating category',
         error: error.message,
       });
     }
   };



   // Delete category by ID

   export const deleteCategory = async (req, res) => {
     const { id } = req.params;
     try {
       const deleteCategory = await Category.findOneAndDelete({ _id:id });
       if (!deleteCategory) {
         return res.status(404).json({ message: 'Category not found' });
       }
       res.status(200).json({
         message: 'Category deleted successfully',
         category: deleteCategory,
       });
     } catch (error) {
       res.status(500).json({
         message: 'Error deleting Category',
         error: error.message,
       });
     }
   };