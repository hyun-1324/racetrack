function fillHTML() {
    const path = window.location.pathname;

    const headerText = document.querySelector('#headerText');
    if (path === '/front-desk') {
        headerText.innerText = 'Please enter the receptionist key to access the Front Desk:';
    } else if (path === '/race-control') {
        headerText.innerText = 'Please enter the safety key to access the Race Control:';
    } else if (path === '/lap-line-tracker') {
        headerText.innerText = 'Please enter the observer key to access the Lap Line Tracker:';
    }

    const form = document.querySelector('#keyForm');
    form.setAttribute('action', path);

    const errorDiv = document.querySelector('#error');
    if (errorDiv.innerText !== '') {
        errorDiv.style.border = '0.25rem solid red';
        errorDiv.style.padding = '1rem';
        errorDiv.style.backgroundColor = 'white';
    }

}   

fillHTML();


