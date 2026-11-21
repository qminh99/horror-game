export function createBathroom({ T, scene, renderer, camera, targets, blockers, say, standEyeY }) {
  // Tọa độ khu nhà vệ sinh: nằm phía Bắc hành lang, sát vách Tây của phòng ngủ đối diện (x = 11.12)
  // Không gian bên trong: x từ 7.20 -> 11.04, z từ -2.75 -> 0.34, cửa mở ra hành lang tại x = 8.00
  const bathGroup = new T.Group();
  scene.add(bathGroup);

  const M = (c, r = 0.8, m = 0, e = {}) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...e });
  const wallMat = M(0xd7e1df, 0.82);
  const darkTile = M(0x4b585b, 0.45, 0.1);
  const floorTile = M(0xc8d2d1, 0.35, 0.05);
  const ceramic = M(0xf4f6f5, 0.18, 0.05);
  const chrome = M(0xd8e0e2, 0.15, 0.9);
  const pvcPipe = M(0x5b6467, 0.55, 0.15);
  const cabinetWood = M(0x6b4e3d, 0.5);

  function box(m, x, y, z, w, h, d, parent = bathGroup) {
    const o = new T.Mesh(new T.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }

  function cyl(m, x, y, z, r1, r2, h, seg = 16, parent = bathGroup) {
    const o = new T.Mesh(new T.CylinderGeometry(r1, r2, h, seg), m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }

  // 1. Sàn gạch, trần, tường bao & gạch ốp chân tường
  box(floorTile, 9.12, -0.125, -1.205, 3.84, 0.25, 3.09);
  for (let gx = 7.4; gx <= 10.9; gx += 0.45) box(M(0x8e9998), gx, 0.003, -1.20, 0.01, 0.006, 2.95);
  for (let gz = -2.6; gz <= 0.2; gz += 0.45) box(M(0x8e9998), 9.12, 0.003, gz, 3.70, 0.006, 0.01);

  box(wallMat, 7.16, 1.56, -1.205, 0.14, 3.12, 3.16);   // Tường Tây
  box(wallMat, 9.12, 1.56, -2.76, 3.98, 3.12, 0.16);    // Tường Bắc (sau lavabo & bồn cầu)
  box(M(0xe4e8e6), 9.12, 3.18, -1.205, 3.98, 0.14, 3.16); // Trần nhà vệ sinh
  box(darkTile, 9.12, 0.55, -2.675, 3.80, 1.10, 0.02);  // Viền gạch ốp tường Bắc
  box(darkTile, 7.235, 0.55, -1.205, 0.02, 1.10, 2.96); // Viền gạch ốp tường Tây
  box(darkTile, 11.03, 0.55, -1.205, 0.02, 1.10, 2.96); // Viền gạch ốp tường Đông (giáp phòng ngủ)

  // Đèn trần nhà vệ sinh & công tắc
  let bathLightOn = true;
  const bathLampMat = M(0xeef9ff, 0.2, 0, { emissive: 0xdff4ff, emissiveIntensity: 1.3 });
  cyl(M(0x283234), 9.12, 3.09, -1.20, 0.22, 0.24, 0.05, 24);
  cyl(bathLampMat, 9.12, 3.05, -1.20, 0.18, 0.18, 0.03, 24);
  const bathLight = new T.PointLight(0xe4f3f8, 18, 6.8, 1.7);
  bathLight.position.set(9.12, 2.88, -1.20);
  bathGroup.add(bathLight);

  const bathSwitch = new T.Group();
  bathSwitch.position.set(7.36, 1.22, 0.25);
  bathGroup.add(bathSwitch);
  box(M(0xf2f4f3), 0, 0, 0, 0.14, 0.22, 0.03, bathSwitch);
  const bathRocker = box(M(0xffffff, 0.2), 0, 0, -0.02, 0.05, 0.08, 0.02, bathSwitch);
  bathRocker.rotation.x = 0.22;

  // Cửa nhà vệ sinh (bản lề bên phải x = 8.46, mở vào trong)
  const doorWidth = 0.92, doorDepth = 0.08, playerRadius = 0.22;
  let bathDoorTarget = 0, bathDoorAngle = 0;
  const bathDoor = new T.Group();
  bathDoor.position.set(8.46, 0, 0.34);
  bathGroup.add(bathDoor);
  box(M(0x7a5c48, 0.5), -doorWidth / 2, 1.20, 0, doorWidth, 2.40, 0.07, bathDoor);
  box(M(0x9fc5ce, 0.25, 0.1, { transparent: true, opacity: 0.55 }), -0.46, 1.88, 0, 0.54, 0.52, 0.08, bathDoor);
  const handleKnob1 = new T.Mesh(new T.SphereGeometry(0.042, 12, 10), chrome);
  handleKnob1.position.set(-0.80, 1.02, 0.06);
  bathDoor.add(handleKnob1);
  const handleKnob2 = handleKnob1.clone();
  handleKnob2.position.z = -0.06;
  bathDoor.add(handleKnob2);

  // 2. BỒN CẦU (góc Tây-Bắc: x = 7.56, z = -2.30)
  const toiletX = 7.56, toiletZ = -2.30;
  cyl(ceramic, toiletX, 0.20, toiletZ + 0.05, 0.15, 0.19, 0.40, 20); // Chân đế
  const bowlOuter = cyl(ceramic, toiletX, 0.42, toiletZ + 0.08, 0.22, 0.17, 0.16, 22);
  bowlOuter.scale.set(0.92, 1, 1.22);
  const toiletWater = cyl(M(0x78bdd1, 0.1, 0.1, { transparent: true, opacity: 0.75 }), toiletX, 0.43, toiletZ + 0.08, 0.14, 0.11, 0.02, 18);
  const seatRing = new T.Mesh(new T.TorusGeometry(0.17, 0.032, 10, 24), ceramic);
  seatRing.rotation.x = Math.PI / 2;
  seatRing.scale.set(0.92, 1.20, 1);
  seatRing.position.set(toiletX, 0.505, toiletZ + 0.08);
  bathGroup.add(seatRing);
  box(ceramic, toiletX, 0.72, toiletZ - 0.25, 0.42, 0.44, 0.20); // Két nước
  box(ceramic, toiletX, 0.955, toiletZ - 0.25, 0.45, 0.035, 0.22); // Nắp két nước
  const flushBtn = cyl(chrome, toiletX, 0.985, toiletZ - 0.25, 0.026, 0.026, 0.025, 14);
  let flushTimer = 0;

  // 3. CHỖ RỬA TAY LAVABO (giữa tường Bắc: x = 8.48, z = -2.42)
  const sinkX = 8.48, sinkZ = -2.42;
  box(cabinetWood, sinkX, 0.41, sinkZ, 0.86, 0.82, 0.50); // Tủ dưới lavabo
  box(M(0x4f382b), sinkX - 0.21, 0.42, sinkZ + 0.255, 0.40, 0.74, 0.02);
  box(M(0x4f382b), sinkX + 0.21, 0.42, sinkZ + 0.255, 0.40, 0.74, 0.02);
  box(ceramic, sinkX, 0.85, sinkZ, 0.92, 0.07, 0.54); // Mặt bàn sứ
  // Lòng chậu rửa & lỗ thoát nước
  const basinInner = cyl(M(0xdce3e2, 0.22), sinkX, 0.875, sinkZ + 0.03, 0.25, 0.16, 0.05, 24);
  basinInner.scale.set(1.35, 1, 0.88);
  cyl(M(0x1b2224), sinkX, 0.892, sinkZ + 0.03, 0.032, 0.032, 0.02, 16);
  // Vòi nước lavabo + tia nước
  cyl(chrome, sinkX, 0.96, sinkZ - 0.18, 0.022, 0.026, 0.16, 14);
  const spout = cyl(chrome, sinkX, 1.03, sinkZ - 0.10, 0.015, 0.015, 0.18, 12);
  spout.rotation.x = Math.PI / 2.4;
  cyl(chrome, sinkX - 0.11, 0.91, sinkZ - 0.18, 0.018, 0.02, 0.05, 12);
  cyl(chrome, sinkX + 0.11, 0.91, sinkZ - 0.18, 0.018, 0.02, 0.05, 12);

  let sinkWaterOn = false;
  const sinkWaterStream = cyl(
    M(0x9ce3f5, 0.1, 0.1, { transparent: true, opacity: 0.65 }),
    sinkX, 0.95, sinkZ - 0.02, 0.011, 0.016, 0.14, 12
  );
  sinkWaterStream.visible = false;

  // 4. GƯƠNG SOI TƯƠNG TÁC NGAY TRÊN LAVABO (thấy phản chiếu bản thân)
  const mirrorX = sinkX, mirrorY = 1.58, mirrorZ = -2.665;
  box(M(0x232b2d, 0.35, 0.6), mirrorX, mirrorY, mirrorZ - 0.01, 0.86, 0.96, 0.025); // Khung gương
  // Đèn rọi gương phía trên
  const mirrorLampMat = M(0xfff5dc, 0.2, 0, { emissive: 0xffe4a8, emissiveIntensity: 1.1 });
  box(mirrorLampMat, mirrorX, mirrorY + 0.52, mirrorZ + 0.03, 0.64, 0.03, 0.06);

  const mirrorRT = new T.WebGLRenderTarget(512, 512, { minFilter: T.LinearFilter, magFilter: T.LinearFilter });
  const mirrorMat = new T.MeshBasicMaterial({ map: mirrorRT.texture, side: T.DoubleSide });
  const mirrorPlane = new T.Mesh(new T.PlaneGeometry(0.78, 0.88), mirrorMat);
  mirrorPlane.position.set(mirrorX, mirrorY, mirrorZ + 0.005);
  mirrorPlane.scale.x = -1; // Lật ngang để phản chiếu đúng chiều trái/phải như gương thật
  bathGroup.add(mirrorPlane);

  // Camera ảo đặt sau mặt gương nhìn ra phòng tắm
  const mirrorCam = new T.PerspectiveCamera(54, 0.78 / 0.88, 0.12, 16);
  mirrorCam.position.set(mirrorX, mirrorY, mirrorZ - 0.02);
  mirrorCam.lookAt(mirrorX, mirrorY - 0.08, -1.20);
  mirrorCam.layers.enable(0);
  mirrorCam.layers.enable(1); // Hiển thị cả model nhân vật của người chơi (Layer 1)

  // Tạo hình hài nhân vật người chơi (Layer 1: chỉ hiện trong gương, không che mắt camera chính)
  const playerAvatar = new T.Group();
  scene.add(playerAvatar);

  function addAvatarPart(geo, mat, x, y, z, parent = playerAvatar) {
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.layers.set(1);
    parent.add(mesh);
    return mesh;
  }

  const shirtMat = M(0x283b42, 0.75);
  const skinMat = M(0xe6bfa0, 0.65);
  const hairMat = M(0x1b1e24, 0.8);
  const eyeMat = M(0x111518, 0.2);

  // Thân áo & vai
  addAvatarPart(new T.BoxGeometry(0.42, 0.54, 0.22), shirtMat, 0, 1.18, 0.02);
  addAvatarPart(new T.CylinderGeometry(0.065, 0.075, 0.12, 14), skinMat, 0, 1.49, 0.01);

  // Cụm đầu xoay theo góc nhìn (pitch)
  const avatarHead = new T.Group();
  avatarHead.position.set(0, 1.62, 0);
  avatarHead.layers.set(1);
  playerAvatar.add(avatarHead);

  addAvatarPart(new T.SphereGeometry(0.115, 20, 16), skinMat, 0, 0, 0, avatarHead);
  // Tóc mái & sau đầu
  const hairCap = addAvatarPart(new T.SphereGeometry(0.122, 20, 16), hairMat, 0, 0.025, 0.018, avatarHead);
  hairCap.scale.set(1.02, 1.05, 1.05);
  addAvatarPart(new T.BoxGeometry(0.18, 0.045, 0.08), hairMat, 0, 0.085, -0.075, avatarHead);
  // Mắt & lông mày (hướng về -Z để khi đứng trước gương mặt hướng thẳng vào gương)
  addAvatarPart(new T.SphereGeometry(0.013, 10, 8), eyeMat, -0.038, 0.01, -0.108, avatarHead);
  addAvatarPart(new T.SphereGeometry(0.013, 10, 8), eyeMat, 0.038, 0.01, -0.108, avatarHead);
  addAvatarPart(new T.BoxGeometry(0.032, 0.008, 0.01), hairMat, -0.038, 0.032, -0.11, avatarHead);
  addAvatarPart(new T.BoxGeometry(0.032, 0.008, 0.01), hairMat, 0.038, 0.032, -0.11, avatarHead);

  // 5. VÒI TẮM HOA SEN & VÁCH KÍNH (góc Đông-Bắc: x = 10.30, z = -2.15)
  const showerX = 10.30, showerZ = -2.15;
  // Vách kính ngăn khu tắm
  const glassMat = M(0x9fd0dc, 0.1, 0.1, { transparent: true, opacity: 0.28 });
  box(glassMat, 9.60, 1.15, -2.15, 0.025, 2.25, 1.08);
  box(chrome, 9.60, 2.27, -2.15, 0.04, 0.03, 1.10);

  // Ống dẫn sen đứng, bát sen trên cao & cụm van gật gù
  cyl(chrome, showerX, 1.62, -2.62, 0.016, 0.016, 1.35, 12);
  const showerArm = cyl(chrome, showerX, 2.28, -2.44, 0.015, 0.015, 0.36, 12);
  showerArm.rotation.x = Math.PI / 2;
  cyl(chrome, showerX, 2.23, -2.28, 0.03, 0.11, 0.04, 20); // Bát sen hoa sen
  box(chrome, showerX, 1.12, -2.62, 0.22, 0.08, 0.07);      // Cụm van chỉnh nước
  cyl(chrome, showerX, 1.12, -2.56, 0.014, 0.014, 0.08, 10).rotation.x = Math.PI / 2;

  // Hiệu ứng hạt nước rơi khi bật vòi tắm
  let showerOn = false;
  const drops = [];
  const dropMat = M(0xb8ecfa, 0.1, 0.1, { transparent: true, opacity: 0.65 });
  const dropGeo = new T.CylinderGeometry(0.004, 0.004, 0.14, 6);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 4;
    const r = 0.02 + (i % 5) * 0.024;
    const d = new T.Mesh(dropGeo, dropMat);
    d.position.set(showerX + Math.cos(a) * r, 0.2 + (i % 7) * 0.28, -2.28 + Math.sin(a) * r);
    d.visible = false;
    bathGroup.add(d);
    drops.push(d);
  }

  // 6. ỐNG CỐNG (Nắp cống thoát nước sàn dưới khu tắm + Đường ống cống đứng góc tường + Xi-phông lavabo)
  // 6a. Nắp cống thoát nước trên sàn ngay dưới vòi sen
  cyl(M(0x161b1c), showerX, 0.004, -2.22, 0.11, 0.11, 0.008, 24);
  cyl(chrome, showerX, 0.007, -2.22, 0.115, 0.115, 0.006, 24);
  for (let s = -0.06; s <= 0.06; s += 0.03) {
    box(M(0x101415), showerX + s, 0.011, -2.22, 0.012, 0.005, 0.15);
  }
  // 6b. Đường ống cống thoát nước đứng chạy dọc góc tường Đông-Bắc
  cyl(pvcPipe, 10.88, 1.56, -2.58, 0.068, 0.068, 3.12, 18);
  for (let by of [0.65, 1.65, 2.65]) {
    box(M(0x2c3335), 10.93, by, -2.62, 0.16, 0.04, 0.14);
  }
  // 6c. Ống cống thoát nước chữ P dưới bồn rửa tay
  cyl(pvcPipe, sinkX, 0.42, sinkZ - 0.12, 0.032, 0.032, 0.84, 14);

  // 7. CÁC MỤC TIÊU TƯƠNG TÁC (targets)
  let mirrorFocus = false;
  const savedMirrorReturn = { pos: new T.Vector3(), yaw: 0, pitch: 0 };

  function exitMirrorFocus(silent = false) {
    if (!mirrorFocus) return;
    mirrorFocus = false;
    camera.position.copy(savedMirrorReturn.pos);
    if (!silent) say('Bạn đã rời khỏi gương soi.');
    return { yaw: savedMirrorReturn.yaw, pitch: savedMirrorReturn.pitch };
  }

  targets.push(
    {
      name: 'Cửa nhà vệ sinh',
      pos: new T.Vector3(8.00, 1.20, 0.34),
      use() {
        bathDoorTarget = bathDoorTarget === 0 ? -1.35 : 0;
        say(bathDoorTarget < 0 ? 'Đang mở cửa nhà vệ sinh.' : 'Đang đóng cửa nhà vệ sinh.');
      }
    },
    {
      name: 'Công tắc đèn nhà vệ sinh',
      pos: new T.Vector3(7.38, 1.22, 0.24),
      use() {
        bathLightOn = !bathLightOn;
        bathLight.intensity = bathLightOn ? 18 : 0;
        bathLampMat.emissiveIntensity = bathLightOn ? 1.3 : 0.02;
        mirrorLampMat.emissiveIntensity = bathLightOn ? 1.1 : 0.02;
        bathRocker.rotation.x = bathLightOn ? 0.22 : -0.22;
        say(bathLightOn ? 'Đã bật đèn nhà vệ sinh.' : 'Đã tắt đèn nhà vệ sinh.');
      }
    },
    {
      name: 'Gương soi',
      pos: new T.Vector3(mirrorX, mirrorY, mirrorZ + 0.04),
      use() {
        if (!mirrorFocus) {
          savedMirrorReturn.pos.copy(camera.position);
          mirrorFocus = true;
          say('Bạn đang soi gương... Nhấn Space hoặc E để rời gương.');
          return { setAngles: { yaw: 0, pitch: -0.02 } };
        } else {
          return exitMirrorFocus();
        }
      }
    },
    {
      name: 'Vòi rửa tay lavabo',
      pos: new T.Vector3(sinkX, 0.96, sinkZ - 0.12),
      use() {
        sinkWaterOn = !sinkWaterOn;
        sinkWaterStream.visible = sinkWaterOn;
        say(sinkWaterOn ? 'Nước từ vòi lavabo chảy xuống ống thoát.' : 'Đã khóa vòi rửa tay.');
      }
    },
    {
      name: 'Bồn cầu',
      pos: new T.Vector3(toiletX, 0.65, toiletZ),
      use() {
        flushTimer = 1.6;
        say('Tiếng nước xả bồn cầu vang lên trong phòng tắm...');
      }
    },
    {
      name: 'Vòi tắm hoa sen',
      pos: new T.Vector3(showerX, 1.25, -2.55),
      use() {
        showerOn = !showerOn;
        drops.forEach(d => (d.visible = showerOn));
        say(showerOn ? 'Vòi hoa sen phun nước xuống nắp cống sàn.' : 'Đã tắt vòi tắm hoa sen.');
      }
    }
  );

  // Vật cản va chạm bên trong nhà vệ sinh
  blockers.push(
    [toiletX, toiletZ, 0.50, 0.68],   // Bồn cầu
    [sinkX, sinkZ, 0.90, 0.54],       // Lavabo
    [9.60, -2.15, 0.12, 1.08],        // Vách kính phòng tắm
    [10.88, -2.58, 0.22, 0.22]        // Ống cống góc tường
  );

  function blocksDoor(x, z, angle = bathDoorAngle) {
    const dx = x - bathDoor.position.x, dz = z - bathDoor.position.z;
    const reach = doorWidth + playerRadius;
    if (Math.abs(dx) > reach || Math.abs(dz) > reach) return false;

    // Đưa tâm người chơi vào hệ tọa độ của cánh cửa đang xoay.
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const localX = cos * dx - sin * dz;
    const localZ = sin * dx + cos * dz;
    const nearestX = T.MathUtils.clamp(localX, -doorWidth, 0);
    const nearestZ = T.MathUtils.clamp(localZ, -doorDepth / 2, doorDepth / 2);
    return (localX - nearestX) ** 2 + (localZ - nearestZ) ** 2 < playerRadius ** 2;
  }

  function isBlocked(x, z) {
    // Vùng ngưỡng cửa giữa hành lang và nhà vệ sinh (z từ 0.12 -> 0.46)
    if (z >= 0.12 && z <= 0.46) {
      return x < 7.66 || x > 8.34; // Tường hai bên khung cửa
    }
    // Tường bao trong nhà vệ sinh
    if (x < 7.42 || x > 10.82 || z < -2.42) return true;
    return false;
  }

  function update(dt, started, yaw, pitch) {
    const nextDoorAngle = T.MathUtils.damp(bathDoorAngle, bathDoorTarget, 4.5, dt);
    if (!blocksDoor(camera.position.x, camera.position.z, nextDoorAngle)) {
      bathDoorAngle = nextDoorAngle;
    }
    bathDoor.rotation.y = bathDoorAngle;

    // Hiệu ứng nước chảy lavabo, vòi sen và xả bồn cầu
    if (sinkWaterOn) {
      sinkWaterStream.scale.x = 0.9 + Math.sin(performance.now() * 0.03) * 0.2;
      sinkWaterStream.scale.z = sinkWaterStream.scale.x;
    }
    if (showerOn) {
      for (const d of drops) {
        d.position.y -= dt * 3.4;
        if (d.position.y < 0.06) d.position.y = 2.18;
      }
    }
    if (flushTimer > 0) {
      flushTimer -= dt;
      flushBtn.position.y = 0.975;
      toiletWater.rotation.y += dt * 10;
    } else {
      flushBtn.position.y = 0.985;
    }

    // Cập nhật vị trí nhân vật ảo & camera khi soi gương
    playerAvatar.position.set(camera.position.x, camera.position.y - standEyeY, camera.position.z);
    playerAvatar.rotation.y = yaw;
    avatarHead.rotation.x = T.MathUtils.clamp(pitch * 0.65, -0.45, 0.45);

    if (mirrorFocus) {
      camera.position.x = T.MathUtils.damp(camera.position.x, mirrorX, 10, dt);
      camera.position.y = T.MathUtils.damp(camera.position.y, 1.56, 10, dt);
      camera.position.z = T.MathUtils.damp(camera.position.z, -1.78, 10, dt);
    }

    // Chỉ render camera gương khi người chơi ở gần hoặc bên trong nhà vệ sinh để giữ FPS cao
    if (started && camera.position.x > 6.5 && camera.position.x < 11.4 && camera.position.z < 1.2) {
      const prevTarget = renderer.getRenderTarget();
      const prevShadowAuto = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      renderer.setRenderTarget(mirrorRT);
      renderer.clear();
      renderer.render(scene, mirrorCam);
      renderer.setRenderTarget(prevTarget);
      renderer.shadowMap.autoUpdate = prevShadowAuto;
    }
  }

  return {
    get doorOpen(){ return Math.abs(bathDoorAngle)>.5; },
    isBlocked,
    blocksDoor,
    update,
    isMirrorFocus: () => mirrorFocus,
    exitMirrorFocus,
    syncAnglesFrom(curYaw, curPitch) {
      savedMirrorReturn.yaw = curYaw;
      savedMirrorReturn.pitch = curPitch;
    }
  };
}
