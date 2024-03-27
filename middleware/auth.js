/** Middleware for handling req authorization for routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
    try {
        const tokenFromBody = req.body._token;
        const payload = jwt.verify(tokenFromBody, SECRET_KEY);

        console.log("In auth middleware...");
        console.log(payload);

        req.user = payload; // create a current user and append to req for use in next handler
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware: Requires user is authenticated. */

function ensureLoggedIn(req, res, next) {
    if (!req.user) {
        return next({ status: 401, message: "Unauthorized" });
    } else {
        return next();
    }
}

/** Middleware: Requires logged in user to match username in params. */

function ensureCorrectUser(req, res, next) {
    try {
        if (req.user.username === req.params.username) {
            return next();
        } else {
            return next({ status: 401, message: "Unauthorized" });
        }
    } catch (err) {
        // errors would happen here if we made a request and req.user is undefined
        return next({ status: 401, message: "Unauthorized" });
    }
}
// end

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureCorrectUser,
};
