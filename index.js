const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const app = express();
const mongoose = require('mongoose');
const Models = require("./models.js");
const { check, validationResult } = require("express-validator");
const cors = require("cors");
const moment = require("moment-timezone");

const Movies = Models.Movie;
const Users = Models.User;

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Setting up the logger
app.use(morgan('common'));

// Serving static files
app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Authentication
app.use(cors());
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport');


// let allowedOrigins = [
//   'https://localhost:8080',
//   'http://localhost:1234',
//   'https://movieflix-app-d827ee527a6d.herokuapp.com'
// ];

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.indexOf(origin) === -1) { //if a specific origin is not found on the list of allowed origins
//       let message = 'The CORS policy for this application does not allow access from origin ' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));

//this is the main screen of the site
// Main screen of the site
/**
 * Main screen of the site
 * @name /
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/', (req, res) => {
  res.send('Welcome to myFlix Application!');
});

// Get all movies
/**
 * Get all movies
 * @name /movies
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/movies', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.find()
    .then((movies) => {
      res.status(201).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get movie data by movie title
/**
 * Get movie data by movie title
 * @name /movies/:Title
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ _id: req.params.Title })
    .then((movies) => {
      res.json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get movie data by genre
/**
 * Get movie data by genre
 * @name /movies/genres/:Name
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Genre.Name': req.params.Name })
    .then((movies) => {
      res.json(movies.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get data about a director by name
/**
 * Get data about a director by name
 * @name /movies/directors/:Name
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Movies.findOne({ 'Director.Name': req.params.Name })
    .then((movies) => {
      res.json(movies.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get all users
/**
 * Get all users
 * @name /users
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Users.find()
    .then((users) => {
      res.status(201).json(users);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Get a user by username
/**
 * Get a user by username
 * @name /users/:Username
 * @function
 * @memberof module:routes
 * @inner
 */
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission Denied!');
  }

  await Users.findOne({ Username: req.params.Username })
    .then((user) => {
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Create a new user
/**
 * Create a new user
 * @name /users
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} Username - The username of the user.
 * @param {string} Password - The password of the user.
 * @param {string} Email - The email of the user.
 * @param {date} Birthday - The birthday of the user.
 */
app.post('/users',
  [
    check('Username', 'Username is required.').isLength({ min: 5 }),
    check('Username', 'Username contains non alphanumeric characters - not allowed').isAlphanumeric(),
    check('Password', 'Password is requred').not().isEmpty(),
    check('Email', 'Email does not appear valid').isEmail()
  ], async (req, res) => {
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Username + 'already exists');
        } else {
          Users
            .create({
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday,
            })
            .then((user) => { res.status(201).json(user) })
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

// Add a movie to a user's favorites list
/**
 * Add a movie to a user's favorites list
 * @name /users/:Username/movies/:MovieID
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} Username - The username of the user.
 * @param {string} MovieID - The ID of the movie.
 */
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission Denied!');
  }

  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $push: { FavoriteMovies: req.params.MovieID }
  },
    { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Update a user's info by username
/**
 * Update a user's info by username
 * @name /users/:Username
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} Username - The username of the user.
 * @param {string} Password - The password of the user.
 * @param {string} Email - The email of the user.
 * @param {date} Birthday - The birthday of the user.
 */
app.put('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  let oldProfile = await Users.findOne({ Username: req.params.Username });

  let updatedProfile = {};

  // Check if a new password is defined, if so, hashes the new password
  if (req.body.Password) {
    updatedProfile.Password = Users.hashPassword(req.body.Password);
  }

  await Users.findOneAndUpdate({ Username: req.params.Username },
    {
      $set:
      {
        Username: req.body.Username || oldProfile.Username,
        Password: updatedProfile.Password || req.body.Password,
        Email: req.body.Email || oldProfile.Email,
        Birthday: req.body.Birthday || oldProfile.Birthday
      }
    },
    { new: true }) // This makes sure that the updated document is returned
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    })
}
);

