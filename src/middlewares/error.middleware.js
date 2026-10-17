import fs from "fs";
import { ApiError } from "../utils/ApiError.js";

const isProd = () => process.env.NODE_ENV === "production";

// 404 handler
const notFound = (req, res, next) => {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Converts known library errors (Mongoose, JWT, multer, bad JSON) into ApiError
const normalizeError = (err) => {
    if (err instanceof ApiError) return err;

    // Mongoose: invalid ObjectId, e.g. /users/abc
    if (err.name === "CastError") {
        return new ApiError(400, `Invalid ${err.path}: ${err.value}`);
    }

    // Mongoose: schema validation failed
    if (err.name === "ValidationError" && err.errors) {
        const errors = Object.values(err.errors).map((e) => e.message);
        return new ApiError(400, "Validation failed", errors);
    }

    // MongoDB: duplicate key (unique index violated)
    if (err.code === 11000) {
        const fields = Object.keys(err.keyValue || {}).join(", ");
        return new ApiError(409, `Duplicate value for: ${fields}`);
    }

    // JWT
    if (err.name === "JsonWebTokenError") {
        return new ApiError(401, "Invalid token");
    }
    if (err.name === "TokenExpiredError") {
        return new ApiError(401, "Token expired");
    }

    // Malformed JSON body (express.json())
    if (err.type === "entity.parse.failed") {
        return new ApiError(400, "Malformed JSON in request body");
    }

    // Multer: file too large, unexpected field, etc. (client's fault -> 400)
    if (err.name === "MulterError") {
        return new ApiError(400, err.message);
    }

    // Never send its real message to the client in production.
    const statusCode = err.statusCode || 500;
    const message =
        isProd() && statusCode >= 500
            ? "Internal Server Error"
            : err.message || "Internal Server Error";

    return new ApiError(statusCode, message, [], err.stack);
};


// Deletes any files multer saved to Public/temp for this request.
// Safe if the file is already gone (uploadOnCloudinary deletes it itself).
const removeUploadedFiles = (req) => {
    const files = req.files
        ? Array.isArray(req.files)
            ? req.files
            : Object.values(req.files).flat()
        : req.file
          ? [req.file]
          : [];
    files.forEach((file) => fs.unlink(file.path, () => {}));
};

const errorHandler = (err, req, res, next) => {
    removeUploadedFiles(req);

    // if the response already started (e.g. mid-stream), we can't
    // send JSON anymore. Let Express's default handler close the connection.
    if (res.headersSent) {
        return next(err);
    }

    const error = normalizeError(err);

    // Log server-side errors with the ORIGINAL error (real message + stack)
    if (error.statusCode >= 500) {
        console.error(err);
    }

    const response = {
        statusCode: error.statusCode,
        data: null,
        message: error.message,
        success: false,
        errors: error.errors,
    };

    // Only expose stack traces in development
    if (process.env.NODE_ENV === "development") {
        response.stack = error.stack;
    }

    return res.status(error.statusCode).json(response);
};

export { notFound, errorHandler };