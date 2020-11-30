const md5 = require("md5");
const ObjectID = require("mongodb").ObjectID;
const fs = require("fs");
const path = require("path");

function AddUser(db, req, res) {
	db.collection("users").insertOne(
		{
			email: req.body.email,
			username: req.body.username,
			password: md5(req.body.password),
			fullname: req.body.fullname,
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
							"pp"
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

exports.AddUser = AddUser;
exports.Login = Login;
exports.ValidateSession = ValidateSession;
