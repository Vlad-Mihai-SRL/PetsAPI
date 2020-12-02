const ObjectID = require("mongodb").ObjectID;

function getProfile(db, req, res) {
	mail = req.params.mail;
	if (true)
		db.collection("users").findOne({ email: mail }, (err, data) => {
			if (err || data == null) res.send({ reason: "Invalid" });
			else {
				delete data.password;
				delete data.email;
				res.send(data);
			}
		});
	else res.send({ reason: "Invalid ID" });
}

function getPost(db, req, res) {
	pid = req.params.id;
	if (ObjectID.isValid(pid)) {
		db.collection("posts").findOne({ _id: ObjectID(pid) }, (err, data) => {
			if (err || data == null) res.send({ reason: "invalid id" });
			else res.send(data);
		});
	} else res.send({ reason: "invalid id" });
}

function getFeed(db, req, res) {
	email = req.params.email;
	id = req.params.id;
	if (ObjectID.isValid(id)) {
		db.collection("sessions").findOne(
			{ _id: ObjectID(id), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "unknonwn" });
				else {
					db.collection("posts")
						.find()
						.toArray((err, items) => {
							if (err || items == null) res.send("no posts");
							else res.send(items);
						});
				}
			}
		);
	} else res.send({ reason: "invalid id" });
}

exports.getFeed = getFeed;
exports.getProfile = getProfile;
exports.getPost = getPost;
