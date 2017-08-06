$(document).ready(function() {
  $('#laflame').on('click', function() {
    $('#flames').append(`
      <span class="middle fire" style="position: absolute">
          🔥
      </span>
    `)

    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 5000)
  });

  setTimeout(function() {
    $('#flames').find('p:first').remove();
  }, 8000)
});
