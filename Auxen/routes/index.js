var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var Room = models.Room;
var existingRoomNames = [];

/* Check login page. */
router.use('/', function (req, res, next) {
  if (req.user) {
    next();
  } else {
    console.log("here");
    res.redirect('/login');
  }
})

/* Get home page. */
router.get('/', function(req, res, next) {
  res.render('home', {
    spotifyId: req.user.spotifyId,
    imageURL: req.user.image,
    username: req.user.username
  });
});

/* Get createRoom page. */
router.get('/createRoom', function(req, res, next){
  res.render('createRoom', {
    existingRoomNames
  });
})

/* Get list of available rooms. */
router.get('/getRooms', function(req, res, next){
  Room.find(function(err, rooms){
    var roomNameArray = [];
    roomNameArray = rooms.map(function(room){
      return room.roomName;
    })
    existingRoomNames = roomNameArray;
    res.render('getRooms', {
      rooms: roomNameArray
    })
  })
})

/* Create a room and render djroom page. */
router.post('/createRoom', function(req, res, next){
  var roomName = req.body.roomNameBar;
  console.log("in index.js", req.user.imageURL);
  var newRoom = new Room({
    roomName:roomName,
    djRefreshToken:req.user.refreshToken,
    djSpotifyId:req.user.spotifyId,
    imageURL:req.user.imageURL
  })
  newRoom.save(function(err, newRoom){
    if(err) {
      res.render('error',{
        err
      })
    }
    else {
      res.render('djRoom', {
        newRoom
      });
    }
  })
})

/* Join a room and render room page. */
router.get('/joinRoom:roomName', function(req, res, next){
  var roomName = req.query.roomName;
  // we can get stuff from db and then render all existing info, and then use jquery to get new users.
  Room.findOne({'roomName':roomName}, function(err, room){
    res.render('userRoom', {
      room
    });
  })
})

module.exports = router;
