const mysql = require("mysql2");

//table maker
const usersTable = `create table if not exists users(
	id integer primary key auto_increment,
	username varchar(50) unique not null,
	email varchar(50) unique not null,
	password varchar(100) not null
)`;

//table messages
const messagesTable = `create table if not exists messages(
	id integer primary key auto_increment,
	message text,
	user_id integer not null,
	foreign key(user_id) references users(id)
)`;
//table messages

const makeTables = async(pool, sql) => {
	try {
		let [result] = await pool.query(sql);
		return result.affectedRows;
	} catch(e) {
		return 0;
	}
}
//table maker

//db
const dbOptions = {
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE,
	connectionLimit: 50
}

const pool = mysql.createPool(dbOptions).promise();
makeTables(pool, usersTable);
makeTables(pool, messagesTable);

const createUser = async(user)=>{
	try {
		let [result] = await pool.query("insert into users(username, email, password) values(?,?,?)", [user.username, user.email, user.password]);
		user.id = result.insertId;
		console.log(user);
		return user;
	} catch(e) {
		return null;
	}
}

const getUser = async(user)=>{
	try {
		let [result] = await pool.query("select * from users where email=? and password=?", [user.email, user.password]);
		return result[0];
	} catch(e) {
		return null;
	}
}

const createMessage = async(user, message)=>{
	try {
		let [result] = await pool.query("insert into messages(user_id, message) values(?,?)", [user.id, message]);
		console.log(result.insertId);
		return result.insertId;
	} catch(e) {
		return null;
	}
}

const getMessages = async(count=50)=>{
	try {
		let [results] = await pool.query("select messages.message, users.username, messages.id as msg_id, users.id as user_id from messages join users on messages.user_id=users.id order by msg_id desc limit ?", [count]);
		console.log(results);
		return results;
	} catch(e) {
		console.log(e);
		return [];
	}
}



module.exports = {
	createUser,
	getUser,
	createMessage,
	getMessages
}

