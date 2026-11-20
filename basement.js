// The basement is rendered on its own so light from the house cannot reach it.
export function createBasement(T, houseScene) {
  const scene = new T.Scene();
  scene.background = new T.Color(0x000000);
  scene.fog = new T.FogExp2(0x000000, .052);
  const base = -7;
  const room = new T.Group();
  room.position.y = base;
  scene.add(room);
  const cube = new T.BoxGeometry();
  const material = color => new T.MeshStandardMaterial({color, roughness: .94});
  function box(parent, mat, x, y, z, w, h, d) {
    const mesh = new T.Mesh(cube, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }

  let seed = 8073;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function concrete(tagged = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const g = canvas.getContext('2d');
    const wash = g.createLinearGradient(0, 0, 0, 256);
    wash.addColorStop(0, '#48483f');
    wash.addColorStop(.35, '#837f70');
    wash.addColorStop(1, '#454a41');
    g.fillStyle = wash;
    g.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = i % 2 ? '#27282130' : '#beb8a226';
      g.fillRect(random()*512, random()*256, 1+random()*6, 1+random()*4);
    }
    for (let i = 0; i < 90; i++) {
      g.fillStyle = '#30342b24';
      g.fillRect(random()*512, 0, 1+random()*5, random()*175);
    }
    if (tagged) {
      for (const [x,y,color] of [[55,160,'#6d3238'],[235,130,'#36575b']]) {
        g.strokeStyle = color;
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x,y);
        for (let i=0; i<16; i++) g.quadraticCurveTo(x+i*5-18,y+random()*80-40,x+i*5,y+random()*44-22);
        g.stroke();
      }
    }
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    return new T.MeshStandardMaterial({map, roughness:.94});
  }
  const cement = concrete(), tagged = concrete(true);
  const oxidized = material(0x483c31), steel = material(0x585951);
  const ivory = material(0xb4ab8c), wood = material(0x494033);
  const obstacles = [];
  function solid(mat,x,z,w,d,h) {
    box(room,mat,x,h/2,z,w,h,d);
    obstacles.push([x,z,w/2+.22,d/2+.22]);
  }
  const height = 3.9;
  box(room,cement,36.5,-.10,5,13,.2,10);
  box(room,cement,36.5,height+.1,5,13,.2,10);
  for (const z of [0,10]) box(room,cement,36.5,height/2,z,13,height,.18);
  for (const x of [30,43]) box(room,cement,x,height/2,5,.18,height,10);
  // Two openings in the tagged partition lead around the rear service bay.
  for (const [x,w] of [[31,2],[36,4],[41.5,3]]) solid(tagged,x,2.5,w,.24,height);
  box(room,cement,36.5,3.17,2.5,13,1.46,.30);
  for (const x of [33.6,39.7]) {
    box(room,cement,x,3.54,5,.46,.52,10);
    for (const z of [4.3,7.8]) {
      solid(cement,x,z,.4,.44,3.36);
      solid(cement,x,z,.55,.59,.25);
    }
  }
  box(room,steel,36.5,3.12,3.4,12.8,.38,.53);
  for (let x=31; x<43; x+=1.6) box(room,oxidized,x,3.13,3.4,.05,.41,.56);
  const pipe = new T.Mesh(new T.CylinderGeometry(.073,.073,12.8,8),oxidized);
  pipe.rotation.z=Math.PI/2;
  pipe.position.set(36.5,3.08,3.93);
  room.add(pipe);

  const chair = new T.Group();
  chair.position.set(36.9,0,5.2);
  chair.rotation.y = -.34;
  room.add(chair);
  box(chair,ivory,0,.47,0,.49,.12,.46);
  box(chair,ivory,0,.82,-.2,.46,.66,.10).rotation.x=-.08;
  for (const x of [-.19,.19]) for (const z of [-.17,.17])
    box(chair,wood,x,.22,z,.055,.44,.055).rotation.z=-x*.18;
  obstacles.push([36.9,5.2,.54,.54]);

  // A short cellar stair runs against the east wall. Its side is solid.
  const stairLeft=41.35, start=6.1, tread=.40, rise=.16, count=9;
  for (let i=0; i<count; i++) {
    const h=(i+1)*rise;
    box(room,cement,42.175,h/2,start+(i+.5)*tread,1.65,h,tread);
  }
  box(room,wood,42.175,2.91,9.87,1.54,1.9,.12);
  box(room,steel,42.62,2.49,9.78,.12,.08,.09);
  const hatch = new T.Group();
  houseScene.add(hatch);
  hatch.position.set(9.35,-3.325,10.24);
  box(hatch,oxidized,0,0,0,1.19,.04,1.18);
  for (let i=0;i<5;i++) box(hatch,wood,(i-2)*.214,.027,0,.205,.04,1.06);
  for (const z of [-.33,.33]) box(hatch,steel,0,.054,z,1.04,.025,.055);
  box(hatch,steel,0,.081,.29,.24,.05,.06);

  const beam = new T.SpotLight(0xfff2d7,55,19,.49,.52,1.5);
  beam.visible=false;
  scene.add(beam,beam.target);
  return {
    scene, beam,
    floor(x,z) {
      if(x<stairLeft || z<start) return base;
      return base+rise*Math.min(count,1+Math.floor((z-start)/tread));
    },
    blocks(x,z,oldX) {
      if(x<30.32 || x>42.68 || z<.32 || z>9.67) return true;
      if(z>start+.35 && (x>=stairLeft)!==(oldX>=stairLeft)) return true;
      return obstacles.some(([cx,cz,rx,rz])=>Math.abs(x-cx)<rx && Math.abs(z-cz)<rz);
    }
  };
}
