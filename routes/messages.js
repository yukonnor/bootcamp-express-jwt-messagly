const express = require("express");
const router = new express.Router();

const ExpressError = require("../expressError");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const User = require("../models/user");
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const logged_in_username = req.user.username; // get from_username from token
        const message = await Message.get(req.params.id);

        // console.log(logged_in_username, message, message.from_username, message.to_username);

        if (
            logged_in_username === message.from_user.username ||
            logged_in_username === message.to_user.username
        ) {
            return res.json({ message });
        }

        throw new ExpressError("Unauthorized to view that message.", 400);
    } catch (err) {
        return next(err);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const { to_username, body } = req.body;
        const from_username = req.user.username; // get from_username from token
        const message = await Message.create({ from_username, to_username, body });
        return res.json({ message });
    } catch (err) {
        return next(err);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post("/:id/read", ensureLoggedIn, async function (req, res, next) {
    try {
        const logged_in_username = req.user.username; // get from_username from token
        const foundMessage = await Message.get(req.params.id);

        console.log(logged_in_username, foundMessage);

        if (logged_in_username === foundMessage.to_user.username) {
            const message = await Message.markRead(req.params.id);
            return res.json({ message });
        }

        throw new ExpressError("Unauthorized to update that message.", 400);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
