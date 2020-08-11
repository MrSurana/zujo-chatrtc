var WebSocket = require('ws');
var debug = require('debug')('chatrtc:server');

let wss;

module.exports = (server) => {
    wss = new WebSocket.Server({ server });
    wss.on('listening', () => debug('Websocket server listening!'));

    wss.on('connection', (ws) => {
        ws.on('message', (msg) => handleMessage(msg, ws));
        ws.on('close', (code, reason) => handleClose(ws))
        // ws.on('error', (code, reason) => handleError(ws))
        // ws.send('Hi there, I am a WebSocket server');
    })
};

function handleMessage(message, ws) {
    console.log('received: %s', message);

    // try {
    const json = JSON.parse(message);
    console.log(json);
    switch (json.type) {
        case 'login':
            loginUser(ws, json.data);
            break;

        // case 'update-user':
        //     updateUser(ws, json.data);
        //     break;

        default:
            break;
    }
    // } catch (e) {
    //     console.error("Invalid JSON");
    // }
}

function loginUser(ws, user) {
    ws.user = user;

    const users = [];
    for (const c of wss.clients) {
        if (c.user != user) users.push(c.user);
    }

    ws.send(JSON.stringify({
        type: 'users',
        data: users
    }));

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client != ws) {
            client.send(JSON.stringify({
                type: 'user-online',
                data: user
            }));
        }
    });
}

function updateUser(ws, user) {
    ws.user = user;

    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client != ws) {
            client.send(JSON.stringify({
                type: 'user-online',
                data: user
            }));
        }
    });
}

function handleClose(ws) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client != ws) {
            client.send(JSON.stringify({
                type: 'user-offline',
                data: ws.user
            }));
        }
    });
}
