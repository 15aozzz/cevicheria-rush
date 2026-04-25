import * as THREE from 'three';
import { TextureManager } from './TextureManager.js';

export function buildWorld(scene) {
    // 1. Iluminación (Plana para mantener colores sucios de psx)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffee, 0.5);
    dirLight.position.set(20, 50, -20);
    dirLight.castShadow = false;
    scene.add(dirLight);

    // Texturas
    const texAsphalt = TextureManager.generateAsphalt();
    texAsphalt.repeat.set(50, 10);
    
    const texLines = TextureManager.generateRoadLines();
    texLines.repeat.set(50, 1);
    
    const texConcrete = TextureManager.generateConcrete();
    const texBricks = TextureManager.generateBricks();
    const texBricks2 = TextureManager.generateBricks('#c0a080', '#e0c0a0', '#908070'); // lighter
    
    // 2. Calle (Asfalto + Linea Central)
    const streetGeo = new THREE.PlaneGeometry(300, 16); // Pista más angosta
    const streetMat = new THREE.MeshLambertMaterial({ map: texAsphalt });
    const street = new THREE.Mesh(streetGeo, streetMat);
    street.rotation.x = -Math.PI / 2;
    scene.add(street);

    // Linea Central
    const lineGeo = new THREE.PlaneGeometry(300, 1);
    const lineMat = new THREE.MeshBasicMaterial({ map: texLines, transparent: true });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.05;
    scene.add(centerLine);

    // 3. Veredas
    const sidewalkGeo = new THREE.BoxGeometry(300, 0.3, 5);
    const sidewalkMat = new THREE.MeshLambertMaterial({ map: texConcrete });
    
    // Vereda Norte (Frente)
    const sidewalkN = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalkN.position.set(0, 0.15, -10.5);
    scene.add(sidewalkN);
    
    // Vereda Sur (Atrás)
    const sidewalkS = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalkS.position.set(0, 0.15, 10.5);
    scene.add(sidewalkS);

    // 4. Generación de Edificios (Casas coloridas tipo barrio con texturas)
    const materials = [
        new THREE.MeshLambertMaterial({ map: texBricks }), // Ladrillo rojo
        new THREE.MeshLambertMaterial({ map: texBricks2 }), // Ladrillo claro
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#3399ff') }), // Azul vibrante
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#ff8833') }), // Naranja
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#44ee66') }), // Verde limón
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#ff5588') }), // Rosado fuerte
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#ffdd33') }), // Amarillo
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#aaddcc') }), // Menta
        new THREE.MeshLambertMaterial({ map: TextureManager.generatePaintedWall('#eeeeee') }), // Blanco
    ];

    // Norte
    let currentXN = -150;
    while(currentXN < 150) {
        const w = 10 + Math.random() * 8;
        createHouse(scene, currentXN + w/2, -18, materials, texConcrete, w);
        currentXN += w;
    }

    // Sur
    let currentXS = -150;
    while(currentXS < 150) {
        const w = 10 + Math.random() * 8;
        createHouse(scene, currentXS + w/2, 18, materials, texConcrete, w);
        currentXS += w;
    }

    // 5. Postes con cables
    createPoles(scene);
}

function createPoles(scene) {
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

    // Cable material
    const lineMat = new THREE.LineBasicMaterial({ color: 0x111111 });

    const createPoleLine = (zPos) => {
        const points1 = []; // Cable inferior
        const points2 = []; // Cable superior

        for (let x = -140; x <= 140; x += 30) {
            // Instanciar poste
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(x, 5, zPos);
            scene.add(pole);

            // Luz del poste (apagada por defecto)
            const poleLight = new THREE.PointLight(0xffaa00, 0, 25);
            poleLight.position.set(x, 9, zPos > 0 ? zPos - 1 : zPos + 1); // Luz apuntando hacia la pista
            poleLight.userData.isPoleLight = true;
            scene.add(poleLight);

            // Caída de cable simulada
            const sagY = 8 + Math.random() * 0.5;
            points1.push(new THREE.Vector3(x, 8.5, zPos));
            if(x < 140) points1.push(new THREE.Vector3(x + 15, sagY, zPos)); // Punto medio colgando

            const sagY2 = 9.5 + Math.random() * 0.5;
            points2.push(new THREE.Vector3(x, 9.8, zPos));
            if(x < 140) points2.push(new THREE.Vector3(x + 15, sagY2, zPos)); // Punto medio colgando
        }
        
        // Puntos finales
        points1.push(new THREE.Vector3(140, 8.5, zPos));
        points2.push(new THREE.Vector3(140, 9.8, zPos));

        const geo1 = new THREE.BufferGeometry().setFromPoints(points1);
        const geo2 = new THREE.BufferGeometry().setFromPoints(points2);
        
        scene.add(new THREE.Line(geo1, lineMat));
        scene.add(new THREE.Line(geo2, lineMat));
    };

    createPoleLine(-10); // Vereda norte
    createPoleLine(10);  // Vereda sur
}

function createHouse(scene, xPos, zPos, materials, windowTex, width) {
    const height = 8 + Math.random() * 6;
    const depth = 10;
    
    const mat = materials[Math.floor(Math.random() * materials.length)];
    
    const geo = new THREE.BoxGeometry(width, height, depth);
    const box = new THREE.Mesh(geo, mat);
    box.position.set(xPos, height / 2, zPos);
    scene.add(box);

    // Puerta
    const doorGeo = new THREE.BoxGeometry(2, 3, depth + 0.2);
    const doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3018 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    const doorOffset = (Math.random() > 0.5 ? 1 : -1) * (width / 4);
    door.position.set(xPos + doorOffset, 1.5, zPos);
    scene.add(door);

    // Ventanas negras pixeladas
    const windowGeo = new THREE.BoxGeometry(2, 2, depth + 0.1);
    const windowSolidMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    
    const w1 = new THREE.Mesh(windowGeo, windowSolidMat);
    w1.position.set(xPos - width/4, height/2, zPos);
    
    const w2 = new THREE.Mesh(windowGeo, windowSolidMat);
    w2.position.set(xPos + width/4, height/2, zPos);
    
    scene.add(w1);
    scene.add(w2);
}
