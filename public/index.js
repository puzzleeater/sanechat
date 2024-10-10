let socket = io();

socket.on("connect", ()=>{
	console.log("Connected!");
});

socket.on("message", (message, username, messageId, userId)=>{
	console.log(messageId, userId);
	let lastMsg = null;
	try{
		lastMsg = [...document.querySelectorAll("#chatroom p")].filter((v,i) => v.getAttribute("data-msg")!="undefined").pop();
		if( Number(messageId) < Number(lastMsg.getAttribute("data-msg")) ) return;
	} catch(e) {
		console.log(e);
	}
	
	let p = document.createElement("p");
	p.setAttribute("data-msg", messageId);
	p.setAttribute("data-user", userId);
	
	let b = document.createElement("b");
	b.innerText = username + " ";
	
	let i = document.createElement("i");
	i.innerText = message;
	
	p.appendChild(b);
	p.appendChild(i);
	let chatroom = document.querySelector("#chatroom");
	chatroom.appendChild(p);
});

document.querySelector("#send").onclick = (e) => {
	let message = document.querySelector("#message").value;
	document.querySelector("#message").value = "";
	if(message.length <= 0) return;
	socket.emit("message", message);
};

document.querySelector("#setImage").onclick = (e) => {
	let url = document.querySelector("#imageUrl").value;
	document.querySelector("#imageUrl").value = "";
	socket.emit("image", url);
};