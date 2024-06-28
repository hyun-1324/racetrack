import { fullscreenButton, showTimer } from "./timerAndFullScreen.js";

const timer = document.getElementById('timer');
const fullscreenButtonElement = document.getElementById('fullScreenButton');

fullscreenButton(fullscreenButtonElement);
showTimer(timer);

