import * as THREE from 'three';
import './styles.css';

const canvas = document.querySelector('#game-canvas');
const fuelBar = document.querySelector('#fuelBar');
const fuelText = document.querySelector('#fuelText');
const fireflyText = document.querySelector('#fireflyText');
const requiredFireflies = document.querySelector('#requiredFireflies');
const objectiveText = document.querySelector('#objectiveText');
const startScreen = document.querySelector('#startScreen');
const endScreen = document.querySelector('#endScreen');
const endTitle = document.querySelector('#endTitle');
const endMessage = document.querySelector('#endMessage');
const endEyebrow = document.querySelector('#endEyebrow');
const startButton = document.querySelector('#startButton');
const restartButton = document.querySelector('#restartButton');
const joystickBase = document.querySelector('#joystickBase');
const joystickKnob = document.querySelector('#joystickKnob');
const blastButton = document.querySelector('#blastButton');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07100d);
scene.fog = new THREE.FogExp2(0x07100d, 0.023);

const camera = new THREE.PerspectiveCamera(74, window.innerWidth / window.innerHeight, 0.1, 220);
const player = new THREE.Object3D();
player.position.set(0, 1.65, 28);
scene.add(player);
player.add(camera);

const lanternLight = new THREE.PointLight(0xffc76a, 2.1, 25, 1.4);
lanternLight.position.set(0.3, -0.15, -0.55);
player.add(lanternLight);

const lanternGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.11, 10, 8),
  new THREE.MeshBasicMaterial({ color: 0xffd166 })
);
lanternGlow.position.copy(lanternLight.position);
player.add(lanternGlow);

const moon = new THREE.DirectionalLight(0xb9d1ff, 1.15);
moon.position.set(-18, 32, 18);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
scene.add(moon);

scene.add(new THREE.HemisphereLight(0x6c9cff, 0x16140e, 0.65));

const materials = {
  grass: new THREE.MeshStandardMaterial({ color: 0x23401f, roughness: 0.95, flatShading: true }),
  path: new THREE.MeshStandardMaterial({ color: 0x66513a, roughness: 0.9, flatShading: true }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a3422, roughness: 0.95, flatShading: true }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x1f5f32, roughness: 0.95, flatShading: true }),
  rock: new THREE.MeshStandardMaterial({ color: 0x717466, roughness: 0.96, flatShading: true }),
  shrine: new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.75, emissive: 0x392000, flatShading: true }),
  shrineStone: new THREE.MeshStandardMaterial({ color: 0x8b8068, roughness: 0.92, flatShading: true }),
  shadow: new THREE.MeshStandardMaterial({ color: 0x030504, roughness: 1, flatShading: true }),
  eye: new THREE.MeshBasicMaterial({ color: 0xff6542 }),
  firefly: new THREE.MeshStandardMaterial({ color: 0xffed99, emissive: 0xffd166, emissiveIntensity: 2.4, flatShading: true })
};

const world = new THREE.Group();
scene.add(world);

const state = {
  started: false,
  won: false,
  gameOver: false,
  fuel: 100,
  fireflies: 0,
  required: 7,
  blastCooldown: 0,
  messageTimer: 0,
  message: 'Collect fireflies, avoid the shadow, and reach the shrine.'
};

requiredFireflies.textContent = state.required;

let yaw = 0;
let pitch = 0;
const keys = new Set();
const clock = new THREE.Clock();
const fireflies = [];
let enemy;
let shrine;

const joystick = {
  active: false,
  id: null,
  x: 0,
  y: 0
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createTerrain() {
  const groundGeometry = new THREE.PlaneGeometry(150, 150, 34, 34);
  groundGeometry.rotateX(-Math.PI / 2);

  const positions = groundGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = Math.sin(x * 0.17) * 0.18 + Math.cos(z * 0.13) * 0.18 + Math.sin((x + z) * 0.05) * 0.16;
    positions.setY(i, height);
  }
  groundGeometry.computeVertexNormals();

  const ground = new THREE.Mesh(groundGeometry, materials.grass);
  ground.receiveShadow = true;
  world.add(ground);

  const path = new THREE.Mesh(new THREE.PlaneGeometry(10, 95, 4, 20), materials.path);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.045, -9);
  path.receiveShadow = true;
  world.add(path);
}

