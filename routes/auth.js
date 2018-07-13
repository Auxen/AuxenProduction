var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;

module.exports = function(passport) {

  // main login routes

  router.get('/login',function(req,res){
    res.render('login');
  })

  router.get('/auth/spotify',
    passport.authenticate('spotify', {
      scope: ['user-read-email', 'user-read-private', 'user-modify-playback-state', 'user-read-playback-state']
    }
  ));

  router.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/login' }),
    function(req, res) {
      console.log("does it reach here",req.session.redirectUrl );
      var redirectionUrl = req.session.redirectUrl || '/';
      res.redirect(redirectionUrl);
      //res.redirect('/');
  });

  router.get('/logout',function(req,res){
    req.logout();
    res.redirect('/login');
  })

  return router;
}
