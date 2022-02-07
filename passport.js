const passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  Models = require('./models.js'),
  passportJWT = require('passport-jwt');

let Users = Models.User,
  JWTStrategy = passportJWT.Strategy,
  ExtractJWT = passportJWT.ExtractJwt;

/**
 * @description Middleware logic for checking login credentials for a user.  
 * This is called when a user logs in.  
 * First ensures the user exists, then checks that the password is correct. 
 * Then, the user's LastActivityDate is set to the current time and the 
 * updated user object is returned.
 * @method loginStrategy
 * @returns {object} Returns true if credentials are valid, false otherwise
 */
passport.use(new LocalStrategy({
  usernameField: 'Email',
  passwordField: 'Password'
}, (email, password, callback) => {
  // Find the user in the database
  Users.findOne({ Email: email }, (error, user) => {
    if (error) {
      console.log(error);
      return callback(error);
    }

    // The user doesn't exist
    if (!user) {
      console.log('incorrect email or password');
      return callback(null, false, { message: 'Incorrect email or password' });
    }

    // The password is wrong
    if (!user.validatePassword(password)) {
      console.log('incorrect password');
      return callback(null, false, { message: 'Incorrect email or password' });
    }

    // Update the LastActivityDate for the user
    Users.findOneAndUpdate({ Email: email }, {
      $set: { LastActivityDate: new Date() }
    },
      { new: true })
      .then((updatedUserData) => {
        return callback(null, updatedUserData);
      })
      .catch((err) => {
        return callback(null, false,
          { message: 'Something went wrong when updating activity date' });
      });

  });
}));

/**
 * @description Middleware logic for checking JWT for a user.  
 * This is called when a user accesses any protected endpoints.  
 * Decodes the JWT and then checks to see if the encoded id 
 * exists on the server.
 * @method jwtStrategy
 * @returns {boolean} Returns true if JWT is valid, false otherwise
 */
passport.use(new JWTStrategy({
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, (jwtPayload, callback) => {
  return Users.findById(jwtPayload._id)
    .then((user) => {
      return callback(null, user);
    })
    .catch((error) => {
      return callback(error);
    });
}));