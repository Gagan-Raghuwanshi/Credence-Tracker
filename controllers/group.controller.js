import { Group } from "../models/group.model.js";
import cache from "../utils/cache.js";


// post group
export const createGroup = async (req, res) => {
  const { attributes, name } = req.body;
  const createdBy = req.user.id;
  try {
    const findGroup = await Group.findOne({ name })
    console.log("here is coming");
    if (findGroup) return res.status(409).json({ message: "Group Already Exist" });
    const newGroup = new Group({
      attributes,
      createdBy,
      name
    });
    await newGroup.save();
    res.status(201).json({
      message: 'Group created successfully',
      group: newGroup
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating group',
      error: error.message
    });
  }
};
// Get all groups
export const getAllGroups = async (req, res) => {


  const cacheKey = 'allGroups';

  const cachedGroups = cache.get(cacheKey);
  if (cachedGroups) {
    console.log('Cache hit');
    return res.status(200).json(cachedGroups);
  }



  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;
    let filter = {};
    if (search) {
      filter = { name: { $regex: search, $options: 'i' } };
    }
    const totalGroups = await Group.countDocuments(filter);

    const groups = await Group.find(filter)
      .skip(startIndex)
      .limit(limitNumber);

    res.status(200).json({
      totalGroups,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalGroups / limitNumber),
      groups,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching groups',
      error: error.message,
    });
  }
};
// Get groups created by 
export const getGroupById = async (req, res) => {
  const  {id}  = req.user;
  const { page = 1, limit = 10 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  try {
    const groups = await Group.find({ createdBy: id })
      .skip(startIndex)
      .limit(limitNumber);
    const totalGroups = await Group.countDocuments({ createdBy: id });
    if (groups.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    
    const cacheKey = 'getGroupById';
    const cachedGroups = cache.get(cacheKey);
    if (cachedGroups) {
      console.log('Cache hit');
      return res.status(200).json(cachedGroups);
    }
   

    res.status(200).json({
      totalGroups,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalGroups / limitNumber),
      groups,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching group',
      error: error.message,
    });
  }
};
// Update group feild 
export const updateGroup = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const updatedGroup = await Group.findOneAndUpdate(
      { _id:id },
      updates,
      { new: true, runValidators: true }
    );
    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json(updatedGroup);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating group',
      error: error.message,
    });
  }
};
// Delete group by ID
export const deleteGroup = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedGroup = await Group.findOneAndDelete({ _id:id });
    if (!deletedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({
      message: 'Group deleted successfully',
      group: deletedGroup,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting group',
      error: error.message,
    });
  }
};



