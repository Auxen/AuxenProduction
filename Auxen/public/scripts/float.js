$(document).ready(function() {
  $('#laflame').on('click', function() {
    $('#flames').append(`
      <span class="small fire" style="position: absolute; left:${Math.floor(100 * Math.random())}%">
          🔥
      </span>
    `)
    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 2000)
  });

  $('#request').on('click', function() {
    var request = $('#requestval').val();
    $('#requestval').val('');
    $('#flames').append(`
      <p class="request small text" style="position: absolute left:${Math.floor(100 * Math.random())}%">
          <span style="width: 30%;">${request}</span>
      </p>
    `)

    setTimeout(function() {
      $('#flames').find('p:first').remove();
    }, 10000)
  });
});
