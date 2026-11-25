
const pool = require("../config/db");

// Public: list active departments.
// Admin: can request all departments using ?includeInactive=true
const getDepartments = async (req, res, next) => {
    try {
        const includeInactive =
            req.user?.role === "admin" &&
            req.includeInactive === true;

        const result = await pool.query(
            `SELECT
                d.id,
                d.name,
                d.description,
                d.is_active,
                d.created_at,
                COUNT(doc.id)::INTEGER AS doctor_count
             FROM departments d
             LEFT JOIN doctors doc
                ON doc.department_id = d.id
                AND doc.available = TRUE
             ${includeInactive ? "" : "WHERE d.is_active = TRUE"}
             GROUP BY d.id
             ORDER BY d.name`
        );

        res.status(200).json({
            success: true,
            count: result.rows.length,
            departments: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// Admin: create a department.
const createDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        if (
            typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Department name must be between 2 and 100 characters"
            });
        }

        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message: "Description must be text"
            });
        }

        const result = await pool.query(
            `INSERT INTO departments (name, description)
             VALUES ($1, $2)
             RETURNING id, name, description, is_active, created_at`,
            [
                name.trim(),
                description?.trim() || null
            ]
        );

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A department with this name already exists"
            });
        }

        next(error);
    }
};


// Admin: edit department name or description.
const updateDepartment = async (req, res, next) => {
    try {
        const { name, description } = req.body;

        const fields = [];
        const values = [];

        if (name !== undefined) {
            if (
                typeof name !== "string" ||
                name.trim().length < 2 ||
                name.trim().length > 100
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Department name must be between 2 and 100 characters"
                });
            }

            values.push(name.trim());
            fields.push(`name = $${values.length}`);
        }

        if (description !== undefined) {
            if (description !== null && typeof description !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Description must be text"
                });
            }

            values.push(description?.trim() || null);
            fields.push(`description = $${values.length}`);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide a department name or description to update"
            });
        }

        values.push(req.params.id);

        const result = await pool.query(
            `UPDATE departments
             SET ${fields.join(", ")},
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $${values.length}
             RETURNING id, name, description, is_active`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Department updated successfully",
            department: result.rows[0]
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "A department with this name already exists"
            });
        }

        next(error);
    }
};


// Admin: activate or deactivate a department.
const setDepartmentActive = async (req, res, next) => {
    try {
        const { is_active } = req.body;

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "is_active must be true or false"
            });
        }

        const result = await pool.query(
            `UPDATE departments
             SET is_active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING id, name, description, is_active`,
            [is_active, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.status(200).json({
            success: true,
            message: is_active
                ? "Department activated successfully"
                : "Department deactivated successfully",
            department: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    setDepartmentActive
};
