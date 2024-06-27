import { fullscreenButton } from './countdown.js';

const bodyStyle = document.body.style;

fullscreenButton();

socket.on('race_mode', data => {
  // Change the background color by race mode
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
