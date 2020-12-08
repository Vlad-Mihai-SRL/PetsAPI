const e = require("express");
const { ObjectID } = require("mongodb");

function addMessage(db, req, res, pusher) {
	senderid = req.body.senderid;
	sid = req.body.sessionid;
	senderemail = req.body.senderemail;
	receiveremail = req.body.receiveremail;
	receiverid = req.body.receiverid;
	content = req.body.content;
	if (ObjectID.isValid(sid) && ObjectID.isValid(senderid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: senderemail },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong login" });
				else {
					pusher.trigger(receiveremail, "newmessage", {
						message: content,
						sender: senderemail,
						mid: data._id,
					});
					res.send();
					db.collection("messages").insertOne({
						sender: senderemail,
						receiver: receiveremail,
						content: content,
						seen: false,
						date: new Date(),
					});
				}
			}
		);
	else res.send({ reason: "wrong login / user" });
}

function getMessages(db, req, res) {
	email1 = req.params.email1;
	email2 = req.params.email2;
	sessionid = req.params.sessionid;
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
									{ sender: email1 },
									{ $set: { seen: true } }
								);
							}
						});
			}
		);
	} else res.send({ reason: "invalid session" });
}

function hasNewMessages(db, req, res) {
	sid = req.params.id;
	email = req.params.email;
	email2 = req.params.email2;
	if (ObjectID.isValid(sid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong id" });
				else {
					db.collection("messages").findOne(
						{ receiver: email, sender: email2, seen: false },
						(err, data) => {
							if (err || data == null) res.send({ result: "no new messages" });
							else res.send({ result: "you have a new message" });
						}
					);
				}
			}
		);
	else res.send({ reason: "invalid" });
}

function seenMessage(db, req, res) {
	sid = req.body.sessionid;
	email = req.body.email;
	mid = req.body.messageid;
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
