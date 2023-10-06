const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: { type: String, required: [true, "Title is needed!"] },
    content: { type: String, required: [true, "Content is needed"] },
    author: { type: Schema.Types.ObjectId, ref: "User", required: [true, "Author is needed"] },
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }]
});


postSchema.virtual('url').get(function() {
    return "/posts/" + this._id;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;