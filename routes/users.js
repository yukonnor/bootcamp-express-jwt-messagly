const express = require("express");
const router = new express.Router();

const ExpressError = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const User = require("../models/user");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

//- only that user can view their get-user-detail route, or their from-messages or to-messages routes.

/** GET / - get list of users.
 * Only logged in users can acceess
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const users = await User.all();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});
// end

/** GET /:username - get detail of a user.
 *  Only that user can view their get-user-detail route.
 *  => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get("/:username", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});
// end

/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/to", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        const messages = await user.messagesTo();
        return res.json({ messages });
    } catch (err) {
        return next(err);
    }
});
// end

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get("/:username/from", ensureLoggedIn, ensureCorrectUser, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        const messages = await user.messagesFrom();
        return res.json({ messages });
    } catch (err) {
        return next(err);
    }
});
// end

module.exports = router;
