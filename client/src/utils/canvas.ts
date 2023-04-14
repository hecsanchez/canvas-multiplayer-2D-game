import {Player} from "../classes/Player";
import {broadcast, initiator} from "./connection";
import {Keys} from "../types";
import {height, width} from "./dimensions";

// TODO: set position for initiator to the left and opponent to the right
export const createPlayer = (ctx) => {
    return new Player({
        ctx,
        position: {x: 50, y:0},
        velocity: {x: 0, y:0},
        offset: {x: 0, y:0},
    });
}

export const createEnemy = (ctx) => {
    return new Player({
        ctx,
        position: {x: 400, y:100},
        velocity: {x: 0, y:0},
        offset: {x: -100, y:0},
    });
}

export const createBackground = async (ctx) => {
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, width, height)
}

export const initMovementHandler = (player, enemy, pressedKeys, healthData) => {
    const activePlayer = initiator ? player : enemy;
    // Reset on keyUp
    player.stopMoving();
    enemy.stopMoving();

    if (pressedKeys[Keys.RIGHT]) {
        activePlayer.moveRight();
        broadcast(activePlayer, healthData);
    } else if (pressedKeys[Keys.LEFT]) {
        activePlayer.moveLeft();
        broadcast(activePlayer, healthData);
    }
}

export const initAttackHandler = (activePlayer, opponent, setOpponentHealth) => {
    const playerIsNearOpponent = activePlayer.attackArea.position.x + activePlayer.attackArea.width >= opponent.position.x
    const isNotPastOpponent = activePlayer.attackArea.position.x <= opponent.position.x + opponent.width;
    const playerIsNotJumping = (activePlayer.attackArea.position.y + activePlayer.height >= opponent.position.y) && (activePlayer.attackArea.position.y <= opponent.position.y + opponent.height);

    if (playerIsNearOpponent && isNotPastOpponent && playerIsNotJumping && activePlayer.attacking) {
        setTimeout(()=>{
            activePlayer.attacking = false;
        }, 1)
        setOpponentHealth(prevState=>prevState-10)
    }
}


