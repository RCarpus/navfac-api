const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @description data model for users
 * @method userSchema
 */
let userSchema = mongoose.Schema({
  FirstName: { type: String, required: true },
  LastName: { type: String, requried: true },
  Email: { type: String, required: true },
  Company: { type: String, required: true },
  Password: { type: String, required: true },
  AccountCreatedDate: { type: Date, required: true },
  AccountModifiedDate: { type: Date, required: true },
  LastActivityDate: { type: Date, required: true },
  Projects: [{
    CreatedDate: Date,
    ModifiedDate: Date,
    Meta: {
      Name: String,
      Client: String,
      Engineer: String,
      Notes: String,
    },
    SoilProfile: {
      GroundwaterDepth: Number,
      IgnoredDepth: Number,
      Increment: Number,
      LayerDepths: [Number],
      LayerNames: [String],
      LayerUnitWeights: [Number],
      LayerPhiOrCs: [String],
      LayerPhiOrCValues: [Number],
    },
    FoundationDetails: {
      PileType: String,
      Material: String,
      FS: Number,
      Widths: [[Number]],
      BearingDepths: [Number]
    }
  }]
});

/**
 * @method hashPassword
 * @description hashes the user's password. This is called before operating on 
 * the password given by the user.
 * @param {string} password 
 * @returns {string} hashed password
 */
userSchema.statics.hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
}


/**
 * @method validatePassword
 * @description hashes a password and compares it with the saved hash
 * @param {string} password 
 * @returns {boolean} true if passwords match. Otherwise false.
 */
userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.Password);
}

let User = mongoose.model('User', userSchema);

module.exports.User = User;