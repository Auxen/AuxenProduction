var express = require('express');
var router = express.Router();
var models = require('../models/models');
var SpotifyWebApi = require('spotify-web-api-node');
var User = models.User;
var Room = models.Room;
var existingRoomNames = ["yash", "mo", "ben"];

module.exports = function() {

  /* Check login page. */
  // router.use('/', function(req, res, next) {
  //   if (req.user) {
  //     if(req.user.premium === 'premium') next();
  //     else res.redirect('/notPremium');
  //   }
  //   else {
  //     //console.log("here");
  //     res.redirect('/login');
  //   }
  // })

  function ifRedirected(req, res, next){
    //console.log("1");
    if(req.user){
      //console.log("2");
      if(req.user.premium === 'premium'){
        User.findOne({spotifyId:req.user.spotifyId})
        .then(user => {
          if(!user.active)next()
          else res.redirect('/multipleTabs')
        })
      }
      else res.redirect('/notPremium');
    }
    else{
      //console.log("3");
      if(req.session){
        //console.log("4");
        req.session.redirectUrl = req.headers.referer || req.originalUrl || req.url;
        res.redirect('/login');
      }
    }
  }

  /* Get home page. */
  router.get('/', ifRedirected,function(req, res, next) {

      res.render('home', {
          spotifyId: req.user.spotifyId,
          imageURL: req.user.imageURL,
          username: req.user.username,
          accessToken: req.user.accessToken,
          refreshToken: req.user.refreshToken
      });
  });

  /* not Premium */
  router.get('/notPremium', ifRedirected,function(req, res, next){
      res.render('notPremium');
   })

  /* checks if user is already in room or not */
  router.get('/isActive', function(req, res, next) {
    //console.log('isActive', req.query.spotifyId);
    User.findOne({'spotifyId':req.query.spotifyId})
    .then(user => {
      //console.log('isActive', user);
      res.send({"active": user.active});
    })
    .catch(err => {
      console.log(err);
    })
  })

  /* multiple tabs error page */
  router.get('/multipleTabs', function(req, res, next){
    res.render('multipleTabs');
  })

  /* Get createRoom page. */
  router.get('/createRoom', ifRedirected ,function(req, res, next) {
    res.render('createRoom', {
      existingRoomNames: existingRoomNames
    });
  })

  /* Get list of available rooms. */
  router.get('/getRooms', ifRedirected,function(req, res, next) {
    Room.find(function(err, rooms) {
      var roomNameArray = [];
      roomNameArray = rooms.map(function(room) {
        return {roomName: room.roomName, roomId: room._id};
      })
      res.render('getRooms', {rooms: roomNameArray})
    })
  })

  /* Create a room */
  router.post('/createRoom', ifRedirected,function(req, res, next) {
    //console.log("reaching create Room in backend post");
    var roomName = req.body.roomNameBar;
    existingRoomNames.push(roomName);
    var newRoom = new Room({
      roomName: roomName,
      djRefreshToken: req.user.refreshToken,
      djSpotifyId: req.user.spotifyId,
      imageURL: req.user.imageURL,
      djName: req.user.username
    })
    newRoom.save(function(err, newRoom) {
      if (err) {
        res.redirect('/error')
      } else {
        res.redirect('/djRoom/' + newRoom._id);
      }
    })
  })

  /* renders room for dj */
  router.get('/djRoom/:roomId', ifRedirected,function(req, res, next) {
    var roomId = req.params.roomId;
    Room.findById(roomId)
    .then(room => {
      if(room && req.user.spotifyId === room.djSpotifyId){
          res.render('djRoom', {room})
      }
      else res.redirect('/');
    })
    .catch(err => {

      res.redirect('/error')

    })
  })

  /* Join a room, add to db array and render room page. */
  router.get('/joinRoom', ifRedirected,function(req, res, next) {
    ///console.log("joined room in database.");
    var roomId = req.query.roomId;
    Room.findById(roomId)
    .then(room => {
      var euser = room.usersInRoom.find(function(user){
        return user.spotifyId === req.user.spotifyId;
      })
      if(euser)return;
      else{
        var userObject = {
          spotifyId: req.user.spotifyId,
          imageURL: req.user.imageURL,
          username: req.user.username
        }
        room.usersInRoom.push(userObject);
        room.save(function(err, room) {
          if (err) {
            res.redirect('/error')
          } else {
            res.redirect('/userRoom/' + room._id);
          }
        })
      }
    })
    .catch( error => {
      res.redirect('/error')
    })
  })

  /* renders room for user */
  router.get('/userRoom/:roomId', ifRedirected ,function(req, res, next) {
    var roomId = req.params.roomId;
      Room.findById(roomId)
      .then(room => {
        room.djRefreshToken = "";
        res.render('userRoom', {room})
      })
      .catch(error => {
        res.redirect('/error')
      })
  });

  /* error */
  router.get('/error', ifRedirected,function(req, res){
    res.render('error')
  })

  /* closes room */
  router.get('/closeRoom/:name', ifRedirected,function(req, res, next) {
    var roomId = req.query.roomId;
    var roomName = req.params.name;
    Room.remove({'_id': roomId}).then(() => {
      existingRoomNames.splice(existingRoomNames.indexOf(roomName), 1);
      res.redirect('/');
    }).catch(error => {
      res.redirect('/error')
    })
  })

  /* makes user leave room, deletes him from db as well*/
  router.get('/leaveRoom', ifRedirected,function(req, res, next) {
    var roomId = req.query.roomId;
    Room.findById(roomId).then(room => {
      room.usersInRoom = room.usersInRoom.filter(function(user) {
        return user.spotifyId !== req.user.spotifyId;
      })
      room.save(function(err, room) {
        res.redirect('/');
      });
    }).catch(error => {
      res.redirect('/error')
    })
  })

  return router;
}
