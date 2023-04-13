interface Coordinates {
    x: number;
    y: number;
}

const gravity = 0.2;

interface IPlayer {
    ctx: CanvasRenderingContext2D;
    position: Coordinates;
    velocity: Coordinates;
}

export class Player {
    position;
    ctx;
    velocity;
    height;
    attack;
    constructor({ctx, position, velocity}: IPlayer) {
        this.position = position;
        this.ctx = ctx;
        this.velocity = velocity
        this.height = 150;
        this.attack = {

        }
    }

    init() {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.position.x, this.position.y, 50, this.height);
    }

    update() {
        this.init();
        this.position.y += this.velocity.y;
        this.position.x += this.velocity.x;

        if (this.position.y + this.height + this.velocity.y >= this.ctx.canvas.height ) {
            this.velocity.y = 0;
        } else {
            this.velocity.y += gravity;
        }
    }

    moveRight() {
        this.velocity.x = 1;
    }

    moveLeft() {
        this.velocity.x = -1;
    }

    stopMoving() {
        this.velocity.x = 0;
    }

    jump() {
        this.velocity.y = -10;
    }
}
