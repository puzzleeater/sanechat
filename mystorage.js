const mysql = require("mysql2");

const dbOptions = {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_DATABASE,
	connectionLimit: 50
};

const pool = mysql.createPool(dbOptions).promise();

//pool.query("show tables").then(result=>console.log(result)).catch(err=>console.log(err));

//table maker
const usersTable = `create table if not exists users(
	id integer primary key auto_increment,
	username varchar(15) unique not null,
	email varchar(40) unique not null,
	password varchar(20) not null
)`;

//table messages
const messagesTable = `create table if not exists messages(
	id integer primary key auto_increment,
	message text,
	type varchar(10),
	url text,
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

makeTables(pool, usersTable);
makeTables(pool, messagesTable);

const createUser = async(user)=>{
	try {
		let [result] = await pool.query("insert into users(username, email, password) values(?,?,?)", [user.username, user.email, user.password]);
		user.id = result.insertId;
		console.log("User created!");
		return user;
	} catch(e) {
		console.log("User creation failed!");
		return null;
	}
}

const getUser = async(user)=>{
	try {
		let [result] = await pool.query("select * from users where email=? and password=?", [user.email, user.password]);
		console.log("User fetched!");
		return result[0];
	} catch(e) {
		console.log("User fetching failed!");
		return null;
	}
}

const createMessage = async(user, message, type=null, url=null)=>{
	try {
		let [result] = await pool.query("insert into messages(user_id, message, type, url) values(?,?,?,?)", [user.id, message, type, url]);
		console.log(result.insertId);
		let msg = {user_id:user.id, msg_id:result.insertId, username:user.username, message:message, type:type, url:url};
		console.log("Message created!");
		return msg;
	} catch(e) {
		console.log("Message creation failed");
		return null;
	}
}

const getMessages = async(count=50)=>{
	try {
		let [results] = await pool.query("select messages.message, users.username, messages.id as msg_id, users.id as user_id, messages.type, messages.url from messages join users on messages.user_id=users.id order by msg_id desc limit ?", [count]);
		console.log(results);
		return results;
	} catch(e) {
		console.log(e);
		return [];
	}
}

const getUsers = async()=>{
	try {
		let [userList] = await pool.query("select * from users");
		return userList;
	} catch(e) {
		return [];
	}
}

module.exports = {
	createUser,
	getUser,
	createMessage,
	getMessages,
	getUsers
}