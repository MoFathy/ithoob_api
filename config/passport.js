const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const FacebookStrategy = require('passport-facebook');
const FacebookTokenStrategy = require('passport-facebook-token');
const TwitterTokenStrategy = require('passport-twitter-token');
const GooglePlusTokenStrategy = require('passport-google-plus-token');
const Op = require("sequelize").Op;

const models = require("../models");
const User = models.User;
const Admin = models.Admin;

const opts = {};
const {secretKey} = require("../config/keys");

const credentials = require("../config/keys").facebook;
const credentials_twitter = require("../config/keys").twitter;
const credentials_google = require("../config/keys").google;

const {client_id, client_secret} = credentials;
const {TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET} = credentials_twitter;
const {GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET} = credentials_google;

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secretKey;

var find_user_social = (id, name, email, done) => {
  User.findOne({
    where: {[Op.or]: [{social_id: id}, {email: email}]},
    // defaults:{
    // name: name,
    // email: email,
    // social_id: id}
  }).then(user => {
    // email exist but without social id
    if (user) {
      return User.update(
        {social_id: id, name},
        {where: {email: email}}
      ).then(() => {
        var returned = [user, 'old']

        done(null, returned)
      })
    } else {
      // return User.create({
      //   name: name,
      //   email: email,
      //   social_id: id
      // }).then(user => {
      //   var returned  = [user,'new']
      //   return done(null, returned)
      // })
      var returned = [{name: name, email: email}, 'new']
      return done(null, returned)
    }

  }).catch(err => {
    console.log(err)
    return done(null, false);

  });
}

var create_user_social = (id, name, email, done) => {
  User.findOne({
    where: {[Op.or]: [{social_id: id}, {email: email}]},
    // defaults:{
    // name: name,
    // email: email,
    // social_id: id}
  }).then(user => {
    // email exist but without social id
    if (user) {
      return User.update(
        {social_id: id, name},
        {where: {email: email}}
      ).then(() => {
        var returned = [user, 'old']

        done(null, returned)
      })
    } else {

      // var returned  = [user,'new']
      var returned = [{name: name, email: email, social_id: id}, 'new']

      return done(null, returned)

    }

  }).catch(err => {
    console.log(err)
    return done(null, false);

  });
}
module.exports = passport => {
  passport.use('jwt',
    new JwtStrategy(opts, (jwt_payload, done) => {
      User.findOne(
        {where: {id: jwt_payload.id}})
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
  passport.use('jwt-admin',
    new JwtStrategy(opts, (jwt_payload, done) => {
      Admin.findOne(
        {where: {id: jwt_payload.id}})
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
  passport.use('jwt-super-admin',
    new JwtStrategy(opts, (jwt_payload, done) => {
      Admin.findOne(
        {where: {id: jwt_payload.id, role: "super"}})
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
  passport.use('facebook', new FacebookTokenStrategy({
    clientID: client_id,
    clientSecret: client_secret,
    fbGraphVersion: 'v3.0'
  }, (accessToken, refreshToken, profile, done) => {
    // in real life: create or update user...
    find_user_social(profile.id, profile._json.name, profile._json.email, done)
  }
  ));

  passport.use(new TwitterTokenStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    options: {includeEmail: true},
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
  }, (token, tokenSecret, profile, done) => {
    console.log("here in profile")
    console.log(profile)
    find_user_social(profile.id, profile._json.name, profile._json.email, done)
  }
  ));

  passport.use(new GooglePlusTokenStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    passReqToCallback: true
  }, function (req, accessToken, refreshToken, profile, next) {
    find_user_social(profile.id, profile._json.displayName, profile._json.emails[0].value, next)
  }));

  passport.use('facebook-2', new FacebookTokenStrategy({
    clientID: client_id,
    clientSecret: client_secret,
    fbGraphVersion: 'v3.0'
  }, (accessToken, refreshToken, profile, done) => {
    // in real life: create or update user...
    create_user_social(profile.id, profile._json.name, profile._json.email, done)
  }
  ));

  passport.use('twitter-token-second', new TwitterTokenStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    options: {includeEmail: true},
    userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
  }, (token, tokenSecret, profile, done) => {
    console.log("req")

    create_user_social(profile.id, profile._json.name, profile._json.email, done)
  }
  ));

  passport.use('google-2', new GooglePlusTokenStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    passReqToCallback: true
  }, function (req, accessToken, refreshToken, profile, next) {
    create_user_social(profile.id, profile._json.displayName, profile._json.emails[0].value, next)
  }));


  // passport.use(new FacebookStrategy({
  //   clientID: client_id,
  //   clientSecret: client_secret,
  //   callbackURL: 'https://127.0.0.1:3000/facebook-token'
  // },  (accessToken, refreshToken, profile, done) => {
  //     console.log('in here')
  //     User.findOne({where: {social_id: profile.id}})
  //     .then(user => {
  //       if (user){
  //         return done(null, user);

  //       } else {
  //         return done(null, false);

  //       }
  //     })
  //     .catch(err => console.log(err));
  //     // console.log('>>>fbProfile::', profile);
  //     // in real life: create or update user...
  //     // console.log(done)
  //   }))
};