function createTree(x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * scale, 0.26 * scale, 1.5 * scale, 5), materials.trunk);
  trunk.position.y = 0.75 * scale;
  trunk.castShadow = true;
  trunk.receiveShadow = true;

  const leavesA = new THREE.Mesh(new THREE.ConeGeometry(0.95 * scale, 1.65 * scale, 6), materials.leaf);
  leavesA.position.y = 1.85 * scale;
  leavesA.castShadow = true;

  const leavesB = new THREE.Mesh(new THREE.ConeGeometry(0.72 * scale, 1.25 * scale, 6), materials.leaf);
  leavesB.position.y = 2.55 * scale;
  leavesB.castShadow = true;

  tree.add(trunk, leavesA, leavesB);
  tree.position.set(x, 0, z);
  tree.rotation.y = randomBetween(0, Math.PI * 2);
  world.add(tree);
}

function createRock(x, z, scale = 1) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), materials.rock);
  rock.position.set(x, scale * 0.42, z);
  rock.rotation.set(randomBetween(-0.15, 0.15), randomBetween(0, Math.PI), randomBetween(-0.12, 0.12));
  rock.scale.y = randomBetween(0.45, 0.85);
  rock.castShadow = true;
  rock.receiveShadow = true;
  world.add(rock);
}

function createFirefly(x, z) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), materials.firefly);
  const light = new THREE.PointLight(0xffdf79, 0.75, 8, 1.8);
  body.castShadow = true;
  group.add(body, light);
  group.position.set(x, 1.25, z);
  group.userData.baseY = 1.25;
  group.userData.active = true;
  group.userData.phase = Math.random() * Math.PI * 2;
  fireflies.push(group);
  world.add(group);
}

function createShrine() {
  shrine = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 4.4, 0.45, 8), materials.shrineStone);
  base.position.y = 0.22;
  base.castShadow = true;
  base.receiveShadow = true;

  const pillarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4, 0.45), materials.shrine);
  pillarLeft.position.set(-1.7, 2.1, 0);
  pillarLeft.castShadow = true;

  const pillarRight = pillarLeft.clone();
  pillarRight.position.x = 1.7;

  const beamTop = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.42, 0.62), materials.shrine);
  beamTop.position.set(0, 4.05, 0);
  beamTop.castShadow = true;

  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), materials.firefly);
  crystal.position.set(0, 2.05, 0);
  crystal.castShadow = true;

  const shrineLight = new THREE.PointLight(0xffd166, 2.8, 26, 1.35);
  shrineLight.position.set(0, 2.7, 0);

  shrine.add(base, pillarLeft, pillarRight, beamTop, crystal, shrineLight);
  shrine.position.set(0, 0, -56);
  world.add(shrine);
}

function createEnemy() {
  enemy = new THREE.Group();

  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), materials.shadow);
  body.scale.set(0.9, 1.45, 0.75);
  body.position.y = 1.25;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.72, 0), materials.shadow);
  head.position.y = 2.45;
  head.scale.set(0.85, 1, 0.72);
  head.castShadow = true;

  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), materials.eye);
  leftEye.position.set(-0.2, 2.55, -0.58);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.2;

  const aura = new THREE.PointLight(0x2c0707, 1.5, 10, 1.8);
  aura.position.y = 1.8;

  enemy.add(body, head, leftEye, rightEye, aura);
  enemy.position.set(randomBetween(-35, 35), 0, randomBetween(-38, -22));
  world.add(enemy);
}

function populateWorld() {
  createTerrain();

  for (let i = 0; i < 120; i += 1) {
    let x = randomBetween(-70, 70);
    let z = randomBetween(-70, 45);
    if (Math.abs(x) < 7 && z > -58 && z < 34) {
      x += x < 0 ? -10 : 10;
    }
    createTree(x, z, randomBetween(0.75, 1.65));
  }

  for (let i = 0; i < 44; i += 1) {
    createRock(randomBetween(-70, 70), randomBetween(-70, 45), randomBetween(0.35, 1.25));
  }

  const fireflySpots = [
    [-8, 20], [9, 16], [-15, 6], [14, 0], [-11, -11], [10, -17], [-18, -28],
    [17, -36], [-9, -45], [6, -50], [24, -4], [-27, -16]
  ];
  fireflySpots.forEach(([x, z]) => createFirefly(x, z));

  createShrine();
  createEnemy();
}

