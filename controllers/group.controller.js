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

        // Get Group by login role

export const getGroups = async (req, res) => {
 

  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;

    const role = req.user.role; 
    const userId = req.user.id; 

    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (role === 'superadmin') {
      console.log('Superadmin access');
    } else if (role === 'user') {
      filter.createdBy = userId;
      console.log('User access');
    } else {
      return res.status(403).json({ message: 'Forbidden: Invalid role' });
    }

    const totalGroups = await Group.countDocuments(filter);

    const groups = await Group.find(filter)
      .skip(startIndex)
      .limit(limitNumber);

    return res.status(200).json({
      totalGroups,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalGroups / limitNumber),
      groups,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error fetching groups',
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