// Delete a user by username
/**
 * Delete a user by username
 * @name /users/:Username
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} Username - The username of the user.
 */
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(404).send('Permission Denied!');
  }

  await Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
      if (!user) {
        res.status(404).send(req.params.Username + ' was not found');
      } else {
        res.status(204).send(req.params.Username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Remove a movie from a user's favorites list
/**
 * Remove a movie from a user's favorites list
 * @name /users/:Username/movies/:MovieID
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} Username - The username of the user.
 * @param {string} MovieID - The ID of the movie.
 */
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), async (req, res) => {
  if (req.user.Username !== req.params.Username) {
    return res.status(400).send('Permission Denied!');
  }

  await Users.findOneAndUpdate({ Username: req.params.Username }, {
    $pull: { FavoriteMovies: req.params.MovieID }
  },
    { new: true })
    .then((updatedUser) => {
      res.json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Search movies by title
/**
 * Search movies by title
 * @name /movies/:title
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} title - The title of the movie.
 */
app.get('/movies/:title', (req, res) => {
  const { title } = req.params;
  const movie = movies.find(movie => movie.Title === title);

  if (movie) {
    res.status(200).json(movie);
  } else {
    res.status(404).send('movie does not exist')
  };
});

// Search movies by genre
/**
 * Search movies by genre
 * @name /movies/genre/:genreName
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} genreName - The name of the genre.
 */
app.get('/movies/genre/:genreName', (req, res) => {
  const { genreName } = req.params;
  const genre = movies.find(movie => movie.Genre.Name === genreName).Genre;

  if (genre) {
    res.status(200).json(genre);
  } else {
    res.status(404).send('genre does not exist')
  };
});

// Search movies by director
/**
 * Search movies by director
 * @name /movies/directors/:directorName
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} directorName - The name of the director.
 */
app.get('/movies/directors/:directorName', (req, res) => {
  const { directorName } = req.params;
  const director = movies.find(movie => movie.Director.Name === directorName).Director;

  if (director) {
    res.status(200).json(director);
  } else {
    res.status(404).send('director cannot be found')
  };
});

// Users can register
/**
 * Users can register
 * @name /users
 * @function
 * @memberof module:routes
 * @inner
 */
app.post('/users', (req, res) => {
  const newUser = req.body;

  if (newUser.name) {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).send(newUser);

  } else {
    const message = 'missing username in request body';
    res.status(404).send(message);
  }
});

// Users can update their user info
/**
 * Users can update their user info
 * @name /users/:id
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} id - The ID of the user.
 */
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUser = req.body;

  let user = users.find(user => user.id == id);

  if (user) {
    user.name = updatedUser.name;
    res.status(200).json(user);
  } else {
    res.status(400).send('no such user')
  };

});

// Users can add a movie to their favorites
/**
 * Users can add a movie to their favorites
 * @name /users/:id/:movieTitle
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} id - The ID of the user.
 * @param {string} movieTitle - The title of the movie.
 */
app.post('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies.push(movieTitle);
    res.status(200).send(`${movieTitle} has been added to user ${id}'s favorites`);
  } else {
    res.status(400).send('no such user')
  }

});

// Users can delete a movie from their favorites
/**
 * Users can delete a movie from their favorites
 * @name /users/:id/:movieTitle
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} id - The ID of the user.
 * @param {string} movieTitle - The title of the movie.
 */
app.delete('/users/:id/:movieTitle', (req, res) => {
  const { id, movieTitle } = req.params;

  let user = users.find(user => user.id == id);

  if (user) {
    user.favoriteMovies = user.favoriteMovies.filter(title => title !== movieTitle);
    res.status(200).send(`${movieTitle} has been removed from user ${id}'s favorites`);
  } else {
    res.status(400).send('no such user')
  }

});

// Users can delete their user account
/**
 * Users can delete their user account
 * @name /users/:id
 * @function
 * @memberof module:routes
 * @inner
 * @param {string} id - The ID of the user.
 */
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  let user = users.find(user => user.id == id);

  if (user) {
    users = users.filter(user => user.id != id);
    res.status(200).send(`user ${id} has been deleted`);
  } else {
    res.status(400).send('no such user')
  }
});

// Error handling
/**
 * Error handling middleware
 * @name ErrorHandling
 * @function
 * @memberof module:middleware
 * @inner
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Listen for requests
/**
 * Listen for requests
 * @name Listen
 * @function
 * @memberof module:server
 * @inner
 */
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
