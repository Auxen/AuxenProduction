'use strict';
var express = require('express');
var router = express.Router();
var SpotifyWebApi = require('spotify-web-api-node'); //added
var socket_io = require('socket.io'); //added
var models = require('../models/models');
var User = models.User;
var Room = models.Room;

module.exports = function(io) {

  function getSpotifyApi() {

    var spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_ID,
      clientSecret: process.env.SPOTIFY_SECRET,
      redirectUri: process.env.CALLBACK_URL
    });

    return spotifyApi;
  }

  function getDJData(DJAccessToken, roomName) {
    var DJSpotifyApi = getSpotifyApi();
    DJSpotifyApi.setAccessToken(DJAccessToken);
    var startTime = Date.now();
    DJSpotifyApi.getMyCurrentPlaybackState()
    .then(data => {
      var timeDiff = Date.now() - startTime ;
      var DJData = {
        songURI: data.body.item.uri,
        timeProgress: data.body.progress_ms + timeDiff
      }; //setting dj data

      if(!io.sockets.adapter.rooms[room].songURI){ // it enters here for the first song of the room
        io.sockets.adapter.rooms[room].timeProgress = data.body.progress_ms; //setting time property to room
        io.sockets.adapter.rooms[room].songURI = data.body.item.uri; //setting song property to room
        socket.to(roomName).emit("DJData", DJData);
      }
      else { // not first song of room
        if(io.sockets.adapter.rooms[room].songURI !== data.body.item.uri){ // song has changed
          io.sockets.adapter.rooms[room].timeProgress = data.body.progress_ms; //setting time property to room
          io.sockets.adapter.rooms[room].songURI = data.body.item.uri; //setting song property to room
          socket.to(roomName).emit("DJData", DJData);
        }
        else { //same song but the time has changed more than 10 seconds.
          if(data.body.is_playing && Math.abs(data.body.progress_ms - io.sockets.adapter.rooms[room].timeProgress) > 10000){
            io.sockets.adapter.rooms[room].songURI = data.body.item.uri;
            socket.to(roomName).emit("DJData", DJData);
          }
        }
      }
    })
    .catch(error => {
      console.log("error", error);
    })
  }

  io.on('connection', function(socket){

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });


    /* this is spotify setup sends access and refresh token to client */
    socket.on('spotifySetup', function(spotifyId){
      console.log("spotify setup");
      var spotifyApi = getSpotifyApi();
      User.findOne({'spotifyId': spotifyId})
      .then( user => {
        spotifyApi.setRefreshToken(user.refreshToken);
        socket.emit('setRefreshToken', user.refreshToken);
        spotifyApi.refreshAccessToken()
        .then(data => {
          spotifyApi.setAccessToken(data.body['access_token']);
          socket.emit('setAccessToken', spotifyApi.getAccessToken());
        })
      })
      .catch(error => {
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
        socket.emit('getAccessToken', spotifyApi.getAccessToken());
      })
      .catch(error => {
        console.log("error", error);
      })
    })

    /* called by dj. closes room, dj leaves room, and emits events for users to leave room */
    socket.on('closingRoom', function(roomData){
      socket.to(socket.room).emit('roomClosed');
      socket.leave(socket.room);
    })

    /* called by users while leaving room or when room closed altogether */
    socket.on('leaveRoom', function(userSpotifyId){
      if(userSpotifyId){
        socket.to(socket.room).emit('userLeaving', userSpotifyId);
      }
      socket.leave(socket.room);
    })

    /* create room in socket with dj information */
    socket.on('createRoom', function(djObject){
      console.log("starting to create room");
      var roomName = djObject.roomName;
      if(socket.room) socket.leave(socket.room); //if already in room leave
      socket.room = roomName; // set property
      socket.join(roomName); // join room
      io.sockets.rooms[roomName].DJToken = djObject.accessToken;
      io.sockets.adapter.rooms[roomName].imageURL = djObject.imageURL;
      io.sockets.adapter.rooms[roomName].username = djObject.username;
      var clearID = setInterval(() => {
        if(io.sockets.adapter.rooms[roomName]){
          return getDJData(io.sockets.rooms[roomName].DJToken, roomName);
        }else {
          console.log("this room no longer exists");
          clearInterval(clearID);
        }
      }, 5000);
    })

    /* user joins room */
    socket.on('joinRoom', function(userObject){
      if(socket.room)socket.leave(socket.room);
      socket.join(userObject.roomName);
      socket.to(roomName).emit('userJoined', userObject);
    })

    /* auto close room and remove from db if user disconnects*/
    socket.on('autoClose', function(roomObject){
      Room.remove({'_id':roomObject.roomId})
      .then(()=>{
        console.log("room successfully removed");
      })
      .catch((error) => {
        console.log("error", error);
      })
    })

    /* auto leave room and remove from db if disconnect */
    socket.on('autoLeave', function(userObject){
      Room.findById(userObject.roomId)
      .then(room => {
        room.usersInRoom = room.usersInRoom.filter(function(user){
          return user.spotifyId === !userObject.spotifyId;
        })
        room.save(function(err, room){
          res.redirect('/');
        });
      })
      .catch(error => {
        console.log("error", error);
      })
    })

  })
}
