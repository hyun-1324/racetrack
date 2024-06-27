let currentRaceData;
socket.on('upcoming_session', data => {
  currentRaceData = data;
});
socket.on('reconnect_leaderboard', data => {
  currentRaceData = data;
});

fullscreenButton();
showTimer();

export function fullscreenButton() {
  const fullscreenButton = document.getElementById('fullScreenButton');

  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      // Request full screen mode
      document.documentElement
        .requestFullscreen()
        .then(() => {
          fullscreenButton.textContent = 'Exit Full Screen';
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
            fullscreenButton.textContent = 'Full Screen';
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
}

export function showTimer() {
  let countdownFunction;

  socket.on('end_time', data => {
    // Set the timer by mode
    if (data.action === 'finish') {
      clearInterval(countdownFunction);
      document.getElementById('timer').textContent = 'Race Completed!';
    } else if (data.action === 'start') {
      timer(data.endTime);
    } else if (data.action === 'endSession') {
      if (currentRaceData.sessionId === 0) {
        document.getElementById('timer').textContent = '00:00:00';
      } else {
        document.getElementById('timer').textContent = 'Race Completed!';
      }
    } else if (data.action === 'reset') {
      document.getElementById('timer').textContent = '00:00:00';
    }
  });

  async function timer(endTime) {
    // Update the count down every 10 milliseconds
    countdownFunction = setInterval(function () {
      // Get today's date and time
      let now = new Date().getTime();

      // Find the distance between now and the count down date
      let distance = endTime - now;

      // Time calculations for minutes, seconds and milliseconds
      let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((distance % (1000 * 60)) / 1000);
      let milliseconds = Math.floor((distance % 1000) / 10);

      // Display the result in the element with id="timer"
      document.getElementById('timer').textContent =
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
        document.getElementById('timer').textContent = 'Race Completed!';
      }
    }, 10);
  }
}
