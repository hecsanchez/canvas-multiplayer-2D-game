import { useEffect, useState, type FC } from 'react'
import './App.css'
import {Keys} from "./types";
import {initSocket, initiator, broadcast} from "./utils/connection";
import {
    createBackground,
    createEnemy,
    createPlayer,
    initAttackHandler,
    initMovementHandler
} from "./utils/canvas";
import {height, width} from "./utils/dimensions";
import {useRefs} from "./utils/useRefs";
import {HealthMeter} from "./components/HealthMeter/HealthMeter";
import {Winner} from "./components/Winner/Winner";
import {Loser} from "./components/Loser/Loser";

const App: FC = () => {
    const {canvas, player, enemy, ctx, pressedKeys} = useRefs();

    const [health, setHealth] = useState(100)
    const [opponentHealth, setOpponentHealth] = useState(100)

    const [connected, setConnected] = useState(false)

    const healthData = { health, opponentHealth }
    console.log('initiator', initiator)
    console.log('health', health)
    console.log('opponentHealth', opponentHealth)

    useEffect(()=>{
        if (initiator) {
            broadcast(player.current, healthData);
        }
    }, [opponentHealth])

    useEffect(()=>{
        if (!initiator) {
            broadcast(enemy.current, healthData);
        }
    }, [health])

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
        const { activePlayer, healthData } = data;
        const {health: currentPlayerHealthData, opponentHealth: opponentHealthData} = healthData;
        const { position, velocity, attackArea } = activePlayer;
        oppositePlayer.position = position;
        oppositePlayer.velocity = velocity;
        oppositePlayer.attackArea = attackArea;

        if (initiator) {
            setHealth(currentPlayerHealthData);
        } else {
            setOpponentHealth(opponentHealthData);
        }
    }

    useEffect(() => {
        const onConnect = () => {
            setConnected(true)
            initGame();
        }

        initSocket(onConnect, draw)
    }, [])

    const animate = () => {
        createBackground(ctx.current)
        player.current.update();
        enemy.current.update();

        initMovementHandler(player.current, enemy.current, pressedKeys.current, {health, opponentHealth});

        if (initiator) {
            initAttackHandler(player.current, enemy.current, setOpponentHealth);
        } else {
            initAttackHandler(enemy.current, player.current, setHealth);
        }

        requestAnimationFrame(animate);
    }

    const initGame = () => {
        player.current = createPlayer(ctx.current);
        enemy.current = createEnemy(ctx.current);
        requestAnimationFrame(animate)
    }

    useEffect(()=>{
        ctx.current = canvas.current.getContext('2d');
        createBackground(ctx.current);
    }, [])

    pressedKeys.current = ({
        [Keys.RIGHT]: false,
        [Keys.LEFT]: false,
        [Keys.UP]: false,
    })

    const handleKeyDown = (e) => {
        const activePlayer = initiator ? player.current : enemy.current;
        const key = e.key;

        switch(key) {
            case Keys.UP:
                activePlayer.jump();
                broadcast(activePlayer, healthData);
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
        {(initiator && opponentHealth === 0) || (!initiator && health === 0) ? (
            <Winner />
        ): null}
        {(initiator && health === 0) || (!initiator && opponentHealth === 0) ? (
            <Loser />
        ): null}
        <HealthMeter playerHealth={health} opponentHealth={opponentHealth}/>
        <canvas ref={canvas} width={width} height={height}/>
    </div>
  )
}

export default App
