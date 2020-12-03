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
							else {
								res.send(
									items
										.sort((a, b) => {
											return new Date(b.date) - new Date(a.date);
										})
										.map((val) => {
											val.comments.reverse();
											return val;
										})
								);
							}
						});
				}
			}
		);
	} else res.send({ reason: "invalid id" });
}

function likePage(db, req, res) {
	sid = req.body.sessionid;
	postid = req.body.postid;
	email = req.body.email;
	if (ObjectID.isValid(postid) && ObjectID.isValid(sid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong session" });
				else {
					db.collection("posts").findOne(
						{ _id: ObjectID(postid) },
						(err, data) => {
							if (err || data == null) res.send({ reason: "wrong postid" });
							else {
								if (data.likes.includes(email))
									res.send({ reason: "already liked", sr: "liked already" });
								else {
									res.send();
									db.collection("posts").updateOne(
										{ _id: ObjectID(postid) },
										{ $inc: { nrlikes: 1 }, $push: { likes: email } }
									);
								}
							}
						}
					);
				}
			}
		);
	else res.send({ reason: "wrong id/ids" });
}

function addComment(db, req, res) {
	pid = req.body.postid;
	sessionid = req.body.sessionid;
	email = req.body.email;
	content = req.body.content;
	ind = req.body.ind;
	fullname = req.body.fullname;
	petname = req.body.petname;
	if (ObjectID.isValid(pid) && ObjectID.isValid(sessionid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sessionid), email: email },
			(err, data) => {
				if (err || data == null) res.send("wrong id");
				else {
					db.collection("posts").updateOne(
						{ _id: ObjectID(pid) },
						{
							$push: {
								comments: {
									author: email,
									date: new Date(),
									ind: ind,
									petname: petname,
									fullname: fullname,
									content: content,
								},
							},
						}
					);
					res.send();
				}
			}
		);
	else res.send({ reason: "invalid ids" });
}

exports.addComment = addComment;
exports.likePage = likePage;
exports.getFeed = getFeed;
exports.getProfile = getProfile;
exports.getPost = getPost;
