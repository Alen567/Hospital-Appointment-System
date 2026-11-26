
const pool = require("../config/db");
const { createNotification } = require("../utils/notificationService");

const validDate = (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

const validTime = (value) =>
    typeof value === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

const canManageDoctor = async (client, req, doctorId) => {
    const result = await client.query(
        `SELECT d.id
         FROM doctors d
         JOIN users u ON u.id = d.user_id
         WHERE d.id = $1
           AND u.is_active = TRUE
           AND d.available = TRUE
           AND ($2 = 'admin' OR d.user_id = $3)`,
        [doctorId, req.user.role, req.user.id]
    );

    return result.rows.length > 0;
};


// Create an availability slot.
// Doctors can create slots for themselves.
// Admins can create slots for any active doctor.
const createSlot = async (req, res, next) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const { doctor_id, slot_date, start_time, end_time } = req.body;

        if (
            !slot_date ||
            !start_time ||
            !end_time ||
            !validDate(slot_date) ||
            !validTime(start_time) ||
            !validTime(end_time)
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid date, start time and end time"
            });
        }

        if (start_time >= end_time) {
            return res.status(400).json({
                success: false,
                message: "End time must be later than start time"
            });
        }

        if (req.user.role === "admin" &&
            (!Number.isInteger(Number(doctor_id)) || Number(doctor_id) < 1)) {
            return res.status(400).json({
                success: false,
                message: "Admin must provide a valid doctor_id"
            });
        }

        const targetDoctorId = req.user.role === "doctor"
            ? await (async () => {
                const result = await pool.query(
                    "SELECT id FROM doctors WHERE user_id = $1",
                    [req.user.id]
                );
                return result.rows[0]?.id;
            })()
            : Number(doctor_id);

        if (!targetDoctorId) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        // Lock the doctor row so concurrent slot creation requests
        // cannot create overlapping slots for this doctor.
        const doctorResult = await client.query(
            `SELECT d.id
             FROM doctors d
             JOIN users u ON u.id = d.user_id
             WHERE d.id = $1
               AND d.available = TRUE
               AND u.is_active = TRUE
             FOR UPDATE OF d`,
            [targetDoctorId]
        );

        if (doctorResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Active doctor not found"
            });
        }

        if (req.user.role === "doctor") {
            const owner = await client.query(
                "SELECT id FROM doctors WHERE id = $1 AND user_id = $2",
                [targetDoctorId, req.user.id]
            );

            if (owner.rows.length === 0) {
                await client.query("ROLLBACK");
                transactionStarted = false;

                return res.status(403).json({
                    success: false,
                    message: "You can only manage your own availability"
                });
            }
        }

        const pastDate = await client.query(
            "SELECT $1::date < CURRENT_DATE AS is_past",
            [slot_date]
        );

        if (pastDate.rows[0].is_past) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Cannot create availability for a past date"
            });
        }

        const overlap = await client.query(
            `SELECT id
             FROM doctor_slots
             WHERE doctor_id = $1
               AND slot_date = $2
               AND start_time < $4::time
               AND end_time > $3::time`,
            [targetDoctorId, slot_date, start_time, end_time]
        );

        if (overlap.rows.length > 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(409).json({
                success: false,
                message: "This slot overlaps an existing slot"
            });
        }

        const result = await client.query(
            `INSERT INTO doctor_slots
                (doctor_id, slot_date, start_time, end_time)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [targetDoctorId, slot_date, start_time, end_time]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return res.status(201).json({
            success: true,
            message: "Availability slot created successfully",
            slot: result.rows[0]
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A slot already exists at this start time"
            });
        }

        next(error);
    } finally {
        client.release();
    }
};


// Public: list available future slots for a doctor.
const getAvailableSlots = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        if ((from && !validDate(from)) || (to && !validDate(to))) {
            return res.status(400).json({
                success: false,
                message: "Date filters must use YYYY-MM-DD"
            });
        }

        const values = [req.params.doctorId];
        let dateCondition = "s.slot_date >= CURRENT_DATE";

        if (from) {
            values.push(from);
            dateCondition = `s.slot_date >= $${values.length}`;
        }

        if (to) {
            values.push(to);
            dateCondition += ` AND s.slot_date <= $${values.length}`;
        }

        const result = await pool.query(
            `SELECT
                s.id,
                s.doctor_id,
                s.slot_date::text AS slot_date,
                s.start_time,
                s.end_time,
                s.is_booked
             FROM doctor_slots s
             JOIN doctors d ON d.id = s.doctor_id
             JOIN users u ON u.id = d.user_id
             WHERE s.doctor_id = $1
               AND ${dateCondition}
               AND s.is_booked = FALSE
               AND d.available = TRUE
               AND u.is_active = TRUE
             ORDER BY s.slot_date, s.start_time`,
            values
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            slots: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// Doctor/admin: view all slots, including booked slots, for a calendar.
const getDoctorCalendar = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const doctorId = Number(req.params.doctorId);

        if (!Number.isInteger(doctorId) || doctorId < 1) {
            return res.status(400).json({
                success: false,
                message: "Invalid doctor ID"
            });
        }

        if ((from && !validDate(from)) || (to && !validDate(to))) {
            return res.status(400).json({
                success: false,
                message: "Date filters must use YYYY-MM-DD"
            });
        }

        if (req.user.role === "doctor") {
            const owner = await pool.query(
                "SELECT id FROM doctors WHERE id = $1 AND user_id = $2",
                [doctorId, req.user.id]
            );

            if (owner.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You can only view your own calendar"
                });
            }
        }

        const values = [doctorId];
        let dateCondition = "TRUE";

        if (from) {
            values.push(from);
            dateCondition += ` AND s.slot_date >= $${values.length}`;
        }

        if (to) {
            values.push(to);
            dateCondition += ` AND s.slot_date <= $${values.length}`;
        }

        const result = await pool.query(
            `SELECT
                s.id,
                s.doctor_id,
                s.slot_date::text AS slot_date,
                s.start_time,
                s.end_time,
                s.is_booked,
                CASE WHEN a.id IS NULL THEN NULL
                     ELSE json_build_object(
                        'id', a.id,
                        'status', a.appointment_status
                     )
                END AS appointment
             FROM doctor_slots s
             LEFT JOIN appointments a
                ON a.slot_id = s.id
                AND a.appointment_status IN ('pending', 'confirmed')
             WHERE s.doctor_id = $1
               AND ${dateCondition}
             ORDER BY s.slot_date, s.start_time`,
            values
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            slots: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// Doctor: view their own availability calendar.
const getMyDoctorCalendar = async (req, res, next) => {
    try {
        // Resolve the doctor's profile using the logged-in user ID.
        const doctorResult = await pool.query(
            `SELECT id
             FROM doctors
             WHERE user_id = $1`,
            [req.user.id]
        );

        if (doctorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor profile not found"
            });
        }

        const doctorId = doctorResult.rows[0].id;
        const { from, to } = req.query;

        if ((from && !validDate(from)) || (to && !validDate(to))) {
            return res.status(400).json({
                success: false,
                message: "Date filters must use YYYY-MM-DD"
            });
        }

        if (from && to && from > to) {
            return res.status(400).json({
                success: false,
                message: "'from' date cannot be later than 'to' date"
            });
        }

        const values = [doctorId];
        let dateCondition = "TRUE";

        if (from) {
            values.push(from);
            dateCondition += ` AND s.slot_date >= $${values.length}`;
        }

        if (to) {
            values.push(to);
            dateCondition += ` AND s.slot_date <= $${values.length}`;
        }

        const result = await pool.query(
            `SELECT
                s.id,
                s.doctor_id,
                s.slot_date::text AS slot_date,
                s.start_time,
                s.end_time,
                s.is_booked,
                CASE
                    WHEN a.id IS NULL THEN NULL
                    ELSE json_build_object(
                        'id', a.id,
                        'status', a.appointment_status
                    )
                END AS appointment
             FROM doctor_slots s
             LEFT JOIN appointments a
                ON a.slot_id = s.id
                AND a.appointment_status IN ('pending', 'confirmed')
             WHERE s.doctor_id = $1
               AND ${dateCondition}
             ORDER BY s.slot_date, s.start_time`,
            values
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            slots: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// Doctor/admin: edit an unbooked slot.
const updateSlot = async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { slot_date, start_time, end_time } = req.body;

        if (
            !validDate(slot_date) ||
            !validTime(start_time) ||
            !validTime(end_time) ||
            start_time >= end_time
        ) {
            return res.status(400).json({
                success: false,
                message: "Provide a valid date and time range"
            });
        }

        await client.query("BEGIN");

        const slotResult = await client.query(
            `SELECT s.*
             FROM doctor_slots s
             JOIN doctors d ON d.id = s.doctor_id
             WHERE s.id = $1
               AND ($2 = 'admin' OR d.user_id = $3)
             FOR UPDATE OF s`,
            [req.params.id, req.user.role, req.user.id]
        );

        if (slotResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Slot not found or not permitted"
            });
        }

        const slot = slotResult.rows[0];

        if (slot.is_booked) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Booked slots cannot be edited"
            });
        }

        const pastDate = await client.query(
            "SELECT $1::date < CURRENT_DATE AS is_past",
            [slot_date]
        );

        if (pastDate.rows[0].is_past) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Cannot move a slot to a past date"
            });
        }

        const overlap = await client.query(
            `SELECT id
             FROM doctor_slots
             WHERE doctor_id = $1
               AND slot_date = $2
               AND id <> $5
               AND start_time < $4::time
               AND end_time > $3::time`,
            [
                slot.doctor_id,
                slot_date,
                start_time,
                end_time,
                req.params.id
            ]
        );

        if (overlap.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "This slot overlaps an existing slot"
            });
        }

        const result = await client.query(
            `UPDATE doctor_slots
             SET slot_date = $1,
                 start_time = $2,
                 end_time = $3
             WHERE id = $4
             RETURNING *`,
            [slot_date, start_time, end_time, req.params.id]
        );

        await client.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Slot updated successfully",
            slot: result.rows[0]
        });
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A slot already exists at this start time"
            });
        }

        next(error);
    } finally {
        client.release();
    }
};


// Doctor/admin: delete an unbooked slot.
const deleteSlot = async (req, res, next) => {
    try {
        const result = await pool.query(
            `DELETE FROM doctor_slots s
             USING doctors d
             WHERE s.id = $1
               AND d.id = s.doctor_id
               AND ( $2 = 'admin' OR d.user_id = $3 )
               AND s.is_booked = FALSE
             RETURNING s.id`,
            [req.params.id, req.user.role, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Unbooked slot not found or not permitted"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Availability slot deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};


// Patient books an available appointment slot


const bookAppointment = async (req, res, next) => {
  const { slot_id, reason } = req.body;
  const patientId = req.user.id;

  if (!slot_id || !Number.isInteger(Number(slot_id))) {
    return res.status(400).json({
      success: false,
      message: "A valid slot_id is required",
    });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({
      success: false,
      message: "Please provide a reason for the appointment",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const slotResult = await client.query(
      `SELECT
         s.id,
         s.doctor_id,
         s.slot_date,
         s.start_time,
         s.end_time,
         s.is_booked,
         d.available,
         d.user_id AS doctor_user_id,
         u.is_active,
         (s.slot_date + s.start_time) > NOW() AS is_future
       FROM doctor_slots s
       JOIN doctors d ON d.id = s.doctor_id
       JOIN users u ON u.id = d.user_id
       WHERE s.id = $1
       FOR UPDATE OF s`,
      [slot_id]
    );

    if (slotResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Appointment slot not found",
      });
    }

    const slot = slotResult.rows[0];

    if (slot.is_booked) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked",
      });
    }

    if (!slot.is_future) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Cannot book a past appointment slot",
      });
    }

    if (!slot.available || !slot.is_active) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "This doctor is currently unavailable",
      });
    }

    const appointmentResult = await client.query(
      `INSERT INTO appointments
         (patient_id, doctor_id, slot_id, reason, appointment_status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [patientId, slot.doctor_id, slot_id, reason.trim()]
    );

    const appointment = appointmentResult.rows[0];

    await client.query(
      `UPDATE doctor_slots
       SET is_booked = TRUE
       WHERE id = $1`,
      [slot_id]
    );

    // Notify the patient.
    await createNotification(
      client,
      patientId,
      appointment.id,
      "appointment_booked",
      "Appointment booked",
      "Your appointment request has been submitted and is awaiting confirmation."
    );

    // Notify the doctor.
    await createNotification(
      client,
      slot.doctor_user_id,
      appointment.id,
      "appointment_booked",
      "New appointment request",
      "A patient has booked one of your available appointment slots."
    );

    // Notify all active administrators.
    const adminResult = await client.query(
      `SELECT id
       FROM users
       WHERE role = 'admin'
         AND is_active = TRUE`
    );

    for (const admin of adminResult.rows) {
      await createNotification(
        client,
        admin.id,
        appointment.id,
        "appointment_booked",
        "New appointment booked",
        "A new patient appointment has been submitted."
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "This appointment slot has already been booked",
      });
    }

    next(error);
  } finally {
    client.release();
  }
};


