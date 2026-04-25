import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { buildWorld } from './World.js';
import { buildCart } from './Cart.js';
import { GameManager } from './GameManager.js';
import { OrderManager } from './OrderManager.js';
import { NPCManager } from './NPCManager.js';
import { AmbientManager } from './AmbientManager.js';
import { Config } from './Config.js';
import { EventBus, EVENTS } from './EventBus.js';

let camera, scene, renderer, player;
let prevTime = performance.now();
let cartHitbox;

let gameManager, orderManager, npcManager, ambientManager;
const raycaster = new THREE.Raycaster();
const centerPoint = new THREE.Vector2(0, 0); 

const startScreen = document.getElementById('start-screen');

let isCinematicPlaying = false;
let cinematicTimer = 0;
let cinematicGoal = 0;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.Fog(0x87CEEB, 30, 100); 

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
    
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Config.PIXEL_RATIO); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    gameManager = new GameManager();
    orderManager = new OrderManager(gameManager);
    npcManager = new NPCManager(scene, gameManager, orderManager);
    ambientManager = new AmbientManager(scene);

    player = new PlayerController(camera, document.body);
    player.getObject().position.set(0, 1.8, 0); // Establecer posición inicial explícitamente

    startScreen.addEventListener('click', () => {
        if (!gameManager.isGameOver) player.controls.lock();
    });

    player.controls.addEventListener('lock', () => {
        startScreen.style.display = 'none';
        document.getElementById('crosshair').style.display = 'block';
    });

    player.controls.addEventListener('unlock', () => {
        if (!gameManager.isGameOver) startScreen.style.display = 'flex';
        document.getElementById('crosshair').style.display = 'none';
    });
    
    scene.add(player.getObject());

    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onDocKeyDown);

    EventBus.on(EVENTS.CINEMATIC_START, (data) => {
        // Bloquear al jugador instantáneamente
        gameManager.isGameOver = true;
        document.exitPointerLock();

        // Crear div para efecto de Fade (oscurecer pantalla)
        let fadeDiv = document.getElementById('fade-overlay');
        if (!fadeDiv) {
            fadeDiv = document.createElement('div');
            fadeDiv.id = 'fade-overlay';
            fadeDiv.style.position = 'absolute';
            fadeDiv.style.top = '0';
            fadeDiv.style.left = '0';
            fadeDiv.style.width = '100%';
            fadeDiv.style.height = '100%';
            fadeDiv.style.backgroundColor = '#000';
            fadeDiv.style.opacity = '0';
            fadeDiv.style.pointerEvents = 'none';
            fadeDiv.style.zIndex = '9000';
            fadeDiv.style.transition = 'opacity 2s ease-in-out'; // Transición suave de 2s
            document.body.appendChild(fadeDiv);
            fadeDiv.offsetHeight; // Forzar reflow para que CSS pille el opacity 0 inicial
        }
        
        // Iniciar el fundido a negro
        fadeDiv.style.opacity = '1';

        // Esperar 2 segundos a que se ponga todo negro, luego iniciar cinemática y hacer fade in
        setTimeout(() => {
            startCinematic(data.goal);
            // Volver a aclarar la pantalla (Fade in) para mostrar la escena de noche
            fadeDiv.style.opacity = '0';
        }, 2000);
    });

    buildWorld(scene);
    const cartData = buildCart(scene);
    cartHitbox = cartData.cartGroup;
    cartHitbox.itemsInteractuables = cartData.itemsInteractuables;

    npcManager.spawnClient();
}

