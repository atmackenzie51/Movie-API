const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const app = express();
const mongoose = require('mongoose');
const Models = require("./models.js");
const {check, validationResults} = require("express-validator");



const Movies = Models.Movie;
const Users = Models.User;

//mongoose.connect('mongodb://127.0.0.1:27017/cfDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connect(process.env.CONNECTION_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//setting up the logger
app.use(morgan('common'));

//setting the static files
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//Authenication
const cors = require("cors"); 
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');

let allowedOrigins = ['https://localhost:8080', 'http://testsite.com'];
app.use(cors({
    origin: (origin, callback) => {
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){ //if a specific origin is not found on the list of allowed origins
            let message = 'The CORS policy for this application does not allow access from origin ' + origin;
            return callback(new Error(message ), false);
        }
        return callback(null, true);
    }
}));

//this is the main screen of the site
app.get('/', (req, res)=>{
    res.send('Welcome to my top favorite movies!');
});

//Below is all the GET requests
// Get all movies
app.get('/movies', passport.authenticate('jwt', {session: false}), async (req, res)=> {
    await Movies.find()
    .then((movies)=> {
        res.status(201).json(movies);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get movie data by movie title
app.get('/movies/:Title',passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({Title: req.params.Title})
    .then((movies) =>{
        res.json(movies);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get movie data by genre
app.get('/movies/genres/:Name',passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({'Genre.Name': req.params.Name})
    .then((movies) =>{
        res.json(movies.Genre);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get data about a director by name
app.get('/movies/directors/:Name',passport.authenticate('jwt', {session: false}), async (req, res) => {
    await Movies.findOne({'Director.Name': req.params.Name})
    .then((movies) =>{
        res.json(movies.Director);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get all users
app.get('/users', passport.authenticate('jwt', {session: false}), async (req, res)=> {
    await Users.find()
    .then((users)=>{
        res.status(201).json(users);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
app.get('/users/:Username', passport.authenticate('jwt', {session: false}), async (req,res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission Denied!');
    }
    
    await Users.findOne({Username: req.params.Username})
    .then((user) => {
        res.json(user);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


//POST requests
//Creating a new user
/* we will expect json in this format
{
    ID: Integer,
    Username: String,
    Password: String,
    Email: String,
    Birthday: Date
}*/
app.post('/users',
    [
        check('Username', 'Username is required.').isLength({min: 5}),
        check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
        check('Password', 'Password is requred').not().isEmpty(),
        check('Email', 'Email does not appear valid').isEmail()
    ], async (req, res) => {
        let errors = validationResults(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({errors: errors.array()});
        } 
   
    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username})
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password:hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday, 
            })
            .then((user) => {res.status(201).json(user)})
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error ' + error);
            })
        }
    })
    .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
    });
});

// adding a movie to a user's favorites list
app.post('/users/:Username/movies/:MovieID',passport.authenticate('jwt', {session: false}), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission Denied!');
    }
    
    await Users.findOneAndUpdate({ Username: req.params.Username}, {
        $push: { FavoriteMovies: req.params.MovieID}
    },
    {new: true})
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});


//PUT requests
// Update a user's info by username
/* expect in the following json format
{
    Username: String,
    (required)
    Password: String,
    (required)
    Email: String,
    (required)
    Birthday: Date
}*/
app.put('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res)=> {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission Denied!');
    }

    await Users.findOneAndUpdate({Username: req.params.Username}, 
        {$set: {
        Username: req.body.Username,
        Password:req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
        },
    },
    {new: true}) //this makes sure that the updated document is returned
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    })
});


//DELETE requests
// Delete a user by username
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), async (req, res) =>{
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission Denied!');
    }
    
    await Users.findOneAndRemove({Username: req.params.Username})
    .then((user)=> {
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// removing a movie to a user's favorites list
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), async (req, res) => {
    if(req.user.Username !== req.params.Username){
        return res.status(400).send('Permission Denied!');
    }
    
    await Users.findOneAndUpdate({ Username: req.params.Username}, {
        $pull: { FavoriteMovies: req.params.MovieID}
    },
    {new: true})
    .then((updatedUser) => {
        res.json(updatedUser);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//error handling
app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).json({error:'Something went wrong!'});
});



// listens for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});