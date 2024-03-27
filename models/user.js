/** User class for message.ly */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const ExpressError = require("../expressError");
const db = require("../db");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");

/** User of the site. */

class User {
    constructor(username, password, first_name, last_name, phone, join_at, last_login_at) {
        this.username = username;
        this.password = password;
        this.first_name = first_name;
        this.last_name = last_name;
        this.phone = phone;
        this.join_at = join_at;
        this.last_login_at = last_login_at;
    }

    /** register new user -- returns instance of User
     *
     */

    static async register({ username, password, first_name, last_name, phone }) {
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
                 RETURNING join_at, last_login_at`,
                [username, hashedPassword, first_name, last_name, phone]
            );

            // if no results something went wrong
            if (!newUserResult.rows[0]) {
                throw new ExpressError(
                    "Something went wrong when attempting to create user record.",
                    400
                );
            }

            // get the join_at and lastLogin timestamps from SQL query results
            let { join_at, last_login_at } = newUserResult.rows[0];

            return new User(
                username,
                hashedPassword,
                first_name,
                last_name,
                phone,
                join_at,
                last_login_at
            );
        } catch (err) {
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

            throw new ExpressError("Couldn't find user with that username.", 404);
        } catch (err) {
            return next(err);
        }
    }

    /** Update last_login_at for user */

    async updateLoginTimestamp() {
        try {
            const userResult = await db.query(
                `UPDATE users SET last_login_at = CURRENT_TIMESTAMP() WHERE username = $1 
                 RETURNING last_login_at`,
                [this.username]
            );

            if (!userResult.rows[0]) {
                throw new ExpressError("Couldn't find user with that username.", 404);
            }
        } catch (err) {
            return next(err);
        }
    }

    /** Return All: basic info on all users:
     * [User, User] */

    static async all() {
        try {
            const result = await db.query(
                `SELECT username, password, fist_name, last_name, phone, join_at, last_login_at 
                 FROM users`
            );
            return result.rows.map(
                (user) =>
                    new User(
                        user.username,
                        user.password,
                        user.fist_name,
                        user.last_name,
                        user.phone,
                        user.join_at,
                        user.last_login_at
                    )
            );
        } catch (err) {
            return next(err);
        }
    }

    /** Get: get user by username
     *
     * returns User instance */

    static async get(username) {
        try {
            const userResult = await db.query(
                `SELECT username, password, fist_name, last_name, phone, join_at, last_login_at 
                 FROM users
                 WHERE username = $1 `,
                [username]
            );

            const user = userResult.rows[0];

            if (!user) {
                throw new ExpressError("Couldn't find user with that username.", 404);
            }

            return new User(
                user.username,
                user.password,
                user.fist_name,
                user.last_name,
                user.phone,
                user.join_at,
                user.last_login_at
            );
        } catch (err) {
            return next(err);
        }
    }

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
