const passport = require("passport");
const TwitterStrategy = require("passport-twitter");
const keys = require("./keys");
const User = require("../models/user-model");
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;


OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  console.log("works");
  var options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
  };

  request(options, function (error, response, body) {
    if (response && response.statusCode == 200) {
      done(null, JSON.parse(body));
    } else {
      done(JSON.parse(body));
    }
  });
}


// serialize the user.id to save in the cookie session
// so the browser will remember the user when login
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize the cookieUserId to user in the database
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(e => {
      done(new Error("Failed to deserialize an user"));
    });
});

console.log("yeet+"+keys.TWITCH_CLIENT_ID);
passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
  tokenURL: 'https://id.twitch.tv/oauth2/token',
  clientID: keys.TWITCH_CLIENT_ID,
  clientSecret: keys.TWITCH_SECRET,
  callbackURL: "http://localhost:4000/auth/twitch/callback",
  state: true
},
async(accessToken, refreshToken, profile, done) => {
  profile.accessToken = accessToken;
  profile.refreshToken = refreshToken;

  // Securely store user profile in your DB
  //User.findOrCreate(..., function(err, user) {
  //  done(err, user);
  //});
  const currentUser = await User.findOne({
    twitterId: profile._json.id_str
  });

  if (!currentUser) {
    const newUser = await new User({
      name: profile._json.name,
      screenName: profile._json.screen_name,
      twitterId: profile._json.id_str,
      profileImageUrl: profile._json.profile_image_url
    }).save();
    if (newUser) {
      done(null, newUser);
    }
  }
  done(null, currentUser);
}
)
);

/*passport.use(new TwitterStrategy(
    {
      consumerKey: keys.TWITTER_CONSUMER_KEY,
      consumerSecret: keys.TWITTER_CONSUMER_SECRET,
      callbackURL: "/auth/twitter/redirect"
    },
    async (token, tokenSecret, profile, done) => {
      // find current user in UserModel
      const currentUser = await User.findOne({
        twitterId: profile._json.id_str
      });
      // create new user if the database doesn't have this user
      if (!currentUser) {
        const newUser = await new User({
          name: profile._json.name,
          screenName: profile._json.screen_name,
          twitterId: profile._json.id_str,
          profileImageUrl: profile._json.profile_image_url
        }).save();
        if (newUser) {
          done(null, newUser);
        }
      }
      done(null, currentUser);
    }
  )
);*/
