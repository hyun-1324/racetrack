import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function checkAccessKeysExist() {
    const receptionistKey = process.env.RECEPTIONIST_KEY;
    const observerKey = process.env.OBSERVER_KEY;
    const safetyKey = process.env.SAFETY_KEY;

    if (receptionistKey === undefined || observerKey === undefined || safetyKey === undefined) {
        console.error (`Please set the RECEPTIONIST_KEY, OBSERVER_KEY, and SAFETY_KEY\nenvironment variables before starting the program.
    Example:
        export RECEPTIONIST_KEY=your_key_here
        export OBSERVER_KEY=your_key_here
        export SAFETY_KEY=your_key_here\n`);
        return { success: false };
    }
    return { success: true, receptionistKey, observerKey, safetyKey };
}

export function checkAccess(req, res, emloyeeKey) {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const key = req.body.key;
    const path = req.path;
    // If key is correct, send the corresponding HTML file
    if (key === emloyeeKey && key !== undefined) {
        if (path === '/front-desk') {
            res.status(200).sendFile(join(__dirname, '..', 'html', 'reception.html'));
        } else if (path === '/race-control') {
            res.status(200).sendFile(join(__dirname, '..', 'html', 'safety.html'));
        } else if (path === '/lap-line-tracker') {
            res.status(200).sendFile(join(__dirname, '..', 'html', 'observer.html'));
        } else {
            res.status(400).send('Bad request');
        }
    } else {
        // If key is incorrect, send the login page with an error message
        // Wait 500 ms before sending the response
        setTimeout(() => {
            res.status(401).render('login', { errorMessage: 'Incorrect access key. Please try again.' });
        }, 500);
    }
}