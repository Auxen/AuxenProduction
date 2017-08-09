$(document).ready(function(){
  var roomName = '{{room.roomName}}';
  var roomId = '{{room._id}}';
  console.log("roomId", roomId);
  var socket = io();
  var clearId = -1;

  /* happens on refresh and close tab */
  $(window).on("unload", function(){
    console.log("unloading");
    var userObject = {roomId: roomId, spotifyId:localStorage.getItem("spotifyId")};
    console.log("user object", userObject);
    socket.emit('specialLeave', userObject);
    localStorage.setItem("disconnectTime", new Date().getTime());
    clearInterval(clearId);
  });

   /* user sends request */
  $('#request').on('click', function() {
    var request = $('#requestval').val();
    socket.emit('userSongRequest', $('#requestval').val());
  });

  /* user sends flames */
  $('#laflame').on('click', function() {
    socket.emit('laflame');
  })

  /* if user wants to leave room it comes here */
  $('#userLeave').on('click', function(event){
    socket.emit('leaveRoom', localStorage.getItem("spotifyId"));
  })

  /* Checking connnection to socket */
  socket.on('connect', function(){
    console.log('Connected!');
    if(localStorage.getItem("disconnectTime") && (new Date().getTime() - localStorage.getItem("disconnectTime") <5000)){
      console.log("entering here on connect");
        console.log("this was a refresh");
        var userObject = {
          roomId: roomId,
          roomName: roomName,
          spotifyId: localStorage.getItem('spotifyId'),
          imageURL: localStorage.getItem('imageURL'),
          username: localStorage.getItem('username')
        }
        console.log("userObject after asfkjtcjs", userObject);
        socket.emit("userRefreshed", userObject);
        localStorage.removeItem("disconnectTime");

    }else{
      console.log("new room joined without refresh");
      socket.emit('spotifySetup', localStorage.getItem("spotifyId"));
    }
  });

  /* Setting refresh token in localStorage and calling setInterval every 30 mins to refresh */
  socket.on('setRefreshToken', function(refreshToken){
    localStorage.setItem('refreshToken', refreshToken);
    clearId = setInterval(function () {
      socket.emit("toRefresh", localStorage.getItem("refreshToken"));
    }, 30*60000 );
  });

  /* Setting access token in localStorage */
  socket.on('setAccessToken', function(accessToken){
    localStorage.setItem('accessToken', accessToken);
    console.log(localStorage.getItem('imageURL'));
    var userObject = {
      roomName: roomName,
      spotifyId: localStorage.getItem('spotifyId'),
      imageURL: localStorage.getItem('imageURL'),
      username: localStorage.getItem('username')
    }
    console.log("show this to me");
    socket.emit('joinRoom', userObject);
  });

  /* sets new access token after refresh */
  socket.on('setNewAccessToken', function(accessToken){
    localStorage.setItem('accessToken', accessToken);
  })

  /* if dj closes room it will come here and redirect to home after leavingRoom */
  socket.on('roomClosed', function(){
    socket.emit('leaveRoom');
    alert('Sorry, the dj closed the room');
    window.location = '/';
  })

  /* new user has joined */
  socket.on('userJoined', function(userData){
    console.log("userJoined", userData);
      if($('#' + userData.spotifyId).length !== 0){
        console.log("this guy exits", userData);
        return;
      }else {

         var data = `<div id="${userData.spotifyId}" class="col-xs-6 col-sm-4" style="margin-top: 3%;">
             <div data-id="${userData.spotifyId}" >
               <img class="scaling raise animated bounceIn" style="border-radius: 50%; width: 25%;" src="${userData.imageURL}" alt="">
             </div>
         </div>`
         $('#users').append(data);

      }

  });

  /* some other user has left room */
  socket.on('userLeaving', function(userSpotifyId){
    console.log("userLeaving", userSpotifyId);
    $('#' + userSpotifyId).remove();
  });

  /* get dj setting info and configure users spotify */
  socket.on('DJData', function(DJData){
    var timeProgress = DJData.timeProgress - 100;
    var songURI = DJData.songURI;
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/play',
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
        'Content-Type': "application/json"
      },
      data: JSON.stringify({
        "uris": [songURI]
      }),
      dataType: "JSON",
      success: function(data){
        $.ajax({
          url: `https://api.spotify.com/v1/me/player/seek?position_ms=${timeProgress}`,
          headers: {
              'Authorization': 'Bearer ' + localStorage.getItem("accessToken")
            },
          method: 'PUT',
          json: true,
          success: function (something) {
              console.log("lets go home");
          }
        })
      }
    })
  })

  /* listens for dj message */
  socket.on('djTalk', function(data) {
      $('#flames').append(`
        <p class="request small text" style="position: absolute; color: #2dc72d;">
            <span style="width: 30%;">${data}</span>
        </p>
      `)
      setTimeout(function() {
        $('#flames').find('p:first').remove();
      }, 8000)
    });

  /* listens for dj thanks */
  socket.on('sendgrace', function() {
    $('#flames').append(`
      <span class="middle fire" style="position: absolute">
          🙏
      </span>
    `)
    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 5000)
  })
})
