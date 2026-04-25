import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class PlayerController {
    constructor(camera, domElement) {
        this.controls = new PointerLockControls(camera, domElement);
        this.camera = camera;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.knockedDownTimer = 0;
        
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    getObject() {
        return this.controls.getObject();
    }

    knockDown(time) {
        if (this.knockedDownTimer > 0) return; // Ya está en el piso
        this.knockedDownTimer = time;
        this.velocity.y = 0; 
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
            case 'Space': 
                if(this.canJump) {
                    this.velocity.y += 18;
                    this.canJump = false;
                }
                break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
        }
    }

    update(delta) {
        if (this.controls.isLocked) {
            
            // Manejar caída
            if (this.knockedDownTimer > 0) {
                this.knockedDownTimer -= delta;
                if (this.knockedDownTimer <= 0) {
                    this.knockedDownTimer = 0;
                }
            }

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 60.0 * delta; // Gravedad

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            // Config walkSpeed (0 si está tirado)
            const speed = this.knockedDownTimer > 0 ? 0 : 70.0;
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * speed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * speed * delta;

            const rightMove = -this.velocity.x * delta;
            const fwdMove = -this.velocity.z * delta;

            this.controls.moveRight(rightMove);
            let pos = this.getObject().position;
            if (this.checkCollision(pos)) {
                this.controls.moveRight(-rightMove);
                this.velocity.x = 0;
                pos = this.getObject().position;
            }

            this.controls.moveForward(fwdMove);
            pos = this.getObject().position;
            if (this.checkCollision(pos)) {
                this.controls.moveForward(-fwdMove);
                this.velocity.z = 0;
                pos = this.getObject().position;
            }
            
            // Altura base dependiendo de si estás en la vereda o en la pista
            // Veredas están en Z < -8 y Z > 8 con una altura de 0.3
            const onSidewalk = pos.z <= -8 || pos.z >= 8;
            let baseY = onSidewalk ? 2.0 : 1.7; // 1.7 (altura jugador) + 0.3 (altura vereda)
            
            if (this.knockedDownTimer > 0) baseY = onSidewalk ? 0.8 : 0.5; // Altura de tirado

            pos.y += this.velocity.y * delta;

            // Colision con el suelo
            if (pos.y < baseY) {
                this.velocity.y = 0;
                pos.y = baseY;
                this.canJump = true;
            }
        }
    }

    checkCollision(pos) {
        // Límites del mundo (casas en z < -12.5 o z > 12.5)
        if (pos.z < -12.5 || pos.z > 12.5) return true;
        if (pos.x < -140 || pos.x > 140) return true;

        // Carrito
        // El carrito está en x=0, z=-7. Body width 4, depth 2.
        // Asumiendo radio de colisión del jugador de 0.5:
        // x entre -2.5 y 2.5
        // z entre -8.5 y -5.5
        if (pos.x > -2.5 && pos.x < 2.5 && pos.z > -8.5 && pos.z < -5.5) {
            return true;
        }

        return false;
    }
}
