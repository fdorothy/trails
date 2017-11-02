import Phaser from 'phaser'
import config from '../config'

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset }) {
    super(game, x, y, asset)
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    var framenames = Phaser.Animation.generateFrameNames('run/', 0, 7);
    this.run = this.animations.add('run', framenames, 10, true, false);
    framenames = Phaser.Animation.generateFrameNames('idle/', 0, 11);
    this.animations.add('idle', framenames, 10, true, false);
    framenames = ['jump/jump.png'];
    this.animations.add('jump', framenames, 10, true, false);
    framenames = Phaser.Animation.generateFrameNames('freefall/', 0, 1);
    var anim = this.animations.add('freefall', framenames, 5, true, false);
    this.anchor.setTo(0.5, 0.5);
    this.game.scaleModel = Phaser.ScaleManager.SHOW_ALL;
    this.scale.setTo(config.player.scale);
    this.speed = 1.0;
  }

  update () {
    var vx = this.body.velocity.x;
    var vy = this.body.velocity.y;
    if (vx < -1.0 || vx > 1.0 ||
        vy < -1.0 || vy > 1.0) {
      this.walkAnimation();
    } else {
      this.stopAnimation();
    }

    if (!this.movingLR)
      this.stopLR();
    if (!this.movingUD)
      this.stopUD();
    this.movingLR = false;
    this.movingUD = false;

    var dt = this.game.time.physicsElapsed;
    var drag = 0.1;
    this.body.velocity.y -= vy * dt * drag;
    this.body.velocity.x -= vx * dt * drag;
  }

  moveLeft() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vx = this.body.velocity.x - accel * dt;
    if (vx < -config.player.targetSpeed*this.speed) {
      vx = -config.player.targetSpeed*this.speed;
    } else if (vx > -config.player.initialSpeed*this.speed) {
      vx = -config.player.initialSpeed*this.speed;
    }
    this.body.velocity.x = vx;
    if (this.scale.x > 0)
      this.scale.x = -this.scale.x;
    this.movingLR = true;
  }

  moveRight() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vx = this.body.velocity.x + accel * dt;
    if (vx > config.player.targetSpeed*this.speed) {
      vx = config.player.targetSpeed*this.speed;
    } else if (vx < config.player.initialSpeed*this.speed) {
      vx = config.player.initialSpeed*this.speed;
    }
    this.body.velocity.x = vx;
    if (this.scale.x < 0)
      this.scale.x = -this.scale.x;
    this.movingLR = true;
  }

  moveDown() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vy = this.body.velocity.y + accel * dt;
    if (vy > config.player.targetSpeed*this.speed) {
      vy = config.player.targetSpeed*this.speed;
    } else if (vy < config.player.initialSpeed*this.speed) {
      vy = config.player.initialSpeed*this.speed;
    }
    this.body.velocity.y = vy;
    this.movingUD = true;
  }

  moveUp() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vy = this.body.velocity.y - accel * dt;
    if (vy < -config.player.targetSpeed*this.speed) {
      vy = -config.player.targetSpeed*this.speed;
    } else if (vy > -config.player.initialSpeed*this.speed) {
      vy = -config.player.initialSpeed*this.speed;
    }
    this.body.velocity.y = vy;
    this.movingUD = true;
  }

  stopLR() {
    var dt = this.game.time.physicsElapsed;
    var vx = this.body.velocity.x;
    this.body.velocity.x = this.slowdown(vx, dt);
  }

  stopUD() {
    var dt = this.game.time.physicsElapsed;
    var vy = this.body.velocity.y;
    this.body.velocity.y = this.slowdown(vy, dt);
  }

  slowdown(v, dt) {
    if (v < 0) {
      v += config.player.groundDeaccel * dt;
      if (v > 0)
	v = 0;
    } else if (v > 0) {
      v -= config.player.groundDeaccel * dt;
      if (v < 0)
	v = 0;
    }
    if (v < config.player.initialSpeed && v > -config.player.initialSpeed) {
      v = 0;
    }
    return v;
  }

  walkAnimation() {
    this.animations.play('run');
  }

  stopAnimation() {
    this.animations.play('idle');
  }

  jumpAnimation() {
    this.animations.play('jump');
  }

  freefallAnimation() {
    this.animations.play('freefall');
  }
}
