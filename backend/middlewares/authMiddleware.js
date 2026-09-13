const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const Admin = require("../models/Admin");
const Student = require("../models/Student");

const verifyToken = asyncHandler(async (req, res, next) => {
    const adminCookie =
        req.cookies?.[`${process.env.JWT_COOKIE_NAME}_admin`];

    const studentCookie =
        req.cookies?.[`${process.env.JWT_COOKIE_NAME}_student`];

    let token = null;

    const url = req.originalUrl.toLowerCase();

    const roleHeader = req.headers['x-user-role'] || req.headers['x-role'];

    // -----------------------------
    // EXPLICIT ROLE HEADER HINT
    // -----------------------------
    if (roleHeader === 'admin' && adminCookie) {
        token = adminCookie;
    } else if (roleHeader === 'student' && studentCookie) {
        token = studentCookie;
    }
    // -----------------------------
    // ADMIN APIs
    // -----------------------------
    else if (
        url.startsWith("/api/admin") ||
        url.startsWith("/api/products") ||
        url.startsWith("/api/categories") ||
        url.startsWith("/api/inventory") ||
        url.startsWith("/api/reports") ||
        url.startsWith("/api/settings") ||
        url.startsWith("/api/sales")
    ) {
        token = adminCookie;
    }

    // -----------------------------
    // STUDENT APIs
    // -----------------------------
    else if (
        url.startsWith("/api/student") ||
        url.startsWith("/api/cart") ||
        url.startsWith("/api/wishlist") ||
        url.startsWith("/api/orders") ||
        url.startsWith("/api/profile") ||
        url.startsWith("/api/checkout")
    ) {
        token = studentCookie;
    }

    // -----------------------------
    // COMMON APIs (e.g. /api/notifications)
    // -----------------------------
    else {
        token = studentCookie || adminCookie;
    }

    // Fallback: Authorization header Bearer token if cookies not sent
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        throw new ApiError(401, "Not authenticated. Please login.");
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, "Session expired or invalid.");
    }

    let user = null;

    if (decoded.role === "admin") {
        user = await Admin.findById(decoded.id);
    } else if (decoded.role === "student") {
        user = await Student.findById(decoded.id);
    }

    if (!user) {
        throw new ApiError(401, "User not found.");
    }

    req.user = user;
    req.userRole = decoded.role;

    // console.log("========== AUTH ==========");
    // console.log("URL:", req.originalUrl);
    // console.log("Role:", req.userRole);
    // console.log("User:", req.user.name);
    // console.log("==========================");

    next();
});

module.exports = {
    verifyToken,
};