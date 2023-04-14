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
        const { position, velocity, attackArea } = data;
        oppositePlayer.position = position;
        oppositePlayer.velocity = velocity;
        oppositePlayer.attackArea = attackArea;
    }

    const broadcast = (activePlayer) => {
        const broadcastData = JSON.stringify(activePlayer)

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
        [Keys.UP]: false,
    })

    // TODO: set position for initiator to the left and opponent to the right
    const createPlayer = () => {
        player.current = new Player({
            ctx: ctx.current,
            position: {x: 50, y:0},
            velocity: {x: 0, y:0},
            offset: {x: 0, y:0},
        });
    }

    const createEnemy = () => {
        enemy.current = new Player({
            ctx: ctx.current,
            position: {x: 400, y:100},
            velocity: {x: 0, y:0},
            offset: {x: -50, y:0},
        });
    }

    const createBackground = async () => {
        ctx.current.fillStyle = 'white'
        ctx.current.fillRect(0, 0, width, height)
    }

    const initMovementHandler = () => {
        const activePlayer = initiator ? player.current : enemy.current;
        // Reset on keyUp
        player.current.stopMoving();
        enemy.current.stopMoving();

        if (pressedKeys.current[Keys.RIGHT]) {
            activePlayer.moveRight();
            broadcast(activePlayer);
        } else if (pressedKeys.current[Keys.LEFT]) {
            activePlayer.moveLeft();
            broadcast(activePlayer);
        }
    }

    const initInitiatorAttackHandler = () => {
        const activePlayer = player.current ;
        const opponent = enemy.current;

        const playerIsNearOpponent = activePlayer.attackArea.position.x + activePlayer.attackArea.width >= opponent.position.x
        const isNotPastOpponent = activePlayer.attackArea.position.x <= opponent.position.x + opponent.width;
        const playerIsNotJumping = (activePlayer.attackArea.position.y + activePlayer.height >= opponent.position.y) && (activePlayer.attackArea.position.y <= opponent.position.y + opponent.height);

        if (playerIsNearOpponent && isNotPastOpponent && playerIsNotJumping && activePlayer.attacking) {
            activePlayer.attacking = false;
            console.log('go')
        }
    }

    const initOpponentAttackHandler = () => {

    }

    const animate = () => {
        ctx.current.fillStyle = 'black'
        ctx.current.fillRect(0,0,width,height);
        player.current.update();
        enemy.current.update();

        initMovementHandler();
        initInitiatorAttackHandler();
        requestAnimationFrame(animate);
    }


    const handleKeyDown = (e) => {
        e.preventDefault();
        const activePlayer = initiator ? player.current : enemy.current;
        const key = e.key;
        console.log('key', key)
        switch(key) {
            case Keys.UP:
                activePlayer.jump();
                broadcast(activePlayer);
                break;
            case Keys.ATTACK:
                activePlayer.attack();
                break;
            default:
                pressedKeys.current = {...pressedKeys.current, [key]: true}
        }
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
