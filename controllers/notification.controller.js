
import { Notification } from "../models/notification.model.js";

//  add a device

export const addNotification = async (req, res) => {
  const {
    type,
    channel,
    deviceId
  } = req.body;

  const createdBy = req.user.id;

  try {
    if (Array.isArray(deviceId)) {
      const notifications = deviceId.map(async (id) => {
        const notification = new Notification({
          type,
          channel,
          deviceId: id,
          createdBy
        });

        return await notification.save();
      });

      await Promise.all(notifications);

      return res.status(201).json({
        message: 'Notifications added successfully for all devices',
      });

    } else {
      const notification = new Notification({
        type,
        channel,
        deviceId,
        createdBy
      });

      await notification.save();
      return res.status(201).json({
        message: 'Notification added successfully for the single device',
        notification,
      });
    }

  } catch (error) {
    console.error('Error adding notification:', error);
    return res.status(500).json({
      message: 'Error adding notification',
      error: error.message,
    });
  }
};


export const getNotification = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const startIndex = (pageNumber - 1) * limitNumber;

    let filter = {};

    if (role === 'superadmin') {
      //  console.log('Superadmin access: All Notifications');
    } else {
      filter.createdBy = userId;
      //  console.log(`Restricted access for role ${role}: Only notifications created by user ${userId}`);
    }

    const totalNotification = await Notification.countDocuments(filter);

    const notifications = await Notification.find(filter)
      .skip(startIndex)
      .limit(limitNumber)
      .populate('deviceId', 'name deviceId')


    res.status(200).json({
      totalNotification,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalNotification / limitNumber),
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};


export const updateNotification = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const notificationId = req.params.id;
  const updateData = req.body;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    //  if (role !== 'superadmin' && notification.createdBy.toString() !== userId) {
    //    return res.status(403).json({ message: 'Forbidden: You do not have permission to update this notification' });
    //  }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: updateData },
      { new: true }
    );

    res.status(200).json({
      message: 'Notification updated successfully',
      notification: updatedNotification,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating notification',
      error: error.message,
    });
  }
};



export const deleteNotification = async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    //  if (role !== 'superadmin' && notification.createdBy.toString() !== userId) {
    //    return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this notification' });
    //  }

    await Notification.findByIdAndDelete(notificationId);

    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};



