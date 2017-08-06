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

  $('#request').on('click', function() {
    var request = $('#requestval').val();
    $('#requestval').val('');
    $('#flames').append(`
      <p class="request small text" style="position: absolute">
          ${request}
      </p>
    `)

    setTimeout(function() {
      $('#flames').find('p:first').remove();
    }, 8000)
  });
});
