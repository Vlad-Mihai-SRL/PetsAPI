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

exports.addMessage = addMessage;
