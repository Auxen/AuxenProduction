// final for beta
var express = require('express');
var router = express.Router();

var models = require('../models/models');
var SpotifyWebApi = require('spotify-web-api-node');
var User = models.User;
var Room = models.Room;
var existingRoomNames = [];

module.exports = function(io) {
  /* Check login page. */
  router.use('/', function(req, res, next) {
    if (req.user) {
      next();
    } else {
      console.log("here");
      res.redirect('/login');
    }
  })

  /* Get home page. */
  router.get('/', function(req, res, next) {
    console.log('AAAAAAAAAA', req.user.imageURL);
    res.render('home', {
      spotifyId: req.user.spotifyId,
      imageURL: req.user.imageURL,
      username: req.user.username
    });
  });

  /* Get createRoom page. */
  router.get('/createRoom', function(req, res, next) {
    res.render('createRoom', {existingRoomNames});
  })

  /* Get list of available rooms. */
  router.get('/getRooms', function(req, res, next) {
    Room.find(function(err, rooms) {
      var roomNameArray = [];
      roomNameArray = rooms.map(function(room) {
        return {roomName: room.roomName, roomId: room._id};
      })
      res.render('getRooms', {rooms: roomNameArray})
    })
  })

  /* Create a room and render djroom page. */
  router.post('/createRoom', function(req, res, next) {
    console.log("reaching create Room in backend post");
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
        res.render('error', {err})
      } else {
        res.redirect('/djRoom/' + newRoom._id);
      }
    })
  })

  router.get('/djRoom/:roomId', function(req, res, next) {
    var roomId = req.params.roomId;
    Room.findById(roomId).then(room => {
      if(room){
        res.render('djRoom', {room})
      }
      else res.redirect('/');
    }).catch(err => {
      console.log("error", err);
    })
  })

  /* Join a room, add to db array and render room page. */
  router.get('/joinRoom', function(req, res, next) {
    console.log("joined room in database.");
    var roomId = req.query.roomId;
    Room.findById(roomId, function(err, room) {
      var userObject = {
        spotifyId: req.user.spotifyId,
        imageURL: req.user.imageURL,
        username: req.user.username
      }
      room.usersInRoom.push(userObject);
      room.save(function(err, room) {
        if (err) {
          res.render('error');
        } else {
          res.redirect('/userRoom/' + room._id);
        }
      })

    })
  })

  router.get('/userRoom/:roomId', function(req, res, next) {
    var roomId = req.params.roomId;
    Room.findById(roomId).then(room => {
      room.djRefreshToken = "";
      res.render('userRoom', {room})
    }).catch(error => {
      console.log("error", error);
    })
  });

  /* Closes room redirects dj to home. */

  // NEED TO CHANGE THE POST REQUEST AND ATTACH FLFAMES TO THE BODY

  router.get('/closeRoom/:name', function(req, res, next) {
    var roomId = req.query.roomId;
    var roomName = req.params.name;
    Room.remove({'_id': roomId}).then(() => {
      existingRoomNames.splice(existingRoomNames.indexOf(roomName), 1);
      // redirect to the screen here
      res.redirect('/');
    }).catch(error => {
      console.log("error", error);
    })
  })


  /* makes user leave room, deletes him from db as well*/
  router.get('/leaveRoom', function(req, res, next) {
    var roomId = req.query.roomId;
    Room.findById(roomId).then(room => {
      room.usersInRoom = room.usersInRoom.filter(function(user) {
        return user.spotifyId !== req.user.spotifyId;
      })
      room.save(function(err, room) {
        res.redirect('/');
      });
    }).catch(error => {
      console.log("error", error);
    })
  })

  return router;
}
