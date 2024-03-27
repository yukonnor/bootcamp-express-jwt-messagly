/** User class for message.ly */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ExpressError = require("../expressError");
const db = require("../db");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
    constructor(username, password, firstName, lastName, phone, joinAt, lastLoginAt) {
        this.username = username;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.joinAt = joinAt;
        this.lastLoginAt = lastLoginAt;
    }

    /** register new user -- returns instance of User
     *
     */

    static async register({ username, password, firstName, lastName, phone }) {
        try {
            const checkUsernameResult = await db.query(
                `SELECT username FROM users WHERE username = $1`,
                [username]
            );

            // if a user already exists with that username, throw error.
            if (checkUsernameResult.rows[0]) {
                throw new ExpressError("A user with that username already exists", 400);
            }

            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
            const newUserResult = await db.query(
                `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP()) 
                 RETURNING join_at as joinAt, last_login_at as lastLoginAt`,
                [username, hashedPassword, firstName, lastName, phone]
            );

            // if no results something went wrong
            if (!newUserResult.rows[0]) {
                throw new ExpressError(
                    "Something went wrong when attempting to create user record.",
                    400
                );
            }

            // get the joinAt and lastLogin timestamps from SQL query results
            let { joinAt, lastLoginAt } = newUserResult.rows[0];

            return new User(
                username,
                hashedPassword,
                firstName,
                lastName,
                phone,
                joinAt,
                lastLoginAt
            );
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    /** Authenticate: is this username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        try {
            const userResult = await db.query("SELECT password FROM users WHERE username = $1", [
                username,
            ]);

            let user = userResult.rows[0];

            if (user) {
                return await bcrypt.compare(password, user.password);
            }

            throw new ExpressError("Unable to find user.", 404);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {}

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    static async all() {}

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    static async get(username) {}

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesFrom(username) {}

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesTo(username) {}
}

module.exports = User;
