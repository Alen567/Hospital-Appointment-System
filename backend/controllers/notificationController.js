
const pool = require("../config/db");

// Get the latest 50 notifications for the logged-in user.
const getNotifications = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         appointment_id,
         notification_type,
         title,
         message,
         is_read,
         read_at,
         created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      notifications: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


// Get the unread notification count.
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = $1
         AND is_read = FALSE`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      unread_count: Number(result.rows[0].unread_count),
    });
  } catch (error) {
    next(error);
  }
};


// Mark one notification as read.
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);

    if (!Number.isInteger(notificationId) || notificationId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE,
           read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
       WHERE id = $1
         AND user_id = $2
       RETURNING *`,
      [notificationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};


// Mark all notifications as read for the logged-in user.
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE,
           read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
         AND is_read = FALSE
       RETURNING id`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
