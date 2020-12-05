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
					pusher.trigger(receiverid + senderemail, "newmessage", {
						message: content,
					});
					res.send();
					db.collection("messages").insertOne({
						sender: senderemail,
						receiver: receiveremail,
						content: content,
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
								res.send(
									items.sort((a, b) => {
										new Date(a.date) - new Date(b.date);
									})
								);
							}
						});
			}
		);
	} else res.send({ reason: "invalid session" });
}

exports.getMessages = getMessages;
exports.addMessage = addMessage;
