import Phaser from 'phaser'
import { centerGameObjects } from '../utils'
import config from '../config'

export default class extends Phaser.State {
  init () {}

  preload () {
    this.loaderBg = this.add.sprite(this.game.world.centerX, this.game.height-30, 'loaderBg')
    this.loaderBar = this.add.sprite(this.game.world.centerX, this.game.height-30, 'loaderBar')
    this.loaderBg.anchor.x = 0.5;
    this.loaderBg.anchor.y = 0.5;
    this.loaderBar.anchor.x = 0.5;
    this.loaderBar.anchor.y = 0.5;

    this.load.setPreloadSprite(this.loaderBar)

    // load all tilemaps and tilesheets
    for (var key in config.levels) {
      this.load.tilemap(key, config.levels[key].asset, null, Phaser.Tilemap.TILED_JSON);

      // load the minimap as an image
      this.load.image(key + '_map', config.levels[key].minimap)
    }

    for (var key in config.images) {
      this.load.image(key, config.images[key]);
    }

    for (var key in config.sounds) {
      this.load.audio(key, config.sounds[key]);
    }
    
    this.load.atlasJSONHash('hero', 'assets/images/hero.png', 'assets/images/hero.json');
    this.load.spritesheet('fire', 'assets/images/fire.png', 64, 64, 4);

    config.state = JSON.parse(config.initial_state);

  }

  create () {
    // add the spinning world
    var group = this.game.add.group();
    this.world = new Phaser.Sprite(this.game, this.game.width/2, this.game.height/2, "round_world");
    this.world.anchor.x = 0.5;
    this.world.anchor.y = 0.5;
    group.add(this.world);

    var tween = game.add.tween(this.world).to(
      {angle: '360'},
      30000,
      "Linear",
      true,
      0,
      -1,
      false
    );

    var style = {
      font: 'bold 14px Belgrano',
      fill: '#000',
      align: 'center',
      boundsAlignH: "center",
      boundsAlignV: "middle",
    };
    this.text = this.add.text(this.game.world.centerX, this.game.height-30, '[press any key]', style);
    this.text.anchor.setTo(0.5, 0.5);
    var tween = game.add.tween(this.text).to(
      {alpha: 0.0},
      1000,
      "Linear",
      true,
      0,
      -1,
      true
    );

    //this.loaderBar.destroy();
    var kbrd = this.game.input.keyboard;
    kbrd.addCallbacks(this, null, null, this.onKey);
  }

  update() {
    // if (this.cache.isSoundDecoded)
    //   this.state.start('Game')
  }

  onKey() {
    if (this.cache.isSoundDecoded)
      this.state.start('Game')
  }
}
