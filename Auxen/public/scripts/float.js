$(document).ready(function() {
  $('#laflame').on('click', function() {
    $('#flames').append(`
      <span class="middle fire" style="position: absolute">
          🔥
      </span>
<<<<<<< HEAD
    `)

    setTimeout(function() {
      $('#flames').find('span:first').remove();
    }, 5000)
  });

  setTimeout(function() {
    $('#flames').find('p:first').remove();
  }, 8000)
});
=======
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
          <span style="width: 30%;">${request}</span>
      </p>
    `)

    setTimeout(function() {
      $('#flames').find('p:first').remove();
    }, 8000)
  });
});
>>>>>>> e5042b3918465d7cca9e5c325a195b2f93520d70
