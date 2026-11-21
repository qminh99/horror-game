import { cellar } from './cellar-layout.js';

// The basement is rendered on its own so light from the house cannot reach it.
export function createBasement(T, houseScene) {
  const scene = new T.Scene();

  scene.fog = new T.FogExp2(0x000000, .052);
  const base = cellar.lower;
  const center = (cellar.left + cellar.right) / 2;
  const width = cellar.right - cellar.left;
  const offsetX = center - (43 - width / 2);
  const offsetZ = cellar.top + 10;
  const room = new T.Group();
  room.position.set(offsetX,base,offsetZ);
  room.scale.z = -1;
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
  // Separate floor finish: broad damp patches break up grazing light.
  const slab = concrete();
  const floorCanvas = slab.map.image;
  const floorPaint = floorCanvas.getContext('2d');
  for (let i = 0; i < 95; i++) {
    const x = random()*512, y = random()*256, radius = 4+random()*30;
    const stain = floorPaint.createRadialGradient(x,y,0,x,y,radius);
    stain.addColorStop(0, i%4 ? '#202c27a6' : '#6548388c');
    stain.addColorStop(1, '#292b2600');
    floorPaint.fillStyle = stain;
    floorPaint.fillRect(x-radius,y-radius,2*radius,2*radius);
  }
  slab.roughness = .68;
  const oxidized = material(0x483c31), steel = material(0x585951);
  const ivory = material(0xb4ab8c), wood = material(0x494033);
  const obstacles = [];
  function solid(mat,x,z,w,d,h) {
    box(room,mat,x,h/2,z,w,h,d);
    obstacles.push([x,z,w/2+.22,d/2+.22]);
  }
  const height = cellar.upper - base - .25;
  box(room,slab,36.5,-.10,5,13,.2,10);
  box(room,cement,36.5-width/2,height+.1,5,13-width,.2,10);
  const covered = offsetZ - cellar.coverEnd;
  box(room,cement,43-width/2,height+.1,covered/2,width,.2,covered);
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
  chair.rotation.y = .57;
  room.add(chair);
  box(chair,ivory,0,.47,0,.49,.12,.46);
  box(chair,ivory,0,.82,-.2,.46,.66,.10).rotation.x=-.08;
  for (const x of [-.19,.19]) for (const z of [-.17,.17])
    box(chair,wood,x,.22,z,.055,.44,.055).rotation.z=-x*.18;
  obstacles.push([36.9,5.2,.54,.54]);

  // A short cellar stair runs against the east wall. Its side is solid.
  const tread = (cellar.foot - cellar.firstStep) / cellar.steps;
  const rise = (cellar.upper - base) / cellar.steps;
  const localX = center-offsetX;
  for (let i=0; i<cellar.steps; i++) {
    const h = (cellar.steps-i-.5)*rise;
    box(room,cement,localX,h/2,offsetZ-cellar.firstStep-(i+.5)*tread,width,h,tread);
  }
  const landing = cellar.firstStep-cellar.top;
  box(room,cement,localX,cellar.upper-base-.10,10-landing/2,width,.20,landing);
  const length = cellar.coverEnd-cellar.top;
  const hatch = new T.Group();
  houseScene.add(hatch);
  hatch.position.set(cellar.right,cellar.upper+.012,cellar.top+length/2);
  box(hatch,wood,-width/2,0,0,width,.055,length);
  for (const z of [-length*.35,length*.35]) box(hatch,steel,-width/2,.035,z,width,.026,.07);
  const handle = box(hatch,steel,-width+.17,.063,0,.07,.08,.24);
  // A dim landing light reveals the steps while the room beyond stays dark.
  const guide = new T.PointLight(0xffc28a,8,5);
  guide.position.set(center,cellar.upper+.65,cellar.firstStep);
  scene.add(guide);
  let opening = false;
  room.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  const flashlight = new T.Group();
  flashlight.visible = false;
  const beam = new T.SpotLight(0xfff5e7, 70, 22, 1.04, 1, 1.65);
  beam.castShadow = true;
  beam.shadow.mapSize.set(512,512);
  beam.shadow.camera.near = .12;
  beam.shadow.normalBias = .015;
  beam.shadow.bias = -.00025;
  beam.shadow.autoUpdate = false;
  // Weak, short-range spill approximates light reflected back from the room.
  const spill = new T.PointLight(0xcad8dc, 5, 12, 1.45);
  flashlight.add(beam, beam.target, spill);
  scene.add(flashlight);
  const origin = new T.Vector3(), aim = new T.Vector3();
  return {
    scene, flashlight,
    aimFlashlight(camera, direction) {
      if (!flashlight.visible) return;
      origin.set(.21,-.26,-.1).applyQuaternion(camera.quaternion).add(camera.position);
      aim.copy(camera.position).addScaledVector(direction, 5);
      if (!beam.position.equals(origin) || !beam.target.position.equals(aim)) {
        beam.position.copy(origin);
        beam.target.position.copy(aim);
        spill.position.copy(origin);
        beam.shadow.needsUpdate = true;
      }
    },
    toggle() { opening = !opening; },
    handlePosition(target) { return handle.getWorldPosition(target); },
    overHatch(x,z) {
      return x >= cellar.left && x <= cellar.right && z >= cellar.top && z < cellar.coverEnd;
    },
    get opened() { return opening; },
    update(dt) {
      hatch.rotation.z = T.MathUtils.damp(hatch.rotation.z,opening ? -Math.PI/2 : 0,8,dt);
    },
    inLane(x) { return x >= cellar.left+.15 && x <= cellar.right-.15; },
    canDescend(x,z) {
      return opening && hatch.rotation.z < -1.35 && this.inLane(x) &&
        z > cellar.firstStep && z < cellar.coverEnd;
    },
    floor(x,z) {
      if (!this.inLane(x)) return base;
      const progress = T.MathUtils.clamp((z-cellar.firstStep)/(cellar.foot-cellar.firstStep),0,1);
      return cellar.upper+(base-cellar.upper)*progress;
    },
    blocks(x,z,oldX) {
      const lx=x-offsetX, lz=offsetZ-z;
      if(lx<30.22 || lx>42.85 || lz<.22 || z<cellar.top) return true;
      if(z<cellar.foot && this.inLane(x)!==this.inLane(oldX)) return true;
      return obstacles.some(([cx,cz,rx,rz])=>Math.abs(lx-cx)<rx && Math.abs(lz-cz)<rz);
    },
    blocksFromAbove(x,z) {
      if (!this.overHatch(x,z)) return false;
      const angle = hatch.rotation.z;
      if (!opening) return angle < -.06;
      if (angle > -1.35) return z > cellar.firstStep && angle < -.06;
      return x > cellar.right-.15;
    }
  };
}
