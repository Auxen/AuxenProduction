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
  router.post('/createRoom', function(req, res, next){
    console.log("reaching create Room in backend post");
    var roomName = req.body.roomNameBar;
    existingRoomNames.push(roomName);
    var newRoom = new Room({
      roomName:roomName,
      djRefreshToken:req.user.refreshToken,
      djSpotifyId:req.user.spotifyId,
      imageURL:req.user.imageURL,
      djName: req.user.username
    })
    newRoom.save(function(err, newRoom){
      if(err) {
        res.render('error',{
          err
        })
      }
      else {
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
  router.get('/closeRoom/:name', function(req, res, next) {
    var roomId = req.query.roomId;
    var roomName = req.params.name;
    Room.remove({'_id': roomId}).then(() => {
      existingRoomNames.splice(existingRoomNames.indexOf(roomName), 1);
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
        return user.spotifyId === !req.user.spotifyId;
      })
      room.save(function(err, room) {
        res.redirect('/');
      });
    }).catch(error => {
      console.log("error", error);
    })
  })

  io.on('connection', function(socket) {

    socket.on('disconnect', function() {
      console.log('user disconnected');
    });

    function getSpotifyApi() {

      var spotifyApi = new SpotifyWebApi({
        clientId: process.env.SPOTIFY_ID,
        clientSecret: process.env.SPOTIFY_SECRET,
        redirectUri: process.env.CALLBACK_URL
      });

      return spotifyApi;
    }

    function getDJData(DJAccessToken, room) {
      console.log("this should happen every 5 sec", room);
      var DJSpotifyApi = getSpotifyApi();
      DJSpotifyApi.setAccessToken(DJAccessToken);
      var startTime = Date.now();
      DJSpotifyApi.getMyCurrentPlaybackState()
      .then(data => {
        var timeDiff = Date.now() - startTime ;
        console.log("*****",data.body.progress_ms, data.body.item.uri);
        if(!io.sockets.adapter.rooms[room].songURI){ // it enters here for the first song of the room
          console.log("first time it should enter here");
          io.sockets.adapter.rooms[room].timeProgress = data.body.progress_ms; //setting time property to room
          io.sockets.adapter.rooms[room].songURI = data.body.item.uri; //setting song property to room
          var DJData = {
            songURI: data.body.item.uri,
            timeProgress: data.body.progress_ms + timeDiff
          };
          socket.to(room).emit("DJData", DJData);
        }
        else { // not first song of room
          console.log("second time it should enter here");
          if(io.sockets.adapter.rooms[room].songURI !== data.body.item.uri){ // song has changed
            console.log("song changed");
            io.sockets.adapter.rooms[room].timeProgress = data.body.progress_ms; //setting time property to room
            io.sockets.adapter.rooms[room].songURI = data.body.item.uri; //setting song property to room
            var DJData = {
              songURI: data.body.item.uri,
              timeProgress: data.body.progress_ms + timeDiff
            };
            socket.to(room).emit("DJData", DJData);
          }
          else {
            console.log("song not changed");
            if(data.body.is_playing){
              if(Math.abs(data.body.progress_ms - io.sockets.adapter.rooms[room].timeProgress) > 20000){
                console.log("same song but change in time");
                var DJData = {
                  songURI: data.body.item.uri,
                  timeProgress: data.body.progress_ms + timeDiff
                };
                socket.to(room).emit("DJData", DJData);
              }
              io.sockets.adapter.rooms[room].timeProgress = data.body.progress_ms;
            }
          }
        }
      })
      .catch(error => {
        console.log("error", error);
      })
    }

    /* this is spotify setup sends access and refresh token to client */
    socket.on('spotifySetup', function(spotifyId) {
      console.log("spotify setup");
      var spotifyApi = getSpotifyApi();
      User.findOne({'spotifyId': spotifyId}).then(user => {
        spotifyApi.setRefreshToken(user.refreshToken);
        socket.emit('setRefreshToken', user.refreshToken);
        spotifyApi.refreshAccessToken().then(data => {
          spotifyApi.setAccessToken(data.body['access_token']);
          socket.emit('setAccessToken', spotifyApi.getAccessToken());
        })
      }).catch(error => {
        console.log("error", error);
      })

    })

    /* called every 30 minutes by user to refresh token */
    socket.on('toRefresh', function(refreshToken){
      console.log("refreshing token");
      var spotifyApi = getSpotifyApi();
      spotifyApi.setRefreshToken(refreshToken);
      spotifyApi.refreshAccessToken()
      .then(data => {
        spotifyApi.setAccessToken(data.body['access_token']);
        socket.emit('setNewAccessToken', spotifyApi.getAccessToken());
      })
      .catch(error => {
        console.log("error", error);
      })
    })

    /* called by dj. closes room, dj leaves room, and emits events for users to leave room */
    socket.on('closingRoom', function(roomData) {
      console.log("backend closingRoom");
      socket.to(socket.room).emit('roomClosed');
      socket.leave(socket.room);
    })

    /* called by users while leaving room or when room closed altogether */
    socket.on('leaveRoom', function(userSpotifyId) {
      if (userSpotifyId) {
        socket.to(socket.room).emit('userLeaving', userSpotifyId);
      }
      socket.leave(socket.room);
    })

    /* create room in socket with dj information */
    socket.on('createRoom', function(djObject) {
      console.log("starting to create room");
      var roomName = djObject.roomName;
      if (socket.room)
        socket.leave(socket.room); //if already in room leave
      socket.room = roomName; // set property
      socket.join(roomName); // join room
      io.sockets.adapter.rooms[roomName].DJToken = djObject.accessToken;
      io.sockets.adapter.rooms[roomName].imageURL = djObject.imageURL;
      io.sockets.adapter.rooms[roomName].username = djObject.username;
      var clearID = setInterval(() => {
        if (io.sockets.adapter.rooms[roomName]) {
          return getDJData(io.sockets.adapter.rooms[roomName].DJToken, roomName);
        } else {
          console.log("this room no longer exists");
          clearInterval(clearID);
        }
      }, 5000);
    })

    /* user joins room */
    socket.on('joinRoom', function(userObject) {
      console.log(userObject);
      if (socket.room) {
        socket.leave(socket.room);
      }
      socket.join(userObject.roomName);
      socket.room = userObject.roomName;
      console.log("socket room", socket.room);
      socket.to(userObject.roomName).emit('userJoined', userObject);
    })

    /* auto close room and remove from db if user disconnects*/
    socket.on('autoClose', function(roomObject) {
      console.log("reaching autoclose at backend");
      Room.remove({'_id': roomObject.roomId})
      .then(() => {
        console.log("room successfully removed");
      })
      .catch((error) => {
        console.log("error", error);
      })
    })

    /* auto leave room and remove from db if disconnect */
    socket.on('autoLeave', function(userObject) {
      Room.findById(userObject.roomId)
      .then(room => {
        room.usersInRoom = room.usersInRoom.filter(function(user) {
          return user.spotifyId === !userObject.spotifyId;
        })
        room.save(function(err, room) {
          res.redirect('/');
        });
      })
      .catch(error => {
        console.log("error", error);
      })
    })

    /* after access token is changed for dj, i set that token to room here */
    socket.on('changeRoomToken', function(data){
      io.sockets.adapter.rooms[data.roomName].DJToken = data.newToken;
    });

    /* user refreshed so adding to db */
    socket.on('userRefreshed', function(userObject){
      console.log("user refreshed and add to database", userObject);
      Room.findById(userObject.roomId)
      .then(room => {
        console.log("room", room);
        var userObject = {
          spotifyId: userObject.spotifyId,
          imageURL: userObject.imageURL,
          username: userObject.username
        }
        console.log("****", userObject);
        room.usersInRoom.push(userObject);
        room.save(function(err, room) {
          console.log("entered here");
          if(err)console.log(err);
          else {
            console.log("user successfully added");
            socket.to(userObject.roomName).broadcast('userJoined', userObject);
          }
        })
      })
      .catch(err => {
        console.log("error", err);
      })
    })

    socket.on('specialClose', function(roomObject){
      console.log("backend closingRoom");
      socket.to(socket.room).emit('roomClosed');
      socket.leave(socket.room);
      console.log("reaching autoclose at backend");
      Room.remove({'_id': roomObject.roomId})
      .then(() => {
        console.log("room successfully removed");
      })
      .catch((error) => {
        console.log("error", error);
      })
    })

    socket.on('specialLeave', function(userObject){
      console.log("enetered specialLeave");
      if (userObject.spotifyId) {
        socket.to(socket.room).emit('userLeaving', userObject.spotifyId);
      }
      socket.leave(socket.room);
      Room.findById(userObject.roomId)
      .then(room => {
        room.usersInRoom = room.usersInRoom.filter(function(user) {
          return user.spotifyId === !userObject.spotifyId;
        })
        room.save(function(err, room) {
          console.log("user successfully removed");
        });
      })
      .catch(error => {
        console.log("error", error);
      })
    })

  })



  return router;
}
