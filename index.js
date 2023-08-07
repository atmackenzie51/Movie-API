const express = require("express"),
    morgan = require("morgan");

const app = express();


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



//this is the main screen of the site
app.get('/', (req, res)=>{
    res.send('Welcome to my top favorite movies!');
});

// this will show top 3 movies when movies endpoint is requested
app.get('/movies', (req, res)=> {
    res.json(topMovies);
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