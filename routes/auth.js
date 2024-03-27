const express = require("express");
const router = new express.Router();
const jwt = require("jsonwebtoken");

const ExpressError = require("../expressError");
const { SECRET_KEY, JWT_OPTIONS } = require("../config");
const User = require("../models/user");

/** POST /login - login: {username, password} => {token}
 *
 * Also updates user's last-login timestamp.
 *
 **/

router.post("/login", async function (req, res, next) {
    try {
        const { username, password } = req.body;
        const authenticated = await User.authenticate(username, password);

        if (authenticated) {
            const user = await User.get(username);

            await user.updateLoginTimestamp();

            let token = jwt.sign({ username }, SECRET_KEY, JWT_OPTIONS);
            return res.json({ token });
        }

        throw new ExpressError("Invalid username and/or password", 400);
    } catch (err) {
        return next(err);
    }
});
// end

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 */

router.post("/register", async function (req, res, next) {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        const newUser = await User.register({ username, password, first_name, last_name, phone });

        let token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
