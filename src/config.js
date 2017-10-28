export default {
  localStorageName: 'trails',
  gameWidth: 640,
  gameHeight: 480,
  player: {
    scale: 1.2,
    initialSpeed: 50,
    targetSpeed: 300,
    groundAccel: 200,
    groundDeaccel: 500
  },
  levels: {
    sample: {asset: 'assets/maps/sample.json', desc: 'sample map'},
  },
  monsters: {
    // 'bear': {
    //   asset: {key: 'bear', path: 'assets/images/bear.png'},
    //   scale: 1.0,
    //   initialSpeed: 50,
    //   targetSpeed: 75,
    // }
  },
  sounds: {
  },
  images: {
    fire: 'assets/images/fire.png',
    tiles: 'assets/images/tiles.png',
    woodland_ground: 'assets/images/woodland_ground.png',
    starfield: 'assets/images/starfield.png',
  },
  // playground map
  state: {
    map: 'sample',
    entrance: 'exit bottom',
    equipped: 'forage',
    items: [
      {
        name: 'forage',
      },
      {
        name: 'map',
      },
    ],
    rescueTime: 0.0,
    rescued: false,
    deadTime: 999
  }

  // use for trying out maps
  // state: {
  //   map: 'drop1',
  //   entrance: 'entrance_left',
  //   equipped: 'flashlight',
  //   items: null,
  //   fires: null,
  //   rescueTime: 0.0,
  //   rescued: false,
  //   deadTime: 999
  // }

  // actual game-start
  // state: {
  //   map: 'island1',
  //   entrance: 'game_start',
  //   equipped: 'forage',
  //   items: [
  //     {
  //       name: 'forage',
  //     },
  //     {
  //       name: 'map',
  //     },
  //   ]
  //   rescueTime: 0.0,
  //   rescued: false,
  //   deadTime: 999
  // }
}
