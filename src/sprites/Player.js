import Phaser from 'phaser'
import config from '../config'

export default class extends Phaser.Sprite {
  constructor ({ game, x, y, asset }) {
    super(game, x, y, asset)
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    var framenames = Phaser.Animation.generateFrameNames('run/', 0, 7);
    this.animations.add('run', framenames, 10, true, false);
    framenames = Phaser.Animation.generateFrameNames('idle/', 0, 11);
    this.animations.add('idle', framenames, 10, true, false);
    framenames = ['jump/jump.png'];
    this.animations.add('jump', framenames, 10, true, false);
    framenames = Phaser.Animation.generateFrameNames('freefall/', 0, 1);
    var anim = this.animations.add('freefall', framenames, 5, true, false);
    this.anchor.setTo(0.5, 0.5);
    this.game.scaleModel = Phaser.ScaleManager.SHOW_ALL;
    this.scale.setTo(config.player.scale);
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

    var dt = this.game.time.physicsElapsed;
    var drag = 0.05;
    this.body.velocity.y -= vy * dt * drag;
    this.body.velocity.x -= vx * dt * drag;
  }

  moveLeft() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vx = this.body.velocity.x - accel * dt;
    if (vx < -config.player.targetSpeed) {
      vx = -config.player.targetSpeed;
    } else if (vx > -config.player.initialSpeed) {
      vx = -config.player.initialSpeed;
    }
    this.body.velocity.x = vx;
    this.scale.x = -config.player.scale;
  }

  moveRight() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vx = this.body.velocity.x + accel * dt;
    if (vx > config.player.targetSpeed) {
      vx = config.player.targetSpeed;
    } else if (vx < config.player.initialSpeed) {
      vx = config.player.initialSpeed;
    }
    this.body.velocity.x = vx;
    this.scale.x = config.player.scale;
  }

  moveDown() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vy = this.body.velocity.y + accel * dt;
    if (vy > config.player.targetSpeed) {
      vy = config.player.targetSpeed;
    } else if (vy < config.player.initialSpeed) {
      vy = config.player.initialSpeed;
    }
    this.body.velocity.y = vy;
  }

  moveUp() {
    var dt = this.game.time.physicsElapsed;
    var accel = config.player.groundAccel;
    var vy = this.body.velocity.y - accel * dt;
    if (vy < -config.player.targetSpeed) {
      vy = -config.player.targetSpeed;
    } else if (vy > -config.player.initialSpeed) {
      vy = -config.player.initialSpeed;
    }
    this.body.velocity.y = vy;
  }

  stop() {
    var dt = this.game.time.physicsElapsed;
    var vx = this.body.velocity.x;
    var vy = this.body.velocity.y;
    this.body.velocity.x = this.slowdown(vx, dt);
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
