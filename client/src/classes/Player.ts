interface Coordinates {
    x: number;
    y: number;
}

const gravity = 0.2;

interface IPlayer {
    ctx: CanvasRenderingContext2D;
    position: Coordinates;
    velocity: Coordinates;
    offset: Coordinates;
}

export class Player {
    position;
    ctx;
    velocity;
    height;
    attackArea;
    width;
    attacking;
    constructor({ctx, position, velocity, offset}: IPlayer) {
        this.position = position;
        this.ctx = ctx;
        this.velocity = velocity
        this.height = 150;
        this.width = 50;
        this.attackArea = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            width: 150,
            height: 50,
            offset
        }
        this.attacking = false;
    }

    init() {
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        if (this.attacking) {
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(
                this.attackArea.position.x,
                this.attackArea.position.y,
                this.attackArea.width,
                this.attackArea.height
            )
        }

    }

    update() {
        this.init();
        this.attackArea.position.x = this.position.x + this.attackArea.offset.x;
        this.attackArea.position.y = this.position.y;

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

    attack() {
        this.attacking = true;
        setTimeout(()=>{
            this.attacking = false;
        }, 100)
    }

}
