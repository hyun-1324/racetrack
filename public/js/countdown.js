let countdownFunction;

socket.on('end_time', data => {
  if (data.action === 'finish') {
    clearInterval(countdownFunction);
    document.getElementById('timer').innerHTML = 'Race Completed!';
  } else if (data.action === 'start') {
    timer(data.endTime);
  } else if (data.action === 'endSession') {
    document.getElementById('timer').innerHTML = '00:00:00';
  }
});

async function timer(endTime) {
  // Update the count down every 1 second
  countdownFunction = setInterval(function () {
    // Get today's date and time
    let now = new Date().getTime();

    // Find the distance between now and the count down date
    let distance = endTime - now;

    // Time calculations for hours, minutes and seconds

    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    let milliseconds = Math.floor((distance % 1000) / 10);

    // Display the result in the element with id="timer"
    document.getElementById('timer').innerHTML =
      minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ':' +
      seconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      ':' +
      milliseconds.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      });

    if (distance < 0) {
      clearInterval(countdownFunction);
      document.getElementById('timer').innerHTML = 'Race Completed!';
    }
  }, 10);
}

socket.emit('reconnect', 'countdown');

const fullscreenButton = document.getElementById('fullScreenButton');

fullscreenButton.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    // Request full screen mode
    document.documentElement
      .requestFullscreen()
      .then(() => {
        fullscreen.textContent = 'Exit Full Screen';
      })
      .catch(err => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
  } else {
    // Exit full screen mode
    if (document.exitFullscreen) {
      document
        .exitFullscreen()
        .then(() => {
          fullscreen.textContent = 'Full Screen';
        })
        .catch(err => {
          console.error(
            `Error attempting to exit full-screen mode: ${err.message} (${err.name})`
          );
        });
    }
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = 'Exit Full Screen';
  } else {
    fullscreenButton.textContent = 'Full Screen';
  }
});
