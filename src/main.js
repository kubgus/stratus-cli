import io from 'socket.io-client';
import { question } from 'readline-sync';
import axios from 'axios';
import chalk from 'chalk';

console.log(chalk.rgb(16, 234, 114)(`
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
██ ▄▄▄ █▄ ▄█ ▄▄▀█ ▄▄▀█▄ ▄█ ██ █ ▄▄
██▄▄▄▀▀██ ██ ▀▀▄█ ▀▀ ██ ██ ██ █▄▄▀
██ ▀▀▀ ██▄██▄█▄▄█▄██▄██▄███▄▄▄█▄▄▄
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

`));

// Helper function to prompt user for URL and port
function promptForUrlAndPort(promptMessage) {
    const url = question(`${promptMessage} URL: `);
    const port = question(`${promptMessage} Port: `);
    return { url, port };
}

// Main function to run the client
async function main() {
    // Prompt for server URL and port
    const { url: serverUrl, port: serverPort } = promptForUrlAndPort('Sever');
    const socket = io(`http://${serverUrl}${serverPort ? `:${serverPort}` : ''}`, {
        reconnectionAttempts: 1,
        timeout: 60000, // 60 seconds timeout
    });

    // Wait for connection success
    let isConnected = false;
    socket.on('connect', () => {
        console.log(chalk.green('Connected to the server.'));
        isConnected = true;
    });

    socket.on('disconnect', () => {
        console.log(chalk.red('Disconnected from the server.'));
        isConnected = false;
        process.exit(1);
    });

    setTimeout(() => {
        if (!isConnected) {
            console.error(chalk.red('Failed to connect to the server.'));
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
        const authToken = question('Stratus Auth Token: ');
        socket.emit('token_verify', { token: authToken }, ({ data, error }) => {
            if (error) {
                console.error(chalk.red(error));
                process.exit(1);
            }

            isAuthenticated = true;
            // console.log(data);
            console.log(chalk.green('Authentcation success.'));
            console.log(chalk.blue(`Receiving requests from "${data.id}.${serverUrl}${serverPort ? `:${serverPort}` : ''}".`));
        });

        // Wait until authenticated or re-prompt
        while (!isAuthenticated) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Prompt for service selection
    //const serviceSelection = questionInt('Select service (1-Port Forwarding, 2-Broadcast Directory): ');

    //if (serviceSelection === 1) {
    //    await startPortForwarding(socket);
    //} else if (serviceSelection === 2) {
    //    await startBroadcastDirectory(socket); // Placeholder for future implementation
    //} else {
    //    console.log(chalk.red('Invalid service selection.'));
    //    process.exit(1);
    //}

    await startPortForwarding(socket);
}

// Function to start port forwarding service
async function startPortForwarding(socket) {
    const { url: forwardUrl, port: forwardPort } = promptForUrlAndPort('Local');

    socket.on('forward_request', async ({ data }, callback) => {
        let query_string = "?";
        for (const key in data.query) {
            query_string += `${key}=${data.query[key]}&`;
        }
        const final_url =
            `${data.protocol}://${forwardUrl}${forwardPort ? `:${forwardPort}` : ''}`
            + `${data.path ?? "/"}${query_string}`;
        try {
            const response = await axios({
                method: data.method,
                url: final_url,
                headers: data.headers,
                data: data.body,
                validateStatus: (status) => status >= 200 && status < 300 || status === 304,
            });
            callback({
                data: response.data,
                headers: response.headers,
                status: response.status,
            });
            console.log(chalk.green(`> ${final_url} :: ${response.status}`));
        } catch (error) {
            console.error(chalk.red(`! ${final_url} :: ${error.cause?.code ?? error ?? "Unknown error"}`));
        }
    });

    console.log(chalk.blue(`Forwarding requests to "${forwardUrl}${forwardPort ? `:${forwardPort}` : ''}".`));
}

// Placeholder function for future implementation
async function startBroadcastDirectory(socket) {
    console.log(chalk.cyan('Broadcast Directory service is not yet implemented.'));
}

main();

