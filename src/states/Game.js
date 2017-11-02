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

    this.exiting = false;
    if (config.state.new_game) {
      this.resetGame();
      this.playIntro = true;
    } else {
      this.playIntro = false;
    }
    this.loadMap();
    if (config.state.new_tile) {
      this.spawnMapPiece();
      config.state.new_tile = false;
    }
    this.createWorldMap();
    this.spawnItems();
    this.loadPlayer();
    this.initKeyboard();
    this.initTooltip();

    this.emitterLayer = this.game.add.group();
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

    // spawn the child if he is still following...
    if (config.state.child_following)
      this.spawnChild(this.player.x, this.player.y+32);
  }

  spawnChild(x, y) {
    this.child = new Player({
      game: this.game,
      x: x,
      y: y,
      asset: 'hero'
    })
    this.child.width *= 0.75;
    this.child.height *= 0.75;
    this.child.body.setSize(
      this.child.body.width * 0.75,
      this.child.body.height * 0.5,
      0, 0
    );
    this.map.spriteLayer.add(this.child);
  }

  spawnItems() {
    this.items = new Phaser.Group(this.game);
    this.map.spriteLayer.add(this.items);
    for (var i in config.state.world_map) {
      var obj = config.state.world_map[i];
      if (obj.world[0] == config.state.world_location[0] &&
          obj.world[1] == config.state.world_location[1])
        this.addMapPiece(obj.local[0]*32, obj.local[1]*32);
    }
    this.updateEquippedMap();

    // special case items
    for (var i in this.map.objectMap) {
      var obj = this.map.objectMap[i];
      if (obj.type == 'cabin') {
	console.log('adding house');
	var s = new Phaser.Sprite(this.game, obj.x, obj.y, "house");
	s.anchor.x = 0.5;
	s.anchor.y = 1.0;
	this.map.spriteLayer.add(s);
      }
      if (obj.type == 'boat') {
	this.boat = new Phaser.Sprite(this.game, obj.x+obj.width/2, obj.y+obj.height, "boat");
	this.boat.anchor.x = 0.5;
	this.boat.anchor.y = 1.0;
	this.boat.scale.x = -1;
	this.boatGroup = new Phaser.Group(this.game);
	this.boatGroup.add(this.boat);
	this.map.spriteLayer.add(this.boatGroup);
      }
      if (obj.type == 'child' && !config.state.child_folowing) {
	this.spawnChild(obj.x+obj.width/2, obj.y+obj.height/2);
      }
    }
  }

  spawnMapPiece() {
    var poi = [];
    for (var i in this.map.objectMap) {
      var obj = this.map.objectMap[i];
      if (obj.type == 'poi') {
	poi.push(obj);
      }
    }
    this.shuffleArray(poi);
    var obj = poi[0];
    var local = [obj.x/32, obj.y/32];
    var world = [
      config.state.world_location[0],
      config.state.world_location[1]
    ];
    obj = {local: local, world: world}
    config.state.world_map.push(obj);
    console.log("spawned");
    console.log(obj);
    return true;
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
    this.world.desiredX = config.gameWidth/2.0 - width*9/2.0;
    this.world.cameraOffset.x = this.world.desiredX;
    this.world.cameraOffset.y = 5;
    this.world.visible = false;
    this.hideMap();
  }

  updateEquippedMap() {
    var piece = 'map_unknown';
    if (config.state.equipped_map) {
      piece = config.state.equipped_map + '_map';
    }
    if (this.equipped)
      this.equipped.destroy();
    var w = this.worldMapTileSize;
    this.equipped = new Phaser.Sprite(this.game, w*8, w*3.5, piece);
    this.equipped.anchor.x = 0.5;
    this.equipped.anchor.y = 0.5;
    this.equipped.width = this.worldMapTileSize*1.2;
    this.equipped.height = this.worldMapTileSize*1.2;
    this.world.add(this.equipped);
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
    this.updateEquippedMap();

    // destroy old tile, and forget it
    sprite.destroy();
    config.state.world_map = [];
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
    if (y.props.type == "exit")
      this.warp(y.props.name);
    if (y.props.type == "map")
      this.pickupItem(y);
    if (y.props.type == "child") {
      if (!config.state.child_following)
	this.playFound = true;
      config.state.child_following = true;
    }
    if (y.props.type == "docks") {
      this.docks = y;
      if (config.state.child_following)
	this.exiting = true;
      else {
	this.tooltip.text = "here's the boat, but where's junior?"
      }
    }
  }

  warp(name) {
    var info = this.warpInfo(name);
    this.tooltip.text = info.message
    if (this.spacebar.isDown && info.enabled) {
      var p = info.location;
      if (info.place) {
        config.state.grid[p[1]][p[0]] = config.state.equipped_map;
        config.state.equipped_map = null;
        config.state.new_tile = true;
      }
      config.state.entrance = info.entrance;
      config.state.world_location[0] = p[0];
      config.state.world_location[1] = p[1];
      this.state.start("Game");
    }
  }

  warpInfo(exit_name) {
    var dst = [0,0];
    var src = config.state.world_location;
    var entrance = '';
    switch(exit_name) {
    case 'exit bottom':
      dst = [src[0],src[1]+1];
      entrance = 'exit top';
      break;
    case 'exit top':
      dst = [src[0],src[1]-1];
      entrance = 'exit bottom';
      break;
    case 'exit left':
      dst = [src[0]-1,src[1]];
      entrance = 'exit right';
      break;
    case 'exit right':
      dst = [src[0]+1,src[1]];
      entrance = 'exit left';
      break;
    default:
      return {
        enabled: false,
        message: "bug! not an exit"
      };
      break;
    }

    if (dst[0] < 0 || dst[1] < 0 ||
        dst[0] >= 7 || dst[1] >= 7)
      return {
        enabled: false,
        message: "only wilderness lies beyond"
      };

    var grid = config.state.grid;
    var tile = config.state.equipped_map;
    if (grid[dst[1]][dst[0]] != null) {
      return {
        enabled: true,
        entrance: entrance,
        location: dst,
        place: false,
        message: "continue on path?"
      };
    } else if (tile != null) {
      if (this.canPlaceTile(tile, dst[0], dst[1])) {
        return {
          enabled: true,
          entrance: entrance,
          location: dst,
          place: true,
          message: "place map piece and continue?"
        };
      } else {
        return {
          enabled: false,
          message: "cannot place map piece, maybe rotate it?"
        };
      }
    }
    return {
      enabled: false,
      message: "find the map piece first"
    }
  }

  getEntranceXY(entrance_name) {
    var entrance = this.map.objectMap[entrance_name];
    return [entrance.x+entrance.width/2.0,
            entrance.y+entrance.height/2.0]
  }

  update() {
    var dt = this.game.time.physicsElapsed;
    if (this.timer)
      this.timer -= dt;

    this.resetTooltip();
    if (this.playIntro)
      if (this.playDialog(config.dialog.intro))
	this.playIntro = false;
    if (this.playFound)
      if (this.playDialog(config.dialog.found))
	this.playFound = false;

    this.checkCollision();
    this.checkItems();
    this.checkTriggers();
    this.checkMonsters();
    if (!this.exiting) {
      this.checkKeys();
      this.updateChild();
    } else {
      this.checkExiting();
    }
  }

  resetTooltip() {
    this.tooltip.text = '';
    if (this.tooltip.follow == 'child') {
      this.tooltip.x = this.child.x;
      this.tooltip.y = this.child.y - 32;
    }
    else {
      this.tooltip.x = this.player.x;
      this.tooltip.y = this.player.y - 32;
    }
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
    
    if (this.cursor.up.isDown)
      this.player.moveUp();
    else if (this.cursor.down.isDown)
      this.player.moveDown();
  }

  onKey(x) {
    if (x == 'm' || x == 'M')
      if (this.mapVisible)
        this.hideMap();
      else
        this.showMap();
    else if (x == 'r' || x == 'R')
      if (this.mapVisible)
        this.rotateMap();
  }

  updateChild() {
    if (this.child && config.state.child_following) {
      var d = 2*32;
      this.walkTo(this.child, this.player.x, this.player.y, d)
    }
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

  walkTo(actor, x, y, d = 2*32) {
    var moving = false;
    if (actor.x < x-d) {
      actor.moveRight();
      moving=true;
    } else if (actor.x > x+d) {
      actor.moveLeft();
      moving=true;
    }

    if (actor.y < this.player.y-d) {
      actor.moveDown();
      moving=true;
    } else if (actor.y > y+d) {
      actor.moveUp();
      moving=true;
    }

    var vx = actor.body.velocity.x;
    var vy = actor.body.velocity.y;
    if (vx < -1.0 || vx > 1.0 ||
        vy < -1.0 || vy > 1.0)
      return true;
    else
      return moving;
  }

  checkExiting() {
    if (this.exiting) {
      if (!this.exitState) {
	this.exitState = 1
	this.player.body.velocity.x = 0;
	this.player.body.velocity.y = 0;
	this.child.body.velocity.x = 0;
	this.child.body.velocity.y = 0;
      }

      switch (this.exitState) {
      case 1:
	this.exitWalkToDocks();
	break;
      case 2:
	this.exitShowDialog();
	break;
      case 3:
	this.exitGetOnBoat();
	break;
      case 4:
	this.exitRowRowRow();
	this.exitFadeOut();
	break;
      case 6:
	this.state.start("Credits");
	break;
      }
    }
  }

  exitWalkToDocks() {
    var w = this.docks.props.width;
    var h = this.docks.props.height;
    var x = this.docks.props.x+w/2;
    var y = this.docks.props.y+h/2;
    var moving = this.walkTo(this.player, x-w/4, y, 1);
    var moving2 = this.walkTo(this.child, x+w/4, y, 1);
    if (!moving && !moving2) {
      this.exitState += 1;
      this.player.moveRight();
      this.child.moveLeft();
    }
  }

  exitShowDialog() {
    if (this.playDialog(config.dialog.exit))
      this.exitState += 1;
  }

  playDialog(dialog) {
    if (!this.dialogIter)
      this.dialogIter = 0;
    var frame = dialog[this.dialogIter];
    if (this.delay(frame.delay)) {
      this.dialogIter += 1;
    } else {
      this.tooltip.text = frame.text;
      this.tooltip.follow = frame.actor;
    }
    if (this.dialogIter >= dialog.length) {
      this.dialogIter = null;
      return true;
    }
    return false;
  }

  exitGetOnBoat() {
    var w = -this.boat.width;
    var h = this.boat.height;
    var x = this.boat.x;
    var y = this.boat.y-h/4;
    var moving = this.walkTo(this.player, x-w/4, y, 1);
    var moving2 = this.walkTo(this.child, x+w/4, y, 1);
    if (!moving && !moving2 && this.delay(1)) {
      this.exitState += 1;
      this.player.moveLeft();
      this.child.moveLeft();

      var dx = x - this.player.x;
      var dy = y - this.player.y;
      //this.map.spriteLayer.remove(this.player);
      //this.boatGroup.add(this.player);

      var actors = [this.player, this.child, this.boat];
      for (var i in actors) {
	var actor = actors[i];
	var tween = game.add.tween(actor).to(
          {x: '-600'},
          20000,
          'Linear',
          true,
          0
	);
      }
    }
  }

  exitRowRowRow() {
    this.exitState +=1;
  }

  exitFadeOut() {
    this.camera.fade('#000000', 10000);
    this.camera.onFadeComplete.add(this.exitComplete, this);
  }

  exitComplete() {
    this.state.start("GameOver");
  }

  delay(time) {
    if (this.timer == null)
      this.timer = time;
    if (this.timer <= 0.0)
      this.timer = null;
    return this.timer == null;
  }

  canPlaceTile(dst_tile, dst_x, dst_y) {
    var tiles = [
      this.tileAt(dst_x,dst_y-1),
      this.tileAt(dst_x,dst_y+1),
      this.tileAt(dst_x-1,dst_y),
      this.tileAt(dst_x+1,dst_y)
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

    var edges = tiledef[dst_tile].edges;
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

  rotateMap() {
    var t = config.state.equipped_map;
    if (t) {
      config.state.equipped_map = config.rotations[t];
      this.updateEquippedMap();
    }
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
