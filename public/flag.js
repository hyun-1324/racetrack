socket.on('race_mode', data => {
  if (data === 'safe') {
    document.body.style.backgroundColor = 'green';
  } else if (data === 'hazard') {
    document.body.style.backgroundColor = 'yellow';
  } else if (data === 'danger') {
    document.body.style.backgroundColor = 'red';
  } else if (data === 'finish') {
    document.body.style.backgroundColor = '';
    document.body.classList.add('checkered');
  }
});

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
