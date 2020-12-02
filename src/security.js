const md5 = require("md5");
const ObjectID = require("mongodb").ObjectID;
const fs = require("fs");
const path = require("path");
const { type } = require("os");

function AddUser(db, req, res) {
	db.collection("users").insertOne(
		{
			email: req.body.email,
			username: req.body.username,
			password: md5(req.body.password),
			fullname: req.body.fullname,
			ownerdate: req.body.ownerdate,
			pets: req.body.pets
				.map((val) => {
					val.story = {};
					return val;
				})
				.filter((val) => {
					return true;
				}),
			friends: [],
		},
		(err, data) => {
			if (err)
				res.send({ reason: "Username already exists" }),
					console.log("Dupe key : ", req.body.username);
			else {
				fs.mkdirSync(
					path.join(__dirname, "..", "public", "users", req.body.email)
				);
				fs.mkdirSync(
					path.join(__dirname, "..", "public", "users", req.body.email, "0")
				);
				fs.createReadStream(
					path.join(__dirname, "..", "public", "defaultpp.png")
				).pipe(
					fs.createWriteStream(
						path.join(
							__dirname,
							"..",
							"public",
							"users",
							req.body.email,
							"0",
							"pp.png"
						)
					)
				);
				res.status(201).send();
			}
		}
	);
}

function Login(db, req, res) {
	db.collection("users").findOne({ email: req.body.email }, (err, data) => {
		if (err) res.send(), console.log(err);
		else if (data != null && data.password == md5(req.body.password)) {
			db.collection("sessions").insertOne(
				{ email: req.body.email, time: new Date() },
				(err, news) => {
					res.status(200).send({ id: news.insertedId });
				}
			);
		} else res.send({ reason: "wrong password/username" });
	});
}

function ValidateSession(db, req, res) {
	id = req.params.id;
	email = req.params.email;
	if (ObjectID.isValid(id))
		db.collection("sessions").findOne(
			{ _id: ObjectID(id), email: email },
			(err, data) => {
				if (data == null || err) res.send({ reason: "invalid/not found" });
				else res.status(200).send();
			}
		);
	else res.send({ reason: "invalid" });
}

function updateProfileAnimal(db, req, res) {
	ind = req.body.ind;
	sid = req.body.id;
	email = req.body.email;
	animal = req.body.animal;
	ownerdate = req.body.ownerdate;
	fname = req.body.fullname;
	console.log(fname);
	if (ObjectID.isValid(sid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (data == null || err) res.send({ reason: "invalid/not found" });
				else {
					db.collection("users").updateOne(
						{ email: email },
						{
							$set: {
								[`pets.${ind}`]: animal,
								fullname: fname,
								ownerdate: ownerdate,
							},
						},
						(err, data) => {
							if (err || data == null) res.send({ reason: "unknown" });
							else res.send();
						}
					);
				}
			}
		);
	else res.send({ reason: "invalid" });
}

async function changeProfilePic(db, req, res) {
	try {
		if (!req.files) {
			res.send({ reason: "no files uploaded" });
		} else {
			avatar = req.files.avatar;
			email = req.body.email;
			sessionID = req.body.id;
			ind = req.body.ind;
			console.log(email, sessionID, ind, avatar.name);
			if (ObjectID.isValid(sessionID)) {
				db.collection("sessions").findOne(
					{ _id: ObjectID(sessionID), email: email },
					(err, data) => {
						if (err || data == null) res.send({ reason: "wrong" });
						else {
							avatar.mv(
								path.join(
									__dirname,
									"..",
									"public",
									"users",
									email,
									ind,
									"pp.png"
								)
							);
							res.send();
						}
					}
				);
			} else res.send({ reason: "wrong sid" });
		}
	} catch (err) {
		res.send({ reason: "unknown" });
	}
}

async function addPost(db, req, res) {
	try {
		if (!req.files) {
			res.send({ reason: "no files uploaded" });
		} else {
			avatar = req.files.file;
			email = req.body.email;
			sessionID = req.body.id;
			ind = req.body.ind;
			content = req.body.content;
			typesx = req.body.typesx;
			if (ObjectID.isValid(sessionID)) {
				db.collection("sessions").findOne(
					{ _id: ObjectID(sessionID), email: email },
					(err, data) => {
						if (err || data == null) res.send({ reason: "unknown" });
						else {
							db.collection("posts").insertOne(
								{
									nrlikes: 0,
									likes: [],
									comments: [],
									author: email,
									ind: ind,
									content: content,
									typesx: typesx,
								},
								(err, data) => {
									if (err || data == null) {
										res.send({ reason: "unkown" });
									} else {
										if (typesx == "Photo")
											avatar.mv(
												path.join(
													__dirname,
													"..",
													"public",
													"users",
													email,
													ind,
													data.insertedId + ".png"
												)
											);
										else
											avatar.mv(
												path.join(
													__dirname,
													"..",
													"public",
													"users",
													email,
													ind,
													data.insertedId + ".mp4"
												)
											);
										res.send();
									}
								}
							);
						}
					}
				);
			} else res.send({ reason: "wrong" });
		}
	} catch (err) {
		res.send({ reason: "unknown" });
	}
}

exports.addPost = addPost;
exports.updateProfileAnimal = updateProfileAnimal;
exports.AddUser = AddUser;
exports.Login = Login;
exports.ValidateSession = ValidateSession;
exports.changeProfilePic = changeProfilePic;
