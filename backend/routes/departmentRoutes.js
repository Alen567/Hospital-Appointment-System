
const express = require("express");

const {
    getDepartments,
    createDepartment,
    updateDepartment,
    setDepartmentActive
} = require("../controllers/departmentController");

const {
    authenticateToken,
    authorizeRoles
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public: active departments
router.get("/", getDepartments);

// Admin: all departments, including inactive ones
router.get(
    "/admin/all",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res, next) => {
        req.includeInactive = true;
        next();
    },
    getDepartments
);

// Admin: create department
router.post(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    createDepartment
);

// Admin: edit department
router.patch(
    "/:id",
    authenticateToken,
    authorizeRoles("admin"),
    updateDepartment
);

// Admin: activate/deactivate department
router.patch(
    "/:id/active",
    authenticateToken,
    authorizeRoles("admin"),
    setDepartmentActive
);

module.exports = router;
