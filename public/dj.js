$(document).ready(function(){
  var djRefreshToken = '{{room.djRefreshToken}}';
  var roomId = '{{room._id}}';
  var roomName = '{{room.roomName}}';
  var socket = io();
  var clearId = -1;

  /* happens before refresh or close tab */
  $(window).bind('beforeunload', function(){
    console.log("before unloading");
    return null;
    // return "Are you sure you want to leave? This will take you to home page";
  });

  /* after refresh or close tab*/
  $(window).on("unload", function(){
    console.log("unloading");
    socket.emit('specialClose', {"roomName": roomName, "roomId": roomId});
    clearInterval(clearId);
    localStorage.setItem("closing", "true");
  });

  /* Checking connnection to socket */
  socket.on('connect', function(){
    console.log('Connected!');

    clearId = setInterval(function () {
      socket.emit("toRefresh", localStorage.getItem("refreshToken"));
    }, 30*60000);

    if(localStorage.getItem('closing') === "true"){
      window.location.href = '/';
    }else{
      //socket.emit('spotifySetup', localStorage.getItem("spotifyId"));
      var djObject = {
        roomName: roomName,
        accessToken: localStorage.getItem('accessToken')
      }
      socket.emit('createRoom', djObject);
    }
  })

  /* Setting refresh token in localStorage and calling setInterval every 30 mins to refresh */
  socket.on('setRefreshToken', function(refreshToken){
    localStorage.setItem('refreshToken', refreshToken);

  });

  /* Setting access token in localStorage */
  socket.on('setAccessToken', function(accessToken){
    localStorage.setItem('accessToken', accessToken);
    var djObject = {
      roomName: roomName,
      accessToken: localStorage.getItem('accessToken')
    }
    socket.emit('createRoom', djObject);
  })

  /* sets new access token after refresh */
  socket.on('setNewAccessToken', function(accessToken){
    localStorage.setItem('accessToken', accessToken);
    socket.emit('changeRoomToken', {roomName: roomName, newToken: accessToken});
  })

  /* some other user has left room */
  socket.on('userLeaving', function(userSpotifyId){
      console.log(userSpotifyId);
      $('#' + userSpotifyId).remove();
  });

  /* listens to flames in room */  socket.on('laflame', function() {
    $('#flames').append(`
        <span class="small fire" style="position: absolute; left:${Math.floor(100 * Math.random())}%">
            🔥
        </span>
      `)
      setTimeout(function() {
        $('#flames').find('span:first').remove();
      }, 2000)
  })

  /* listens to requests in room */
  socket.on('userSongRequest', function(data){
    $('#flames').append(`
      <p class="request small text" style="position: absolute; left:${Math.floor(100 * Math.random())}%">
          <span style="width: 30%;">${data}</span>
      </p>
    `)

    setTimeout(function() {
      $('#flames').find('p:first').remove();
    }, 8000)
  });

  /* new user has joined */
  socket.on('userJoined', function(userData){
    console.log("user joined", userData);
    if($('#' + userData.spotifyId).length !== 0){
      console.log("this guy exits");
      return;
    }
    else {
      var data = `<div id="${userData.spotifyId}" >
          <div data-id="${userData.spotifyId}" >
            <img class="raise animated bounceIn grid-item" src="${userData.imageURL}" alt="">
          </div>
      </div>`

      var randomEmojis = ['🕺', '🙏', '👾', '🚀', '🎵', '🎤', '🎧', '🎉', '🔥', '💯', '☀️', '🌊'];
      var index = Math.floor(Math.random() * (randomEmojis.length - 2));
      console.log(index);

      var potentialDJS = `<div id="${userData.spotifyId}" >
          <div data-id="${userData.spotifyId}" >
            <h2 class="text grow small raise-user searchUsers">${userData.username}</h2>
            <h2 class="text small ">${randomEmojis[index]}</h2>
          </div>
      </div>`

      $('#potentialDJS').append(potentialDJS);

      $('#users').append(data);
    }
  });

   /* sends message of dj to room */
  $('#djtalk').on('click', function() {
    var djTalk = $('#djtalkval').val();
    $('#djtalkval').val('');

    $('#flames').append(`
      <p class="request small text" style="position: absolute; color: green; left:${Math.floor(100 * Math.random())}%">
          <span style="width: 50%;">${djTalk}</span>
      </p>
    `)

    setTimeout(function() {
        $('#flames').find('p:first').remove();
      }, 8000)

    socket.emit('djTalk', djTalk);
  });

  /* dj closes room emits event to server which then kicks people out of the room */
  $('#closeRoom').on('click', function(event){
    console.log("reached front end destination");
    socket.emit('closingRoom', {"roomName": roomName, "roomId": roomId});
    $(window).unbind('beforeunload');
    window.location = $(this).attr('data-url');
  })

  /* sends thanks by dj to room */
  $('#sendgrace').on('click', function() {
    $('#flames').append(`
      <span class="small fire" style="position: absolute; left:${Math.floor(100 * Math.random())}%">
          🙏
      </span>
    `)
    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 2000)
    socket.emit('sendgrace');
  })


})
