const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");

const app = express();

app.use(bodyParser.json());

//setting up the logger
app.use(morgan('common'));

//setting the static files
app.use(express.static('public'));

//sample users
let users =[
    {
        id: 1, 
        name: "James",
        favoriteMovies: ["Rush Hour"]
    }
];

//sample list of movies
let movies =[
    {
        "Title": 'Lord of the Rings: Return of the King',
        "Genre": {
            "Name":'Fantasy',
        },
        "Director": {
            "Name":'Peter Jackson',
            "Birth": '1961'
        }
    },
    {
        "Title": 'Rush Hour',
        "Genre": {
            "Name":'Comedy',
            "Description": "Funny good times"
        },
        "Director": {
            "Name":'Brett Ratner',
            "Birth": '1969'
        }
    }
];


//this is the main screen of the site
app.get('/', (req, res)=>{
    res.send('Welcome to myFlix Application!');
});

// this will show a list of all movies when movies endpoint is requested
app.get('/movies', (req, res)=> {
   res.json(movies)
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