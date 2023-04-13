import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 } from 'uuid';
const app = express();


const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastConnections() {
    let ids = app.locals.connections.map(c => c._connId);
    app.locals.connections.forEach(c => {
        c.send(JSON.stringify({ type: 'ids', ids }));
    });
}

wss.on('connection', (ws) => {
    console.log('connected')
    if (app.locals.connections) {
        if (app.locals.connections.length === 2) return;
        app.locals.connections.push(ws)
    } else {
        app.locals.connections = []
    }
    ws._connId = `conn-${v4()}`;

    // send the local id for the connection
    const connectionData = JSON.stringify({ type: 'connection', id: ws._connId });
    console.log('connectionData', connectionData)
    ws.send(connectionData);

    // send the list of connection ids
    broadcastConnections();

    ws.on('close', () => {
        let index = app.locals.connections.indexOf(ws);
        app.locals.connections.splice(index, 1);

        // send the list of connection ids
        broadcastConnections();
    });

    ws.on('message', (message) => {
        for (let i = 0; i < app.locals.connections.length; i++) {
            if (app.locals.connections[i] !== ws) {
                app.locals.connections[i].send(message.toString());
            }
        }
    });

});

server.listen(process.env.PORT || 8081, () => {
    console.log(`Started server on port ${server.address().port}`);
});
