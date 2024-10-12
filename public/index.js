let socket = io();

socket.on("connect", ()=>{
	console.log("Connected!");
});

socket.on("message", (message, username, messageId, userId)=>{
	let lastMsg = null;
	try{
		lastMsg = [...document.querySelectorAll("#chatroom p")].filter((v,i) => v.getAttribute("data-msg")!="undefined").pop();
		if( Number(messageId) < Number(lastMsg.getAttribute("data-msg")) ) return;
	} catch(e) {
		console.log(e);
	} finally {
	
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
	}
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

//photo and video
document.querySelector("#sendPhoto").onclick = (e)=>{
	let photoUrl = document.querySelector("#photo").value.trim();
	if(photoUrl.length <= 0) return;
	document.querySelector("#photo").value = "";
	socket.emit("photo", photoUrl);
};

document.querySelector("#sendVideo").onclick = (e)=>{
	let videoUrl = document.querySelector("#video").value.trim();
	if(videoUrl.length <= 0) return;
	document.querySelector("#video").value = "";
	socket.emit("video", videoUrl);
};

socket.on("photo", (photoUrl, username, messageId, userId)=>{
	let lastMsg = null;
	try{
		lastMsg = [...document.querySelectorAll("#chatroom p")].filter((v,i) => v.getAttribute("data-msg")!="undefined").pop();
		if( Number(messageId) < Number(lastMsg.getAttribute("data-msg")) ) return;
	} catch(e) {
		console.log(e);
	} finally {
		let p = document.createElement("p");
		p.setAttribute("data-msg", messageId);
		p.setAttribute("data-user", userId);
		
		let b = document.createElement("b");
		b.innerText = username + " ";
		
		let i = document.createElement("img");
		i.src = photoUrl;
		console.log(photoUrl);
		p.appendChild(b);
		p.appendChild(i);
		let chatroom = document.querySelector("#chatroom");
		chatroom.appendChild(p);
	}
});

socket.on("video", (videoUrl, username, messageId, userId)=>{
	console.log("video shared");
	//reg
	let iframeRegex = /^[\<]iframe.*[\<][\/]iframe[\>]/gi; // /https:\/\/www.youtube.com/gi;
	let arr = iframeRegex.exec(videoUrl);
	let embedThing = null;
	if(!arr || arr.length < 1) {
		console.log("damn", arr);
		return;
	} else {
		embedThing = arr[0];
	}
	//reg
	let lastMsg = null;
	try{
		lastMsg = [...document.querySelectorAll("#chatroom p")].filter((v,i) => v.getAttribute("data-msg")!="undefined").pop();
		if( Number(messageId) < Number(lastMsg.getAttribute("data-msg")) ) return;
	} catch(e) {
		console.log(e);
	} finally {
		let p = document.createElement("p");
		p.setAttribute("data-msg", messageId);
		p.setAttribute("data-user", userId);
		let b = document.createElement("b");
		b.innerText = username + " ";
		p.appendChild(b);

		/*
		//video
		let vid = document.createElement("video");
		vid.width = "560";
		vid.height = "315";
		vid.controls = true;
		vid.autoplay = true;
		
		let vidSrc = document.createElement("source");
		vidSrc.type = "video/mp4";
		vidSrc.src = videoUrl;
		vid.appendChild(vidSrc);
		p.appendChild(vid);
		//video
		*/
		p.innerHTML += videoUrl;
		
		let chatroom = document.querySelector("#chatroom");
		chatroom.appendChild(p);
		console.log("video done");
	}
});

//photo and video