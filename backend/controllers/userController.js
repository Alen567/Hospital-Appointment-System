
const pool = require("../config/db");
const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { randomUUID } = require("crypto");
const s3 = require("../config/s3");
// Get the currently logged-in user's complete profile.

// Upload or replace the current user's profile image.
const uploadProfileImage = async (req, res, next) => {
    let newKey;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select an image to upload"
            });
        }

        const allowedTypes = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp"
        };

        const extension = allowedTypes[req.file.mimetype];

        if (!extension) {
            return res.status(400).json({
                success: false,
                message: "Only JPEG, PNG, and WebP images are allowed"
            });
        }

        const bucket = process.env.AWS_S3_BUCKET;

        if (!bucket) {
            throw new Error("AWS_S3_BUCKET is not configured");
        }

        const previousResult = await pool.query(
            "SELECT profile_image_key FROM users WHERE id = $1",
            [req.user.id]
        );

        if (previousResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const previousKey = previousResult.rows[0].profile_image_key;

        newKey = `profile-images/${req.user.id}/${randomUUID()}.${extension}`;

        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: newKey,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }));

        try {
            await pool.query(
                `UPDATE users
                 SET profile_image_key = $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $2`,
                [newKey, req.user.id]
            );
        } catch (databaseError) {
            await s3.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: newKey
            }));

            throw databaseError;
        }

        if (previousKey) {
            try {
                await s3.send(new DeleteObjectCommand({
                    Bucket: bucket,
                    Key: previousKey
                }));
            } catch (deleteError) {
                console.error("Could not delete previous profile image:", deleteError.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Profile image uploaded successfully",
            profile_image_key: newKey
        });

    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userResult = await pool.query(
            `SELECT id, name, email, role, phone, profile_image_key,
                    is_active, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResult.rows[0];

        // Generate a temporary URL for the private profile image.
        user.profile_image_url = null;

        if (user.profile_image_key) {
            try {
                const command = new GetObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET,
                    Key: user.profile_image_key
                });

                user.profile_image_url = await getSignedUrl(s3, command, {
                    expiresIn: 900
                });
            } catch (error) {
                console.error("Could not generate profile image URL:", error.message);
            }
        }

        if (user.role === "doctor") {
            const doctorResult = await pool.query(
                `SELECT d.id AS doctor_id,
                        d.specialization,
                        d.qualification,
                        d.experience_years,
                        d.consultation_fee,
                        d.bio,
                        d.department_id,
                        dep.name AS department_name
                 FROM doctors d
                 LEFT JOIN departments dep
                    ON dep.id = d.department_id
                 WHERE d.user_id = $1`,
                [user.id]
            );

            user.doctor_profile = doctorResult.rows[0] || null;
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};


// Update the current user's profile.
const updateProfile = async (req, res, next) => {
    const client = await pool.connect();

    try {
        const { name, phone } = req.body;

        const allowedFields = ["name", "phone"];

        if (req.user.role === "doctor") {
            allowedFields.push(
                "specialization",
                "qualification",
                "experience_years",
                "consultation_fee",
                "bio"
            );
        }

        const receivedFields = Object.keys(req.body);

        const invalidFields = receivedFields.filter(
            field => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `These fields cannot be updated: ${invalidFields.join(", ")}`
            });
        }

        if (receivedFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Provide at least one field to update"
            });
        }

        if (name !== undefined &&
            (typeof name !== "string" ||
             name.trim().length < 2 ||
             name.trim().length > 100)) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 100 characters"
            });
        }

        if (phone !== undefined &&
            phone !== null &&
            (typeof phone !== "string" ||
             phone.trim().length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Phone number must be 20 characters or fewer"
            });
        }

        if (req.user.role === "doctor") {
            if (req.body.specialization !== undefined &&
                (typeof req.body.specialization !== "string" ||
                 !req.body.specialization.trim())) {
                return res.status(400).json({
                    success: false,
                    message: "A valid specialization is required"
                });
            }

            if (req.body.qualification !== undefined &&
                req.body.qualification !== null &&
                typeof req.body.qualification !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Qualification must be text"
                });
            }

            if (req.body.bio !== undefined &&
                req.body.bio !== null &&
                typeof req.body.bio !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Bio must be text"
                });
            }

            if (req.body.experience_years !== undefined &&
                (!Number.isInteger(Number(req.body.experience_years)) ||
                 Number(req.body.experience_years) < 0)) {
                return res.status(400).json({
                    success: false,
                    message: "Experience must be a non-negative whole number"
                });
            }

            if (req.body.consultation_fee !== undefined &&
                (!Number.isFinite(Number(req.body.consultation_fee)) ||
                 Number(req.body.consultation_fee) < 0)) {
                return res.status(400).json({
                    success: false,
                    message: "Consultation fee must be a non-negative number"
                });
            }
        }

        await client.query("BEGIN");

        const userFields = [];
        const userValues = [];

        if (name !== undefined) {
            userValues.push(name.trim());
            userFields.push(`name = $${userValues.length}`);
        }

        if (phone !== undefined) {
            userValues.push(phone ? phone.trim() : null);
            userFields.push(`phone = $${userValues.length}`);
        }

        if (userFields.length > 0) {
            userValues.push(req.user.id);

            await client.query(
                `UPDATE users
                 SET ${userFields.join(", ")},
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $${userValues.length}`,
                userValues
            );
        }

        if (req.user.role === "doctor") {
            const doctorFields = [];
            const doctorValues = [];

            const doctorColumns = {
                specialization: "specialization",
                qualification: "qualification",
                experience_years: "experience_years",
                consultation_fee: "consultation_fee",
                bio: "bio"
            };

            for (const [field, column] of Object.entries(doctorColumns)) {
                if (req.body[field] !== undefined) {
                    let value = req.body[field];

                    if (field === "specialization") {
                        value = value.trim();
                    }

                    if (field === "qualification" || field === "bio") {
                        value = value ? value.trim() : null;
                    }

                    if (field === "experience_years") {
                        value = Number(value);
                    }

                    if (field === "consultation_fee") {
                        value = Number(value);
                    }

                    doctorValues.push(value);
                    doctorFields.push(`${column} = $${doctorValues.length}`);
                }
            }

            if (doctorFields.length > 0) {
                doctorValues.push(req.user.id);

                const result = await client.query(
                    `UPDATE doctors
                     SET ${doctorFields.join(", ")},
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $${doctorValues.length}`,
                    doctorValues
                );

                if (result.rowCount === 0) {
                    throw new Error("Doctor profile not found");
                }
            }
        }

        await client.query("COMMIT");

        return getProfile(req, res, next);
    } catch (error) {
        await client.query("ROLLBACK");
        next(error);
    } finally {
        client.release();
    }
};

// Get all registered patient accounts (admin only).
const getPatients = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                name,
                email,
                phone,
                is_active,
                created_at
             FROM users
             WHERE role = 'patient'
             ORDER BY created_at DESC`
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            patients: result.rows
        });
    } catch (error) {
        next(error);
    }
};


