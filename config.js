/** Common config for message.ly */

// read .env files and make environmental variables
// NOTE: typically this wouldn't be added to the repo. Keeping for notes / reference (nothing secret here).

require("dotenv").config();

const DB_URI =
    process.env.NODE_ENV === "test" ? "postgresql:///messagely_test" : "postgresql:///messagely";

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;

module.exports = {
    DB_URI,
    SECRET_KEY,
    BCRYPT_WORK_FACTOR,
};
