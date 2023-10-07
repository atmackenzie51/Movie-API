const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const app = express();
const mongoose = require('mongoose');
const Models = require("./models.js");


const Movies = Models.Movie;
const Users = Models.User;


mongoose.connect('mongodb://127.0.0.1:27017/cfDB', {useNewUrlParser: true, useUnifiedTopology: true});


//setting up the logger
app.use(morgan('common'));

//setting the static files
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//this is the main screen of the site
app.get('/', (req, res)=>{
    res.send('Welcome to myFlix Application!');
});

//Below is all the GET requests
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
app.get('/movies/:Title', async (req, res) => {
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
app.get('/movies/genres/:Name', async (req, res) => {
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
app.get('/movies/directors/:Name', async (req, res) => {
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
app.get('/users/:Username', async (req,res) => {
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
app.post('/users', async (req,res) => {
    await Users.findOne({ Username: req.body.Username})
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password:req.body.Password,
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
app.put('/users/:Username', async (req, res)=> {
    Users.findOneAndUpdate({Username: req.params.Username}, 
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

// removing a movie to a user's favorites list
app.delete('/users/:Username/movies/:MovieID', async (req, res) => {
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

//search movies by title
app.get('/movies/:title', (req, res)=>{
   const { title } = req.params;
   const movie = movies.find(movie => movie.Title === title);

   if (movie) {
         res.status(200).json(movie);   
     } else {
         res.status(400).send('movie does not exist')
     };
});

//search movies by genre
app.get('/movies/genre/:genreName', (req, res)=>{
   const { genreName } = req.params;
   const  genre  = movies.find(movie => movie.Genre.Name === genreName).Genre;

   if (genre) {
         res.status(200).json(genre);   
     } else {
         res.status(400).send('genre does not exist')
     };
});

//search movies by director
app.get('/movies/directors/:directorName', (req, res)=>{
   const { directorName } = req.params;
   const  director = movies.find(movie => movie.Director.Name === directorName).Director;
   
   if (director) {
         res.status(200).json(director);   
     } else {
         res.status(400).send('director cannot be found')
     };
});

//users can register
app.post('/users', (req, res) => { 
    const newUser = req.body;

    if (newUser.name){
        newUser.id = uuid.v4();
        users.push(newUser);
        res.status(201).send(newUser);
        
    } else {
        const message = 'missing username in request body';
        res.status(400).send(message);
    }
});

//users can update their user info
app.put('/users/:id', (req, res) => {
    const {id} = req.params; 
    const updatedUser = req.body;

    let user = users.find( user => user.id == id);

    if (user) {
        user.name = updatedUser.name;
        res.status(200).json(user);
    } else {
        res.status(400).send('no such user')
    };

});

//users can add a movie to their favorites
app.post('/users/:id/:movieTitle', (req, res) => {
    const {id, movieTitle} = req.params; 

    let user = users.find( user => user.id == id);

    if (user) {
        user.favoriteMovies.push(movieTitle);
        res.status(200).send(`${movieTitle} has been added to user ${id}'s favorites`);
    } else {
        res.status(400).send('no such user')
    }

});

//users can delete a movie from their favorites
app.delete('/users/:id/:movieTitle', (req, res) => {
 const {id, movieTitle} = req.params; 

    let user = users.find( user => user.id == id);

    if (user) {
        user.favoriteMovies = user.favoriteMovies.filter( title => title !== movieTitle);
        res.status(200).send(`${movieTitle} has been removed from user ${id}'s favorites`);
    } else {
        res.status(400).send('no such user')
    }

});


//users can delete their user account
app.delete('/users/:id', (req, res) => {
    const {id} = req.params; 
    let user = users.find( user => user.id == id);

    if (user) {
        users = users.filter( user => user.id != id);
        res.status(200).send(`user ${id} has been deleted`);
    } else {
        res.status(400).send('no such user')
    }
});




//error handling
app.use((err, req, res, next)=> {
    console.error(err.stack);
    res.status(500).json({error:'Something went wrong!'});
});



// listens for requests
app.listen(8080, ()=> {
    console.log('Your app is listening on port 8080')
});