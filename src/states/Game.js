/* globals __DEV__ */
import Phaser from 'phaser'
import Player from '../sprites/Player'
import Monster from '../sprites/Monster'
import Level from '../sprites/Level'
import Item from '../sprites/Item'
import Fire from '../sprites/Fire'

import config from '../config'

export default class extends Phaser.State {
  init () {
    this.stage.backgroundColor = '#000'
  }
  preload () {
  }

  create () {
    // constants
    this.worldMapTileSize = 64;

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.time.advancedTiming = true;

    if (config.state.new_game)
      this.resetGame();
    this.loadMap();
    this.loadPlayer();
    this.initKeyboard();
    this.initTooltip();

    this.spawnItems();
    this.spawnMapPiece();
    this.spawnMonsters();

    this.emitterLayer = this.game.add.group();

    // the world map
    this.createWorldMap();

    this.drytimer = 0.0;
  }

  initKeyboard() {
    var kbrd = this.game.input.keyboard;
    this.cursor = kbrd.createCursorKeys();
    this.spacebar = kbrd.addKey(Phaser.Keyboard.SPACEBAR);
    kbrd.addCallbacks(this, null, null, this.onKey);
    kbrd.addKeyCapture([
      Phaser.Keyboard.LEFT,
      Phaser.Keyboard.RIGHT,
      Phaser.Keyboard.UP,
      Phaser.Keyboard.DOWN,
      Phaser.Keyboard.SPACEBAR
    ]);
  }

  resetGame() {
    config.state.new_game = false;
    var bag = [];
    this.addToBag(bag, 'x', 3);
    this.addToBag(bag, 'ud', 14);
    this.addToBag(bag, 'c_ul', 14);
    this.addToBag(bag, 't_u', 9);
    this.addToBag(bag, 'd_u', 4);
    this.shuffleArray(bag);
    console.log(bag);
    config.state.tile_bag = bag;
  }

  addToBag(bag, piece, count) {
    for (var i=0; i<count; i++)
      bag.push(piece);
  }

  initTooltip() {
    var style = {
      font: 'bold 16px Belgrano',
      fill: '#000',
      align: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      boundsAlignH: "center",
      boundsAlignV: "middle",
    };
    this.tooltip = this.add.text(0, 0, '', style);
    this.tooltip.anchor.setTo(0.5, 0.5);
  }

  initSound() {
    if (game.music == null) {
      game.music = {};
    }
    var music = null;
    if (this.map.properties && this.map.properties.music) {
      music = this.map.properties.music;
    }
    if (game.music[music] == null) {
      game.music[music] = this.game.add.audio(music);
      game.music[music].play('', 0, 0.0, true);
    }
    // fade out all other music
    for (var key in game.music) {
      if (key != music)
        game.music[key].stop();
    }
    if (music) {
      game.music[music].play('', 0, 1.0, true);
    }

    // sound effects
    this.sfx = {
      pickup: this.game.add.audio('pickup_audio'),
      fire: this.game.add.audio('fire_audio'),
    }
    this.player.sfx = this.sfx;
  }

  loadMap() {
    var pos = config.state.world_location;
    var name = config.state.grid[pos[1]][pos[0]];
    this.map = new Level({
      game: this.game,
      asset: name
    });
  }

  loadPlayer() {
    var entranceXY = this.getEntranceXY(config.state.entrance);
    this.player = new Player({
      game: this.game,
      x: entranceXY[0],
      y: entranceXY[1],
      asset: 'hero'
    })
    this.player.body.setSize(
      this.player.body.width * 0.75,
      this.player.body.height,
      0, 0
    );
    this.map.spriteLayer.add(this.player);
    this.game.camera.follow(this.player);
  }

  spawnItems() {
    this.items = new Phaser.Group(this.game);
    this.map.spriteLayer.add(this.items);
    if (config.state.items == null)
      config.state.items = {};
    for (var i in config.state.world_map) {
      var obj = config.state.world_map[i];
      if (obj.world[0] == config.state.world_location[0] &&
          obj.world[1] == config.state.world_location[1])
        this.addMapPiece(obj.local[0]*32, obj.local[1]*32);
    }
  }

