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

  io.on('connection', function(socket){

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
    socket.on('createRoom', function(djInfo){
      
    })

  })
}
