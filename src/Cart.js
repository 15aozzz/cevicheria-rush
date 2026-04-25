import * as THREE from 'three';
import { TextureManager } from './TextureManager.js';
import { EventBus, EVENTS } from './EventBus.js';
import { Config } from './Config.js';

export function buildCart(scene) {
    const cartGroup = new THREE.Group();
    // Posición en la pista, pegado a la vereda norte (Z = -7, borde pista = -8)
    cartGroup.position.set(0, -0.15, -7); // Ligeramente hundido/más bajo

    // Estado del carrito
    cartGroup.userData.isKnocked = false;

    // Escuchar Eventos
    EventBus.on(EVENTS.CART_KNOCKED_DOWN, () => {
        cartGroup.userData.isKnocked = true;
        cartGroup.rotation.x = Math.PI / 2; // Caída 90 grados
    });

    EventBus.on(EVENTS.CART_RECOVERED, () => {
        cartGroup.userData.isKnocked = false;
        cartGroup.rotation.x = 0;
    });

    const texRust = TextureManager.generateMetalRust();
    const texCanopy = TextureManager.generateCanopy();
    const texSign = TextureManager.generateSign();
    const texChicha = TextureManager.generateChichaSign();

    // Llantas
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(-1.5, 0.3, 0.9);
    
    const w2 = w1.clone();
    w2.position.set(1.5, 0.3, 0.9);
    
    const w3 = w1.clone();
    w3.position.set(-1.5, 0.3, -0.9);
    
    const w4 = w1.clone();
    w4.position.set(1.5, 0.3, -0.9);

    cartGroup.add(w1, w2, w3, w4);

    // Cuerpo principal (Mas bajo)
    const bodyGeo = new THREE.BoxGeometry(4, 0.9, 2);
    const bodyMat = new THREE.MeshLambertMaterial({ map: texRust });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75; 
    cartGroup.add(body);

    // Letreros
    const signGeo = new THREE.PlaneGeometry(3, 0.8);
    const signMat = new THREE.MeshLambertMaterial({ map: texSign });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 0.75, 1.01);
    cartGroup.add(sign);

    const signBack = new THREE.Mesh(signGeo, signMat);
    signBack.rotation.y = Math.PI;
    signBack.position.set(0, 0.75, -1.01);
    cartGroup.add(signBack);

    // Postes
    const postGeo = new THREE.BoxGeometry(0.1, 1.5, 0.1);
    const postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    
    const positions = [
        [-1.9, 1.95, 0.9], [1.9, 1.95, 0.9],
        [-1.9, 1.95, -0.9], [1.9, 1.95, -0.9]
    ];
    
    positions.forEach(pos => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(...pos);
        cartGroup.add(post);
    });

    // Toldo (Plano ligeramente inclinado)
    const canopyGeo = new THREE.PlaneGeometry(4.4, 2.6);
    const canopyMat = new THREE.MeshLambertMaterial({ map: texCanopy, side: THREE.DoubleSide });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.rotation.x = -Math.PI / 2 + 0.15; // Inclinado hacia adelante
    canopy.position.set(0, 2.7, 0.2);
    cartGroup.add(canopy);

    const itemsInteractuables = [];

    // Base de madera para ingredientes
    const tableGeo = new THREE.BoxGeometry(3.6, 0.1, 1.6);
    const tableMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 1.25, 0);
    cartGroup.add(table);

    // Función auxiliar para crear platos con ingredientes
    function createBowl(colorHex, ingredientName, x, z) {
        const group = new THREE.Group();
        const radius = 0.22;
        
        // Semicírculo blanco (plato/tazón)
        const bowlGeo = new THREE.SphereGeometry(radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bowlMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const bowl = new THREE.Mesh(bowlGeo, bowlMat);
        bowl.rotation.x = Math.PI; 
        bowl.scale.set(1.4, 1.0, 1.4); // Más ancho de los lados
        
        // Parte plana de color (el ingrediente con textura)
        const flatGeo = new THREE.CircleGeometry(radius, 16);
        const tex = TextureManager.generateIngredientTexture(ingredientName);
        const flatMat = new THREE.MeshLambertMaterial({ map: tex });
        const flatPart = new THREE.Mesh(flatGeo, flatMat);
        flatPart.rotation.x = -Math.PI / 2;
        flatPart.position.y = -0.02; // Ligeramente hundido dentro del plato para que no flote
        flatPart.scale.set(1.4, 1.0, 1.4); // Más ancho igual que el plato

        group.add(bowl, flatPart);
        group.position.set(x, 1.3 + radius, z); // Bajamos la posición base Y a 1.3
        
        bowl.userData = { ingredient: ingredientName };
        flatPart.userData = { ingredient: ingredientName };

        cartGroup.add(group);
        itemsInteractuables.push(bowl, flatPart);
    }

    createBowl(0xdddddd, 'Pescado', -1.2, 0.3);
    createBowl(0x88ff88, 'Limón', -1.2, -0.3);
    createBowl(0xff88ff, 'Cebolla', -0.6, 0.3);
    createBowl(0xffff00, 'Choclo', -0.6, -0.3);
    createBowl(0xff8c00, 'Camote', 0, 0.3);
    createBowl(0xcd853f, 'Cancha', 0, -0.3);
    createBowl(0x8b4513, 'Chicharrón', 0.6, 0.3);

    // Balde morado de Chicha
    const bucketGeo = new THREE.CylinderGeometry(0.4, 0.35, 0.8, 8);
    const bucketMat = new THREE.MeshLambertMaterial({ color: 0x4a004a });
    const bucket = new THREE.Mesh(bucketGeo, bucketMat);
    bucket.position.set(1.2, 1.65, 0); // Bajado a 1.65
    bucket.userData = { ingredient: 'Chicha Morada', type: 'extra' };
    
    const bSignGeo = new THREE.PlaneGeometry(0.5, 0.3);
    const bSignMat = new THREE.MeshLambertMaterial({ map: texChicha, transparent: true });
    const bSign = new THREE.Mesh(bSignGeo, bSignMat);
    bSign.position.set(1.2, 1.65, 0.41);
    cartGroup.add(bucket);
    cartGroup.add(bSign);
    
    itemsInteractuables.push(bucket);

    scene.add(cartGroup);
    return { cartGroup, itemsInteractuables };
}