  spawnMapPiece() {
    var poi = [];
    for (var i in this.map.objectMap) {
      var obj = this.map.objectMap[i];
      if (obj.type == 'poi') {
      }
    }
  }

  spawnMonsters() {
    // spawn monsters
    this.monsters = new Phaser.Group(this.game);
    this.map.spriteLayer.add(this.monsters);
    for (var key in this.map.allObjects) {
      var monster = this.map.allObjects[key];
      if (monster.type == "monster") {
	var sprite = new Monster({
	  game: this.game,
	  x: monster.x + monster.width / 2.0,
	  y: monster.y + monster.height / 2.0,
	  info: monster.properties
	});
	this.monsters.add(sprite);
      }
    }
  }

  createWorldMap() {
    var width = this.worldMapTileSize;
    this.world = this.game.add.group();
    for (var i in config.state.grid) {
      var row = config.state.grid[i];
      for (var j in row) {
        var cell = row[j];
        var minimap = "map_unknown";
        if (cell != null) {
          minimap = cell + '_map';
        }
        var sprite = new Phaser.Sprite(
          this.game,
          j*width, i*width,
          minimap,
        );
        sprite.width = width;
        sprite.height = width;
        this.world.add(sprite);
      }
    }

    // add in the overlay to show our current
    // position on the world-map
    var x = config.state.world_location[0]*width;
    var y = config.state.world_location[1]*width;
    this.overlay = new Phaser.Sprite(this.game, x, y, 'overlay')
    this.overlay.alpha = 0.0
    this.world.add(this.overlay)
    var tween = game.add.tween(this.overlay).to(
      {alpha: 1},
      2000,
      "Linear",
      true,
      0,
      -1,
      true
    );

    // add the sprite to represent current position
    this.worldHead = new Phaser.Sprite(
      this.game,
      x+width/2, y+width/2,
      'head'
    );
    this.worldHead.anchor.x = 0.5;
    this.worldHead.anchor.y = 0.5;
    this.world.add(this.worldHead);

    // add sprites for map pieces
    this.worldItems = []
    for (i in config.state.world_map) {
      var piece = config.state.world_map[i];
      var x = piece.world[0]*width +
          piece.local[0]*width/this.map.width;
      var y = piece.world[1]*width +
          piece.local[1]*width/this.map.height;
      var sprite = new Phaser.Sprite(this.game, x, y, 'arrow');
      sprite.anchor.x = 0.5;
      sprite.anchor.y = 1.0;
      var tween = game.add.tween(sprite).to(
        {y: y-5},
        650,
        Phaser.Easing.Bounce.InOut,
        true,
        0,
        -1,
        true
      );
      this.world.add(sprite);
    }

    this.world.fixedToCamera = true;
    this.world.desiredX = config.gameWidth/2.0 - width*7/2.0;
    this.world.cameraOffset.x = this.world.desiredX;
    this.world.cameraOffset.y = 5;
    this.world.visible = false;
    this.hideMap();
  }

  addMapPiece(x, y) {
    var sprite = new Phaser.Sprite(
      this.game,
      x,
      y,
      'map_unknown'
    );
    sprite.props = {type: 'map'}
    sprite.width = 32;
    sprite.height = 32;
    this.game.physics.enable(sprite, Phaser.Physics.ARCADE);
    this.items.add(sprite);
    return sprite;
  }