// Get patients who have appointments with the logged-in doctor.
const getMyPatients = async (req, res, next) => {
    try {
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

        const result = await pool.query(
            `SELECT
                u.id AS patient_id,
                u.name,
                u.email,
                u.phone,
                COUNT(a.id)::INTEGER AS total_appointments,
                MAX(s.slot_date) AS last_appointment_date
             FROM appointments a
             INNER JOIN doctor_slots s
                ON s.id = a.slot_id
             INNER JOIN users u
                ON u.id = a.patient_id
             WHERE s.doctor_id = $1
               AND u.role = 'patient'
             GROUP BY u.id, u.name, u.email, u.phone
             ORDER BY MAX(s.slot_date) DESC, u.name ASC`,
            [doctorId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            patients: result.rows
        });

    } catch (error) {
        next(error);
    }
};


// Activate or deactivate a patient account (admin only).
const setPatientActive = async (req, res, next) => {
    try {
        const patientId = Number(req.params.id);
        const { is_active } = req.body;

        if (!Number.isInteger(patientId) || patientId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid patient ID"
            });
        }

        if (typeof is_active !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "is_active must be true or false"
            });
        }

        const result = await pool.query(
            `UPDATE users
             SET is_active = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
               AND role = 'patient'
             RETURNING id, name, email, phone, is_active`,
            [is_active, patientId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: is_active
                ? "Patient account activated successfully"
                : "Patient account deactivated successfully",
            patient: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    uploadProfileImage,
    getPatients,
    getMyPatients,
    setPatientActive
};