function resetGame() {
  state.started = false;
  state.won = false;
  state.gameOver = false;
  state.fuel = 100;
  state.fireflies = 0;
  state.blastCooldown = 0;
  state.messageTimer = 0;
  state.message = 'Collect fireflies, avoid the shadow, and reach the shrine.';

  yaw = 0;
  pitch = 0;
  player.position.set(0, 1.65, 28);
  player.rotation.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  fireflies.forEach((firefly) => {
    firefly.userData.active = true;
    firefly.visible = true;
  });

  enemy.position.set(randomBetween(-35, 35), 0, randomBetween(-38, -22));
  updateHud();
}

function startGame() {
  resetGame();
  state.started = true;
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  canvas.focus();
}

function endGame(won) {
  state.started = false;
  state.gameOver = !won;
  state.won = won;
  endScreen.classList.remove('hidden');
  endEyebrow.textContent = won ? 'Shrine reached' : 'Run ended';
  endTitle.textContent = won ? 'You Escaped' : 'Game Over';
  endMessage.textContent = won
    ? `You reached the shrine with ${state.fireflies} fireflies collected. The forest releases you.`
    : 'The forest swallowed your light. Collect more fireflies and keep the shadow away.';
}

function setMessage(message, seconds = 2) {
  state.message = message;
  state.messageTimer = seconds;
}

function clampPlayer() {
  player.position.x = THREE.MathUtils.clamp(player.position.x, -72, 72);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -72, 48);
}

function blastLantern() {
  if (!state.started || state.fuel < 18 || state.blastCooldown > 0) return;

  state.fuel -= 18;
  state.blastCooldown = 1.25;
  lanternLight.intensity = 6;
  setMessage('Lantern blast! The shadow fears bright light.', 1.4);

  const distance = enemy.position.distanceTo(player.position);
  if (distance < 16) {
    const push = enemy.position.clone().sub(player.position).setY(0).normalize();
    enemy.position.addScaledVector(push, 12);
  }
}

function updateMovement(delta) {
  const forwardInput = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - joystick.y;
  const sideInput = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joystick.x;

  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const direction = new THREE.Vector3();
  direction.addScaledVector(forward, forwardInput);
  direction.addScaledVector(right, sideInput);

  if (direction.lengthSq() > 0.001) {
    direction.normalize();
    player.position.addScaledVector(direction, 7.2 * delta);
    state.fuel -= 0.38 * delta;
  }

  player.position.y = 1.65;
  clampPlayer();
}

function updateFireflies(elapsed) {
  for (const firefly of fireflies) {
    if (!firefly.userData.active) continue;
    firefly.rotation.y += 2.5 * clock.getDelta() * 0.2;
    firefly.position.y = firefly.userData.baseY + Math.sin(elapsed * 3 + firefly.userData.phase) * 0.22;

    const distance = firefly.position.distanceTo(player.position);
    if (distance < 1.8) {
      firefly.userData.active = false;
      firefly.visible = false;
      state.fireflies += 1;
      state.fuel = Math.min(100, state.fuel + 23);
      setMessage('Firefly collected. Lantern fuel restored.', 1.6);
    }
  }
}

function updateEnemy(delta) {
  const distance = enemy.position.distanceTo(player.position);
  const canSeePlayer = distance < 52;
  const speed = THREE.MathUtils.mapLinear(100 - state.fuel, 0, 100, 1.7, 3.75);

  enemy.children[0].scale.y = 1.45 + Math.sin(performance.now() * 0.006) * 0.08;

  if (canSeePlayer) {
    const direction = player.position.clone().sub(enemy.position).setY(0).normalize();
    enemy.position.addScaledVector(direction, speed * delta);
    enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
  } else {
    enemy.position.x += Math.sin(performance.now() * 0.0008) * 0.006;
    enemy.position.z += Math.cos(performance.now() * 0.0009) * 0.006;
  }

  if (distance < 2.0) {
    endGame(false);
  }
}

function updateShrine(elapsed) {
  shrine.rotation.y = Math.sin(elapsed * 0.45) * 0.06;
  shrine.children[4].rotation.y += 0.025;
  shrine.children[4].position.y = 2.05 + Math.sin(elapsed * 2.4) * 0.18;

  const distanceToShrine = player.position.distanceTo(new THREE.Vector3(shrine.position.x, 1.65, shrine.position.z));
  if (distanceToShrine < 5.2) {
    if (state.fireflies >= state.required) {
      endGame(true);
    } else {
      setMessage(`The shrine needs ${state.required - state.fireflies} more fireflies.`, 0.35);
    }
  }
}