function onDocKeyDown(e) {
    if(!player.controls.isLocked) return;

    if (e.code === 'KeyE') {
        raycaster.setFromCamera(centerPoint, camera);
        
        // Logica 1: Si el carrito esta tumbado, pagar para recuperarlo
        if (cartHitbox.userData.isKnocked) {
            const dist = player.getObject().position.distanceTo(cartHitbox.position);
            if (dist < 4.0) {
                if (gameManager.money >= Config.BRIBE_AMOUNT) {
                    gameManager.addMoney(-Config.BRIBE_AMOUNT);
                    EventBus.emit(EVENTS.CART_RECOVERED);
                    EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡Sobornaste al fiscalizador! (-S/. 10)', color: '#aaffaa' });
                } else {
                    EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡No tienes S/. 10 para pagarle!', color: '#ffaaaa' });
                }
            }
            return;
        }

        // Logica 2: Interactuar con ingredientes si el carrito esta bien
        const cartIntersects = raycaster.intersectObjects(cartHitbox.itemsInteractuables);
        if (cartIntersects.length > 0 && cartIntersects[0].distance < 6.0) {
            const ingr = cartIntersects[0].object.userData.ingredient;
            if (ingr) {
                orderManager.selectIngredient(ingr);
                return;
            }
        }

        // Logica 3: Entregar pedido a cliente
        const prepared = orderManager.currentSelection.length > 0 ? orderManager.confirmOrder() : null;
        if(prepared) {
            npcManager.deliverOrder(prepared, player.getObject().position);
        }
    } 
    else if (e.code === 'KeyG') {
        if (cartHitbox.userData.isKnocked) return;
        
        if (orderManager.currentSelection.length > 0) {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡A entregar! Acércate al cliente y usa E', color: '#aaaaaa' });
        } else {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: 'Añade ingredientes primero', color: '#ffaaaa' });
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (isCinematicPlaying) {
        cinematicTimer += delta;
        
        // El carrito avanza por la pista (Eje X)
        cartHitbox.position.x += 6 * delta; 
        
        // Se mueve suavemente hacia el centro de la pista (Z = 0)
        if (cartHitbox.position.z < 0) {
            cartHitbox.position.z += 3 * delta;
            if (cartHitbox.position.z > 0) cartHitbox.position.z = 0;
        }

        camera.lookAt(cartHitbox.position);
        
        // Efecto de rebote al caminar empujando el carrito
        cartHitbox.position.y = -0.15 + Math.abs(Math.sin(cinematicTimer * 8)) * 0.1;

        if (cinematicTimer > 5.0) { // Tras 5 segundos, mostrar pantalla victoria
            isCinematicPlaying = false; // Detener bucle de cinematica
            showVictoryScreen(cinematicGoal);
        }
    } else if (!gameManager.isGameOver) {
        player.update(delta);
        npcManager.update(delta, player.getObject().position);
        ambientManager.update(delta);
        
        // Chequear si el jugador es atropellado
        const pPos = player.getObject().position;
        ambientManager.cars.forEach(car => {
            if (pPos.distanceTo(car.mesh.position) < 3.0) {
                player.knockDown(3.0); // Tirarlo por 3 segundos
            }
        });

        orderManager.updateTimers(delta);
        checkHover();
    }

    prevTime = time;
    renderer.render(scene, camera);
}

