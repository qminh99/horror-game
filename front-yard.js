export function createFrontYard({
  T, scene, floor, boxAt, texture, grit, plaster, light, house, yard, entrance, center, radius
}) {
  const group = new T.Group();
  group.position.y = floor;
  scene.add(group);

  const { front } = house;
  const muted = (color, emissive = color) => plaster(color, { emissive, emissiveIntensity: .26 });
  const ground = muted(0x35414a, 0x172833);
  const fence = muted(0x414650, 0x263447);
  const metal = muted(0x202c37);
  const bark = muted(0x2c2a2b, 0x202832);
  const glass = muted(0x4c5750, 0x455c56);
  const eaves = muted(0x272932);
  const fascia = muted(0x505359);
  const porch = muted(0x58545a);
  const amber = plaster(0xfac77b, { emissive: 0xd88a3e, emissiveIntensity: 1.3 });
  const stone = plaster(0x859098, { map: texture(256, 256, ctx => {
    ctx.fillStyle = '#707278';
    ctx.fillRect(0, 0, 256, 256);
    grit(ctx, 256, 256, 3000, 9);
    ctx.strokeStyle = '#373b42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const [x, y] of [[35, 0], [55, 68], [97, 105], [103, 163], [153, 256]]) ctx.lineTo(x, y);
    ctx.moveTo(97, 105);
    ctx.lineTo(21, 130);
    ctx.stroke();
  }) });
  const terrain = plaster(0x7d8c8e, { map: texture(512, 512, ctx => {
    ctx.fillStyle = '#484d53';
    ctx.fillRect(0, 0, 512, 512);
    grit(ctx, 512, 512, 12000, 17);
  }), emissive: 0x182731, emissiveIntensity: .45 });
  const box = (material, x, y, z, w, h, d) => boxAt(material, x, y, z, w, h, d, group);

  box(ground, center, -.22, front + 9.6, 128, .32, 19.2);
  box(terrain, (yard.left + yard.right) / 2, -.075, (front + yard.end) / 2, yard.right - yard.left, .15, yard.end - front);
  box(porch, center, -.045, front + .76, 2.55, .085, 1.52);
  for (let i = 0; i < 15; i++) {
    const z = front + 1.92 + i * .77;
    box(stone, center + Math.sin(i * .71) * .075, .005, z, 1.53, .025, .72).rotation.y = (i % 4 - 1.5) * .016;
  }

  // The road follows the ridge. Beyond its far shoulder the terrain drops away.
  const roadZ = yard.end + 2.75;
  const asphalt = muted(0x292e36,0x28303b);
  box(asphalt,center,-.04,roadZ,128,.12,4.4);
  for (let x=-53; x<70; x+=6) box(stone,x,.026,roadZ,2.1,.012,.075);
  const rock = muted(0x293039,0x1a2833);
  box(rock,center,-5.15,front+22.9,128,.6,13).rotation.x=.88;
  for (const [x,z,w] of [[-16,22,5.6],[33,18,6.4],[-43,24,4.8],[57,23,5.3]]) {
    box(fascia,x,1.32,z,w,2.64,4.1);
    for (const side of [-1,1]) {
      box(eaves,x,2.99,z+side*1.14,w+.68,.17,2.49).rotation.x=side*.32;
      box(glass,x+side*w*.31,1.47,z+2.07,.83,.88,.05);
    }
    box(amber,x-w*.31,1.47,z+2.11,.63,.65,.025);
    box(metal,x+.4,.99,z+2.07,.84,1.98,.06);
  }

  // Unlit silhouettes and windows retain their contrast through the night haze.
  const skyline = new T.MeshBasicMaterial({color:0x101c25,fog:false});
  const windows = [0xc89c66,0x7996aa,0xe2c58e].map(color=>new T.MeshBasicMaterial({color,fog:false}));
  for (let row=0;row<3;row++) {
    for (let i=0;i<33;i++) {
      const x=center+(i-16)*3.6+Math.sin(i*7+row)*1.3;
      const z=52+row*8+Math.cos(i)*2;
      const top=-2.9+row*.74+1.5*Math.sin(i*13.7+row*5.4);
      const w=1.4+.65*(1+Math.cos(i*3.4));
      box(skyline,x,top-4,z,w,8,1.5);
      for(let k=0;k<12;k++){
        if(Math.cos(i*6.7+k*5+row)<-.27) continue;
        box(windows[(i+k+row)%3],x+(k%3-1)*w*.28,top-.34-Math.floor(k/3)*.55,z-.76,.17,.16,.03);
      }
    }
  }

  const faceZ = front + .095;
  for (const [x1, x2] of [[house.west, entrance.left], [entrance.right, house.east]]) {
    const mid = (x1 + x2) / 2;
    box(fascia, mid, 1.43, faceZ, x2 - x1, 2.86, .037);
    box(eaves, mid, .15, faceZ + .039, x2 - x1, .28, .093);
    for (const y of [.65, 1.28, 1.91, 2.54]) box(eaves, mid, y, faceZ + .019, x2 - x1, .019, .027);
  }
  box(eaves, (house.west + house.east) / 2, 2.99, front + .08, house.east - house.west + .39, .17, .67);
  box(eaves, center, 2.73, front + .50, 2.63, .14, 1.31).rotation.x = .09;
  for (const x of [3.1, 13.62]) {
    box(eaves, x, 1.67, faceZ + .046, 1.48, 1.12, .13);
    box(glass, x, 1.68, faceZ + .122, 1.29, .91, .045);
    box(eaves, x, 1.68, faceZ + .155, .051, .97, .048);
    box(eaves, x, 1.68, faceZ + .155, 1.34, .048, .048);
    box(porch, x, 1.103, faceZ + .11, 1.60, .085, .23);
  }
  const lampX = entrance.right + .29;
  box(eaves, lampX, 2.15, front + .18, .21, .28, .19);
  box(amber, lampX, 2.15, front + .295, .127, .165, .089);
  const porchLight = light(0xffc475, 12, 5.4, lampX, 2.10, front + .61, group);

  for (const x of [yard.left, yard.right]) {
    box(fence, x, .40, (front + yard.end) / 2, .18, .80, yard.end - front);
    for (const y of [.91, 1.55]) box(metal, x, y, (front + yard.end) / 2, .06, .06, yard.end - front);
    for (let z = front + .32; z < yard.end; z += .63) box(metal, x, 1.20, z, .067, 1, .067);
  }
  for (const [x1, x2] of [[yard.left, center - 1.04], [center + 1.04, yard.right]]) {
    box(fence, (x1 + x2) / 2, .40, yard.end, x2 - x1, .80, .20);
    for (const y of [.91, 1.55]) box(metal, (x1 + x2) / 2, y, yard.end, x2 - x1, .06, .068);
    for (let x = x1 + .15; x < x2; x += .60) box(metal, x, 1.19, yard.end, .064, .98, .075);
  }
  for (const x of [center - 1.04, center + 1.04]) {
    box(fence, x, .94, yard.end, .29, 1.88, .32);
    box(porch, x, 1.89, yard.end, .39, .11, .40);
  }
  for (const y of [.14, 1.00, 1.57]) box(metal, center, y, yard.end, 2.04, .086, .078);
  for (let i = -4; i <= 4; i++) box(metal, center + i * .225, .93, yard.end, .047, 1.78, .074);

  const trees = [[2.73, 18.75, .91], [14.42, 20.45, 1.16], [17.15, 14.48, .58]];
  const branchGeometry = new T.CylinderGeometry(.33, 1, 1, 5);
  const branches = new T.InstancedMesh(branchGeometry, bark, (trees.length + 2) * 12);
  const transform = new T.Object3D();
  const up = new T.Vector3(0, 1, 0), delta = new T.Vector3();
  let branchIndex = 0;
  const limbs = [
    [[0, 0, 0], [.14, 2.75, -.16], .22],
    [[.14, 2.74, -.16], [-.08, 5.02, .03], .118],
    [[.08, 1.93, -.10], [-1.02, 3.31, .11], .121],
    [[-1.02, 3.31, .11], [-1.67, 4.28, .09], .066],
    [[-1.01, 3.30, .11], [-.87, 4.36, .60], .046],
    [[.15, 2.50, -.13], [1.16, 3.69, .43], .087],
    [[1.16, 3.69, .43], [1.82, 4.27, .36], .052],
    [[1.14, 3.68, .43], [1.04, 4.65, .13], .042],
    [[.03, 3.64, -.03], [.71, 4.45, -.87], .067],
    [[.71, 4.45, -.87], [.56, 5.28, -1.28], .036],
    [[-.07, 4.39, .02], [-.61, 5.11, .37], .043],
    [[-.08, 5.02, .03], [.13, 5.65, .08], .032]
  ];
  for (const [x, z, size] of [...trees, [1.50, 30.5, 1.32], [17.43, 31.3, 1.48]]) {
    for (const [a, b, thickness] of limbs) {
      delta.set((b[0] - a[0]) * size, (b[1] - a[1]) * size, (b[2] - a[2]) * size);
      const length = delta.length();
      transform.position.set(x + (a[0] + b[0]) * size / 2, (a[1] + b[1]) * size / 2, z + (a[2] + b[2]) * size / 2);
      transform.quaternion.setFromUnitVectors(up, delta.normalize());
      transform.scale.set(thickness * size, length, thickness * size);
      transform.updateMatrix();
      branches.setMatrixAt(branchIndex++, transform.matrix);
    }
  }
  branches.instanceMatrix.needsUpdate = true;
  branches.computeBoundingSphere();
  group.add(branches);

  const haze = texture(256, 128, ctx => {
    const softEdge = ctx.createRadialGradient(128, 64, 1, 128, 64, 63);
    softEdge.addColorStop(0, '#a4b8d653');
    softEdge.addColorStop(.48, '#849bb631');
    softEdge.addColorStop(1, '#849bb600');
    ctx.translate(128, 0);
    ctx.scale(2, 1);
    ctx.translate(-128, 0);
    ctx.fillStyle = softEdge;
    ctx.fillRect(64, 0, 128, 128);
  });
  const fogMaterial = new T.MeshBasicMaterial({ map: haze, transparent: true, depthWrite: false, side: T.DoubleSide });
  const wisps = [[5.35, 22.2, 13.6], [12, 27.2, 23.2], [9.1, 33.7, 27.0]].map(([x, z, width]) => {
    const mesh = new T.Mesh(new T.PlaneGeometry(width, 1.55), fogMaterial);
    mesh.position.set(x, .91, z);
    group.add(mesh);
    return { mesh, x };
  });
  const moonMap = texture(256, 256, ctx => {
    const halo = ctx.createRadialGradient(128, 128, 12, 128, 128, 126);
    halo.addColorStop(0, '#cbdbefb0');
    halo.addColorStop(.31, '#91add254');
    halo.addColorStop(1, '#839abe00');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#d6e4f2';
    ctx.beginPath();
    ctx.arc(128, 128, 34, 0, Math.PI * 2);
    ctx.fill();
  });
  const moon = new T.Mesh(new T.PlaneGeometry(8, 8), new T.MeshBasicMaterial({
    map: moonMap, transparent: true, depthWrite: false, fog: false, side: T.DoubleSide
  }));
  moon.position.set(13, 10.3, 45);
  group.add(moon);

  return {
    group,
    blocked(x, z) {
      return trees.some(([treeX, treeZ, size]) => Math.hypot(x - treeX, z - treeZ) < radius + .24 * size);
    },
    update(position, now) {
      group.visible = position.z > front + radius ||
        (position.z > front - 2.3 && Math.abs(position.x - center) < 1.96);
      if (!group.visible) return;
      porchLight.intensity = 12 + Math.sin(now * .004) * .7;
      wisps.forEach(({ mesh, x }, i) => { mesh.position.x = x + Math.sin(now * .00035 + i) * .68; });
    }
  };
}
