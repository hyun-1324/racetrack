function fillHTML() {
    const path = window.location.pathname;

    const headerText = document.querySelector('#headerText');
    if (path === '/front-desk') {
        headerText.innerText = 'Please enter the receptionist key for Front Desk:';
    } else if (path === '/race-control') {
        headerText.innerText = 'Please enter the safety key for Race Control:';
    } else if (path === '/lap-line-tracker') {
        headerText.innerText = 'Please enter the observer key for Lap Line Tracker:';
    }

    const form = document.querySelector('#keyForm');
    form.setAttribute('action', path);

}   

fillHTML();


