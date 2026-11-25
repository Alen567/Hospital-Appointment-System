
const express = require("express");

const {
    getDoctors,
    getAvailableDoctors,
    createDoctor,
    updateDoctor,
    setDoctorActive
} = require("../controllers/doctorController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// All doctor management routes require admin authentication.
router.get(
    "/admin/all",
    authenticateToken,
    authorizeRoles("admin"),
    getDoctors
);

// Patients: retrieve active doctors.
router.get(
    "/available",
    authenticateToken,
    authorizeRoles("patient"),
    getAvailableDoctors
);

router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    createDoctor
);

router.patch(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    updateDoctor
);

router.patch(
    "/:id/active",
    authenticateToken,
    authorizeRoles("admin"),
    setDoctorActive
);

module.exports = router;