  pickupItem(sprite) {
    //this.sfx.pickup.play();

    // pick a random tile to pickup
    var map = config.state.tile_bag.shift();
    config.state.equipped_map = map;

    // destroy old tile, and forget it
    sprite.destroy();
    config.state.world_map = []
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  render () {
    //game.debug.spriteInfo(this.player, 32, 32);
    //game.debug.text(game.time.fps || '--', 2, 14, "#fff");
    //this.game.debug.text(game.time.fps || '--', 2, 14);   
  }

  trigger(x, y) {
    if (this.spacebar.isDown) {
      if (y.props.type == "exit")
        this.warp(y.props.properties);
    }
    if (y.props.type == "map")
        this.pickupItem(y);

    // show tooltip if available
    if (y.props.properties) {
      var tooltip = y.props.properties.tooltip;
      if (tooltip != null) {
	this.tooltip.text = tooltip;
      }
    }
  }

  warp(props) {
    if (props != null && config.levels[props.map] != null) {
      config.state.map = props.map;
      config.state.entrance = props.entrance;
      this.state.start('Warp');
    } else {
    }
  }

  getEntranceXY(entrance_name) {
    var entrance = this.map.objectMap[entrance_name];
    return [entrance.x+entrance.width/2.0,
            entrance.y+entrance.height/2.0]
  }

  update() {
    this.resetTooltip();
    this.checkCollision();
    this.checkItems();
    this.checkTriggers();
    this.checkMonsters();
    this.checkKeys();
  }

  resetTooltip() {
    this.tooltip.text = '';
    this.tooltip.x = this.player.x;
    this.tooltip.y = this.player.y - 32;
  }

  checkCollision() {
    game.physics.arcade.collide(
      this.player,
      this.map.boundaries
    );
  }

  checkItems() {
    game.physics.arcade.overlap(
      this.player,
      this.items,
      this.trigger,
      null,
      this
    );
  }

  checkTriggers() {
    game.physics.arcade.overlap(
      this.player,
      this.map.triggers,
      this.trigger,
      null,
      this
    );
  }

  checkKeys() {
    if (this.cursor.left.isDown)
      this.player.moveLeft();
    else if (this.cursor.right.isDown)
      this.player.moveRight();
    else
      this.player.stopLR();
    
    if (this.cursor.up.isDown)
      this.player.moveUp();
    else if (this.cursor.down.isDown)
      this.player.moveDown();
    else
      this.player.stopUD();
  }

  onKey(x) {
    if (x == 'm' || x == 'M')
      if (this.mapVisible)
        this.hideMap();
      else
        this.showMap();
  }

  checkMonsters() {
    game.physics.arcade.overlap(
      this.player,
      this.monsters,
      (x, y) => {
        this.sfx.death.play();
        this.state.start("GameOver");
      },
      null,
      this
    );
  }

  canPlaceTile(dst_tile, dst_x, dst_y) {
    var tiles = [
      tileAt(dst_x,dst_y-1),
      tileAt(dst_x,dst_y+1),
      tileAt(dst_x-1,dst_y),
      tileAt(dst_x+1,dst_y)
    ]
    var tiledef = config.levels;
    var req_edges = [];

    // up
    if (tiles[0] == null)
      req_edges[0] = null;
    else
      req_edges[0] = tiledef[tiles[0]].edges[1];

    // down
    if (tiles[1] == null)
      req_edges[1] = null;
    else
      req_edges[1] = tiledef[tiles[1]].edges[0];

    // left
    if (tiles[2] == null)
      req_edges[2] = null;
    else
      req_edges[2] = tiledef[tiles[2]].edges[3];

    // right
    if (tiles[3] == null)
      req_edges[3] = null;
    else
      req_edges[3] = tiledef[tiles[3]].edges[2];

    edges = tiledef[dst_tile].edges;
    for (var i=0; i<4; i++) {
      if (req_edges[i] != null &&
          req_edges[i] != edges[i])
        return false;
    }
    return true;
  }

  tileAt(x, y) {
    if (x >= 0 && y >= 0 && x < 7 && y < 7)
      return config.state.grid[y][x];
    return null;
  }

  hideMap() {
    if (this.worldTween)
      this.worldTween.stop();
    this.worldTween = game.add.tween(this.world.cameraOffset);
    this.worldTween.to({y: -500}, 500, "Linear", true)
    this.mapVisible = false;
  }

  showMap() {
    if (this.worldTween)
      this.worldTween.stop();
    this.worldTween = game.add.tween(this.world.cameraOffset);
    this.worldTween.to({y: 5}, 500, "Linear", true)
    this.world.visible = true;
    this.mapVisible = true;

    // update our location on the map
    var width = this.worldMapTileSize;
    var x = config.state.world_location[0]*width;
    var y = config.state.world_location[1]*width;
    this.worldHead.x = x+this.player.x*width/this.map.widthInPixels;
    this.worldHead.y = y+this.player.y*width/this.map.heightInPixels;
  }
}
