
const express = require("express");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const {
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
} = require("../controllers/appointmentController");

const router = express.Router();

// Public: patients can see available slots.
router.get("/available/:doctorId", getAvailableSlots);

// Doctor/admin: calendar with booked and unbooked slots.
router.get(
    "/calendar/:doctorId",
    authenticateToken,
    authorizeRoles("doctor", "admin"),
    getDoctorCalendar
);

// Doctor/admin: create availability.
router.post(
    "/slots",
    authenticateToken,
    authorizeRoles("doctor", "admin"),
    createSlot
);

// Doctor/admin: edit availability.
router.patch(
    "/slots/:id",
    authenticateToken,
    authorizeRoles("doctor", "admin"),
    updateSlot
);

// Doctor/admin: delete unbooked availability.
router.delete(
    "/slots/:id",
    authenticateToken,
    authorizeRoles("doctor", "admin"),
    deleteSlot
);

// Doctor: view their own availability calendar.
router.get(
    "/doctor/calendar",
    authenticateToken,
    authorizeRoles("doctor"),
    getMyDoctorCalendar
);

router.post(
  "/book",
  authenticateToken,
  authorizeRoles("patient"),
  bookAppointment
);

router.get(
  "/mine",
  authenticateToken,
  authorizeRoles("patient"),
  getMyAppointments
);

router.patch(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles("patient"),
  cancelAppointment
);

router.get(
  "/doctor/mine",
  authenticateToken,
  authorizeRoles("doctor"),
  getDoctorAppointments
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("doctor"),
  updateAppointmentStatus
);

router.get(
  "/admin/all",
  authenticateToken,
  authorizeRoles("admin"),
  getAllAppointments
);

router.patch(
  "/admin/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  adminUpdateAppointmentStatus
);

module.exports = router;