function updateLantern(delta) {
  state.fuel -= 1.35 * delta;
  state.fuel = THREE.MathUtils.clamp(state.fuel, 0, 100);
  state.blastCooldown = Math.max(0, state.blastCooldown - delta);

  const fuel01 = state.fuel / 100;
  lanternLight.distance = THREE.MathUtils.lerp(7, 29, fuel01);
  lanternLight.intensity = THREE.MathUtils.lerp(lanternLight.intensity, THREE.MathUtils.lerp(0.35, 2.5, fuel01), 0.06);
  lanternGlow.scale.setScalar(THREE.MathUtils.lerp(0.65, 1.7, fuel01));

  if (state.fuel <= 0.1) {
    endGame(false);
  }
}

function updateHud() {
  const fuelRounded = Math.ceil(state.fuel);
  fuelBar.style.width = `${fuelRounded}%`;
  fuelText.textContent = `${fuelRounded}%`;
  fireflyText.textContent = state.fireflies;
  objectiveText.textContent = state.message;
}

function update(delta) {
  const elapsed = performance.now() / 1000;

  if (state.started) {
    updateMovement(delta);
    updateFireflies(elapsed);
    updateEnemy(delta);
    updateShrine(elapsed);
    updateLantern(delta);

    if (state.messageTimer > 0) {
      state.messageTimer -= delta;
      if (state.messageTimer <= 0) {
        state.message = 'Collect fireflies, avoid the shadow, and reach the shrine.';
      }
    }
  } else {
    if (enemy) enemy.rotation.y += delta * 0.25;
    if (shrine) shrine.rotation.y += delta * 0.08;
  }

  updateHud();
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  update(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateLook(deltaX, deltaY, sensitivity = 0.003) {
  yaw -= deltaX * sensitivity;
  pitch -= deltaY * sensitivity;
  pitch = THREE.MathUtils.clamp(pitch, -1.18, 1.05);
  player.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function setupControls() {
  window.addEventListener('keydown', (event) => {
    keys.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      blastLantern();
    }
  });

  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('resize', onResize);

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas && !('ontouchstart' in window)) {
      canvas.requestPointerLock?.();
    }
  });

  window.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === canvas && state.started) {
      updateLook(event.movementX, event.movementY, 0.0028);
    }
  });

  let lookTouchId = null;
  let lastTouchX = 0;
  let lastTouchY = 0;

  window.addEventListener('touchstart', (event) => {
    for (const touch of event.changedTouches) {
      const isLeftSide = touch.clientX < window.innerWidth * 0.45;
      if (!isLeftSide && lookTouchId === null) {
        lookTouchId = touch.identifier;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === lookTouchId && state.started) {
        updateLook(touch.clientX - lastTouchX, touch.clientY - lastTouchY, 0.005);
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', (event) => {
    for (const touch of event.changedTouches) {
      if (touch.identifier === lookTouchId) {
        lookTouchId = null;
      }
    }
  }, { passive: true });

  joystickBase.addEventListener('pointerdown', (event) => {
    joystick.active = true;
    joystick.id = event.pointerId;
    joystickBase.setPointerCapture(event.pointerId);
  });

  joystickBase.addEventListener('pointermove', (event) => {
    if (!joystick.active || event.pointerId !== joystick.id) return;

    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = rect.width * 0.39;
    const dx = THREE.MathUtils.clamp(event.clientX - centerX, -radius, radius);
    const dy = THREE.MathUtils.clamp(event.clientY - centerY, -radius, radius);
    const length = Math.hypot(dx, dy);
    const limitedX = length > radius ? (dx / length) * radius : dx;
    const limitedY = length > radius ? (dy / length) * radius : dy;

    joystick.x = limitedX / radius;
    joystick.y = limitedY / radius;
    joystickKnob.style.transform = `translate(calc(-50% + ${limitedX}px), calc(-50% + ${limitedY}px))`;
  });

  function releaseJoystick(event) {
    if (event.pointerId !== joystick.id) return;
    joystick.active = false;
    joystick.id = null;
    joystick.x = 0;
    joystick.y = 0;
    joystickKnob.style.transform = 'translate(-50%, -50%)';
  }

  joystickBase.addEventListener('pointerup', releaseJoystick);
  joystickBase.addEventListener('pointercancel', releaseJoystick);
  blastButton.addEventListener('click', blastLantern);
  startButton.addEventListener('click', startGame);
  restartButton.addEventListener('click', startGame);
}

populateWorld();
setupControls();
resetGame();
animate();
