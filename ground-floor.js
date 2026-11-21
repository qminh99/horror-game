import { createFrontYard } from './front-yard.js';

import { cellar } from './cellar-layout.js';

export const stairOpening = { left: 7.46, right: 9.14 };

const stair = { start: 3.43, top: 4.36, bottom: 9.56, floor: -3.35, steps: 19 };
const house = { west: .42, kitchenWall: 6.35, livingWall: 10.12, east: 17.35, back: 7.34, front: 12.56 };
const kitchenDoorway = { start: 10.57, end: 11.94 };
const livingDoorway = { start: 11.02, end: 12.49 };
const radius = .22;
const entrance = { left: 7.58, right: 9.02, height: 2.36 };
const yard = { left: -5.8, right: 21.8, end: 31.6, rear: 4.35, roadZ: 28.55, binX: 1.4, binZ: 5.25 };

export { house, yard, entrance, kitchenDoorway, livingDoorway };

export function isOutside(z,x) {
  if(z > house.front + radius) return true;
  return z>=yard.rear && x>=yard.left && (x<house.west-radius ||
    (z<house.back-radius && x<house.west+3));
}

export function lowerFloorHeight(x, z) {
  const insideStairs = x >= stairOpening.left + radius && x <= stairOpening.right - radius;
  if (insideStairs && z > 3.35 && z < stair.bottom + radius) {
    const slope = (z - stair.top) / (stair.bottom - stair.top);
    return stair.floor * Math.max(0, Math.min(1, slope));
  }

  if (isOutside(z,x)) {
      return x >= yard.left + radius && x <= yard.right - radius && z <= yard.end - radius ? stair.floor : null;
  }
  if (z > house.front - radius) {
    const clearance = radius + .03;
    return x >= entrance.left + clearance && x <= entrance.right - clearance ? stair.floor : null;
  }

  if (x < house.west + radius || x > house.east - radius || z < house.back + radius) return null;
  if (x > house.kitchenWall - radius && x < house.livingWall + radius && z < stair.bottom + radius) return null;

  const doorway = x < (house.kitchenWall + house.livingWall) / 2 ? kitchenDoorway : livingDoorway;
  const nearPartition = Math.abs(x - house.kitchenWall) < radius || Math.abs(x - house.livingWall) < radius;
  if (nearPartition && (z < doorway.start + radius || z > doorway.end - radius)) return null;
  return stair.floor;
}

