import * as THREE from 'three';
import { EventBus, EVENTS } from './EventBus.js';

let clientIdCounter = 0;

export class NPCManager {
    constructor(scene, gameManager, orderManager) {
        this.scene = scene;
        this.gameManager = gameManager;
        this.orderManager = orderManager;
        
        this.npcs = [];
        this.fiscalizadores = [];
        this.spawnTimer = 0;
        this.fiscTimer = 150; // Inicia en 150s para que no aparezca al principio

        // Texture for Billboard
        this.reqCanvas = document.createElement('canvas');
        this.reqCanvas.width = 64; this.reqCanvas.height = 64;
        const ctx = this.reqCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,64,64);
        ctx.fillStyle = '#0000ff'; ctx.font = '40px monospace';
        ctx.fillText('!?', 10, 48);
        this.reqTex = new THREE.CanvasTexture(this.reqCanvas);
        this.reqTex.magFilter = THREE.NearestFilter;

        // Limpiar fiscalizador al recuperar carrito
        EventBus.on(EVENTS.CART_RECOVERED, () => {
            this.fiscalizadores.forEach(f => f.despawn());
        });
    }

    update(delta, playerPos) {
        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 8 + Math.random() * 4; 
            this.spawnClient();
        }

        this.fiscTimer -= delta;
        if (this.fiscTimer <= 0) {
            this.fiscTimer = 150; // cada 2.5 minutos
            this.spawnFiscalizador();
        }

        this.npcs.forEach(npc => npc.update(delta));
        this.fiscalizadores.forEach(fisc => fisc.update(delta)); // ya no persigue a playerPos
        
        this.fiscalizadores = this.fiscalizadores.filter(f => !f.markedForDelete);
        this.npcs = this.npcs.filter(n => !n.markedForDelete);
    }

    spawnClient() {
        if (!this.orderManager.canAddOrder()) return;

        const types = [
            { type: 'Normal', time: 40, extraMoney: 0, color: '#ffffff', wantsExtras: [0, 1] },
            { type: 'Apurado', time: 25, extraMoney: 2, color: '#ffaaaa', wantsExtras: [0, 1] },
            { type: 'VIP', time: 55, extraMoney: 5, color: '#ffd700', wantsExtras: [2, 3] }
        ];

        const t = types[Math.floor(Math.random() * types.length)];
        
        const isLeft = Math.random() > 0.5;
        let xPos = 0;
        let zPos = 0;
        let overlap = true;
        let attempts = 0;
        
        while (overlap && attempts < 10) {
            // Posición base +/- una variación aleatoria para espaciarlos
            xPos = (isLeft ? -30 : 30) + (Math.random() * 16 - 8); 
            zPos = (Math.random() > 0.5) ? -11 : 11;
            
            // Comprobar si hay otro NPC demasiado cerca
            overlap = this.npcs.some(n => Math.abs(n.mesh.position.x - xPos) < 2.5 && n.mesh.position.z === zPos);
            attempts++;
        }

        const client = new Client(this, t, xPos, zPos, this.reqTex);
        this.npcs.push(client);
        this.orderManager.addOrder(client);
    }

    spawnFiscalizador() {
        if(this.fiscalizadores.length >= 1) return; // Solo 1 a la vez
        
        const isLeft = Math.random() > 0.5;
        const xPos = isLeft ? -60 : 60;
        const zPos = -10.5; // En la vereda hacia el carrito

        const fisc = new Fiscalizador(this, xPos, zPos);
        this.fiscalizadores.push(fisc);
    }

    deliverOrder(preparedOrder, playerPos) {
        if (!preparedOrder) return false;

        const distanceThresh = 4.0;
        const target = this.npcs.find(n => n.id === preparedOrder.id);
        
        if (target) {
            const dist = playerPos.distanceTo(target.mesh.position);
            if (dist < distanceThresh) {
                this.gameManager.addMoney(preparedOrder.price);
                target.despawn(false);
                this.orderManager.removeOrder(target);
                return true;
            } else {
                EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡Te acercas, pero estás muy lejos del cliente!', color: '#ffff00' });
            }
        }
        return false;
    }
}

class Client {
    constructor(manager, typeInfo, x, z, billboardTex) {
        this.manager = manager;
        this.id = ++clientIdCounter;
        this.type = typeInfo.type;
        this.maxTime = typeInfo.time;
        this.timeLeft = typeInfo.time;
        this.color = typeInfo.color;
        
        this.markedForDelete = false;

        // Shirt Color (Para identificar en la UI)
        this.shirtColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

        const extrasPool = ['Choclo', 'Cancha', 'Camote', 'Chicharrón', 'Chicha Morada'];
        const numExtras = typeInfo.wantsExtras[0] + Math.floor(Math.random() * (typeInfo.wantsExtras[1] - typeInfo.wantsExtras[0] + 1));
        
        const myExtras = [];
        const poolCpy = [...extrasPool];
        for(let i=0; i<numExtras; i++){
            if(poolCpy.length === 0) break;
            const idx = Math.floor(Math.random() * poolCpy.length);
            myExtras.push(poolCpy.splice(idx, 1)[0]);
        }

        this.order = ['Pescado', 'Limón', 'Cebolla', ...myExtras];
        this.price = 7 + (myExtras.length * 3) + typeInfo.extraMoney;

        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 0, z);
        
        const bodyMat = new THREE.MeshLambertMaterial({color: this.shirtColor, flatShading:true});
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.8, 6);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        
        const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMat = new THREE.MeshLambertMaterial({color: 0xddaa99});
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.1;
        
        this.mesh.add(body, head);

        const spriteMat = new THREE.SpriteMaterial({ map: billboardTex });
        this.sprite = new THREE.Sprite(spriteMat);
        this.sprite.position.y = 3.0;
        this.sprite.scale.set(1.5, 1.5, 1);
        this.mesh.add(this.sprite);

        manager.scene.add(this.mesh);
    }

    update(delta) {
        this.sprite.material.rotation = Math.sin(Date.now()*0.005) * 0.1;
    }

    despawn(fail) {
        this.manager.scene.remove(this.mesh);
        this.markedForDelete = true;
    }
}

class Fiscalizador {
    constructor(manager, x, z) {
        this.manager = manager;
        this.lifeTime = 30;
        this.markedForDelete = false;
        this.hasKnockedCart = false;

        this.mesh = new THREE.Group();
        this.mesh.position.set(x, 0, z);

        const bodyMat = new THREE.MeshLambertMaterial({color: 0x444455, flatShading:true});
        const bodyGeo = new THREE.BoxGeometry(1, 1.8, 1);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        this.mesh.add(body);

        manager.scene.add(this.mesh);
    }

    update(delta) {
        if(this.hasKnockedCart) return; // Se queda parado esperando soborno

        this.lifeTime -= delta;
        if(this.lifeTime <= 0) {
            this.despawn();
            return;
        }

        // Caminar directo al carrito (0, 0, -7)
        const targetPos = new THREE.Vector3(0, 0, -7);
        const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position);
        dir.y = 0; 
        const dist = dir.length();

        if (dist > 2.5) {
            dir.normalize();
            const speed = 4.0;
            this.mesh.position.addScaledVector(dir, speed * delta);
        } else {
            // Llegó al carrito
            this.hasKnockedCart = true;
            EventBus.emit(EVENTS.CART_KNOCKED_DOWN);
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡EL FISCALIZADOR TUMBÓ TU CARRO! Acércate y presiona [E] para pagar S/. 10', color: '#ff3333' });
        }
    }

    despawn() {
        this.manager.scene.remove(this.mesh);
        this.markedForDelete = true;
    }
}
