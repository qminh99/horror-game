export function createDormCharacters(T, scene, { say, onJacketChange = () => {}, onFriendInteract, deskPosition }) {
  const material = (color, roughness = 0.8, extra = {}) =>
    new T.MeshStandardMaterial({ color, roughness, ...extra });
  const navy = material(0x071a3d, 0.58);
  const blue = material(0x0752ad, 0.52);
  const white = material(0xf2f2ed, 0.72);
  const seam = material(0x182746, 0.7);

  function box(parent, mat, x, y, z, w, h, d, rotationZ = 0) {
    const mesh = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.rotation.z = rotationZ;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function makeVnuJacket() {
    const jacket = new T.Group();
    box(jacket, navy, 0, 0, 0, 0.46, 0.56, 0.23);
    // White side panels and the front zipper echo the reference windbreaker.
    for (const side of [-1, 1]) {
      box(jacket, white, side * 0.205, -0.025, -0.01, 0.055, 0.43, 0.235);
      const sleeve = box(jacket, navy, side * 0.29, 0.015, 0, 0.15, 0.48, 0.21, -side * 0.12);
      sleeve.position.x = side * 0.29;
      for (const [offset, mat, width] of [[-0.045, white, 0.025], [0, blue, 0.02], [0.045, white, 0.025]]) {
        const stripe = box(jacket, mat, side * 0.29, 0.015, -0.108, 0.018, 0.47, width, -side * 0.12);
        stripe.position.x += offset;
      }
      box(jacket, seam, side * 0.29, -0.235, -0.002, 0.15, 0.045, 0.214, -side * 0.12);
    }
    box(jacket, seam, 0, 0.275, 0, 0.26, 0.065, 0.24);
    box(jacket, white, 0, -0.275, 0, 0.46, 0.035, 0.23);
    box(jacket, white, 0, 0, -0.119, 0.012, 0.54, 0.008);

    const badge = new T.Group();
    badge.position.set(-0.105, 0.12, -0.126);
    jacket.add(badge);
    const ring = new T.Mesh(new T.TorusGeometry(0.045, 0.004, 6, 24), white);
    badge.add(ring);
    box(badge, white, 0, -0.006, 0, 0.034, 0.004, 0.006);
    box(badge, white, -0.009, 0.007, 0, 0.003, 0.026, 0.006);
    box(badge, white, 0.009, 0.007, 0, 0.003, 0.026, 0.006);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#f2f2ed';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ĐẠI HỌC QUỐC GIA HÀ NỘI', 256, 64);
    const labelTexture = new T.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = T.SRGBColorSpace;
    const label = new T.Mesh(
      new T.PlaneGeometry(0.39, 0.095),
      new T.MeshBasicMaterial({ map: labelTexture, transparent: true, side: T.DoubleSide })
    );
    label.position.set(0, 0.075, 0.117);
    jacket.add(label);
    return jacket;
  }

  const wornJacket = makeVnuJacket();
  wornJacket.position.set(0, 1.18, 0);
  wornJacket.visible = true;

  // Wall-mounted peg and wooden hanger on the clear wall beside the bedroom door.
  const peg = new T.Group();
  peg.position.set(4.45, 1.55, -1.55);
  peg.rotation.y = Math.PI / 2;
  scene.add(peg);
  box(peg, material(0x74513a), 0, 0.13, 0, 0.22, 0.30, 0.045);
  box(peg, material(0xc9a978), 0, 0.31, -0.055, 0.025, 0.12, 0.035);
  const hanger = new T.Group();
  hanger.position.y = 0.25;
  peg.add(hanger);
  const hangerMat = material(0xb88b57, 0.58);
  box(hanger, hangerMat, 0, -0.005, -0.01, 0.36, 0.025, 0.026);
  box(hanger, hangerMat, -0.09, 0.045, -0.01, 0.18, 0.022, 0.026, -0.38);
  box(hanger, hangerMat, 0.09, 0.045, -0.01, 0.18, 0.022, 0.026, 0.38);
  const hook = new T.Mesh(new T.TorusGeometry(0.045, 0.009, 6, 16, Math.PI * 1.35), hangerMat);
  hook.position.set(0, 0.085, -0.01);
  hook.rotation.z = Math.PI * 0.82;
  hanger.add(hook);
  const hungJacket = makeVnuJacket();
  hungJacket.scale.set(0.92, 0.92, 0.92);
  hungJacket.position.set(0, 0, -0.13);
  // Hang it with the university lettering facing into the room.
  hungJacket.rotation.y = Math.PI;
  peg.add(hungJacket);
  hungJacket.visible = false;

  // Huy is seated at the existing gaming desk in the adjoining bedroom.
  const friend = new T.Group();
  friend.position.set(deskPosition.x, 0, deskPosition.z - 0.84);
  friend.rotation.y = Math.PI;
  scene.add(friend);
  let friendTargetYaw = Math.PI;
  const skin = material(0xc99473, 0.82);
  const hair = material(0x121416, 0.9);
  const shirt = material(0x17191a, 0.94);
  const shorts = material(0x777a77, 0.9);
  const slipper = material(0x101112, 0.85);
  const glasses = material(0x181a1c, 0.32, { metalness: 0.35 });
  const face = new T.Mesh(new T.SphereGeometry(0.12, 12, 10), skin);
  face.position.y = 1.57;
  face.scale.set(0.82, 1.08, 0.86);
  friend.add(face);
  const hairCap = new T.Mesh(new T.SphereGeometry(0.13, 12, 8), hair);
  hairCap.position.set(0, 1.64, -0.015);
  hairCap.scale.set(1.06, 0.76, 1.05);
  friend.add(hairCap);
  for (const side of [-1, 1]) {
    box(friend, skin, side * 0.105, 1.56, 0, 0.035, 0.055, 0.04);
    const lens = new T.Mesh(new T.BoxGeometry(0.078, 0.055, 0.012), glasses);
    lens.position.set(side * 0.043, 1.585, 0.099);
    friend.add(lens);
  }
  box(friend, glasses, 0, 1.585, 0.105, 0.02, 0.009, 0.014);
  box(friend, skin, 0, 1.54, 0.101, 0.018, 0.045, 0.025);
  box(friend, shirt, 0, 1.17, 0, 0.43, 0.56, 0.25);
  for (const side of [-1, 1]) {
    box(friend, shirt, side * 0.275, 1.19, 0.02, 0.13, 0.47, 0.18, -side * 0.08);
    // Forearms rest forward on the desktop; forearms and hands are distinct shapes.
    box(friend, skin, side * 0.25, 1.00, -0.28, 0.075, 0.07, 0.40, side * 0.04);
    box(friend, shorts, side * 0.115, 0.73, -0.12, 0.18, 0.20, 0.43);
    box(friend, skin, side * 0.115, 0.52, -0.28, 0.095, 0.28, 0.11);
    box(friend, skin, side * 0.115, 0.13, -0.32, 0.09, 0.12, 0.10);
    box(friend, slipper, side * 0.115, 0.065, -0.34, 0.17, 0.055, 0.24);
  }
  const standingFriend = new T.Group();
  standingFriend.position.set(deskPosition.x, 0, deskPosition.z - 1.22);
  scene.add(standingFriend);
  const standingHead = new T.Mesh(new T.SphereGeometry(0.12, 12, 10), skin);
  standingHead.position.y = 1.57;
  standingHead.scale.set(0.82, 1.08, 0.86);
  standingFriend.add(standingHead);
  const standingHair = new T.Mesh(new T.SphereGeometry(0.13, 12, 8), hair);
  standingHair.position.set(0, 1.64, 0.015);
  standingHair.scale.set(1.06, 0.76, 1.05);
  standingFriend.add(standingHair);
  for (const side of [-1, 1]) {
    box(standingFriend, skin, side * 0.105, 1.56, 0, 0.035, 0.055, 0.04);
    box(standingFriend, glasses, side * 0.043, 1.585, -0.099, 0.078, 0.055, 0.012);
    box(standingFriend, shirt, side * 0.275, 1.18, 0, 0.13, 0.47, 0.18, -side * 0.08);
    box(standingFriend, skin, side * 0.29, 0.91, 0, 0.09, 0.12, 0.10);
    box(standingFriend, shorts, side * 0.115, 0.78, 0, 0.18, 0.25, 0.22);
    box(standingFriend, skin, side * 0.115, 0.40, 0, 0.10, 0.52, 0.12);
    box(standingFriend, slipper, side * 0.115, 0.065, -0.02, 0.17, 0.055, 0.24);
  }
  box(standingFriend, glasses, 0, 1.585, -0.105, 0.02, 0.009, 0.014);
  box(standingFriend, skin, 0, 1.54, -0.101, 0.018, 0.045, 0.025);
  box(standingFriend, shirt, 0, 1.17, 0, 0.43, 0.56, 0.25);
  standingFriend.visible = false;
  const friendTarget = {
    name: 'Huy, bạn cùng khóa',
    pos: new T.Vector3(deskPosition.x, 1.45, deskPosition.z - 0.72),
    use() {
      friendTargetYaw = 0;
      friend.visible = false;
      standingFriend.visible = true;
      onFriendInteract();
    }
  };

  let jacketWorn = true;
  const jacketTarget = {
    name: 'Móc áo khoác VNU',
    pos: new T.Vector3(4.08, 1.63, -1.55),
    use() {
      jacketWorn = !jacketWorn;
      wornJacket.visible = jacketWorn;
      hungJacket.visible = !jacketWorn;
      onJacketChange(jacketWorn);
      say(jacketWorn
        ? 'Minh mặc lại áo khoác xanh VNU, vuốt phẳng hai tay áo rồi nhìn về phía Huy.'
        : 'Minh cởi áo khoác VNU và treo lên chiếc móc gỗ cạnh cửa. Áo xanh navy, sọc tay trắng-xanh-trắng và dòng chữ Đại học Quốc gia Hà Nội quay ra phòng.');
    }
  };

  return {
    targets: [friendTarget, jacketTarget],
    blockers: [],
    setJacketWorn(value) {
      jacketWorn = Boolean(value);
      wornJacket.visible = jacketWorn;
      hungJacket.visible = !jacketWorn;
    },
    isJacketWorn: () => jacketWorn,
    update(dt) { friend.rotation.y = T.MathUtils.damp(friend.rotation.y, friendTargetYaw, 5, dt); },
    returnToDesk() {
      friendTargetYaw = Math.PI;
      friend.visible = true;
      standingFriend.visible = false;
    }
  };
}
