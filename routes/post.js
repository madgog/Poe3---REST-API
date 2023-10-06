const express = require('express');
const User = require('../models/user');
const Post = require('../models/posts');
const mongoose = require('mongoose');

const router = express.Router();

router.use(express.json());


//  CHECK IS USER IS LOGER
function checkForLogin(req, res, next) {
    return (!req.user ? res.status(403).send({ Message: "You have to login first!" }) : next());
}

// CHECK IF POST EXISTS
async function checkIfPostExists(req, res, next) {
        if ( !mongoose.isValidObjectId(req.params.postId) ) {
            return res.status(401).send({ Message: "Post ID is needed!"})
        } else if ( !await Post.exists({ _id: req.params.postId }) ) {
            return res.status(404).send({ Message: "Post doesn't exist!" });
        }
        next();
}

const checks = [checkForLogin, checkIfPostExists]


// GET ALL POSTS
router.get('/:page?', async (req, res) => {
    let limit = 10;
    let page = req.params.page || 0;
    Post.find({}, "-__v", { skip: page * (limit - 1), limit: limit})
        .lean()
        // .select("-__v")
        .populate("author", "-_id username")
        // .skip(page * (limit - 1))
        // .limit(limit)
        .exec(function(err, posts){
            if (err) console.log(err);

            return res.status(200).send(posts);
        })
})


// GET POST
router.get("/post/:postId",checkIfPostExists ,(req, res) => {
    Post.findById(req.params.postId)
        .lean()
        .select("-__v")
        .populate("author", "-_id username")
        .exec(function (err, post) {
            if (err) console.log(err);
            if (!post) return res.status(404).send({ Error: "Post does not exists!"});

            return res.status(200).send({...post, likes: post.likes.length});
        });
});


// CREATE POST
router.post('/create', checkForLogin, async (req, res) => {
    let author = await User.findById(req.user.id);

    let newPost = new Post({
        title: req.body.title,
        content: req.body.content,
        author: author._id,
    });

    try {
        await newPost.save()
            .then((post) => {
                author.posts.push(newPost._id);
                author.save().catch((err) => { console.log(err) });
                return res.status(301).redirect(`/posts/${post._id}`)
            })
            .catch((err) => {
                    let errors = {}
                    if (err instanceof mongoose.Error.ValidationError) {
                        Object.keys(err.errors).forEach(key => {
                            errors[key] = err.errors[key].message;
                    })
                    return res.status(400).send(errors);
                }
            });
    }
    catch (err) {
            console.log(err);
        }
})

// UPDATE POST
router.put('/update/:postId',checks , (req, res) => {
    Post.findOneAndUpdate({ _id: req.params.postId, author: req.user.id }, { title: req.body.title, content: req.body.content, updatedAt: Date.now() }, { new: true },
    function (err, post) {
        if (err) return res.status(500).send(err);
        if (!post) return res.status(401).send({ Message: "Access Denied"});

        return res.status(200).send(post);
    })
});


// DELETE POST
router.delete("/delete/:postId",checks , (req, res) => {
    Post.findOneAndDelete({ _id: req.params.postId, author: req.user.id }, function (err, post) {
        if (err) return res.status(500).send(err);
        if (!post) return res.status(401).send({ Message: "Access Denied"});
        
        res.status(200).send({
            Message: "Success",
        });
        return res.redirect(301, "/posts/")
    });
});


// LIKE POST
router.post("/like/:postId",checks ,async (req, res) => {
    let author = await User.findById(req.user.id);
    let post = await Post.findById(req.params.postId);

    if (author.likes.includes(post._id)) {
        return res.redirect(301, "/posts/" + post._id);
    } else {
        author.likes.push(post._id);
        post.likes.push(author._id);
        author.save();
        post.save();
        return res.redirect(301, "/posts/" + post._id);
    }
});

module.exports = router;