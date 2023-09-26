const express = require("express");
const morgan = require("morgan");
<<<<<<< Updated upstream

=======
const bodyParser = require("body-parser");
const uuid = require("uuid");
>>>>>>> Stashed changes
const app = express();
const mongoose = require('mongoose');
const Models = require("./models.js");

const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

mongoose.connect('mongodb://localhost:27017/cfDB', {useNewUrlParser: true, useUnifiedTopology: true});



//array of 3 movies
let topMovies =[
    {
        title: 'Lord of the Rings: Return of the King'
    },
    {
        title: 'Harry Potter and the Goblet of Fire'
    },
    {
        title: 'Rush Hour'
    }
];


//setting up the logger
app.use(morgan('common'));


//setting the static files
app.use(express.static('public'));


<<<<<<< Updated upstream

//this is the main screen of the site
app.get('/', (req, res)=>{
    res.send('Welcome to my top favorite movies!');
});

// this will show top 3 movies when movies endpoint is requested
app.get('/movies', (req, res)=> {
    res.json(topMovies);
});
=======
// Get all movies
app.get('/movies', async (req, res)=> {
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
app.get('/movies', async (req, res) => {
    await Movies.findOne({Title: req.params.Title})
    .then((movie) =>{
        res.json(movie);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get movie data by genre
app.get('/movies/:Genre', async (req, res) => {
    await Movies.find({Genre: req.params.Genre})
    .then((movie) =>{
        res.json(movie);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get data about a director by name
app.get('/movies/directors/:Name', async (req, res) => {
    await Movies.findOne({Director: req.params.Name})
    .then((movie) =>{
        res.json(movie);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

// Get all users
app.get('/users', async (req, res)=> {
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
app.get('/users', async (req,res) => {
    await Users.findOne({Username: req.params.Username})
    .then((user) => {
        res.json(user);
    })
    .catch((err)=> {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

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
app.put('/users/:Username', async (req, res)=> {
    await Users.findOneAndUpdate({Username: req.params.Username}, {$set:
        {
        Username: req.body.Username,
        Password:req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
        }
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




//Adding a User to the DB
/* we will expect json in this format
{
    ID: Integer,
    Username: String,
    Password: String,
    Email: String,
    Birthday: Date
}*/
app.post('/users', async (req, res) => {
    await Users.fineOne({ Username: req.body.Username })
        .then((user) => {
            if (user) {
            return res.status(400).send(req.body.Username + 'Already exists');
        } else {
            Users
                .create({
                    Username: req.body.Username,
                    Password: req.body.Password,
                    Email: req.body.Email,
                    Birthday: req.body.Birthday
                })
                .then((user) => { res.status(201).json(user) })
                .catch((error) => {
                    console.error(error);
                    res.status(500).send('Error: ' + error);
                })
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
        });
});

// adding a movie to a user's favorites list
app.post('/users/:Username/movies/:MovieID', async (req, res) => {
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


// Delete a user by username
app.delete('/users/:Username', async (req, res) =>{
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

>>>>>>> Stashed changes

//error handling
app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).json({error:'Something went wrong!'});
});



// listens for requests
app.listen(8080, ()=> {
    console.log('Your app is listening on port 8080')
});