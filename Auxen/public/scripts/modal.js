$(document).ready(function() {

  // replace if condition with if user has logged in before
  if(!(localStorage.getItem('spotifyId'))) {
    $('#exampleModalLong').modal('show');
  }
});
