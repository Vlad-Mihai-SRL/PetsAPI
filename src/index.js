const { time } = require("console");
const { randomInt } = require("crypto");
const ObjectID = require("mongodb").ObjectID;
const express = require("express");
const md5 = require("md5");
const path = require("path");
const { title } = require("process");
const MongoClient = require("mongodb").MongoClient;
const dotenv = require("dotenv").config({ path: path.join(__dirname, ".env") });
const cors = require("cors");
const SecurityModule = require("./security");
const FunctionalityModule = require("./page_functionality");
const fs = require("fs");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const formidable = require("formidable");
const Pusher = require("pusher");
const MessageModule = require("./messages");
const busboy = require("busboy");
var bodyParser = require("body-parser");
const busboyBodyParser = require("busboy-body-parser");

async function main() {
	const uri = process.env.DB_URI;
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
	const pusher = new Pusher({
		appId: "1118434",
		key: "a7acd3d224d7106769ad",
		secret: "3aeeb7032cd2ed416b00",
		cluster: "eu",
		useTLS: true,
	});

	pusher
		.trigger("coaieverzi", "newmessage", {
			message: "Buna , lume ! ",
		})
		.catch((err) => {
			console.log(err);
		});
	await client.connect();
	db = client.db("Yappy");

	const app = express();
	app.use(express.json());
	app.use(cors());
	app.use(bodyParser.json());
	db.collection("users").createIndex({ fullname: "text", email: "text" });

	app.use("/public", express.static(path.join(__dirname, "..", "public")));

	app.get("/api/test", (req, res) => {
		res.send("hello world!");
	});

	app.post("/api/add-user", (req, res) => {
		SecurityModule.AddUser(db, req, res);
	});

	app.post(
		"/api/add-post",
		fileUpload({
			createParentPath: true,
			limits: {
				fileSize: 32 * 1024 * 1024,
			},
		}),
		async function (req, res) {
			SecurityModule.addPost(db, req, res);
		}
	);

	app.post("/api/login", (req, res) => {
		SecurityModule.Login(db, req, res);
	});

	app.post("/api/modify-animal", (req, res) => {
		SecurityModule.updateProfileAnimal(db, req, res);
	});

	app.post("/api/modify-profilepic/:id/:email/:ind", async (req, res) => {
		SecurityModule.changeProfilePic(db, req, res);
	});
	app.get("/api/check-session/:id/:email", (req, res) => {
		SecurityModule.ValidateSession(db, req, res);
	});
	app.get("/api/fetch-user/:mail", (req, res) => {
		FunctionalityModule.getProfile(db, req, res);
	});

	app.get("/api/fetch-post/:id", (req, res) => {
		FunctionalityModule.getPost(db, req, res);
	});

	app.get("/api/get-feed/:email/:id", (req, res) => {
		FunctionalityModule.getFeed(db, req, res);
	});

	app.post("/api/like-post", (req, res) => {
		FunctionalityModule.likePage(db, req, res);
	});

	app.post("/api/add-comment", (req, res) => {
		FunctionalityModule.addComment(db, req, res);
	});

	app.post("/api/add-friend-request", (req, res) => {
		FunctionalityModule.addFriendRequest(db, req, res);
	});

	app.post("/api/respond-to-friend-request", (req, res) => {
		FunctionalityModule.respondToFriendRequest(db, req, res);
	});

	app.post("/api/get-friend-requests", (req, res) => {
		FunctionalityModule.getFriendRequests(db, req, res);
	});

	app.get("/api/get-users", (req, res) => {
		FunctionalityModule.searchUsers(db, req, res);
	});

	app.post("/api/add-message", (req, res) => {
		MessageModule.addMessage(db, req, res, pusher);
	});
	app.get("/api/get-friend-list/:sessionid/:email", (req, res) => {
		FunctionalityModule.getFriendList(db, req, res);
	});
	app.get("/api/get-messages/:sessionid/:email1/:email2", (req, res) => {
		MessageModule.getMessages(db, req, res);
	});
	app.get("/api/has-new-messages-from-user/:id/:email/:email2", (req, res) => {
		MessageModule.hasNewMessagesFromUser(db, req, res);
	});
	app.get("/api/has-new-messages/:id/:email", (req, res) => {
		MessageModule.hasNewMessages(db, req, res);
	});
	app.get("/api/get-user-profile/:email", (req, res) => {
		FunctionalityModule.getUserProfile(db, req, res);
	});
	app.post("/api/seen-message", (req, res) => {
		MessageModule.seenMessage(db, req, res);
	});
	app.post("/api/change-profile-cover/:id/:email/:ind", async (req, res) => {
		SecurityModule.changeProfileCover(db, req, res);
	});
	app.post("/api/delete-post", (req, res) => {
		FunctionalityModule.deletePost(db, req, res);
	});
	app.listen(8080, () => {
		console.log("Started on port 8080");
	});
}

main();
