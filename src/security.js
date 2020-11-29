const md5 = require("md5");
const ObjectID = require("mongodb").ObjectID;

function AddUser(db, req, res) {
	db.collection("users").insertOne(
		{
			email: req.body.email,
			username: req.body.username,
			password: md5(req.body.password),
			breed: req.body.breed,
			sex: req.body.sex,
			color: req.body.color,
			weight: req.body.weight,
			diet: req.body.diet,
			toys: req.body.toys,
			personality: req.body.personality,
			medical: req.body.medical,
			likes: req.body.likes,
			dislikes: req.body.dislikes,
			friends: [],
			story: {},
		},
		(err, data) => {
			if (err)
				res.status(409).send({ reason: "Username already exists" }),
					console.log("Dupe key : ", req.body.username);
			else res.status(201).send();
		}
	);
}

function Login(db, req, res) {
	db.collection("users").findOne({ email: req.body.email }, (err, data) => {
		if (err) res.status(400).send(), console.log(err);
		else if (data != null && data.password == md5(req.body.password)) {
			db.collection("sessions").insertOne(
				{ email: req.body.email, time: new Date() },
				(err, news) => {
					res.status(200).send({ id: news.insertedId });
				}
			);
		} else res.status(403).send({ reason: "wrong password/username" });
	});
}

function ValidateSession(db, req, res) {
	id = req.params.id;
	email = req.params.email;
	console.log(id, email);
	if (ObjectID.isValid(id))
		db.collection("sessions").findOne(
			{ _id: ObjectID(id), email: email },
			(err, data) => {
				console.log(data);
				if (data == null || err)
					res.status(400).send({ reason: "invalid/not found" });
				else res.status(200).send();
			}
		);
	else res.status(400).send({ reason: "invalid" });
}

exports.AddUser = AddUser;
exports.Login = Login;
exports.ValidateSession = ValidateSession;
