const jwtSecret = 'your_jwt_secret'; // has to be the same key used in the JWTStrategy

const jwt = require('jsonwebtoken');
const passport = require('passport');

require('./passport'); //the local passport file


let generateJWTToken = (user) => {
    return jwt.sign(user, jwtSecret, {
        subject: user.Username, //username getting encoded with JWT
        expiresIn: '7d', // specifies token expires in 7 days
        algorithm: 'HS256' // this is the algorithm used to "sign" or encode values of the JWT
    });
}

/* POST Login. */
module.exports = (router) => {
    router.post('/login', (req, res) => {
        passport.authenticate('local', {session: false}, (error, user, info) => {
            if (error || !user) {
                return res.status(400).json({
                    message: 'Something is not right',
                    user: user
                });
            }
            req.login(user, {session: false}, (error) => {
                if (error) {
                    res.send(error);
                }
                let token = generateJWTToken(user.toJSON());
                return res.json({user, token});
            });
        })(req, res);
    });
}