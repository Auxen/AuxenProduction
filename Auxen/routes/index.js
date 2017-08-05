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
    imageURL: req.user.imageURL,
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
      return {roomName: room.roomName, roomId: room._id};
    })
    res.render('getRooms', {
      rooms: roomNameArray
    })
  })
})

/* Create a room and render djroom page. */
router.post('/createRoom', function(req, res, next){
  var roomName = req.body.roomNameBar;
  existingRoomNames.push(roomName);
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

/* Join a room, add to db array and render room page. */
router.get('/joinRoom', function(req, res, next){
  var roomId = req.query.roomId;
  Room.findById(roomId, function(err, room){
    var userObject = {
      spotifyId : req.user.spotifyId,
      imageURL : req.user.imageURL,
      username : req.user.username
    }
    room.usersInRoom.push(userObject);
    room.save(function(err, user){
      if(err){
        res.render('error');
      }else{
        res.render('userRoom', {
          room
        });
      }
    })

  })
})

/* Closes room redirects dj to home. */
router.get('/closeRoom/:name', function(req, res, next){
  var roomId = req.query.roomId;
  var roomName = req.params.name;
  Room.remove({'_id': roomId})
  .then(() => {
    existingRoomNames.splice(existingRoomNames.indexOf(roomName), 1);
    res.redirect('/');
  })
  .catch(error => {
    console.log("error", error);
  })
})

/* makes user leave room, deletes him from db as well*/
router.get('/leaveRoom', function(req, res, next){
  var roomId = req.query.roomId;
  Room.findById(roomId)
  .then(room => {
    room.usersInRoom = room.usersInRoom.filter(function(user){
      return user.spotifyId === !req.user.spotifyId;
    })
    room.save(function(err, room){
      res.redirect('/');
    });
  })
  .catch(error => {
    console.log("error", error);
  })
})

module.exports = router;
