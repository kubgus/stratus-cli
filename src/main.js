import io from 'socket.io-client';
import { question, questionInt } from 'readline-sync';
import axios from 'axios';

// Helper function to prompt user for URL and port
function promptForUrlAndPort(promptMessage) {
    const url = question(`${promptMessage} URL: `);
    const port = questionInt(`${promptMessage} Port: `);
    return { url, port };
}

// Main function to run the client
async function main() {
    // Prompt for server URL and port
    const { url: serverUrl, port: serverPort } = promptForUrlAndPort('Socket server');
    const socket = io(`http://${serverUrl}${serverPort ? `:${serverPort}` : ''}`, {
        reconnectionAttempts: 1,
        timeout: 60000, // 60 seconds timeout
    });

    // Wait for connection success
    let isConnected = false;
    let reconnections = 0;
    socket.on('connect', () => {
        console.log('Connected to the server.');
        isConnected = true;
        reconnections++;
        if (reconnections > 1) {
            process.exit(1);
        }
    });

    setTimeout(() => {
        if (!isConnected) {
            console.log('Connection timed out.');
            process.exit(1);
        }
    }, 60000);

    // Wait until connected
    while (!isConnected) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Prompt for auth token and verify
    let isAuthenticated = false;
    while (!isAuthenticated) {
        const authToken = question('Enter auth token: ');
        socket.emit('token_verify', { token: authToken }, ({ data, error }) => {
            if (error) {
                console.log(error);
                return;
            }

            isAuthenticated = true;
            console.log(data);
        });

        // Wait until authenticated or re-prompt
        while (!isAuthenticated) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Prompt for service selection
    const serviceSelection = questionInt('Select service (1-Port Forwarding, 2-Broadcast Directory): ');

    if (serviceSelection === 1) {
        await startPortForwarding(socket);
    } else if (serviceSelection === 2) {
        await startBroadcastDirectory(socket); // Placeholder for future implementation
    } else {
        console.log('Invalid selection.');
        process.exit(1);
    }
}

// Function to start port forwarding service
async function startPortForwarding(socket) {
    const { url: forwardUrl, port: forwardPort } = promptForUrlAndPort('Forward to');

    socket.on('forward_request', async (data, callback) => {
        try {
            const final_url =
                `${data.protocol}://${forwardUrl}${forwardPort ? `:${forwardPort}` : ''}`
                + `${data.path ?? "/"}${data.query ? data.query_string : ""}`;
            console.log(final_url);
            const response = await axios({
                method: data.method,
                url: final_url,
                headers: data.headers,
                data: data.body,
            });
            callback(response.data);
            console.log(`Request forwarded to ${final_url}`);
        } catch (error) {
            console.error(error);
        }
    });

    console.log(`Port forwarding service started, forwarding requests to http://${forwardUrl}:${forwardPort}`);
}

// Placeholder function for future implementation
async function startBroadcastDirectory(socket) {
    console.log('Broadcast Directory service is not yet implemented.');
}

main();

