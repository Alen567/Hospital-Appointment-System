
const express = require("express");

const {
    getProfile,
    updateProfile,
    getPatients,
    getMyPatients,
    setPatientActive
} = require("../controllers/userController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Logged-in user's profile
router.get("/profile", authenticateToken, getProfile);
router.patch("/profile", authenticateToken, updateProfile);

// Admin: patient management
router.get(
    "/admin/patients",
    authenticateToken,
    authorizeRoles("admin"),
    getPatients
);

// Doctor: patients associated with their appointments.
router.get(
    "/doctor/patients",
    authenticateToken,
    authorizeRoles("doctor"),
    getMyPatients
);

router.patch(
    "/admin/patients/:id/active",
    authenticateToken,
    authorizeRoles("admin"),
    setPatientActive
);

module.exports = router;
