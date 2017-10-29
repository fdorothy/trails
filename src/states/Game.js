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
    this.itemPickupCooldown = 1.0;

    this.backgroundLayer = this.game.add.group();
    this.mapVisible = false;

    this.map = new Level({
      game: this.game,
      asset: config.state.map
    });

    // background if needed
    if (this.map.properties && this.map.properties.background) {
      this.bg = new Phaser.TileSprite(this.game, 0, 0, this.game.world.width * 3 / 2, this.game.world.height * 3 / 2, this.map.properties.background);
      this.bg.tilePosition.y += 2;
      this.bg.anchor.setTo(0.5, 0.5);
      this.backgroundLayer.add(this.bg);
    }

    // create and add player
    var entranceXY = this.getEntranceXY(config.state.entrance);
    this.player = new Player({
      game: this.game,
      x: entranceXY[0],
      y: entranceXY[1],
      asset: 'hero'
    })
    this.player.body.setSize(this.player.body.width * 0.75, this.player.body.height, 0, 0);
    this.map.spriteLayer.add(this.player);
    this.game.camera.follow(this.player);

    this.cursor = this.game.input.keyboard.createCursorKeys();
    this.spacebar = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.game.input.keyboard.addCallbacks(this, null, null, this.onKey);
    this.game.input.keyboard.addKeyCapture([
      Phaser.Keyboard.LEFT,
      Phaser.Keyboard.RIGHT,
      Phaser.Keyboard.UP,
      Phaser.Keyboard.DOWN,
      Phaser.Keyboard.SPACEBAR
    ]);

    // tooltip that appears above items
    var style = {
      font: 'bold 16px Belgrano',
      fill: '#000',
      align: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      boundsAlignH: "center",
      boundsAlignV: "middle",
    };

    this.tooltip = this.add.text(this.player.x, this.player.y, '', style);
    this.tooltip.anchor.setTo(0.5, 0.5);

    // message that appears in center of screen
    this.message = this.add.text(0, 0, '', style)
    this.message.anchor.setTo(0.5, 0.5);
    this.messageTime = 0.0;

    this.emitterLayer = this.game.add.group();

    // spawn items
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

    // show how long we have to solve the game
    this.hud = this.game.add.group();
    this.hud.fixedToCamera = true;
    
    var style = {
      font: 'bold 16px Belgrano',
      fill: '#900',
      align: 'center',
      boundsAlignH: "center",
      boundsAlignV: "middle",
    };
    this.deadTime = new Phaser.Text(this.game, this.camera.width / 2, 0, config.state.deadTime, style);
    this.hud.add(this.deadTime);
    this.deadTime.anchor.setTo(0.5, 0);

    // the world map
    this.createWorldMap();

    // music!
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

    this.drytimer = 0.0;
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
    this.hideMap();
  }

  spawnItem(name, x, y) {
    var sprite = new Item({
      game: this.game,
      x: x,
      y: y,
      name: name
    });
    sprite.props = {name: name, type: "item", properties: {tooltip: name}}
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
    if (this.itemPickupCooldown <= 0.0) {
      this.sfx.pickup.play();
      config.state.equipped = sprite.props.name;
      config.state.items.add({name: sprite.props.name})
      sprite.destroy();
      config.state.items[sprite.props.name] = "equipped";
      this.itemPickupCooldown = 1.0;
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
      this.setMessageText("cannot fit");
    }
  }

  setMessageText(text) {
    if (text != this.message.text) {
      this.message.text = text;
      this.messageTime = 5.0;
      this.message.visible = true;
    }
  }

  getEntranceXY(entrance_name) {
    var entrance = this.map.objectMap[entrance_name];
    return [entrance.x+entrance.width/2.0,
            entrance.y+entrance.height/2.0]
  }

  update() {
    var dt = this.game.time.physicsElapsed;

    // reduce the rescue time if set
    if (config.state.rescueTime > 0.0) {
      config.state.rescueTime -= dt;
    } else {
      config.state.rescueTime = 0.0;
    }

    // reduce and check dead time
    if (config.state.deadTime <= 0.0) {
      this.state.start("GameOver");
    } else {
      config.state.deadTime -= dt;
      var t = config.state.deadTime.toFixed(0)
      this.deadTime.text = t;
    }

    // switch to the game over screen if we won
    if (config.state.rescueTime == 0.0 && config.state.rescued) {
      this.state.start("GameOver");
    }

    // set our message text to center of screen
    this.updateMessage(dt);
    
    // clear the tooltip and message texts
    this.tooltip.text = '';
    this.tooltip.x = this.player.x;
    this.tooltip.y = this.player.y - 32;

    if (this.itemPickupCooldown > 0.0)
      this.itemPickupCooldown -= dt;
    game.physics.arcade.collide([this.player, this.monsters, this.items], this.map.boundaries);

    var inwater = this.player.underwater;
    this.player.underwater = false;
    for (var idx in this.map.water) {
      var layer = this.map.water[idx];
      var tiles = layer.getTiles(this.player.x - 16, this.player.y - 16 - this.player.height / 2.0, 32, 32);
      this.player.underwater = tiles.filter((x) => x.index != -1).length > 0;
    }
    if (inwater != this.player.underwater && this.drytimer > 0.25) {
      this.sfx.splash.play();
    }
    if (this.player.underwater)
      this.drytimer = 0.0;
    else
      this.drytimer += dt;

    game.physics.arcade.overlap(this.player, this.items, this.trigger, null, this);
    game.physics.arcade.overlap(this.player, this.map.triggers, this.trigger, null, this);
    game.physics.arcade.overlap(this.player, this.monsters, (x, y) => {
      this.sfx.death.play();
      this.state.start("GameOver");
    }, null, this);

    if (this.cursor.left.isDown) {
      this.player.moveLeft();
    }
    else if (this.cursor.right.isDown) {
      this.player.moveRight();
    } else
      this.player.stopLR();
    
    if (this.cursor.up.isDown) {
      this.player.moveUp();
    }
    else if (this.cursor.down.isDown) {
      this.player.moveDown();
    } else
      this.player.stopUD();
  }

  onKey(x) {
    if (x == 'm' || x == 'M') {
      if (this.mapVisible) {
        this.hideMap();
      } else {
        this.showMap();
      }
    }
  }

  hideMap() {
    console.log("hiding map");
    if (this.worldTween)
      this.worldTween.stop();
    this.worldTween = game.add.tween(this.world.cameraOffset);
    this.worldTween.to({y: -500}, 500, "Linear", true)
    //this.world.visible = false;
    this.mapVisible = false;
  }

  showMap() {
    console.log("showing map");
    if (this.worldTween)
      this.worldTween.stop();
    this.worldTween = game.add.tween(this.world.cameraOffset);
    this.worldTween.to({y: 5}, 500, "Linear", true)
    //this.world.visible = true;
    this.mapVisible = true;
  }

  updateMessage(dt) {
    if (this.messageTime > 0.0) {
      this.message.x = this.player.x;
      this.message.y = this.player.y - 32;
      this.messageTime -= dt;
    } else {
      this.message.text = '';
      this.message.visible = false;
    }
  }
}
