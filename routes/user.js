const express = require('express');
const argon2 = require('argon2');
const mongoose= require('mongoose');
const passport = require('passport');
const JSONStrategy = require('passport-local').Strategy;

const User = require('../models/user');

const router = express.Router();


passport.use(new JSONStrategy(
    function(username, password, done) {
        User.findOne({ username: username }, async function(err, user) {
            if (err) return done(err);
            if (!user) return done(null, false, { message: 'Incorrect username or password.' });
            // if (!argon2.verify(user.password, password)) return done(null, false, { message: 'Incorrect username or password.' });
            if (user.password != password) return done(null, false, { message: 'Incorrect username or password.' });
            
            return done(null, user);
    })
}))

passport.serializeUser(function(user, done) {
    process.nextTick(function() {
        done(null, {id: user.id, username: user.username})
    })
})

passport.deserializeUser(function(user, done) {
    process.nextTick(function() {
      return done(null, user);
    })
})

// Get user by username
router.get('/:username', async (req, res) => {
    User.findOne({ username: req.params.username })
        .lean()
        // .populate({"path": "posts", select: ["title"]})
        // .populate("posts", "title")
        // .populate("likes", "-_id title")
        .exec(function (err, user) {
            if (err) return res.status(503).send({ error: err });
            if (!user) return res.status(404).send({ Error: "User does't exist!"});

            return res.status(200).send({
                id: user.id,
                username: user.username,
                email: user.email,
        });
    })
})

// LOGIN - creating session
router.post('/login', passport.authenticate('json', { failureRedirect: '/'}), 
    function(req, res) {
        return res.status(200).send({username: req.user.username})
    }
);

// LOGING OUT - DELETING SESSION
router.post("/logout", function(req, res, next) {
    req.logout(function(err) {
        if (err) return next(err);
    })
    res.status(200).clearCookie('connect.sid', { path: "/" });
    res.redirect("/posts");
})

// Register
router.post('/register', async (req, res) => {
    if ( await User.exists({ username: req.body.username }) ) {
        return res.status(400).send({ Error: "Username already exists!" });
    } else if ( await User.exists( { email: req.body.email }) ) {
        return res.status(400).send({ Error: "Email already exists!"})
    } else {
        let newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: await argon2.hash(req.body.password)
        });
    
        await newUser.save()
            .then(() => res.redirect(307, "/users/login"))
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
})

module.exports = router;