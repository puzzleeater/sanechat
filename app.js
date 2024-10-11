const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const nocache = require("nocache");
const session = require("./mysession.js");
const {createUser, getUser, createMessage, getMessages, getUsers} = require("./mockusers.js");

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
	}).catch(err=>{return res.status(301).setHeader("location", "/").send();});
});

app.post("/signin", (req,res)=>{
	const {email, password} = req.body;
	const user = {email,password};
	getUser(user).then(result=>{
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
	const users = getUsers();
	res.status(200).render("users". {users});
});
//app

//io

//io sess
const sessWrapper = (socket, next) => {
	session(socket.request, {}, next);
};
io.use(sessWrapper);
//io sess

io.on("connection", (socket)=>{
	const {user} = socket.request.session;
	if(!user) {
		socket.emit("message", "You are not logged in, Log in first!"); socket.disconnect();
	} else {
		getMessages().then(messages=>{
			for(let i = messages.length-1; i >= 0; i--) {
				let message = messages[i];
				socket.emit("message", message.message, message.username, message.msg_id, message.user_id);
			}
		}).catch(errx=>{console.log(errx)});
		
		socket.on("disconnect", ()=>{
			io.emit("message", `User ${user.username} disconnected!`, "SYSTEM");
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
		
		io.emit("message", `User ${user.username} connected!`, "SYSTEM");
	}
});
//io

httpServer.listen(port, ()=>{console.log(`Listening to port ${port}!`)});
