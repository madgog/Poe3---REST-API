const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const cors = require('cors');

const users = require('./routes/user');
const posts = require('./routes/post');

const app = express();
const port = 3001;

// app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Database
mongoose.connect("mongodb://localhost:27017/", { dbName: "poe3" }).
    catch(error => logError(error));
mongoose.connection.on('error', err => {
    logError(err);
});
mongoose.connection.once("open", () => {
    console.log("Database connection successful!");
});

// Session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ client: mongoose.connection.getClient() })
  }));


// Middlewares
app.use(passport.initialize());
app.use(passport.session());

function logError(error) {
    console.log(error)
}

// Routes
app.use('/users', users);
app.use('/posts', posts);

// Start listening
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}.`);
});