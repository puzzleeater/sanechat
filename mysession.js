const session = require("express-session");
const mysqlStore = require("express-mysql-session")(session);
const mysql = require("mysql2");

//store
const dbOptions = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE,
	connectionLimit: 50
}

const sessionStore = new mysqlStore(dbOptions);
//store

//session
const sessionOptions = {
	secret: "bakjfeljkf3liwfhew@#wfejsSDq2!sddFGSBP",
	saveUninitialized: false,
	resave: true,
	store: sessionStore
};

const mySession = session(sessionOptions);
//session

module.exports = mySession;

