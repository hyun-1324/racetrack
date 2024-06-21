const bodyStyle = document.body.style;
const fullscreenButton = document.getElementById('fullScreenButton');

socket.on('race_mode', data => {
  if (data === 'safe') {
    bodyStyle.backgroundColor = 'green';
  } else if (data === 'hazard') {
    bodyStyle.backgroundColor = 'yellow';
  } else if (data === 'danger') {
    bodyStyle.backgroundColor = 'red';
    if (document.body.classList.contains('checkered')) {
      document.body.classList.remove('checkered');
    }
  } else if (data === 'finish') {
    bodyStyle.backgroundColor = '';
    document.body.classList.add('checkered');
  }
});

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

socket.emit('reconnect', 'flag');
