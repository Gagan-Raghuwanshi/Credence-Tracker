import { Group } from "../models/group.model.js";
import { User } from "../models/usermodel.js";


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
    const { search, page = 1, limit = Number.MAX_SAFE_INTEGER } = req.query;
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
      { _id: id },
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
    const deletedGroup = await Group.findOneAndDelete({ _id: id });
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


export const importGroupData = async (req, res) => {
  try {
    const registrationData = req.body;

    if (!Array.isArray(registrationData) || registrationData.length === 0) {
      return res.status(400).json({ error: 'No registration data provided' });
    }

    const processedDevices = [];
    const failedEntries = [];

    const registrationPromises = registrationData.map(async (data) => {
      const {
        // email,
        name,
        attributes,

      } = data;
      // console.log("impoet group",data)

      try {
        if (!name) {
          throw new Error(`Group Name are required for Create Group`);
        }

        let group = await Group.findOne({ name });
        if (group) {
          throw new Error(`Group with this name already exists: ${group.name}`);
        }

        const gId = await User.findOne({ username: name }).select('_id')
        // const user = await User.findOne({ email });        

        // if(user){
        const newGroup = new Group({
          createdBy: gId,                //"6713653b613cf2d2c532ed0e",
          name,
          attributes

        });

        const response = await newGroup.save();
        await response.populate('createdBy', 'email');
        processedDevices.push({ group: response.toObject({ transform: (doc, ret) => { delete ret._id; } }) });
        // }
        // else {
        // throw new Error("Wrong Email")
        // }

      } catch (error) {
        failedEntries.push({ error: error.message, data });
      }
    });

    await Promise.allSettled(registrationPromises);

    res.status(201).json({
      success: processedDevices,
      failed: failedEntries
    });

  } catch (error) {
    console.error('Error during group registration:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

