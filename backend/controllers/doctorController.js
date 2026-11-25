
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

// Reusable query to retrieve a doctor with their user and department details.
const doctorSelect = `
    SELECT
        d.id AS doctor_id,
        u.id AS user_id,
        u.name,
        u.email,
        u.phone,
        u.is_active,
        d.department_id,
        dep.name AS department_name,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.bio,
        d.available,
        d.created_at
    FROM doctors d
    JOIN users u ON u.id = d.user_id
    LEFT JOIN departments dep ON dep.id = d.department_id
`;

// GET /api/doctors/admin/all
// Admin: retrieve all doctors, including deactivated accounts.
const getDoctors = async (req, res, next) => {
    try {
        const result = await pool.query(
            `${doctorSelect}
             ORDER BY u.name ASC`
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            doctors: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// GET /api/doctors/available
// Patients: retrieve active doctors available for consultation.
const getAvailableDoctors = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                d.id AS doctor_id,
                u.name,
                dep.name AS department_name,
                d.specialization,
                d.qualification,
                d.experience_years,
                d.consultation_fee,
                d.bio,
                d.available
             FROM doctors d
             INNER JOIN users u ON u.id = d.user_id
             LEFT JOIN departments dep ON dep.id = d.department_id
             WHERE u.is_active = TRUE
               AND d.available = TRUE
             ORDER BY u.name ASC`
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            doctors: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// POST /api/doctors
// Admin: create a doctor account and profile.
const createDoctor = async (req, res, next) => {
    const {
        name,
        email,
        password,
        phone,
        department_id,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        bio
    } = req.body;

    if (
        !name ||
        !email ||
        !password ||
        !department_id ||
        !specialization
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, email, password, department and specialization are required"
        });
    }

    if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Name must be between 2 and 100 characters"
        });
    }

    if (typeof email !== "string") {
        return res.status(400).json({
            success: false,
            message: "A valid email address is required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
    }

    if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 8 characters"
        });
    }

    if (
        typeof specialization !== "string" ||
        specialization.trim().length < 2 ||
        specialization.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Specialization must be between 2 and 100 characters"
        });
    }

    const departmentId = Number(department_id);
    const experience = Number(experience_years ?? 0);
    const fee = Number(consultation_fee ?? 0);

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid department"
        });
    }

    if (!Number.isInteger(experience) || experience < 0) {
        return res.status(400).json({
            success: false,
            message: "Experience must be a non-negative whole number"
        });
    }

    if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
            success: false,
            message: "Consultation fee must be a valid non-negative amount"
        });
    }

    if (
        qualification != null &&
        typeof qualification !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Qualification must be text"
        });
    }

    if (bio != null && typeof bio !== "string") {
        return res.status(400).json({
            success: false,
            message: "Bio must be text"
        });
    }

    if (phone != null && typeof phone !== "string") {
        return res.status(400).json({
            success: false,
            message: "Phone must be text"
        });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        // Only allow assignment to an active department.
        const departmentResult = await client.query(
            `SELECT id
             FROM departments
             WHERE id = $1 AND is_active = TRUE`,
            [departmentId]
        );

        if (departmentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Selected department does not exist or is inactive"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Create the login account.
        const userResult = await client.query(
            `INSERT INTO users
                (name, email, password_hash, role, phone)
             VALUES ($1, $2, $3, 'doctor', $4)
             RETURNING id`,
            [
                name.trim(),
                normalizedEmail,
                passwordHash,
                phone?.trim() || null
            ]
        );

        const userId = userResult.rows[0].id;

        // Create the associated doctor profile.
        const doctorResult = await client.query(
            `INSERT INTO doctors
                (
                    user_id,
                    department_id,
                    specialization,
                    qualification,
                    experience_years,
                    consultation_fee,
                    bio
                )
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                userId,
                departmentId,
                specialization.trim(),
                qualification?.trim() || null,
                experience,
                fee,
                bio?.trim() || null
            ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        const result = await pool.query(
            `${doctorSelect}
             WHERE d.id = $1`,
            [doctorResult.rows[0].id]
        );

        return res.status(201).json({
            success: true,
            message: "Doctor account created successfully",
            doctor: result.rows[0]
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        next(error);
    } finally {
        client.release();
    }
};

// PATCH /api/doctors/:id
// Admin: update doctor profile and user details.
const updateDoctor = async (req, res, next) => {
    const doctorId = Number(req.params.id);

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid doctor ID"
        });
    }

    const {
        name,
        email,
        phone,
        department_id,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        bio,
        available
    } = req.body;

    if (
        !name ||
        !email ||
        !specialization ||
        department_id == null
    ) {
        return res.status(400).json({
            success: false,
            message: "Name, email, department and specialization are required"
        });
    }

    if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Name must be between 2 and 100 characters"
        });
    }

    if (typeof email !== "string") {
        return res.status(400).json({
            success: false,
            message: "A valid email address is required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
    }

    if (
        typeof specialization !== "string" ||
        specialization.trim().length < 2 ||
        specialization.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            message: "Specialization must be between 2 and 100 characters"
        });
    }

    const departmentId = Number(department_id);
    const experience = Number(experience_years ?? 0);
    const fee = Number(consultation_fee ?? 0);

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please select a valid department"
        });
    }

    if (!Number.isInteger(experience) || experience < 0) {
        return res.status(400).json({
            success: false,
            message: "Experience must be a non-negative whole number"
        });
    }

    if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
            success: false,
            message: "Consultation fee must be a valid non-negative amount"
        });
    }

    if (available != null && typeof available !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "Availability must be true or false"
        });
    }

    if (
        qualification != null &&
        typeof qualification !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Qualification must be text"
        });
    }

    if (bio != null && typeof bio !== "string") {
        return res.status(400).json({
            success: false,
            message: "Bio must be text"
        });
    }

    if (phone != null && typeof phone !== "string") {
        return res.status(400).json({
            success: false,
            message: "Phone must be text"
        });
    }

    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const doctorResult = await client.query(
            `SELECT d.id, d.user_id
             FROM doctors d
             WHERE d.id = $1`,
            [doctorId]
        );

        if (doctorResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const userId = doctorResult.rows[0].user_id;

        const departmentResult = await client.query(
            `SELECT id
             FROM departments
             WHERE id = $1 AND is_active = TRUE`,
            [departmentId]
        );

        if (departmentResult.rows.length === 0) {
            await client.query("ROLLBACK");
            transactionStarted = false;

            return res.status(400).json({
                success: false,
                message: "Selected department does not exist or is inactive"
            });
        }

        await client.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 phone = $3,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [
                name.trim(),
                normalizedEmail,
                phone?.trim() || null,
                userId
            ]
        );

        await client.query(
            `UPDATE doctors
             SET department_id = $1,
                 specialization = $2,
                 qualification = $3,
                 experience_years = $4,
                 consultation_fee = $5,
                 bio = $6,
                 available = COALESCE($7, available),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [
                departmentId,
                specialization.trim(),
                qualification?.trim() || null,
                experience,
                fee,
                bio?.trim() || null,
                available ?? null,
                doctorId
            ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        const result = await pool.query(
            `${doctorSelect}
             WHERE d.id = $1`,
            [doctorId]
        );

        return res.status(200).json({
            success: true,
            message: "Doctor details updated successfully",
            doctor: result.rows[0]
        });
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        next(error);
    } finally {
        client.release();
    }
};

// PATCH /api/doctors/:id/active
// Admin: activate or deactivate a doctor's login account.
const setDoctorActive = async (req, res, next) => {
    const doctorId = Number(req.params.id);
    const { is_active } = req.body;

    if (!Number.isInteger(doctorId) || doctorId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid doctor ID"
        });
    }

    if (typeof is_active !== "boolean") {
        return res.status(400).json({
            success: false,
            message: "is_active must be true or false"
        });
    }

    try {
        const result = await pool.query(
            `UPDATE users
             SET is_active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = (
                 SELECT user_id
                 FROM doctors
                 WHERE id = $2
             )
             RETURNING id, name, email, is_active`,
            [is_active, doctorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Doctor account ${is_active ? "activated" : "deactivated"} successfully`,
            user: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDoctors,
    getAvailableDoctors,
    createDoctor,
    updateDoctor,
    setDoctorActive
};
