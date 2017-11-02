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
    cabin: {asset: 'assets/maps/cabin.json', desc: 'cross', edges: [1,1,1,1], minimap: 'assets/images/minimaps/cabin.png'},
    ferry: {asset: 'assets/maps/ferry.json', desc: 'cross', edges: [1,1,1,1], minimap: 'assets/images/minimaps/ferry.png'},
    x: {asset: 'assets/maps/x.json', desc: 'cross', edges: [1,1,1,1], minimap: 'assets/images/minimaps/x.png'},
    ud: {asset: 'assets/maps/ud.json', desc: 'straight', edges: [1,1,0,0], minimap: 'assets/images/minimaps/ud.png'},
    lr: {asset: 'assets/maps/lr.json', desc: 'straight', edges: [0,0,1,1], minimap: 'assets/images/minimaps/lr.png'},
    c_ul: {asset: 'assets/maps/c_ul.json', desc: 'corner', edges: [1,0,1,0], minimap: 'assets/images/minimaps/c_ul.png'},
    c_bl: {asset: 'assets/maps/c_bl.json', desc: 'corner', edges: [0,1,1,0], minimap: 'assets/images/minimaps/c_bl.png'},
    c_br: {asset: 'assets/maps/c_br.json', desc: 'corner', edges: [0,1,0,1], minimap: 'assets/images/minimaps/c_br.png'},
    c_ur: {asset: 'assets/maps/c_ur.json', desc: 'corner', edges: [1,1,0,1], minimap: 'assets/images/minimaps/c_ur.png'},
    t_u: {asset: 'assets/maps/t_u.json', desc: 'tee', edges: [1,0,1,1], minimap: 'assets/images/minimaps/t_u.png'},
    t_d: {asset: 'assets/maps/t_d.json', desc: 'tee', edges: [0,1,1,1], minimap: 'assets/images/minimaps/t_d.png'},
    t_l: {asset: 'assets/maps/t_l.json', desc: 'tee', edges: [1,1,1,0], minimap: 'assets/images/minimaps/t_l.png'},
    t_r: {asset: 'assets/maps/t_r.json', desc: 'tee', edges: [1,1,0,1], minimap: 'assets/images/minimaps/t_r.png'},
    d_u: {asset: 'assets/maps/d_u.json', desc: 'deadend', edges: [1,0,0,0], minimap: 'assets/images/minimaps/d_u.png'},
    d_d: {asset: 'assets/maps/d_d.json', desc: 'deadend', edges: [0,1,0,0], minimap: 'assets/images/minimaps/d_d.png'},
    d_l: {asset: 'assets/maps/d_l.json', desc: 'deadend', edges: [0,0,1,0], minimap: 'assets/images/minimaps/d_l.png'},
    d_r: {asset: 'assets/maps/d_r.json', desc: 'deadend', edges: [0,0,0,1], minimap: 'assets/images/minimaps/d_r.png'},
  },
  rotations: {
    x: 'x',
    ud: 'lr',
    lr: 'ud',
    c_ul: 'c_ur',
    c_bl: 'c_ul',
    c_br: 'c_bl',
    c_ur: 'c_br',
    t_u: 't_r',
    t_d: 't_l',
    t_l: 't_u',
    t_r: 't_d',
    d_u: 'd_r',
    d_d: 'd_l',
    d_l: 'd_u',
    d_r: 'd_d'
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
    head: 'assets/images/head.png',
    arrow: 'assets/images/arrow.png',
    house: 'assets/images/house.png',
    boat: 'assets/images/boat2.png'
  },
  // playground map
  state: {
    new_game: true,
    new_tile: true,
    map: 'sample',
    grid: [
      [null, null, null, null, null, null, null],
      [null, 'ferry', null, null, null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, 'x',  null, null, null],
      [null, null, null, null, null, null, null],
      [null, null, null, null, null, 'cabin', null],
      [null, null, null, null, null, null, null],
    ],
    entrance: 'poi_1',
    child_following: false,
    equipped_map: null,
    world_map: [],
    world_location: [3,3],
    tile_bag: []
  },
  dialog: {
    intro: [
      {actor: 'player', text: '', delay: 1},
      {actor: 'player', text: '.', delay: 1},
      {actor: 'player', text: '..', delay: 1},
      {actor: 'player', text: '...', delay: 1},
      {actor: 'player', text: 'uh oh', delay: 1},
      {actor: 'player', text: '', delay: 1},
      {actor: 'player', text: "where'd my map go?", delay: 3},
      {actor: 'player', text: '', delay: 1},
      {actor: 'player', text: "where'd junior go!?", delay: 3},
      {actor: 'player', text: '', delay: 1},
      {actor: 'player', text: "the boat to town leaves soon", delay: 3},
      {actor: 'player', text: '', delay: 1},
      {actor: 'player', text: "I'd better find junior quickly", delay: 3}
    ],
    found: [
      {actor: 'child', text: 'where have you been all night?!', delay: 3},
      {actor: 'player', text: "???", delay: 2},
      {actor: 'player', text: "all night?", delay: 3},
      {actor: 'child', text: "we're going to be late", delay: 3},
      {actor: 'player', text: "well let's get moving!", delay: 3},
      {actor: 'player', text: "hi ho, hi ho...", delay: 2},
      {actor: 'child', text: "no singing", delay: 3},
      {actor: 'player', text: "you're no fun", delay: 3}
    ],
    exit: [
      {actor: 'player', text: 'whew! we made it', delay: 3},
      {actor: 'child', text: 'my legs hurt', delay: 3},
      {actor: 'player', text: '...', delay: 1},
      {actor: 'player', text: 'lets get a move on', delay: 3}
    ]
  },

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
