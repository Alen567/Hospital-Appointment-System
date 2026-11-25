
const createNotification = async (
  db,
  userId,
  appointmentId,
  notificationType,
  title,
  message
) => {
  const result = await db.query(
    `INSERT INTO notifications
      (user_id, appointment_id, notification_type, title, message)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      appointmentId,
      notificationType,
      title,
      message,
    ]
  );

  return result.rows[0];
};

module.exports = {
  createNotification,
};
