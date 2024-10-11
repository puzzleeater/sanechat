const express = require("express");
const {createServer} = require("http");
const {Server} = require("socket.io");
const nocache = require("nocache");
const session = require("./mysession.js");
const {createUser, getUser, createMessage, getMessages} = require("./mystorage.js");

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
		return res.setHeader("location", "/enter").status(301).send();
	} else {
		res.status(200).render("home", {user});
	}
});

app.get("/enter", (req,res)=>{
	const {user} = req.session;
	if(user) return res.setHeader("location", "/").status(301).send();
	res.status(200).render("enter", {data:null});
});

//temp users
let tmpUsers = [
	{id:1, username: "Jamal", email: "jamal@gmail.com", password:"1234"},
	{id:2, username: "Lesa", email: "lesa@gmail.com", password:"4321"},
	{id:3, username: "Raine", email: "raine@gmail.com", password:"010101"},
	{id:4, username: "Nohn", email: "nohn@gmail.com", password:"990011aa11"}
];
//temp users

app.post("/signup", (req,res)=>{
	const {username, email, password} = req.body;
	if(username.toLowerCase() == "system") return res.setHeader("location", "/enter").status(301).send();
	const user = {username,email,password};
	createUser(user).then(result=>{
		req.session.user = result;
		req.session.save(err=>{
			return res.setHeader("location", "/chat").status(301).send();
		});
	}).catch(err=>{return res.setHeader("location", "/").status(301).send();});
});

app.post("/signin", (req,res)=>{
	const {email, password} = req.body;
	const user = {email,password};
	let findTmp = tmpUsers.find((userx, index)=>userx.email==email&&userx.password==password);
	console.log(findTmp, "zing");
	if(findTmp) {
		req.session.user = findTmp;
		req.session.save(err=>{
			res.setHeader("location", "/chat");
			res.sendStatus(301);
			return;
		});
	} else { return res.setHeader("location", "/").status(301).send(); }
	/*getUser(user).then(result=>{
		if(user) {
			req.session.user = result;
			req.session.save(err=>{
				res.setHeader("location", "/chat").status(301).send();
			});
		} else {
			res.setHeader("location", "/").status(301).send();
		}
	}).catch(err=>{ res.setHeader("location", "/").status(301).send(); });*/
});

app.get("/clear", (req,res)=>{
	req.session.destroy((err)=>{
		res.status(200).send("SESSION CLEARED!");
	});
});

app.get("/chat", (req,res)=>{
	const {user} = req.session;
	if(!user) {
		res.setHeader("location", "/").status(301).send();
	} else {
		res.status(200).render("chat", {user});
	}
});
app.get("/test/:id", (req,res)=>{
	new Promise(resolve,reject)=>{
		let {id} = req.params;
		if(id>0&&id<10) {
			resolve(id);
		} else {
			reject("Failed");
		}
	}).then(result => {
		res.status(200).send("<h1>Successful!</h1>");
	}).catch(err => {
		res.status(404).send("<h1>Failed!</h1>")
	});
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
		/*getMessages().then(messages=>{
			for(let i = messages.length-1; i >= 0; i--) {
				let message = messages[i];
				socket.emit("message", message.message, message.username, message.msg_id, message.user_id);
			}
		}).catch(errx=>{console.log(errx)});*/
		
		socket.on("disconnect", ()=>{
			io.emit("message", `User ${user.username} disconnected!`, "SYSTEM");
		});
		socket.on("message", (message)=>{
			/*createMessage(user, message).then(result=>{
				//                 message, username, message id, user id
				io.emit("message", message, user.username, result, user.id);
			}).catch(err=>{console.log(err)});*/
			io.emit("message", message, user.username, 0/*result*/, user.id);
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
