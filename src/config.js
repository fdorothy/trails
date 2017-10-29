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
    x: {asset: 'assets/maps/x.json', desc: 'cross', edges: [1,1,1,1], minimap: 'assets/images/minimaps/x.png'},
    ud: {asset: 'assets/maps/ud.json', desc: 'straight', edges: [1,1,0,0], minimap: 'assets/images/minimaps/ud.png'},
    lr: {asset: 'assets/maps/lr.json', desc: 'straight', edges: [0,0,1,1], minimap: 'assets/images/minimaps/lr.png'},
    c_ul: {asset: 'assets/maps/c_ul.json', desc: 'corner', edges: [1,0,1,0], minimap: 'assets/images/minimaps/c_ul.png'},
    c_bl: {asset: 'assets/maps/c_bl.json', desc: 'corner', edges: [0,1,1,0], minimap: 'assets/images/minimaps/c_bl.png'},
    c_br: {asset: 'assets/maps/c_br.json', desc: 'corner', edges: [0,1,0,1], minimap: 'assets/images/minimaps/c_br.png'},
    t_u: {asset: 'assets/maps/t_u.json', desc: 'tee', edges: [1,0,1,1], minimap: 'assets/images/minimaps/t_u.png'},
    t_d: {asset: 'assets/maps/t_d.json', desc: 'tee', edges: [0,1,1,1], minimap: 'assets/images/minimaps/t_d.png'},
    t_l: {asset: 'assets/maps/t_l.json', desc: 'tee', edges: [1,1,1,0], minimap: 'assets/images/minimaps/t_l.png'},
    t_r: {asset: 'assets/maps/t_r.json', desc: 'tee', edges: [1,1,0,1], minimap: 'assets/images/minimaps/t_r.png'},
    d_u: {asset: 'assets/maps/d_u.json', desc: 'deadend', edges: [1,0,0,0], minimap: 'assets/images/minimaps/d_u.png'},
    d_d: {asset: 'assets/maps/d_d.json', desc: 'deadend', edges: [0,1,0,0], minimap: 'assets/images/minimaps/d_d.png'},
    d_l: {asset: 'assets/maps/d_l.json', desc: 'deadend', edges: [0,0,1,0], minimap: 'assets/images/minimaps/d_l.png'},
    d_r: {asset: 'assets/maps/d_r.json', desc: 'deadend', edges: [0,0,0,1], minimap: 'assets/images/minimaps/d_r.png'},
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
    map_unknown: 'assets/images/map_unknown.png',
    overlay: 'assets/images/overlay.png',
    head: 'assets/images/head.png'
  },
  // playground map
  state: {
    map: 'sample',
    grid: [
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, 'x',  null, null, null],
      [null, null, null, 't_l', null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null],
    ],
    entrance: 'exit bottom',
    equipped_map: null,
    world_map: null,
    world_location: [3,3],
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
