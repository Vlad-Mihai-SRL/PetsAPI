const e = require("express");
const { fromPairs } = require("lodash");
const { ObjectId } = require("mongodb");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;

function getProfile(db, req, res) {
	let mail = req.params.mail;
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
	let pid = req.params.id;
	if (ObjectID.isValid(pid)) {
		db.collection("posts").findOne({ _id: ObjectID(pid) }, (err, data) => {
			if (err || data == null) res.send({ reason: "invalid id" });
			else res.send(data);
		});
	} else res.send({ reason: "invalid id" });
}

function getFeed(db, req, res) {
	let email = req.params.email;
	let id = req.params.id;
	if (ObjectID.isValid(id)) {
		db.collection("sessions").findOne(
			{ _id: ObjectID(id), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "unknonwn" });
				else {
					db.collection("users").findOne({ email: email }, (err, data) => {
						if (err || data == null) res.send({ reason: "invalid email" });
						else {
							frlist = data.friends.map((val) => val.email);
							frlist.push(email);
							db.collection("posts")
								.find({ author: { $in: frlist } })
								.toArray((err, items) => {
									if (err || items == null) res.send("no posts");
									else {
										res.send(
											items
												.sort((a, b) => {
													return new Date(b.date) - new Date(a.date);
												})
												.slice(0, 1000)
												.map((val) => {
													val.comments.reverse();
													return val;
												})
										);
									}
								});
						}
					});
				}
			}
		);
	} else res.send({ reason: "invalid id" });
}

function likePage(db, req, res) {
	let sid = req.body.sessionid;
	let postid = req.body.postid;
	let email = req.body.email;
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
	let pid = req.body.postid;
	let sessionid = req.body.sessionid;
	let email = req.body.email;
	let content = req.body.content;
	let ind = req.body.ind;
	let fullname = req.body.fullname;
	let petname = req.body.petname;
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

function addFriendRequest(db, req, res) {
	let sid = req.body.sessionid;
	let toemail = req.body.toemail;
	let fromemail = req.body.fromemail;
	let fromind = req.body.fromind;
	let toind = req.body.toind;
	let frompetname = req.body.frompetname;
	let topetname = req.body.topetname;
	if (ObjectID.isValid(sid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: fromemail },
			(err, data) => {
				if (err || data == null) res.send({ reason: "invalid id" });
				else {
					db.collection("users").findOne({ email: fromemail }, (err, data) => {
						if (err || data == null) res.send({ reason: "doesnt exist" });
						else {
							isfound = false;
							var i = 0;
							for (i = 0; i < data.friends.length; i++)
								if (data.friends[i].email == toemail) {
									isfound = true;
									break;
								}
							if (isfound) res.send({ reason: "already friends" });
							else
								db.collection("friendrequest").updateOne(
									{ email: toemail },
									{
										$addToSet: {
											frlist: {
												email: fromemail,
												fromind: fromind,
												frompetname: frompetname,
												topetname: topetname,
												toind: toind,
											},
										},
									},
									(err, data) => {
										if (err || data == null) res.send({ reason: "unknown" });
										else res.send();
									}
								);
						}
					});
				}
			}
		);
	else res.send({ reason: "invalid id" });
}

function respondToFriendRequest(db, req, res) {
	let sid = req.body.sessionid;
	let toemail = req.body.toemail;
	let fromemail = req.body.fromemail;
	let fromind = req.body.fromind;
	let toind = req.body.toind;
	let frompetname = req.body.frompetname;
	let topetname = req.body.topetname;
	let tor = req.body.tor;
	if (ObjectID.isValid(sid))
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: toemail },
			(err, data) => {
				if (err || data == null) res.send({ reason: "invalid id" });
				else {
					db.collection("friendrequest").findOne(
						{ email: toemail },
						(err, data) => {
							let aux = {
								email: fromemail,
								fromind: fromind,
								frompetname: frompetname,
								topetname: topetname,
								toind: toind,
							};
							if (err || data == null) res.send({ reason: "unknown" });
							else {
								if (
									data.frlist.filter((val) => {
										return _.isEqual(val, aux);
									}).length > 0
								) {
									db.collection("friendrequest").updateOne(
										{ email: toemail },
										{
											$pull: {
												frlist: {
													email: fromemail,
													fromind: fromind,
													frompetname: frompetname,
													topetname: topetname,
													toind: toind,
												},
											},
										},
										(err, data) => {
											if (err || data == null) res.send({ reason: "unknown" });
											else {
												if (tor == "accepted") {
													db.collection("users").updateOne(
														{ email: fromemail },
														{
															$addToSet: {
																friends: { email: toemail, ind: toind },
															},
														}
													);
													db.collection("users").updateOne(
														{ email: toemail },
														{
															$addToSet: {
																friends: {
																	email: fromemail,
																	ind: fromind,
																},
															},
														}
													);
												} else {
												}

												res.send();
											}
										}
									);
								} else res.send({ reason: "invalid frreq" });
							}
						}
					);
				}
			}
		);
	else res.send({ reason: "invalid id" });
}

function getFriendRequests(db, req, res) {
	let sid = req.body.sessionid;
	let email = req.body.email;
	if (ObjectID.isValid(sid)) {
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "invalid id" });
				else {
					db.collection("friendrequest").findOne(
						{ email: email },
						(err2, data2) => {
							if (err2 || data2 == null) res.send({ reason: "invalid email" });
							else res.send(data2);
						}
					);
				}
			}
		);
	} else res.send({ reason: "unknown" });
}

function searchUsers(db, req, res) {
	let fullname = req.query.fullname;
	let petname = req.query.petname;
	db.collection("users")
		.find({ $text: { $search: fullname } })
		.toArray((err, data) => {
			if (err || data == null) res.send({ reason: "null" });
			else res.send(data);
		});
}

function getFriendList(db, req, res) {
	let sid = req.params.sessionid;
	let email = req.params.email;
	if (ObjectID.isValid(sid)) {
		db.collection("sessions").findOne(
			{ _id: ObjectID(sid), email: email },
			(err, data) => {
				if (err || data == null) res.send({ reason: "wrong login" });
				else
					db.collection("users").findOne({ email: email }, (err, data) => {
						if (err || data == null)
							res.send({ reason: "user does not exist" });
						else {
							frlist = data.friends.map((val) => val.email);
							db.collection("users")
								.find({ email: { $in: frlist } })
								.toArray((err, data) => {
									res.send(
										data.map((val) => {
											aux = {
												email: val.email,
												petname: val.pets[0].name,
												_id: val._id,
											};
											return aux;
										})
									);
								});
						}
					});
			}
		);
	} else res.send({ reason: "invalid sid" });
}

exports.getFriendList = getFriendList;
exports.searchUsers = searchUsers;
exports.getFriendRequests = getFriendRequests;
exports.respondToFriendRequest = respondToFriendRequest;
exports.addFriendRequest = addFriendRequest;
exports.addComment = addComment;
exports.likePage = likePage;
exports.getFeed = getFeed;
exports.getProfile = getProfile;
exports.getPost = getPost;