const getMyAppointments = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                a.id AS appointment_id,
                a.appointment_status AS status,
                a.reason,
                a.created_at,
                s.id AS slot_id,
                s.slot_date::text AS slot_date,
                s.start_time,
                s.end_time,
                d.id AS doctor_id,
                du.name AS doctor_name,
                d.specialization,
                d.qualification,
                d.consultation_fee,
                dep.name AS department
             FROM appointments a
             JOIN doctor_slots s
                ON s.id = a.slot_id
                AND s.doctor_id = a.doctor_id
             JOIN doctors d
                ON d.id = s.doctor_id
             JOIN users du
                ON du.id = d.user_id
             LEFT JOIN departments dep
                ON dep.id = d.department_id
             WHERE a.patient_id = $1
             ORDER BY s.slot_date DESC, s.start_time DESC`,
            [req.user.id]
        );

        return res.json({
            success: true,
            count: result.rows.length,
            appointments: result.rows,
        });
    } catch (error) {
        next(error);
    }
};


const cancelAppointment = async (req, res, next) => {
  const appointmentId = Number(req.params.id);

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment ID",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT
         a.id,
         a.appointment_status AS status,
         a.slot_id,
         (s.slot_date + s.start_time) > NOW() AS is_future
       FROM appointments a
       JOIN doctor_slots s ON s.id = a.slot_id
       WHERE a.id = $1 AND a.patient_id = $2
       FOR UPDATE OF a`,
      [appointmentId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = result.rows[0];

    if (!["pending", "confirmed"].includes(appointment.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "This appointment cannot be cancelled",
      });
    }

    if (!appointment.is_future) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Past appointments cannot be cancelled",
      });
    }

    await client.query(
      `UPDATE appointments
       SET appointment_status = 'cancelled',
           updated_at = NOW()
       WHERE id = $1`,
      [appointmentId]
    );

    await client.query(
      `UPDATE doctor_slots
       SET is_booked = FALSE
       WHERE id = $1`,
      [appointment.slot_id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Appointment cancelled successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};


const getDoctorAppointments = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         a.id AS appointment_id,
         a.appointment_status AS status,
         a.reason,
         a.created_at,
         s.id AS slot_id,
         s.slot_date::text AS slot_date,
         s.start_time,
         s.end_time,
         u.id AS patient_id,
         u.name AS patient_name,
         u.email AS patient_email,
         u.phone AS patient_phone
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users u ON u.id = a.patient_id
       JOIN doctor_slots s ON s.id = a.slot_id
       WHERE d.user_id = $1
       ORDER BY s.slot_date DESC, s.start_time DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      count: result.rows.length,
      appointments: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


const updateAppointmentStatus = async (req, res, next) => {
  const appointmentId = Number(req.params.id);
  const { action } = req.body;

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment ID",
    });
  }

  const transitions = {
    confirm: {
      from: "pending",
      to: "confirmed",
    },
    reject: {
      from: "pending",
      to: "rejected",
    },
    complete: {
      from: "confirmed",
      to: "completed",
    },
  };

  const transition = transitions[action];

  if (!transition) {
    return res.status(400).json({
      success: false,
      message: "Invalid action. Use confirm, reject, or complete",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appointmentResult = await client.query(
      `SELECT
         a.id,
         a.appointment_status,
         a.slot_id
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       WHERE a.id = $1
         AND d.user_id = $2
       FOR UPDATE OF a`,
      [appointmentId, req.user.id]
    );

    if (appointmentResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = appointmentResult.rows[0];

    if (appointment.appointment_status !== transition.from) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} an appointment with status ${appointment.appointment_status}`,
      });
    }

    await client.query(
      `UPDATE appointments
       SET appointment_status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [transition.to, appointmentId]
    );

    // Rejected appointments release their slot.
    if (action === "reject") {
      await client.query(
        `UPDATE doctor_slots
         SET is_booked = FALSE
         WHERE id = $1`,
        [appointment.slot_id]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `Appointment ${
            action === "complete" ? "completed" : action === "confirm" ? "confirmed" : "rejected"
        } successfully`,
      appointment: {
        id: appointmentId,
        status: transition.to,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};


const getAllAppointments = async (req, res, next) => {
  try {
    const {
      status,
      doctor_id,
      patient_id,
      from,
      to,
    } = req.query;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "rejected",
      "cancelled",
      "completed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment status",
      });
    }

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`a.appointment_status = $${values.length}`);
    }

    if (doctor_id) {
      if (!/^\d+$/.test(doctor_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor_id",
        });
      }

      values.push(Number(doctor_id));
      conditions.push(`a.doctor_id = $${values.length}`);
    }

    if (patient_id) {
      if (!/^\d+$/.test(patient_id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient_id",
        });
      }

      values.push(Number(patient_id));
      conditions.push(`a.patient_id = $${values.length}`);
    }

    if (from) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        return res.status(400).json({
          success: false,
          message: "Invalid from date. Use YYYY-MM-DD",
        });
      }

      values.push(from);
      conditions.push(`s.slot_date >= $${values.length}::date`);
    }

    if (to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({
          success: false,
          message: "Invalid to date. Use YYYY-MM-DD",
        });
      }

      values.push(to);
      conditions.push(`s.slot_date <= $${values.length}::date`);
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "'from' date cannot be later than 'to' date",
      });
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const result = await pool.query(
      `SELECT
         a.id AS appointment_id,
         a.appointment_status AS status,
         a.reason,
         a.created_at,
         a.updated_at,
         s.id AS slot_id,
         s.slot_date::text AS slot_date,
         s.start_time,
         s.end_time,
         d.id AS doctor_id,
         du.name AS doctor_name,
         du.email AS doctor_email,
         d.specialization,
         p.id AS patient_id,
         p.name AS patient_name,
         p.email AS patient_email,
         p.phone AS patient_phone,
         dep.name AS department
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN users du ON du.id = d.user_id
       JOIN users p ON p.id = a.patient_id
       JOIN doctor_slots s ON s.id = a.slot_id
       LEFT JOIN departments dep ON dep.id = d.department_id
       ${whereClause}
       ORDER BY s.slot_date DESC, s.start_time DESC`,
      values
    );

    return res.json({
      success: true,
      count: result.rows.length,
      appointments: result.rows,
    });
  } catch (error) {
    next(error);
  }
};


