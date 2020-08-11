const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Message = new Schema({
    text: { type: String },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model("Message", Message);