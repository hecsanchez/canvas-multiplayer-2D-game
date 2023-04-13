import { useRef, useEffect, useState } from 'react'
import './App.css'
import {Player} from "./classes/Player";
import {Keys} from "./types";

let localId, peerIds;
let peerConnections = {};
let initiator = false;
let peer;
function App() {
    const canvas = useRef();
    const width = 1024;
    const height = 576;

    const player = useRef();
    const enemy = useRef();
    const ctx = useRef();
    const pressedKeys = useRef();

    const [connected, setConnected] = useState(false)

    console.log('connected', connected)

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const draw = (data) => {
        const oppositePlayer = initiator ? enemy.current : player.current;
        const { position, velocity } = data;
        oppositePlayer.position = position;
        oppositePlayer.velocity = velocity;
    }

    const broadcast = (data) => {
        const broadcastData = data;
        console.log('peerConnections', peerConnections)
        Object.values(peerConnections).forEach(peer => {
            peer.send(broadcastData);
        });
    }

    const initSocket = async () => {

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
            draw(JSON.parse(data));
        }

        const connect = () => {
            console.log('peerConnections', peerConnections)
            if (peerConnections.length >= 2) return;
            Object.keys(peerConnections).forEach(id => {
                console.log('peerIds', peerIds)
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

                console.log('initiator', initiator)
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
                    console.log('peer connected')
                    setConnected(true)
                    initGame();
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

    useEffect(() => {
        initSocket()
    }, [])

    const initGame = () => {
        createPlayer();
        createEnemy();
        requestAnimationFrame(animate)
    }

    useEffect(()=>{
        ctx.current = canvas.current.getContext('2d');
        createBackground();
    }, [])

    pressedKeys.current = ({
        [Keys.RIGHT]: false,
        [Keys.LEFT]: false,
        [Keys.UP]: false
    })

    const createPlayer = () => {
        player.current = new Player({
            ctx: ctx.current,
            position: {x: 0, y:0},
            velocity: {x: 0, y:0},
        });
    }

    const createEnemy = () => {
        enemy.current = new Player({
            ctx: ctx.current,
            position: {x: 400, y:100},
            velocity: {x: 0, y:0},
        });
    }

    const createBackground = async () => {
        ctx.current.fillStyle = 'white'
        ctx.current.fillRect(0, 0, width, height)
    }

    const animate = () => {
        const activePlayer = initiator ? player.current : enemy.current;
        ctx.current.fillStyle = 'black'
        ctx.current.fillRect(0,0,width,height);
        player.current.update();
        enemy.current.update();

        player.current.stopMoving();
        enemy.current.stopMoving();
        if (pressedKeys.current[Keys.RIGHT]) {
            activePlayer.moveRight();
            const playerData = JSON.stringify(activePlayer)
            broadcast(playerData);
        } else if (pressedKeys.current[Keys.LEFT]) {
            activePlayer.moveLeft();
            const playerData = JSON.stringify(activePlayer)
            broadcast(playerData);
        }
        requestAnimationFrame(animate)
    }


    const handleKeyDown = (e) => {
        const activePlayer = initiator ? player.current : enemy.current;
        const key = e.key;
        if (key === Keys.UP) {
            activePlayer.jump();
            return;
        }
        pressedKeys.current = {...pressedKeys.current, [key]: true}
    }

    const handleKeyUp = (e) => {
        const key = e.key;
        pressedKeys.current = {...pressedKeys.current, [key]: false}

    }

  return (
    <div className="App">
     <canvas ref={canvas} width={width} height={height}/>
    </div>
  )
}

export default App
