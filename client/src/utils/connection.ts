let localId, peerIds;
let peerConnections = {};
let peer;
export let initiator;

export const broadcast = (activePlayer, healthData) => {
    const broadcastData = JSON.stringify({activePlayer, healthData})

    Object.values(peerConnections).forEach(peer => {
        peer.send(broadcastData);
    });
}
export const initSocket = async (onConnect, onData) => {

    const wsConnection = new WebSocket('ws:localhost:8081', 'json');
    wsConnection.onopen = (e) => {
        console.log(`wsConnection open to 127.0.0.1:8081`, e);
    };
    wsConnection.onerror = (e) => {
        console.error(`wsConnection error `, e);
    };
    wsConnection.onmessage = (e) => {
        let data = JSON.parse(e.data);
        switch (data.type) {
            case 'connection':
                localId = data.id;
                break;
            case 'ids':
                peerIds = data.ids;
                connect();
                break;
            case 'signal':
                signal(data.id, data.data);
                break;
        }
    };

    const onPeerData = (id, data) => {
        onData(JSON.parse(data));
    }

    const connect = () => {
        if (peerConnections.length >= 2) return;
        Object.keys(peerConnections).forEach(id => {
            if (!peerIds.includes(id)) {
                peerConnections[id].destroy();
                delete peerConnections[id];
            }
        });

        if (peerIds.length === 1) {
            initiator = true;
        }

        peerIds.forEach(id => {
            if (id === localId || peerConnections[id]) {
                return;
            }

            peer = new window.SimplePeer({
                initiator: initiator,
                config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
                channelName: 'test'
            });
            peer.on('error', console.error);
            peer.on('signal', data => {
                const signalData = JSON.stringify({
                    type: 'signal',
                    id: localId,
                    data
                })
                wsConnection.send(signalData);
            });
            peer.on('connect', () => {
                onConnect();
            })
            peer.on('data', (data) => onPeerData(id, data));
            peer._debug = console.log

            peer.on('signalingStateChange', (state) => {
                console.log(`WebRTC state changed for peer ${localId}`, state);
            });

            peerConnections[id] = peer;
        });

    }

    const signal = (id, data) => {
        if (peerConnections[id]) {
            peerConnections[id].signal(data);
        }
    }
}

export default initSocket;
