// A separate first-person pass keeps the arms out of mirrors and security feeds.
export function createPlayerHands(T) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(62, 1, 0.02, 3);
  const fill = new T.HemisphereLight(0xffe4c8, 0x384052, 1);
  const key = new T.DirectionalLight(0xffe0c5, 1);
  key.position.set(-2, 3, 1);
  scene.add(fill, key);

  const material = color => new T.MeshStandardMaterial({ color, roughness: 0.9 });
  const skin = material(0xc38b69);
  const cloth = material(0x23334d);
  const ribbing = material(0x415268);
  const rounded = new T.SphereGeometry(1, 12, 10);
  function oval(parent, surface, x, y, z, w, h, d) {
    const mesh = new T.Mesh(rounded, surface);
    mesh.position.set(x, y, z);
    mesh.scale.set(w, h, d);
    parent.add(mesh);
    return mesh;
  }

  function arm(side) {
    const wrist = new T.Group();
    scene.add(wrist);
    const forearm = oval(wrist, skin, 0, -0.015, 0.17, 0.043, 0.041, 0.22);
    const sleeve = oval(wrist, cloth, 0, -0.015, 0.18, 0.054, 0.051, 0.22);
    const cuff = oval(wrist, ribbing, 0, 0, 0.012, 0.043, 0.039, 0.026);
    oval(wrist, skin, 0, 0, -0.048, 0.046, 0.026, 0.068);
    const fingers = [0.072, 0.080, 0.073, 0.055].map((length, i) => {
      const joint = new T.Group();
      joint.position.set(side * (i - 1.5) * 0.020, 0, -0.092 + Math.abs(i - 1) * 0.004);
      wrist.add(joint);
      oval(joint, skin, 0, 0, -length / 2, 0.0105, 0.012, length * 0.55);
      return joint;
    });
    const thumb = oval(wrist, skin, -side * 0.042, -0.008, -0.061, 0.016, 0.017, 0.042);
    thumb.rotation.y = side * 0.48;
    return { side, wrist, forearm, sleeve, cuff, fingers };
  }
  const arms = [arm(-1), arm(1)];
  const aim = new T.Vector3();
  let phase = 0, gait = 0, reachStart = -Infinity;
  return {
    reach(position, view) {
      aim.set(0, 0, 0);
      if (position) {
        view.updateMatrixWorld();
        aim.copy(position).project(view);
      }
      reachStart = performance.now();
    },
    update(dt, distance, aspect, jacket, brightness) {
      if (camera.aspect !== aspect) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
      phase += distance * 3.7;
      gait = T.MathUtils.damp(gait, dt ? distance / dt / 2.65 : 0, 10, dt);
      const elapsed = Math.min(1, (performance.now() - reachStart) / 520);
      const pulse = Math.pow(Math.sin(Math.PI * elapsed), 2);
      fill.intensity = brightness * 0.85;
      key.intensity = brightness * 1.15;
      const width = Math.min(aspect, 1.8);
      for (const {side, wrist, forearm, sleeve, cuff, fingers} of arms) {
        const reach = side === 1 ? pulse : 0;
        const swing = side * Math.sin(phase) * gait * (1 - reach);
        const restX = side * 0.192 * width;
        const targetX = T.MathUtils.clamp(aim.x, -0.65, 0.65) * width * 0.34;
        wrist.position.set(
          T.MathUtils.lerp(restX, targetX, reach * 0.8),
          -0.256 + swing * 0.019 + reach * (0.19 + T.MathUtils.clamp(aim.y, -0.65, 0.65) * 0.15),
          -0.42 - swing * 0.032 - reach * 0.16
        );
        wrist.rotation.set(0.46 - swing * 0.09 - reach * 0.27, side * (0.30 + reach * 0.12), side * 0.46);
        for (const finger of fingers) finger.rotation.x = -0.68 + reach * 0.59;
        sleeve.visible = cuff.visible = jacket;
        forearm.visible = !jacket;
      }
    },
    render(renderer) {
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.autoClear = true;
    }
  };
}
