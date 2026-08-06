const { validate_token } = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");

module.exports = (app) => {
    // Get all users
    app.get("/api/users", validate_token(), userController.getList);

    // Get one user by ID
    app.get("/api/users/:id", userController.getOne);

    // Create new user (with image upload)
    app.post(
        "/api/users",
        validate_token(),
        userController.uploadMiddleware,
        userController.create
    );

    // Update user (with image upload) - matches frontend "user-edit" endpoint
    app.put(
        "/api/user-edit/:id",
        validate_token(),
        userController.uploadMiddleware,
        userController.update
    );

    // Delete user
    app.delete("/api/users/:id", validate_token(), userController.delete);

    // Toggle user status
    app.patch("/api/users/:id/status", validate_token(), userController.toggleStatus);
};