export function createGroundFloor({ T, scene, camera, targets, say, cyl, ball }) {
  const stairs = new T.Group();
  const rooms = new T.Group();
  rooms.position.y = stair.floor;
  scene.add(stairs, rooms);
  const plaster = (color, options = {}) => new T.MeshStandardMaterial({ color, roughness: .88, ...options });
  const wood = plaster(0x4e3020);
  const darkWood = plaster(0x30251f);
  const brass = plaster(0x927450, { metalness: .44, roughness: .48 });
  const iron = plaster(0x303438, { metalness: .48, roughness: .49 });
  const porcelain = plaster(0xadab90, { roughness: .46 });
  const warm = plaster(0xeac38b, { emissive: 0xeab46c, emissiveIntensity: 1 });
  const trim = plaster(0x463a28);
  const ceiling = plaster(0x786b53);
  const bookPages = plaster(0xa59168);
  const furniture = [];

  let randomState = 49819;
  function random() {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  }

  function texture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    draw(ctx);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }

  function grit(ctx, width, height, count, scale) {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = random() < .6 ? '#28201930' : '#e7ce9b2b';
      ctx.fillRect(random() * width, random() * height, random() * scale + 1, random() * scale + 1);
    }
  }

  function wallMaterial(top, bottom) {
    return plaster(0xffffff, { map: texture(512, 256, ctx => {
      const wash = ctx.createLinearGradient(0, 0, 0, 256);
      wash.addColorStop(0, top);
      wash.addColorStop(1, bottom);
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 85; i++) {
        ctx.fillStyle = i % 2 ? '#1e201514' : '#dec2890b';
        ctx.fillRect(random() * 512, random() * 256, 2 + random() * 25, 10 + random() * 150);
      }
      grit(ctx, 512, 256, 4300, 3);
      for (let i = 0; i < 15; i++) {
        const x = random() * 512, y = random() * 256;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 7, y + 19);
        ctx.lineTo(x + 2, y + 30);
        ctx.lineTo(x + 19, y + 46);
        ctx.strokeStyle = '#26201868';
        ctx.stroke();
      }
    }) });
  }

  const kitchenWall = wallMaterial('#756e51', '#494333');
  const livingWall = wallMaterial('#505542', '#313b30');
  const passageWall = wallMaterial('#6a604c', '#493d31');
  const enamel = wallMaterial('#a5a48d', '#656351');
  const tile = plaster(0xffffff, { map: texture(512, 512, ctx => {
    const shades = ['#52524a', '#5a5950', '#625d50', '#484a44'];
    ctx.fillStyle = '#30322c';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) {
      for (let x = 0; x < 512; x += 64) {
        ctx.fillStyle = shades[Math.floor(random() * shades.length)];
        ctx.fillRect(x + 1, y + 1, 62, 62);
      }
    }
    grit(ctx, 512, 512, 8500, 4);
  }) });
  const planks = plaster(0xffffff, { map: texture(512, 512, ctx => {
    ctx.fillStyle = '#302a21';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 24) {
      for (let x = -(y % 72) * 2; x < 512; x += 158) {
        ctx.fillStyle = ['#65513a', '#524431', '#453b2c'][Math.floor(random() * 3)];
        ctx.fillRect(x + 1, y + 1, 156, 22);
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = '#20170e24';
          ctx.fillRect(x + random() * 110, y + random() * 22, 20 + random() * 36, 1);
        }
      }
    }
    grit(ctx, 512, 512, 2800, 3);
  }) });

  const boxGeometry = new T.BoxGeometry(1, 1, 1);
  function boxAt(mat, x, y, z, w, h, d, parent = rooms) {
    const mesh = new T.Mesh(boxGeometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }
  function cylinder(mat, x, y, z, top, bottom, h, parent = rooms) {
    const mesh = cyl(mat, x, y, z, top, bottom, h, 20, parent);
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }
  const sphere = (mat, x, y, z, r, parent = rooms) => ball(mat, x, y, z, r, parent);
  const solid = (x, z, width, depth) => furniture.push({ x, z, width, depth });
  function light(color, intensity, distance, x, y, z, parent = rooms) {
    const source = new T.PointLight(color, intensity, distance, 2);
    source.position.set(x, y, z);
    parent.add(source);
    return source;
  }

  function sign(label, x, y, z, parent = rooms) {
    boxAt(darkWood, x, y, z, .74, .22, .045, parent);
    const map = texture(384, 96, ctx => {
      ctx.fillStyle = '#30241a';
      ctx.fillRect(0, 0, 384, 96);
      ctx.strokeStyle = '#8a7050';
      ctx.lineWidth = 4;
      ctx.strokeRect(7, 7, 370, 82);
      ctx.fillStyle = '#ead8ab';
      ctx.font = 'bold 43px Georgia';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 192, 50);
    });
    const plate = new T.Mesh(new T.PlaneGeometry(.68, .17), new T.MeshBasicMaterial({ map }));
    plate.position.set(x, y, z - .026);
    plate.rotation.y = Math.PI;
    parent.add(plate);
  }

  // Cầu thang chạy về phía nam, bắt đầu bằng một chiếu nghỉ bằng phẳng.
  const center = (stairOpening.left + stairOpening.right) / 2;
  const width = stairOpening.right - stairOpening.left;
  const run = stair.bottom - stair.top;
  const tread = run / stair.steps;
  const rise = -stair.floor / stair.steps;
  const stairMidZ = (stair.top + stair.bottom) / 2;
  const slopeLength = Math.hypot(run, stair.floor);
  const slopeAngle = Math.atan2(-stair.floor, run);
  const landingLength = stair.top - stair.start;
  boxAt(darkWood, center, -.10, stair.start + landingLength / 2, width, .20, landingLength, stairs);
  boxAt(ceiling, center, 2.91, stair.start + landingLength / 2, width + .28, .18, landingLength, stairs);
  boxAt(ceiling, center, 2.91 + stair.floor / 2, stairMidZ, width + .23, .18, slopeLength, stairs).rotation.x = slopeAngle;
  for (let i = 0; i < stair.steps; i++) {
    const height = -stair.floor - (i + .5) * rise;
    const z = stair.top + (i + .5) * tread;
    boxAt(i % 3 === 0 ? darkWood : wood, center, stair.floor + height / 2, z, width, height, tread, stairs);
    boxAt(darkWood, center, stair.floor + height - .022, z + tread / 2 - .011, width, .045, .053, stairs);
  }
  for (const edge of [stairOpening.left, stairOpening.right]) {
    boxAt(passageWall, edge, (stair.floor + 3.04) / 2, (stair.start + stair.bottom) / 2, .14, 3.04 - stair.floor, stair.bottom - stair.start, stairs);
    const handX = edge + Math.sign(center - edge) * .135;
    boxAt(wood, handX, 1.03 + stair.floor / 2, stairMidZ, .11, .09, slopeLength, stairs).rotation.x = slopeAngle;
    for (const fraction of [.12, .37, .62, .87]) {
      boxAt(brass, edge + Math.sign(center - edge) * .09, .95 + stair.floor * fraction, stair.top + run * fraction, .18, .075, .06, stairs);
    }
  }
  // Enclose the high stair walls with a pitched roof and a solid front gable.
  const roof = plaster(0x383e40);
  const wallTop = 3.04;
  const roofDepth = stair.bottom-stair.start+.65;
  for(const side of [-1,1]){
    boxAt(roof,center+side*.57,wallTop+.21,stairMidZ,1.29,.15,roofDepth,stairs).rotation.z=-side*.33;
  }
  boxAt(passageWall,center,1.37,stair.bottom+.03,width+.14,3.44,.14,stairs);
  const gable = new T.Shape();
  gable.moveTo(-1.14,0); gable.lineTo(1.14,0); gable.lineTo(0,.4); gable.closePath();
  const gableFace = new T.Mesh(new T.ExtrudeGeometry(gable,{depth:.1,bevelEnabled:false}),roof);
  gableFace.position.set(center,wallTop,stair.bottom+.08);
  stairs.add(gableFace);
  const stairSconce = plaster(0xc38750, { emissive: 0xf2a95e, emissiveIntensity: 1.2 });
  for (const [z, y] of [[4.52, 2.13], [7.45, .12]]) {
    boxAt(brass, stairOpening.right - .10, y, z, .068, .29, .19, stairs);
    sphere(stairSconce, stairOpening.right - .19, y + .045, z, .095, stairs);
    light(0xe4ab6d, 8, 4.1, center, y, z, stairs);
  }
  sign('TẦNG 1', center, 2.88, 3.35, stairs);

  function span(mat, minX, maxX, minZ, maxZ, y, height) {
    boxAt(mat, (minX + maxX) / 2, y, (minZ + maxZ) / 2, maxX - minX, height, maxZ - minZ);
  }

  const height = 2.87;
  function wall(mat, x1, x2, z1, z2) {
    span(mat, x1, x2, z1, z2, height / 2, height);
    span(trim, x1 - .014, x2 + .014, z1 - .014, z2 + .014, .09, .18);
  }
  function roomShell(floor, minX, maxX, minZ, maxZ) {
    span(floor, minX, maxX, minZ, maxZ, -.11, .22);
    span(ceiling, minX, maxX, minZ, maxZ, height + .075, .15);
  }
  const { west, kitchenWall: kitchenEdge, livingWall: livingEdge, east, back, front } = house;
  roomShell(tile, west, kitchenEdge, back, front);
  roomShell(planks, livingEdge, east, back, front);
  for (const [x1,x2,z1,z2] of [
    [kitchenEdge, cellar.left, stair.bottom, front], [cellar.right, livingEdge, stair.bottom, front],
    [cellar.left, cellar.right, stair.bottom, cellar.top], [cellar.left, cellar.right, cellar.coverEnd, front]
  ]) span(tile,x1,x2,z1,z2,-.11,.22);
  span(ceiling,kitchenEdge,livingEdge,stair.bottom,front,height+.075,.15);
  wall(kitchenWall, west - .08, west + .08, back, front);
  wall(livingWall, east - .08, east + .08, back, front);
  wall(kitchenWall, west, kitchenEdge, back - .08, back + .08);
  wall(livingWall, livingEdge, east, back - .08, back + .08);
  wall(kitchenWall, west, kitchenEdge, front - .08, front + .08);
  wall(livingWall, livingEdge, east, front - .08, front + .08);
  wall(passageWall, kitchenEdge, entrance.left, front - .08, front + .08);
  wall(passageWall, entrance.right, livingEdge, front - .08, front + .08);
  span(passageWall, entrance.left, entrance.right, front - .08, front + .08, (height + entrance.height) / 2, height - entrance.height);
  wall(passageWall, kitchenEdge, stairOpening.left, stair.bottom - .08, stair.bottom + .08);
  wall(passageWall, stairOpening.right, livingEdge, stair.bottom - .08, stair.bottom + .08);
  for (const [x, material, doorway] of [[kitchenEdge, kitchenWall, kitchenDoorway], [livingEdge, livingWall, livingDoorway]]) {
    wall(material, x - .08, x + .08, back, doorway.start);
    wall(material, x - .08, x + .08, doorway.end, front);
    span(material, x - .08, x + .08, doorway.start, doorway.end, 2.58, .58);
    for (const z of [doorway.start, doorway.end]) boxAt(wood, x, 1.16, z, .25, 2.32, .12);
    boxAt(wood, x, 2.31, (doorway.start + doorway.end) / 2, .25, .13, doorway.end - doorway.start + .12);
  }
  light(0xf0c284, 10, 4.4, 8.28, 2.67, 10.85);
  cylinder(brass, 8.28, 2.79, 10.85, .16, .12, .14);
  sphere(warm, 8.28, 2.67, 10.85, .115);
  sign('BẾP', 7, 1.93, 12.44);
  sign('PHÒNG KHÁCH', 9.61, 1.93, 12.44);
  sign('RA SÂN', center, 2.61, 12.44);

  const frontDoor = new T.Group();
  const leafWidth = entrance.right - entrance.left;
  frontDoor.position.set(entrance.left, 0, front);
  rooms.add(frontDoor);
  for (const x of [entrance.left, entrance.right]) boxAt(darkWood, x, entrance.height / 2, front, .095, entrance.height, .26);
  boxAt(darkWood, center, entrance.height, front, leafWidth + .10, .11, .27);
  boxAt(wood, leafWidth / 2, 1.16, 0, leafWidth - .085, 2.26, .09, frontDoor);
  for (const [y, panelHeight] of [[.61, .73], [1.64, .82]]) {
    boxAt(darkWood, leafWidth / 2, y, 0, leafWidth - .25, panelHeight, .12, frontDoor);
    boxAt(wood, leafWidth / 2, y, 0, leafWidth - .34, panelHeight - .09, .135, frontDoor);
  }
  for (const side of [-1, 1]) {
    boxAt(iron, leafWidth - .17, 1.06, side * .057, .083, .18, .035, frontDoor);
    sphere(brass, leafWidth - .17, 1.06, side * .107, .044, frontDoor);
  }
  let frontDoorAngle = 0, frontDoorTarget = 0;
  targets.push({
    name: 'Cửa chính',
    pos: new T.Vector3(center, stair.floor + 1.26, front),
    use() {
      if (frontDoorTarget !== 0) {
        frontDoorTarget = 0;
      } else {
        // Mở về phía đối diện người chơi và giữ hướng nếu cửa đang khép dở.
        const direction = Math.abs(frontDoorAngle) > .025 ? Math.sign(frontDoorAngle) :
          camera.position.z > front ? 1 : -1;
        frontDoorTarget = direction * 1.48;
      }
      say(frontDoorTarget ? 'Đang mở cửa chính.' : 'Đang đóng cửa chính.');
    }
  });

  function blocksFrontDoor(x, z, angle = frontDoorAngle) {
    const dx = x - entrance.left, dz = z - front;
    if (Math.abs(dx) > leafWidth + radius || Math.abs(dz) > leafWidth + radius) return false;
    const sin = Math.sin(angle), cos = Math.cos(angle);
    const localX = cos * dx - sin * dz, localZ = sin * dx + cos * dz;
    const closestX = T.MathUtils.clamp(localX, 0, leafWidth);
    const closestZ = T.MathUtils.clamp(localZ, -.068, .068);
    return Math.hypot(localX - closestX, localZ - closestZ) < radius;
  }

  const outdoors = createFrontYard({
    T, scene, floor: stair.floor, boxAt, texture, grit, plaster, light, house, yard, entrance, center, radius
  });

  // Bếp cũ, cửa sổ hổ phách và dãy bếp men cạnh chậu rửa.
  const rear = back + .14;
  const windowX = 2.52;
  const windowY = 1.84;
  boxAt(darkWood, windowX, windowY, rear, 1.58, 1.55, .18);
  const paneMap = texture(256, 256, ctx => {
    const glow = ctx.createLinearGradient(0, 0, 0, 256);
    glow.addColorStop(0, '#6a441e');
    glow.addColorStop(.42, '#d49c48');
    glow.addColorStop(1, '#f1d5a0');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 256);
    grit(ctx, 256, 256, 1700, 2);
  });
  boxAt(new T.MeshBasicMaterial({ map: paneMap }), windowX, windowY, rear + .105, 1.37, 1.34, .02);
  boxAt(wood, windowX, windowY, rear + .13, .055, 1.34, .06);
  boxAt(wood, windowX, windowY - .20, rear + .13, 1.40, .035, .06);
  boxAt(darkWood, windowX, 1.06, rear + .15, 1.65, .09, .36);
  light(0xf8b85a, 13, 4.25, windowX, 1.81, rear + .38);

  const curtainMat = plaster(0xc38a52, { side: T.DoubleSide, emissive: 0x6d310e, emissiveIntensity: .43 });
  const curtainRod = cylinder(brass, windowX, 2.68, rear + .29, .023, .023, 1.88);
  curtainRod.rotation.z = Math.PI / 2;
  for (const side of [-1, 1]) {
    const geometry = new T.PlaneGeometry(.61, 1.58, 28, 16);
    const positions = geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      const pinch = Math.exp(-((y + .28) ** 2) / .08);
      positions.setXYZ(i, x * (1 - .57 * pinch) + side * .11 * pinch, y, .029 * Math.cos(x * 84));
    }
    geometry.computeVertexNormals();
    const curtain = new T.Mesh(geometry, curtainMat);
    curtain.position.set(windowX + side * .51, 1.85, rear + .275);
    rooms.add(curtain);
    boxAt(plaster(0x753c33), windowX + side * .61, 1.57, rear + .31, .25, .032, .045);
  }

  const fridgeX = 1.19, fridgeZ = 8.12;
  boxAt(enamel, fridgeX, 1.06, fridgeZ, .95, 2.10, .86);
  for (const [y, h] of [[1.73, .66], [.74, 1.29]]) {
    boxAt(enamel, fridgeX, y, fridgeZ + .44, .91, h, .09);
    boxAt(darkWood, fridgeX + .31, y - .17, fridgeZ + .51, .075, .27, .047);
  }
  boxAt(iron, fridgeX, .10, fridgeZ, .90, .09, .82);
  solid(fridgeX, fridgeZ, .96, .97);
  targets.push({ name: 'Tủ lạnh cũ', pos: new T.Vector3(fridgeX, stair.floor + 1.23, fridgeZ + .55),
    available: () => camera.position.x < kitchenEdge,
    use() { say('Lớp men trên cửa tủ đã bong ở các góc.'); } });

  const binX=2, binZ=8.04;
  cylinder(iron,binX,.30,binZ,.235,.19,.59);
  cylinder(darkWood,binX,.595,binZ,.238,.238,.025);
  boxAt(iron,binX,.065,binZ+.20,.15,.04,.11);
  const bagMaterial=plaster(0x20251f);
  const kitchenBag=sphere(bagMaterial,binX,.61,binZ,.225);
  kitchenBag.scale.y=.52;
  const knot=sphere(bagMaterial,binX,.74,binZ,.06);
  solid(binX,binZ,.47,.47);
  let bagState='kitchen';
  targets.push({name:'Lấy túi rác',pos:new T.Vector3(binX,stair.floor+.64,binZ),
    available:()=>bagState==='kitchen' && !isOutside(camera.position.z,camera.position.x),
    use(){
      if(bagState!=='kitchen') return;
      bagState='carrying';
      kitchenBag.visible=knot.visible=false;
      say('Đã cầm túi rác. Mang ra thùng sau nhà, bên trái nhìn từ sân.');
    }
  },{name:'Đổ túi rác',pos:new T.Vector3(yard.binX,stair.floor+.9,yard.binZ),
    available:()=>bagState==='carrying' && isOutside(camera.position.z,camera.position.x),
    use(){
      if(bagState!=='carrying') return;
      bagState='disposed';
      outdoors.discardBag();
      say('Đã đổ rác.');
    }
  });

  const counterX = 3.66, counterZ = 7.94;
  const topMat = plaster(0x625247, { roughness: .58 });
  boxAt(enamel, counterX, .46, counterZ, 2.65, .90, .73);
  boxAt(topMat, counterX, .94, counterZ, 2.72, .09, .82);
  for (const x of [2.8, 3.66, 4.52]) {
    boxAt(wood, x, .41, counterZ + .38, .78, .64, .06);
    boxAt(brass, x, .65, counterZ + .425, .16, .03, .044);
    boxAt(enamel, x, .80, counterZ + .385, .78, .17, .07);
  }
  boxAt(iron, 3.39, .995, counterZ - .015, .64, .035, .45);
  boxAt(plaster(0x222928), 3.39, 1.017, counterZ - .015, .50, .012, .33);
  cylinder(iron, 3.38, 1.13, counterZ - .24, .025, .032, .28);
  boxAt(iron, 3.38, 1.265, counterZ - .16, .05, .047, .18);
  solid(counterX, counterZ, 2.72, .83);

  const ovenX = 5.57;
  boxAt(enamel, ovenX, .50, counterZ, .87, .98, .83);
  boxAt(iron, ovenX, .98, counterZ, .89, .07, .86);
  boxAt(darkWood, ovenX, .43, counterZ + .447, .64, .46, .033);
  boxAt(iron, ovenX, .71, counterZ + .48, .62, .043, .06);
  for (const x of [-.24, 0, .24]) cylinder(brass, ovenX + x, .85, counterZ + .442, .052, .052, .056).rotation.x = Math.PI / 2;
  for (const x of [-.22, .22]) for (const z of [-.21, .21]) cylinder(darkWood, ovenX + x, 1.035, counterZ + z, .118, .126, .037);
  solid(ovenX, counterZ, .90, .91);
  function pot(x, y, z, size, material) {
    cylinder(material, x, y + size * .43, z, size, size * .86, size * .86);
    cylinder(iron, x, y + size * .91, z, size * .96, size * 1.04, .039);
    sphere(darkWood, x, y + size * .99 + .025, z, size * .19);
    for (const side of [-1, 1]) boxAt(iron, x + side * size * 1.10, y + size * .59, z, size * .45, .045, .047);
  }
  pot(5.37, 1.055, 7.76, .163, porcelain);
  pot(5.76, 1.055, 8.12, .142, iron);
  pot(2.93, .988, 8, .13, iron);
  pot(1.59, .014, 9.01, .17, iron);
  boxAt(darkWood, 4.64, 2.02, rear + .14, 1.64, .11, .38);
  for (const [x, y, r] of [[4.10, 1.68, .19], [4.68, 1.56, .23], [5.19, 1.74, .16]]) {
    cylinder(iron, x, y, rear + .22, r, r * .93, .075).rotation.x = Math.PI / 2;
    boxAt(brass, x, y + r + .080, rear + .24, .035, .19, .03);
  }
  for (let i = 0; i < 5; i++) {
    cylinder(porcelain, 4.26 + i * .084, 1.13, 8.05, .135, .135, .025).rotation.z = .52;
  }

  const clock = cylinder(wood, 1.18, 2.47, rear + .14, .21, .21, .075);
  clock.rotation.x = Math.PI / 2;
  cylinder(porcelain, 1.18, 2.47, rear + .185, .173, .173, .014).rotation.x = Math.PI / 2;
  boxAt(iron, 1.18, 2.51, rear + .20, .015, .091, .017).rotation.z = -.15;
  boxAt(iron, 1.22, 2.45, rear + .20, .013, .112, .017).rotation.z = -1.14;

  const tableCloth = plaster(0x713731);
  function table(mat, x, y, z, w, d) {
    boxAt(mat, x, y, z, w, .10, d);
    for (const ix of [-1, 1]) for (const iz of [-1, 1]) {
      boxAt(darkWood, x + ix * (w / 2 - .105), y / 2, z + iz * (d / 2 - .105), .10, y, .10);
    }
    solid(x, z, w, d);
  }
  table(wood, 2.28, .77, 10.42, 2.05, 1.03);
  boxAt(tableCloth, 2.27, .829, 10.43, 1.96, .016, .56);
  boxAt(tableCloth, 3.235, .71, 10.43, .022, .23, .56);
  cylinder(porcelain, 1.77, .84, 10.43, .15, .115, .025);
  sphere(plaster(0x80512c), 1.77, .92, 10.43, .076);
  cylinder(iron, 2.82, .885, 10.24, .058, .047, .107);
  for (const [x, z] of [[1.27, 11.42], [2.83, 9.49]]) {
    const chair = new T.Group();
    chair.position.set(x, 0, z);
    chair.rotation.y = z > 10 ? Math.PI + .24 : -.18;
    rooms.add(chair);
    boxAt(wood, 0, .43, 0, .47, .085, .44, chair);
    boxAt(wood, 0, .81, -.20, .47, .26, .075, chair);
    for (const lx of [-.175, .175]) for (const lz of [-.16, .16]) {
      boxAt(iron, lx, lz < 0 ? .45 : .21, lz, .055, lz < 0 ? .9 : .42, .055, chair);
    }
    solid(x, z, .52, .57);
  }
  cylinder(brass, 4.31, 2.64, 9.54, .028, .029, .43);
  cylinder(iron, 4.31, 2.37, 9.54, .12, .33, .19);
  const kitchenBulb = sphere(warm.clone(), 4.31, 2.254, 9.54, .082);
  const kitchenLight = light(0xffd295, 20, 6.25, 4.31, 2.10, 9.54);
  let kitchenOn = true;
  boxAt(wood, kitchenEdge - .103, 1.25, 10.22, .048, .19, .13);
  const rocker = boxAt(porcelain, kitchenEdge - .142, 1.25, 10.22, .042, .09, .059);
  targets.push({ name: 'Công tắc đèn bếp', pos: new T.Vector3(kitchenEdge - .18, stair.floor + 1.25, 10.22),
    available: () => camera.position.x < kitchenEdge,
    use() {
      kitchenOn = !kitchenOn;
      kitchenLight.intensity = kitchenOn ? 20 : 0;
      kitchenBulb.material.emissiveIntensity = kitchenOn ? 1 : 0;
      rocker.rotation.z = kitchenOn ? .20 : -.20;
      say(kitchenOn ? 'Đã bật đèn bếp.' : 'Đã tắt đèn bếp.');
    } });

  // Phòng khách, thảm hoa văn, TV bóng đèn hình và sách để dở.
  const rugMap = texture(512, 512, ctx => {
    ctx.fillStyle = '#372c24';
    ctx.fillRect(0, 0, 512, 512);
    for (const [offset, color, line] of [[11,'#675232',4], [23,'#8f7143',2], [35,'#63402d',11], [48,'#9d7949',2]]) {
      ctx.strokeStyle = color;
      ctx.lineWidth = line;
      ctx.strokeRect(offset, offset, 512 - offset * 2, 512 - offset * 2);
    }
    for (let y = 72; y < 460; y += 36) for (let x = 72; x < 460; x += 36) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = (x + y) % 72 ? '#8f7650' : '#6d5133';
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.fillStyle = '#7a4b36';
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
    grit(ctx, 512, 512, 5400, 3);
  });
  boxAt(plaster(0xffffff, { map: rugMap }), 13.53, .009, 10.36, 4.45, .018, 3.66);
  const leather = wallMaterial('#484c37', '#2f372b');
  const seam = plaster(0x646049);
  const sofaX = 14.58, sofaZ = 11.86;
  boxAt(darkWood, sofaX, .17, sofaZ, 2.86, .29, .97);
  boxAt(leather, sofaX, .56, sofaZ + .40, 2.88, .89, .31).rotation.x = .08;
  for (const side of [-1, 1]) {
    boxAt(leather, sofaX + side * 1.34, .49, sofaZ, .25, .59, 1.03);
    boxAt(seam, sofaX + side * 1.34, .78, sofaZ, .24, .018, .99);
  }
  for (const x of [-.80, 0, .80]) {
    boxAt(leather, sofaX + x, .41, sofaZ - .096, .78, .21, .79);
    boxAt(leather, sofaX + x, .73, sofaZ + .27, .76, .56, .22).rotation.x = .15;
    boxAt(seam, sofaX + x, .49, sofaZ - .493, .73, .032, .019);
  }
  solid(sofaX, sofaZ, 2.91, 1.08);

  const bookCovers = [0x3c493d, 0x412720, 0x534337, 0x28383c, 0x635335].map(color => plaster(color));
  function book(x, y, z, w, h, d, angle) {
    const bookGroup = new T.Group();
    bookGroup.position.set(x, y, z);
    bookGroup.rotation.y = angle;
    rooms.add(bookGroup);
    boxAt(bookPages, 0, 0, 0, w * .94, h * .78, d * .89, bookGroup);
    for (const sign of [-1, 1]) boxAt(bookCovers[Math.floor(random() * bookCovers.length)], 0, sign * h * .45, 0, w, h * .125, d, bookGroup);
  }
  table(darkWood, 14.08, .47, 10.10, 1.87, .86);
  for (const [x, z, angle] of [[13.44, 10.14, .24], [13.67, 9.91, -.2], [14.52, 10.24, -.43]]) {
    book(x, .553, z, .28, .058, .39, angle);
  }
  for (const [x, z, count] of [[11.15, 9.10, 7], [16.66, 8.63, 12], [15.54, 9.01, 6]]) {
    for (let i = 0; i < count; i++) {
      book(x + (random() - .5) * .09, .034 + i * .064, z + (random() - .5) * .08, .31, .064, .39, (random() - .5) * .58);
    }
    solid(x, z, .44, .48);
  }
  const flame = plaster(0xfce3a4, { emissive: 0xff9030, emissiveIntensity: 1.5 });
  cylinder(brass, 14.68, .535, 9.94, .094, .10, .035);
  cylinder(porcelain, 14.68, .63, 9.94, .037, .043, .16);
  sphere(flame, 14.68, .733, 9.94, .024).scale.y = 1.55;
  const candle = light(0xff9f43, 2.7, 2.3, 14.68, .79, 9.94);

  const shelfX = 14.43, shelfZ = 7.76;
  boxAt(darkWood, shelfX, 1.14, shelfZ, 1.53, 2.28, .39);
  boxAt(wood, shelfX, 2.32, shelfZ, 1.65, .11, .54);
  for (const side of [-1, 1]) boxAt(wood, shelfX + side * .79, 1.16, shelfZ + .06, .13, 2.24, .52);
  for (const y of [.22, .67, 1.13, 1.57, 2.03]) {
    boxAt(wood, shelfX, y, shelfZ + .11, 1.57, .065, .50);
    for (let i = 0; i < 10; i++) {
      const h = .20 + random() * .14;
      const x = shelfX - .62 + i * .132;
      const cover = bookCovers[Math.floor(random() * bookCovers.length)];
      boxAt(cover, x, y + h / 2 + .033, shelfZ + .19, .085 + random() * .029, h, .21);
      boxAt(brass, x, y + h * .78, shelfZ + .3, .065, .012, .012);
    }
  }
  solid(shelfX, shelfZ, 1.71, .66);

  const tvX = 12.23, tvZ = 7.91;
  table(wood, tvX, .65, tvZ, 1.78, .70);
  boxAt(darkWood, tvX, .29, tvZ, 1.54, .068, .56);
  boxAt(iron, tvX, 1.17, tvZ - .01, 1.34, .94, .65);
  boxAt(brass, tvX - .12, 1.17, tvZ + .324, 1.04, .75, .05);
  const tvGlass = new T.MeshBasicMaterial({ map: texture(256, 176, ctx => {
    const surface = ctx.createRadialGradient(74, 28, 5, 128, 90, 146);
    surface.addColorStop(0, '#596454');
    surface.addColorStop(.31, '#38483e');
    surface.addColorStop(1, '#121a17');
    ctx.fillStyle = surface;
    ctx.fillRect(0, 0, 256, 176);
  }) });
  const staticMap = texture(256, 176, ctx => {
    ctx.fillStyle = '#181f1d';
    ctx.fillRect(0, 0, 256, 176);
    for (let i = 0; i < 11500; i++) {
      const value = Math.floor(random() * 172 + 49);
      ctx.fillStyle = `rgba(${value},${value + 8},${value + 5},.68)`;
      ctx.fillRect(random() * 256, random() * 176, 1 + random() * 3, 1);
    }
    ctx.fillStyle = '#0b151a65';
    for (let y = 1; y < 176; y += 3) ctx.fillRect(0, y, 256, 1);
  });
  const tvScreen = new T.Mesh(new T.PlaneGeometry(.96, .66), tvGlass);
  tvScreen.position.set(tvX - .12, 1.17, tvZ + .356);
  rooms.add(tvScreen);
  const staticScreen = new T.MeshBasicMaterial({ map: staticMap });
  const tvGlow = light(0xa1cec1, 0, 2.5, tvX, 1.18, tvZ + .55);
  for (const y of [1.38, 1.18]) cylinder(darkWood, tvX + .50, y, tvZ + .365, .053, .053, .04).rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) boxAt(darkWood, tvX + .50, 1 + i * .033, tvZ + .326, .13, .013, .012);
  let tvOn = false;
  targets.push({ name: 'TV hộp', pos: new T.Vector3(tvX, stair.floor + 1.22, tvZ + .36),
    available: () => camera.position.x > livingEdge,
    use() {
      tvOn = !tvOn;
      tvScreen.material = tvOn ? staticScreen : tvGlass;
      tvGlow.intensity = tvOn ? 4 : 0;
      say(tvOn ? 'Màn hình chỉ có nhiễu.' : 'Đã tắt TV.');
    } });

  const radiatorX = 16.37;
  for (let i = 0; i < 8; i++) boxAt(enamel, radiatorX - .47 + i * .135, .55, rear + .14, .088, .83, .18);
  boxAt(iron, radiatorX, .23, rear + .11, 1.16, .054, .095);
  solid(radiatorX, rear + .14, 1.14, .34);

  const landscape = plaster(0xffffff, { map: texture(192, 256, ctx => {
    const mist = ctx.createLinearGradient(0, 0, 0, 256);
    mist.addColorStop(0, '#403930');
    mist.addColorStop(.55, '#a5986d');
    mist.addColorStop(1, '#3d4033');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 0, 192, 256);
    for (const [x, y, scale] of [[31, 158, 1], [65, 141, .76], [153, 156, 1.05], [171, 129, .73]]) {
      ctx.fillStyle = '#35372a';
      ctx.fillRect(x, y - 36 * scale, 5 * scale, 53 * scale);
      ctx.beginPath();
      ctx.ellipse(x, y - 54 * scale, 20 * scale, 40 * scale, -.18, 0, Math.PI * 2);
      ctx.fill();
    }
    grit(ctx, 192, 256, 3100, 3);
  }) });
  const portrait = plaster(0xffffff, { map: texture(192, 256, ctx => {
    const backdrop = ctx.createRadialGradient(86, 77, 3, 96, 121, 142);
    backdrop.addColorStop(0, '#686149');
    backdrop.addColorStop(1, '#20251e');
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, 192, 256);
    ctx.fillStyle = '#211f1b';
    ctx.beginPath();
    ctx.ellipse(96, 224, 73, 62, 0, 0, Math.PI * 2);
    ctx.ellipse(98, 125, 40, 67, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#928064';
    ctx.beginPath();
    ctx.ellipse(99, 121, 23, 42, -.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c372a';
    ctx.fillRect(83, 114, 13, 3);
    ctx.fillRect(107, 113, 9, 3);
    ctx.fillRect(96, 145, 12, 3);
    grit(ctx, 192, 256, 4000, 3);
  }) });
  for (const [x, y, w, art] of [[10.81, 1.82, .43, landscape], [15.75, 1.97, .51, portrait], [16.65, 1.83, .56, landscape]]) {
    boxAt(wood, x, y, rear, w, .74, .095);
    boxAt(brass, x, y, rear + .05, w - .067, .66, .016);
    boxAt(art, x, y, rear + .067, w - .105, .62, .019);
  }

  const chandelierX = 13.78, chandelierZ = 9.49;
  cylinder(brass, chandelierX, 2.83, chandelierZ, .16, .13, .10);
  cylinder(brass, chandelierX, 2.53, chandelierZ, .029, .033, .50);
  sphere(brass, chandelierX, 2.30, chandelierZ, .13);
  for (const angle of [Math.PI / 6, Math.PI * .83, Math.PI * 1.5]) {
    const x = Math.cos(angle) * .42, z = Math.sin(angle) * .42;
    const arm = boxAt(brass, chandelierX + x / 2, 2.31, chandelierZ + z / 2, .44, .049, .042);
    arm.rotation.y = -angle;
    cylinder(brass, chandelierX + x, 2.37, chandelierZ + z, .025, .029, .17);
    cylinder(warm, chandelierX + x, 2.52, chandelierZ + z, .15, .090, .18);
  }
  light(0xf9cd88, 23, 7.3, chandelierX, 2.34, chandelierZ);
  light(0xc79962, 4.1, 4.1, 16.17, 1.34, 10.83);

  function batchStaticBoxes(group) {
    group.updateWorldMatrix(true, true);
    const groupInverse = new T.Matrix4().copy(group.matrixWorld).invert();
    const relative = new T.Matrix4();
    const batches = new Map();
    group.traverse(mesh => {
      if (mesh.geometry !== boxGeometry || mesh === rocker || mesh.parent === frontDoor) return;
      if (!batches.has(mesh.material)) batches.set(mesh.material, []);
      batches.get(mesh.material).push(mesh);
    });
    for (const [material, meshes] of batches) {
      if (meshes.length < 2) continue;
      const batch = new T.InstancedMesh(boxGeometry, material, meshes.length);
      meshes.forEach((mesh, index) => {
        relative.multiplyMatrices(groupInverse, mesh.matrixWorld);
        batch.setMatrixAt(index, relative);
        mesh.removeFromParent();
      });
      batch.instanceMatrix.needsUpdate = true;
      batch.computeBoundingSphere();
      group.add(batch);
    }
  }

  batchStaticBoxes(stairs);
  batchStaticBoxes(rooms);
  batchStaticBoxes(outdoors.group);

  function blocksFurniture(x, z) {
    if (blocksFrontDoor(x, z)) return true;
    if (isOutside(z,x)) return outdoors.blocked(x, z);
    return furniture.some(item =>
      Math.abs(x - item.x) < item.width / 2 + radius && Math.abs(z - item.z) < item.depth / 2 + radius
    );
  }

  function update(dt = 0, viewPosition = camera.position) {
    rooms.visible = viewPosition.z > 6.25 || isOutside(viewPosition.z,viewPosition.x);
    const now = performance.now();
    outdoors.update(viewPosition, now);
    if (!rooms.visible) return;
    const nextAngle = T.MathUtils.damp(frontDoorAngle, frontDoorTarget, 5, dt);
    if (!blocksFrontDoor(camera.position.x, camera.position.z, nextAngle)) {
      frontDoor.rotation.y = frontDoorAngle = nextAngle;
    }
    candle.intensity = 2.7 + Math.sin(now * .018) * .26;
  }

  update();
  return { blocksFurniture, update, get doorOpen(){ return Math.abs(frontDoorAngle)>.5; } };
}
