# NAVFAC API
 This is the API used with the NAVFAC Deep Foundation Design Tool built by Ryan Carpus. The API performs CRUD operations for user accounts and project data. The documentation is hosted with GitHub pages [here](http://localhost:5500/out/). The documentation for each endpoint is listed in the sidebar with the following naming convention:  
 `{http method} + {functionality}`  
 For example, the endpoint for user registration is named `POSTRegisterUser`.

## Backend Tech
This API is built with an Express.js server. Passwords are hashed before storing with the `bcript` library. JSON web tokens are utilized for persistent login sessions. A full list of API dependencies is listed in the snippet below taken from `package.json`:
```
  "dependencies": {
    "bcrypt": "^5.0.1",
    "body-parser": "^1.19.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.17.2",
    "express-validator": "^6.14.0",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^6.2.0",
    "morgan": "^1.10.0",
    "passport": "^0.5.2",
    "passport-jwt": "^4.0.0",
    "passport-local": "^1.0.0",
    "uuid": "^8.3.2"
  }
```