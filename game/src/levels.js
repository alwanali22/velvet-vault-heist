// The three rooms of Velvet Vault. Each level is data only: walls, columns, glass
// cases, velvet ropes, paintings, loot, guard patrols, cameras, lasers, the locked
// door and the getaway exit. Walls/columns/cases block movement and line of sight;
// ropes block only the thief's movement (guards step over them).
//
// Coordinates are in the 1280x720 canvas. The HUD occupies y 0..64, so the
// playfield runs y 72..712 inside a 10px wall border.
function borderWalls() {
  return [
    { x: 8, y: 72, w: 1264, h: 10 },
    { x: 8, y: 702, w: 1264, h: 10 },
    { x: 8, y: 72, w: 10, h: 640 },
    { x: 1262, y: 72, w: 10, h: 640 },
  ];
}

export const LEVELS = [
  {
    name: 'The Marble Hall',
    par: 150,
    intro: 'Lift the Velvet Lady, then slip out the east door.',
    walls: [
      ...borderWalls(),
    ],
    columns: [
      { x: 362, y: 282, w: 36, h: 36 },
      { x: 882, y: 282, w: 36, h: 36 },
      { x: 362, y: 560, w: 36, h: 36 },
      { x: 882, y: 560, w: 36, h: 36 },
    ],
    cases: [
      { x: 590, y: 330, w: 100, h: 70 },
      { x: 590, y: 480, w: 100, h: 70 },
    ],
    carpets: [{ x: 480, y: 240, w: 320, h: 280 }],
    ropes: [
      { x1: 200, y1: 220, x2: 520, y2: 220 },
      { x1: 760, y1: 220, x2: 1080, y2: 220 },
    ],
    loot: [
      { id: 'lady', x: 640, y: 122, kind: 'painting', name: 'The Velvet Lady', value: 2500, target: true, locked: false },
      { id: 'dawn', x: 250, y: 122, kind: 'painting', name: 'Dawn over the Docks', value: 800, target: false, locked: false },
      { id: 'harbor', x: 1030, y: 122, kind: 'painting', name: 'Harbor at Dusk', value: 800, target: false, locked: false },
      { id: 'brooch', x: 640, y: 365, kind: 'gem', name: 'Moonstone Brooch', value: 1000, target: false, locked: false },
      { id: 'scarab', x: 640, y: 515, kind: 'gem', name: 'Jade Scarab', value: 1100, target: false, locked: false },
      { id: 'fan', x: 215, y: 622, kind: 'gem', name: 'Opal Fan', value: 900, target: false, locked: false },
      { id: 'emerald', x: 1155, y: 622, kind: 'gem', name: 'Emerald Scarab', value: 1200, target: false, locked: false },
    ],
    guards: [
      { waypoints: [[300, 430], [980, 430]], wait: 0.9 },
      { waypoints: [[1080, 150], [1080, 620]], wait: 0.9 },
    ],
    cameras: [
      { x: 56, y: 116, baseAngle: 0.65, sweep: 0.7, speed: 0.45 },
      { x: 1224, y: 656, baseAngle: Math.PI + 0.65, sweep: 0.7, speed: 0.45 },
    ],
    lasers: [],
    doors: [],
    exit: { x: 1262, y: 380, w: 10, h: 70 },
    start: { x: 80, y: 640 },
  },
  {
    name: 'The Gilded Corridor',
    par: 180,
    intro: 'Pick the vault door, take the Gilded Scepter, get out east.',
    walls: [
      ...borderWalls(),
      { x: 300, y: 250, w: 640, h: 12 },
      { x: 300, y: 470, w: 640, h: 12 },
      { x: 1000, y: 72, w: 12, h: 108 },
      { x: 1000, y: 240, w: 12, h: 60 },
      { x: 1000, y: 300, w: 262, h: 12 },
    ],
    columns: [
      { x: 340, y: 340, w: 36, h: 36 },
      { x: 900, y: 340, w: 36, h: 36 },
    ],
    cases: [
      { x: 600, y: 300, w: 90, h: 50 },
      { x: 1090, y: 170, w: 100, h: 60 },
    ],
    carpets: [{ x: 320, y: 320, w: 640, h: 90 }],
    ropes: [
      { x1: 320, y1: 580, x2: 560, y2: 580 },
      { x1: 720, y1: 580, x2: 960, y2: 580 },
    ],
    loot: [
      { id: 'scepter', x: 1140, y: 200, kind: 'gem', name: 'Gilded Scepter', value: 4000, target: true, locked: false },
      { id: 'tiara', x: 645, y: 325, kind: 'gem', name: 'Ruby Tiara', value: 1300, target: false, locked: false },
      { id: 'vase', x: 1130, y: 122, kind: 'painting', name: 'Vase of Koi', value: 900, target: false, locked: false },
      { id: 'orchard', x: 400, y: 672, kind: 'painting', name: 'The Orchard', value: 700, target: false, locked: false },
      { id: 'storm', x: 900, y: 672, kind: 'painting', name: 'Storm over the Strait', value: 700, target: false, locked: false },
    ],
    guards: [
      { waypoints: [[320, 360], [960, 360]], wait: 0.9 },
      { waypoints: [[320, 160], [820, 160]], wait: 0.9 },
      { waypoints: [[320, 580], [960, 580]], wait: 0.9 },
    ],
    cameras: [
      { x: 56, y: 116, baseAngle: 0.65, sweep: 0.7, speed: 0.45 },
      { x: 1224, y: 400, baseAngle: Math.PI, sweep: 0.8, speed: 0.4 },
      { x: 56, y: 656, baseAngle: -0.65, sweep: 0.7, speed: 0.45 },
    ],
    lasers: [
      { x1: 500, y1: 84, x2: 500, y2: 238, period: 2.6, onTime: 1.7, phase: 0 },
      { x1: 760, y1: 84, x2: 760, y2: 238, period: 2.6, onTime: 1.7, phase: 1.3 },
    ],
    doors: [
      { x: 1000, y: 180, w: 12, h: 60, name: 'Vault door', lockTime: 2.0 },
    ],
    exit: { x: 1262, y: 580, w: 10, h: 70 },
    start: { x: 80, y: 360 },
  },
  {
    name: 'The Star Sapphire Vault',
    par: 210,
    intro: 'The Star Sapphire waits behind the vault door. Take it and run.',
    walls: [
      ...borderWalls(),
      { x: 480, y: 240, w: 320, h: 12 },
      { x: 480, y: 240, w: 12, h: 240 },
      { x: 788, y: 240, w: 12, h: 240 },
      { x: 480, y: 480, w: 140, h: 12 },
      { x: 680, y: 480, w: 120, h: 12 },
    ],
    columns: [
      { x: 300, y: 200, w: 36, h: 36 },
      { x: 940, y: 200, w: 36, h: 36 },
      { x: 300, y: 520, w: 36, h: 36 },
      { x: 940, y: 520, w: 36, h: 36 },
    ],
    cases: [
      { x: 600, y: 110, w: 90, h: 50 },
      { x: 150, y: 330, w: 60, h: 90 },
      { x: 1070, y: 330, w: 60, h: 90 },
      { x: 600, y: 600, w: 90, h: 50 },
      { x: 600, y: 320, w: 80, h: 60 },
    ],
    carpets: [{ x: 440, y: 200, w: 400, h: 320 }],
    ropes: [
      { x1: 220, y1: 420, x2: 420, y2: 420 },
      { x1: 860, y1: 420, x2: 1060, y2: 420 },
    ],
    loot: [
      { id: 'sapphire', x: 640, y: 350, kind: 'gem', name: 'Star Sapphire', value: 5000, target: true, locked: false },
      { id: 'parure', x: 645, y: 135, kind: 'gem', name: 'Sapphire Parure', value: 1500, target: false, locked: false },
      { id: 'idol', x: 180, y: 375, kind: 'gem', name: 'Emerald Idol', value: 1400, target: false, locked: false },
      { id: 'diamondfan', x: 1100, y: 375, kind: 'gem', name: 'Diamond Fan', value: 1400, target: false, locked: false },
      { id: 'crown', x: 645, y: 625, kind: 'gem', name: 'Opal Crown', value: 1300, target: false, locked: false },
      { id: 'orchid', x: 300, y: 122, kind: 'painting', name: 'Orchid Study', value: 800, target: false, locked: false },
      { id: 'tide', x: 940, y: 122, kind: 'painting', name: 'Tide and Lantern', value: 800, target: false, locked: false },
      { id: 'carnival', x: 640, y: 672, kind: 'painting', name: 'Carnival Night', value: 800, target: false, locked: false },
    ],
    guards: [
      { waypoints: [[200, 180], [1080, 180]], wait: 0.9 },
      { waypoints: [[200, 560], [1080, 560]], wait: 0.9 },
      { waypoints: [[200, 150], [200, 600]], wait: 0.9 },
      { waypoints: [[400, 160], [880, 160], [880, 560], [400, 560]], wait: 0.7 },
    ],
    cameras: [
      { x: 56, y: 116, baseAngle: 0.65, sweep: 0.7, speed: 0.5 },
      { x: 1224, y: 116, baseAngle: Math.PI - 0.65, sweep: 0.7, speed: 0.5 },
      { x: 56, y: 656, baseAngle: -0.65, sweep: 0.7, speed: 0.5 },
      { x: 1224, y: 656, baseAngle: Math.PI + 0.65, sweep: 0.7, speed: 0.5 },
    ],
    lasers: [
      { x1: 480, y1: 520, x2: 800, y2: 520, period: 2.6, onTime: 1.7, phase: 0 },
      { x1: 420, y1: 300, x2: 420, y2: 560, period: 3.0, onTime: 1.8, phase: 1.5 },
    ],
    doors: [
      { x: 620, y: 480, w: 60, h: 12, name: 'Vault door', lockTime: 2.5 },
    ],
    exit: { x: 1262, y: 360, w: 10, h: 70 },
    start: { x: 80, y: 360 },
  },
];