const adminUpdateAppointmentStatus = async (req, res, next) => {
  const appointmentId = Number(req.params.id);
  const { action } = req.body;

  if (!Number.isInteger(appointmentId) || appointmentId < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid appointment ID",
    });
  }

  const transitions = {
    confirm: { from: ["pending"], to: "confirmed" },
    reject: { from: ["pending"], to: "rejected" },
    complete: { from: ["confirmed"], to: "completed" },
    cancel: { from: ["pending", "confirmed"], to: "cancelled" },
  };

  const transition = transitions[action];

  if (!transition) {
    return res.status(400).json({
      success: false,
      message: "Invalid action",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT
         a.id,
         a.appointment_status,
         a.slot_id
       FROM appointments a
       WHERE a.id = $1
       FOR UPDATE`,
      [appointmentId]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const appointment = result.rows[0];

    if (!transition.from.includes(appointment.appointment_status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: `Cannot ${action} an appointment with status ${appointment.appointment_status}`,
      });
    }

    await client.query(
      `UPDATE appointments
       SET appointment_status = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [transition.to, appointmentId]
    );

    if (["reject", "cancel"].includes(action)) {
      await client.query(
        `UPDATE doctor_slots
         SET is_booked = FALSE
         WHERE id = $1`,
        [appointment.slot_id]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: `Appointment ${
        action === "complete"
          ? "completed"
          : action === "confirm"
          ? "confirmed"
          : action === "reject"
          ? "rejected"
          : "cancelled"
      } successfully`,
      appointment: {
        id: appointmentId,
        status: transition.to,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
};


module.exports = {
    createSlot,
    getAvailableSlots,
    getDoctorCalendar,
    getMyDoctorCalendar, // Add this
    updateSlot,
    deleteSlot,
    bookAppointment,
    getMyAppointments,
    cancelAppointment,
    getDoctorAppointments,
    updateAppointmentStatus,
    getAllAppointments,
    adminUpdateAppointmentStatus,
};
