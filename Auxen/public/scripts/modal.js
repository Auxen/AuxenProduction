$(document).ready(function() {
  
  // replace if condition with if user has logged in before
  if(!(localStorage.getItem('spotifyId'))) {
    $('#exampleModalLong').modal('show');
  }

  $('#songTest').on('click', function() {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/play',
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem("accessToken"),
        'Content-Type': "application/json"
      },
      data: JSON.stringify({
        "uris": ['spotify:track:4uLU6hMCjMI75M1A2tKUQC']
      }),
      dataType: "JSON",
    })
  })
});
