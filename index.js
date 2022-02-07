if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express'),
  morgan = require('morgan'),
  uuid = require('uuid'),
  mongoose = require('mongoose'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  Models = require('./models.js');

const app = express();
const Users = Models.User;
const { check, validationResult } = require('express-validator');

/* Connect to mongodb */
/* This is an example connection if we are using a locally installed DB */
// mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
/* This is the line I will use when connecting to the host site */
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });
/* This is the connection I will use when developing and using online database */
// mongoose.connect('redacted', { useNewUrlParser: true, useUnifiedTopology: true });

/* CORS configuration. Currently set to allow access from all origins.
  I can change this by uncommenting the code block beneath. */
app.use(cors()); // allows access from all origins
// let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'https://some-domain.com'];
// app.use(cors({
//   origin: (origin, callback) => {
//     if(!origin) return callback(null, true);
//     if(allowedOrigins.indexOf(origin) === -1){
//       let message = 'The CORS policy for this application doesn\'t allow access from the origin ' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));

app.use(bodyParser.json());

// Imports related to auth
const passport = require('passport');
app.use(passport.initialize());
require('./passport');
let auth = require('./auth')(app);

/* Logging middleware.  */
app.use(morgan('common'));

// make all files in /public available
app.use(express.static('public'));

// endpoint for home page
app.get('/', (req, res) => {
  let responseText = `This is the API for the NAVFAC pile design tool built by Ryan Carpus.`;
  res.send(responseText);
});

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('I am afraid something has gone terribly, horribly wrong.');
});

// open server
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Your app is listening on port 8080.');
});

/**
 * @description Endpoint to add a new user. 
 * Does not require authorization JWT.
 * @method POSTRegisterUser
 * @param {string} endpoint - /users/register
 * @param {req.body} object - JSON object as below:
 * <pre><code>
 * {
 *    "FirstName": "John",
 *    "LastName": "Doe",
 *    "Password": "aStrNgPAsSw0rd",
 *    "Email" : "johndo@gmail.com",
 *    "Company" : "John Doe Consulting"
 * }
 * </code></pre>
 * @returns {object} - JSON object containing data for the new user. 
 * <pre><code>
 * {
 *    "FirstName": "John",
 *    "LastName": "Doe",
 *    "Email": "johndo@gmail.com",
 *    "Company": "John Doe Consulting",
 *    "Password": "$2b$10$6NLh9uzJslpepm7EM29X1uX7NTeULei9tXxhACff4.RySY6vjYvZi",
 *    "AccountCreatedDate": "2022-02-07T14:15:29.125Z",
 *    "AccountModifiedDate": "2022-02-07T14:15:29.125Z",
 *    "LastActivityDate": "2022-02-07T14:15:29.125Z",
 *    "Projects": [],
 *    "_id": "620129819a9731ce784dbcb2",
 *    "__v": 0
 * }
 * </code></pre>
 */
app.post('/users/register',
  [
    //check with express-validator
    check('FirstName', 'FirstName is required.').isAlpha('en-US', { ignore: '\s' }),
    check('LastName', 'LastName is required').isAlpha('en-US', { ignore: '\s' }),
    check('Company', 'Company is required').isAlpha('en-US', { ignore: '\s' }),
    check('Password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    check('Email', 'Email does not appear to be valid').isEmail()
  ],
  (req, res) => {
    /* If there were validation errors, send that back */
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    /* If there were no errors in the POST format, attempt to register the user */
    let hashedPassword = Users.hashPassword(req.body.Password);
    /* If there is already a user with that email, do not register */
    Users.findOne({ Email: req.body.Email })
      .then((user) => {
        if (user) {
          return res.status(400).send(req.body.Email +
            ' is already linked to an existing account.');
        } else { // It is alright to register the user now
          Users.create({
            FirstName: req.body.FirstName,
            LastName: req.body.LastName,
            Email: req.body.Email,
            Company: req.body.Company,
            Password: hashedPassword,
            AccountCreatedDate: new Date(),
            AccountModifiedDate: new Date(),
            LastActivityDate: new Date(),
            Projects: [],
          })
            // send the new user data back in the response
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

/**
 * @description Endpoint to delete an existing user account. 
 * Requires valid JWT, and the email encoded in the JWT must match the email 
 * for the account to be deleted.
 * @method DELETEUser
 * @param {string} endpoint - /users/:Email
 * @param {req.body} none - No request body is required.
 * @returns {string} - "<:Email> was deleted".
 */
app.delete('/users/:Username',
  passport.authenticate('jwt', { session: false }), (req, res) => {
    const loggedInUser = req.user.Email;
    const searchedUser = req.params.Email;
    if (loggedInUser !== searchedUser) return res.status(401)
      .send('Hey, how about you try accessing your own data?');


    Users.findOneAndRemove({ Email: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


/**
 * @description Endpoint to get all data for a user. 
 * Requires valid JWT, and the ID encoded in the JWT must match the email 
 * for the account to be deleted.
 * @method GETFullUserData
 * @param {string} endpoint - /users/:ID
 * @param {req.body} none - No request body is required.
 * @returns {object} - JSON object containing all data for the user. 
 * <pre><code>
 * {
 *    "FirstName": "John",
 *    "LastName": "Doe",
 *    "Email": "johndo@gmail.com",
 *    "Company": "John Doe Consulting",
 *    "Password": "$2b$10$6NLh9uzJslpepm7EM29X1uX7NTeULei9tXxhACff4.RySY6vjYvZi",
 *    "AccountCreatedDate": "2022-02-07T14:15:29.125Z",
 *    "AccountModifiedDate": "2022-02-07T14:15:29.125Z",
 *    "LastActivityDate": "2022-02-07T14:15:29.125Z",
 *    "Projects": {Array.<object>},
 *    "_id": "620129819a9731ce784dbcb2",
 *    "__v": 0
 * }
 * </code></pre>
 */
app.get('/users/:ID',
  passport.authenticate('jwt', { session: false }), (req, res) => {
    console.log(loggedInUser, searchedUser);
    if (loggedInUser !== searchedUser) return res.status(401)
      .send('Hey, how about you try accessing your own data?');

    Users.findOne({ _id: req.params.ID })
      .then((user) => {
        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  });


