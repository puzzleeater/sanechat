const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const nocache = require("nocache");
const session = require("./mysession.js");
const {createUser, getUser, createMessage, getMessages, getUsers} = require("./mystorage.js");

const port = process.env.PORT || 80;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

//app
app.set("view engine", "ejs");
app.use(nocache());
app.use(session);
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static("./public"));

app.get("/", (req,res)=>{
	const {user} = req.session;
	if(!user) {
		return res.status(301).setHeader("location", "/enter").send();
	} else {
		res.status(200).render("home", {user});
	}
});

app.get("/enter", (req,res)=>{
	const {user} = req.session;
	if(user) return res.status(301).setHeader("location", "/").send();
	res.status(200).render("enter", {data:null});
});

app.post("/signup", (req,res)=>{
	const {username, email, password} = req.body;
	if(username.toLowerCase() == "system") return res.status(301).setHeader("location", "/enter").send();
	const user = {username,email,password};
	createUser(user).then(result=>{
		req.session.user = result;
		req.session.save(err=>{
			return res.status(301).setHeader("location", "/chat").send();
		});
	}).catch(err=>{console.log(e, "fucked!"); return res.status(301).setHeader("location", "/").send();});
});

app.post("/signin", (req,res)=>{
	const {email, password} = req.body;
	const user = {email,password};
	getUser(user).then(result=>{
		console.log(result);
		if(user) {
			req.session.user = result;
			req.session.save(err=>{
				res.status(301).setHeader("location", "/chat").send();
			});
		} else {
			res.status(301).setHeader("location", "/").send();
		}
	}).catch(err=>{ res.status(301).setHeader("location", "/").send(); });
});

app.get("/clear", (req,res)=>{
	req.session.destroy((err)=>{
		res.status(200).send("SESSION CLEARED!");
	});
});

app.get("/chat", (req,res)=>{
	const {user} = req.session;
	if(!user) {
		res.status(301).setHeader("location", "/").send();
	} else {
		res.status(200).render("chat", {user});
	}
});
//for test
app.get("/test/:id", (req,res)=>{
	const {id} = req.params;
	res.status(200).send(id);
});
app.get("/users", (req,res)=>{
	const {user} = req.session;
	getUsers().then(result=>{
		res.status(200).render("users", {users:result, user:user});
	}).catch(err=>{
		res.sendStatus(404);
	});
});

app.get("/messages", (req,res)=>{
	getMessages().then(messages=>{
		res.status(200).json(messages);
	}).catch(err=>{res.sendStatus(404);});
});

app.get("/logout", (req,res)=>{
	const {user} = req.session;
	if(!user) {
		res.status(301).setHeader("location", "/").send();
	} else {
		req.session.user = undefined;
		req.session.destroy((err)=>{
			console.log("logged out");
			res.status(301).setHeader("location", "/").send();
		});
	}
});
//app

//io

//io sess
const sessWrapper = (socket, next) => {
	session(socket.request, {}, next);
};
io.use(sessWrapper);
//io sess

let connectedUsers = {};
let onlineUsers = {};

io.on("connection", (socket)=>{
	const {user} = socket.request.session;
	if(!user) {
		socket.emit("message", "You are not logged in, Log in first!"); socket.disconnect();
	} else {
		if(!connectedUsers[""+user.id] || connectedUsers[""+user.id].length <= 0) {
			//io.emit("message", `User ${user.username} connected!`, "SYSTEM");
			connectedUsers[""+user.id] = [socket.id];
			onlineUsers[""+user.id] = {id:user.id, username:user.username};
			io.emit("userslist", onlineUsers);
		} else {
			connectedUsers[""+user.id].push(socket.id);
		}
		getMessages().then(messages=>{
			for(let i = messages.length-1; i >= 0; i--) {
				let message = messages[i];
				if(message.type==null) {
					socket.emit("message", message.message, message.username, message.msg_id, message.user_id);
				} else if(message.type=="photo") {
					socket.emit("photo", message.url, message.username, message.msg_id, message.user_id);
				} else if(message.type=="video") {
					console.log(message.url);
					socket.emit("video", message.url, message.username, message.msg_id, message.user_id);
				}
			}
		}).catch(errx=>{console.log(errx)});
		
		socket.on("disconnect", ()=>{
			//io.emit("message", `User ${user.username} disconnected!`, "SYSTEM");
			console.log("before",connectedUsers[""+user.id]);
			connectedUsers[""+user.id] = connectedUsers[""+user.id].filter((v,i)=>v!=socket.id);
			console.log(socket.id);
			console.log("after", connectedUsers[""+user.id]);
			if(!connectedUsers[""+user.id] || connectedUsers[""+user.id].length <= 0) {
				console.log("cocococococcooooo");
				delete onlineUsers[""+user.id];
				io.emit("userslist", onlineUsers);
				console.log("*****************************");
				console.log(onlineUsers, onlineUsers[""+user.id], "hoooooeee");
				console.log("*****************************");
			}
		});
		socket.on("message", (message)=>{
			createMessage(user, message).then(result=>{
				//                 message, username, message id, user id
				io.emit("message", message, user.username, result, user.id);
			}).catch(err=>{console.log(err)});
		});
		
		socket.on("image", url=>{
			socket.request.session.user.image = url;
			socket.request.session.save(err=>{console.log(err)});
		});
		
		//photo and video
		socket.on("photo", photoUrl=>{
			createMessage(user, null, "photo", photoUrl).then(result=>{
				io.emit("photo", photoUrl, user.username, result, user.id);
			}).catch(err=>{console.log(err)});
		});
		socket.on("video", videoUrl=>{
			console.log(videoUrl);
			createMessage(user, null, "video", videoUrl).then(result=>{
				console.log(result);
				io.emit("video", videoUrl, user.username, result, user.id);
				console.log(result);
			}).catch(err=>{console.log(err)});
		});
		//photo and video
	}
});
//io

httpServer.listen(port, ()=>{console.log(`Listening to port ${port}!`)});
