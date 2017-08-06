$(document).ready(function() {
  $('#laflame').on('click', function() {
    $('#flames').append(`
      <span id="fire" class="middle" style="position: absolute">
          🔥
      </span>
    `)

    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 5000)
  });
});
