const jwtSecret = process.env.JWT_SECRET;

const jwt = require('jsonwebtoken'),
  passport = require('passport');

require('./passport'); // My local passport file, not the package


let generateJWTToken = (user) => {
  /**
   * I only want to encode the _id because
   * If I encode the whole user data, 
   * the JWT will get very large and will stop working.
   */
  let encodedData = {
    _id: user._id,
  };
  return jwt.sign(encodedData, jwtSecret, {
    subject: user.Email, // This is the email you’re encoding in the JWT
    expiresIn: '30d', // This specifies that the token will expire in 7 days
    algorithm: 'HS256'
  });
}

/**
 * @description Endpoint to login the user<br>
 * @method POSTLoginUser
 * @param {string} endpoint - /login?Email=[ID]&Password=[Password]
 * @returns {object} - JSON object containing minimal user data and a new JWT. 
 * <pre><code>
 * {
 *    user: {
 *      "_id": "620129819a9731ce784dbcb2"
 *    },
 *    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
 * }
 * </code></pre>
 */
module.exports = (router) => {
  router.post('/login', (req, res) => {
    passport.authenticate('local', { session: false }, (error, user, info) => {
      if (error || !user) {
        return res.status(400).json({
          message: 'Login failed',
          user: user
        });
      }
      req.login(user, { session: false }, (error) => {
        if (error) {
          res.send(error);
        }
        let token = generateJWTToken(user.toJSON());
        // I want to exclude the most data from the return object
        let trimmedUser = {
          _id: user._id
        }
        return res.json({ user: trimmedUser, token });
      });
    })(req, res);
  });
}