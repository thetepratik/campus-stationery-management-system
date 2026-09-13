const ApiError = require("../utils/ApiError");

/**
 * Middleware to allow only specific roles
 * Usage:
 * router.get("/admin", verifyToken, requireRole("admin"), controller)
 * router.get("/student", verifyToken, requireRole("student"), controller)
 * router.get("/common", verifyToken, requireRole("admin", "student"), controller)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {

        // Debug logs (remove after fixing)
        // console.log("========== ROLE CHECK ==========");
        // console.log("Requested URL :", req.originalUrl);
        // console.log("User ID       :", req.user?._id);
        // console.log("User Role     :", req.userRole);
        // console.log("Allowed Roles :", allowedRoles);
        // console.log("================================");

        if (!req.userRole) {
            return next(
                new ApiError(401, "Authentication failed. User role not found.")
            );
        }

        if (!allowedRoles.includes(req.userRole)) {
            return next(
                new ApiError(
                    403,
                    `Access denied. Required role(s): ${allowedRoles.join(
                        ", "
                    )}. Your role is: ${req.userRole}`
                )
            );
        }

        next();
    };
};

module.exports = {
    requireRole,
};