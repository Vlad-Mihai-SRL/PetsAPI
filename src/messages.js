const e = require("express");
const { ObjectID } = require("mongodb");

function addMessage(db, req, res, pusher) {
	let senderid = req.body.senderid;
	let sid = req.body.sessionid;
	let senderemail = req.body.senderemail;
	let receiveremail = req.body.receiveremail;
	let receiverid = req.body.receiverid;
	let content = req.body.content;
	if (ObjectID.isValid(sid) && ObjectID.isValid(senderid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: senderemail },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong login" });
				else {
					res.send();
					db.collection("messages").insertOne(
						{
							sender: senderemail,
							receiver: receiveremail,
							content: content,
							seen: false,
							date: new Date(),
						},
						(err, data) => {
							pusher.trigger(receiveremail, "newmessage", {
								message: content,
								sender: senderemail,
								mid: data.insertedId,
							});
						}
					);
				}
			}
		);
	else res.send({ reason: "wrong login / user" });
}

function getMessages(db, req, res) {
	let email1 = req.params.email1;
	let email2 = req.params.email2;
	let sessionid = req.params.sessionid;
	if (ObjectID.isValid(sessionid)) {
		db.collection("sessions").findOne(
			{ _id: ObjectID(sessionid), email: email1 },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong session" });
				else
					db.collection("messages")
						.find({
							sender: {
								$in: [email1, email2],
							},
							receiver: { $in: [email1, email2] },
						})
						.toArray((err, items) => {
							if (err || items == null) res.send([]);
							else {
								res.send({
									list: items.sort((a, b) => {
										return new Date(a.date) - new Date(b.date);
									}),
								});
								db.collection("messages").updateMany(
									{ receiver: email1, sender: email2 },
									{ $set: { seen: true } }
								);
							}
						});
			}
		);
	} else res.send({ reason: "invalid session" });
}

function hasNewMessages(db, req, res) {
	let sid = req.params.id;
	let email = req.params.email;
	let email2 = req.params.email2;
	console.log("Entry : ", email2, email, sid);
	if (ObjectID.isValid(sid)) {
		console.log(email2);
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				console.log("Second Entry : ", req.params.email2, email2);
				if (err || data == null) res.send({ reason: "wrong id" });
				else {
					db.collection("messages")
						.find({ receiver: email, sender: req.params.email2, seen: false })
						.toArray((err, val) => {
							console.log(val);
							if (err || val == null || val.length == 0)
								res.send({ result: "no new messages" });
							else res.send({ result: "you have a new message" });
						});
				}
			}
		);
	} else res.send({ reason: "invalid" });
}

function seenMessage(db, req, res) {
	let sid = req.body.sessionid;
	let email = req.body.email;
	let mid = req.body.messageid;
	console.log(mid, sid, email);
	if (ObjectID.isValid(sid) && ObjectID.isValid(mid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (err || data == null) {
					res.send({ reason: "wrong sid" });
				} else
					db.collection("messages").updateOne(
						{ _id: ObjectID(mid), receiver: email },
						{ $set: { seen: true } },
						(err, data) => {
							res.send();
						}
					);
			}
		);
	else res.send({ reason: "invalid id" });
}

exports.seenMessage = seenMessage;
exports.hasNewMessages = hasNewMessages;
exports.getMessages = getMessages;
exports.addMessage = addMessage;
