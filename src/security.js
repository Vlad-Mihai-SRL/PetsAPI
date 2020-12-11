const md5 = require("md5");
const ObjectID = require("mongodb").ObjectID;
const fs = require("fs");
const path = require("path");
const { type } = require("os");
const sharp = require("sharp");

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
				db.collection("friendrequest").insertOne(
					{ email: req.body.email, ind: "0", frlist: [] },
					(err, data) => {
						if (err || data == null) res.send({ reason: "Dupe keys?" });
						else {
							res.send();
						}
					}
				);
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
							"pp_min.webp"
						)
					)
				);
				fs.createReadStream(
					path.join(__dirname, "..", "public", "defaultcp.jpg")
				).pipe(
					fs.createWriteStream(
						path.join(
							__dirname,
							"..",
							"public",
							"users",
							req.body.email,
							"0",
							"cp_min.webp"
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
	let id = req.params.id;
	let email = req.params.email;
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
	let ind = req.body.ind;
	let sid = req.body.id;
	let email = req.body.email;
	let animal = req.body.animal;
	let ownerdate = req.body.ownerdate;
	let fname = req.body.fullname;
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
			let avatar = req.files.avatar;
			let email = req.body.email;
			let sessionID = req.body.id;
			let ind = req.body.ind;
			console.log(email, sessionID, ind, avatar.name);
			if (ObjectID.isValid(sessionID)) {
				db.collection("sessions").findOne(
					{ _id: ObjectID(sessionID), email: email },
					(err, data) => {
						if (err || data == null) res.send({ reason: "wrong" });
						else {
							fs.unlinkSync(
								path.join(
									__dirname,
									"..",
									"public",
									"users",
									email,
									ind,
									"cp" + "_min.webp"
								)
							);
							avatar
								.mv(
									path.join(
										__dirname,
										"..",
										"public",
										"users",
										email,
										ind,
										"pp.png"
									)
								)
								.then((val) => {
									sharp(
										path.join(
											__dirname,
											"..",
											"public",
											"users",
											email,
											ind,
											"pp" + ".png"
										)
									).toFile(
										path.join(
											__dirname,
											"..",
											"public",
											"users",
											email,
											ind,
											"pp" + "_min" + ".webp"
										),
										(err, info) => {
											if (err) console.log(err);
											fs.unlinkSync(
												path.join(
													__dirname,
													"..",
													"public",
													"users",
													email,
													ind,
													"pp" + ".png"
												)
											);
										}
									);
								});

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
			let avatar = req.files.file;
			let email = req.body.email;
			let sessionID = req.body.id;
			let ind = req.body.ind;
			let content = req.body.content;
			let petname = req.body.petname;
			let typesx = req.body.typesx;
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
									petname: petname,
									ind: ind,
									content: content,
									typesx: typesx,
									date: new Date(),
								},
								(err, data) => {
									if (err || data == null) {
										res.send({ reason: "unkown" });
									} else {
										if (typesx == "Photo") {
											fs.unlinkSync(
												path.join(
													__dirname,
													"..",
													"public",
													"users",
													email,
													ind,
													"cp" + "_min.webp"
												)
											);
											avatar
												.mv(
													path.join(
														__dirname,
														"..",
														"public",
														"users",
														email,
														ind,
														data.insertedId + ".jpg"
													)
												)
												.then((val) => {
													sharp(
														path.join(
															__dirname,
															"..",
															"public",
															"users",
															email,
															ind,
															data.insertedId + ".jpg"
														)
													).toFile(
														path.join(
															__dirname,
															"..",
															"public",
															"users",
															email,
															ind,
															data.insertedId + "_min" + ".webp"
														),
														(err, info) => {
															if (err) console.log(err);
															fs.unlinkSync(
																path.join(
																	__dirname,
																	"..",
																	"public",
																	"users",
																	email,
																	ind,
																	data.insertedId + ".jpg"
																)
															);
														}
													);
												});
										} else
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

async function changeProfileCover(db, req, res) {
	try {
		if (!req.files) {
			res.send({ reason: "no files uploaded" });
		} else {
			let avatar = req.files.avatar;
			let email = req.body.email;
			let sessionID = req.body.id;
			let ind = req.body.ind;
			console.log(email, sessionID, ind, avatar.name);
			if (ObjectID.isValid(sessionID)) {
				db.collection("sessions").findOne(
					{ _id: ObjectID(sessionID), email: email },
					(err, data) => {
						if (err || data == null) res.send({ reason: "wrong" });
						else {
							fs.unlinkSync(
								path.join(
									__dirname,
									"..",
									"public",
									"users",
									email,
									ind,
									"cp" + "_min.webp"
								)
							);
							avatar
								.mv(
									path.join(
										__dirname,
										"..",
										"public",
										"users",
										email,
										ind,
										"cp.png"
									)
								)
								.then((val) => {
									sharp(
										path.join(
											__dirname,
											"..",
											"public",
											"users",
											email,
											ind,
											"cp" + ".png"
										)
									).toFile(
										path.join(
											__dirname,
											"..",
											"public",
											"users",
											email,
											ind,
											"cp" + "_min" + ".webp"
										),
										(err, info) => {
											if (err) console.log(err);
											fs.unlinkSync(
												path.join(
													__dirname,
													"..",
													"public",
													"users",
													email,
													ind,
													"cp" + ".png"
												)
											);
										}
									);
								});

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

exports.changeProfileCover = changeProfileCover;
exports.addPost = addPost;
exports.updateProfileAnimal = updateProfileAnimal;
exports.AddUser = AddUser;
exports.Login = Login;
exports.ValidateSession = ValidateSession;
exports.changeProfilePic = changeProfilePic;
