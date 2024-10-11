let userList = [];
let lastUserId = 0;

let msgList = [];
let lastMsgId = 0;

const createUser = async(user)=>{
	try {
		let result = await new Promise((resolve,reject)=>{
			const found = userList.find((v,i)=>(v.email==user.email&&v.username==user.username));
			if(!found) {
				user.id = lastId++;
				userList.push(user);
				resolve(user);
			} else {
				resolve(null);
			}
		});
		return result;
	} catch(e) {
		return null;
	}
}

const getUser = async(user)=>{
	try {
		let result = await new Promise((resolve,reject)=>{
			let found = userList.find((v,i)=>(v.username==user.username&&v.email==user.email&&v.password==user.password));
			if(found) {
				resolve(found);
			} else {
				resolve(null);
			}
		});
		return result;
	} catch(e) {
		return null;
	}
}

const createMessage = async(user, message)=>{
	try {
		let result = await new Promise((resolve,reject)=>{
			let msg = {user_id:user.id, msg_id:lastMsgId, username:user.username, message:message};
			msgList.push(msg);
			resolve(msg);
		});
		return result;
	} catch(e) {
		return null;
	}
}

const getMessages = async(count=50)=>{
	try {
		let results = await new Promise((resolve,reject)=>{
			let messages = msgList.split(count);
			resolve(messages);
		});
		return results;
	} catch(e) {
		console.log(e);
		return [];
	}
}
//for testing
const getUsers = ()=>{
	return userList;
}



module.exports = {
	createUser,
	getUser,
	createMessage,
	getMessages,
	getUsers
}

