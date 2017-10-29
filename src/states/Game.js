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
    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.time.advancedTiming = true;

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
    for (var key in config.state.items) {
      var obj = config.state.items[key];
      if (obj != "equipped" && obj.map == this.map.asset) {
       	this.spawnItem(key, obj.x, obj.y);
      }
    }
    for (var key in this.map.allObjects) {
      var obj = this.map.allObjects[key];
      if (obj.type == "item_spawn") {
	if (config.state.items[obj.name] == null) {
	  this.spawnItem(obj.name, obj.x + obj.width/2.0, obj.y+obj.height/2.0);
	}
      }
    }
  }

  spawnMapPiece() {
    var poi = [];
    for (var i in this.map.objectMap) {
      var obj = this.map.objectMap[i];
      console.log(obj.type);
      if (obj.type == 'poi') {
        console.log("found poi");
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
    var width = 48;
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
    var tween = game.add.tween(this.overlay).to( { alpha: 1 }, 2000, "Linear", true, 0, -1, true);

    this.world.fixedToCamera = true;
    this.world.desiredX = config.gameWidth/2.0 - width*7/2.0;
    this.world.cameraOffset.x = this.world.desiredX;
    this.world.cameraOffset.y = 5;
    this.world.visible = false;
    this.hideMap();
  }

  spawnItem(name, x, y) {
    var sprite = new Item({
      game: this.game,
      x: x,
      y: y,
      name: name
    });
    sprite.props = {
      name: name,
      type: "item",
      properties: {tooltip: name}
    }
    this.items.add(sprite);
    this.emitterLayer.add(sprite.emitter);
    this.updateItemState(sprite);
    return sprite;
  }

  updateItemState(sprite) {
    config.state.items[sprite.props.name] = {
      map: this.map.asset,
      x: sprite.x,
      y: sprite.y
    };
  }

  pickupItem(sprite) {
    this.sfx.pickup.play();
    config.state.equipped = sprite.props.name;
    config.state.items.add({name: sprite.props.name})
    sprite.destroy();
    config.state.items[sprite.props.name] = "equipped";
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
      else if (y.props.type == "item")
        this.pickupItem(y);
    }

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
  }
}