function startCinematic(goal) {
    isCinematicPlaying = true;
    cinematicTimer = 0;
    cinematicGoal = goal;
    gameManager.isGameOver = true; // Bloquear interacciones y clicks en la pantalla
    
    // Ocultar UI
    document.getElementById('hud-container').style.display = 'none';
    document.getElementById('crosshair').style.display = 'none';
    document.getElementById('interaction-prompt').style.display = 'none';
    document.exitPointerLock();

    // Oscurecer luces globales (hacer de noche) y encender postes
    scene.children.forEach(child => {
        if (child instanceof THREE.AmbientLight) child.intensity = 0.1;
        if (child instanceof THREE.DirectionalLight) child.intensity = 0.05;
        if (child.userData.isPoleLight) child.intensity = 1.5; // Encender postes
    });
    scene.background = new THREE.Color(0x050510);
    scene.fog.color.setHex(0x050510);

    // Añadir luz focal al carrito
    const cartLight = new THREE.PointLight(0xffddaa, 2, 20);
    cartLight.position.set(0, 3, 0);
    cartHitbox.add(cartLight);

    // Reposicionar cámara para una vista cinematográfica desde la vereda
    player.getObject().remove(camera); // Separar cámara del jugador
    scene.add(camera);
    camera.position.set(cartHitbox.position.x - 8, 2.5, cartHitbox.position.z + 8); 

    // Eliminar NPCs (Clientes y Peatones) para que la calle quede vacía
    if (npcManager.clientMesh) scene.remove(npcManager.clientMesh);
    ambientManager.pedestrians.forEach(ped => scene.remove(ped.mesh));
    ambientManager.pedestrians = []; // Vaciar array
    ambientManager.pedSpawnTimer = 999999; // Prevenir que aparezcan más

    // Añadir Cielo Nocturno (Estrellas ignorando la niebla)
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 300;
    const posArray = new Float32Array(starsCount * 3);
    for(let i=0; i<starsCount*3; i+=3) {
        posArray[i] = cartHitbox.position.x + 20 + Math.random() * 200; // Estrellas por delante
        posArray[i+1] = 30 + Math.random() * 60; // Y (altura)
        posArray[i+2] = (Math.random() - 0.5) * 150; // Z
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.8, fog: false});
    const starsMesh = new THREE.Points(starsGeo, starsMat);
    scene.add(starsMesh);

    // Añadir Luna (ignorando la niebla para que brille al fondo)
    const moonGeo = new THREE.SphereGeometry(8, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({color: 0xffffee, fog: false});
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(cartHitbox.position.x + 120, 45, -30);
    scene.add(moon);
}

function showVictoryScreen(goal) {
    const endDiv = document.createElement('div');
    endDiv.style.position = 'absolute';
    endDiv.style.top = '0';
    endDiv.style.left = '0';
    endDiv.style.width = '100%';
    endDiv.style.height = '100%';
    endDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    endDiv.style.display = 'flex';
    endDiv.style.justifyContent = 'center';
    endDiv.style.alignItems = 'center';
    endDiv.style.zIndex = '9999'; // Garantizar que esté por encima de TODO
    endDiv.style.fontFamily = "'Courier New', Courier, monospace";
    
    endDiv.innerHTML = `
        <div style="background-color: #000; border: 4px solid #fff; padding: 50px; text-align: center; max-width: 600px; box-shadow: 10px 10px 0px #222;">
            <h1 style="color:#ffcc00; font-size: 36px; text-shadow: 2px 2px 0 #fff; margin-bottom: 10px; text-transform: uppercase;">¡Lo lograste!</h1>
            <h2 style="color:#fff; font-size: 28px; margin-bottom: 30px; font-weight: normal;">Sobreviviste otro día de los cobradores de cupo</h2>
            <p style="font-size: 20px; color: #aaa; margin-bottom: 40px;">Total recaudado: S/. ${goal}</p>
            <button onclick="location.reload()" style="padding: 15px 40px; font-size: 22px; font-family: 'Courier New', monospace; font-weight: bold; background: #fff; color: #000; border: 4px solid #44ff44; cursor: pointer; transition: 0.2s;">[ VOLVER A JUGAR ]</button>
        </div>
    `;
    document.body.appendChild(endDiv);
}

function checkHover() {
    if (!player.controls.isLocked) return;
    raycaster.setFromCamera(centerPoint, camera);
    const cartIntersects = raycaster.intersectObjects(cartHitbox.itemsInteractuables);
    const hoverEl = document.getElementById('hover-text');
    if (cartIntersects.length > 0 && cartIntersects[0].distance < 6.0) {
        const ingr = cartIntersects[0].object.userData.ingredient;
        if (ingr) {
            hoverEl.textContent = `+ ${ingr}`;
            hoverEl.style.display = 'block';
            return;
        }
    }
    hoverEl.style.display = 'none';
}


