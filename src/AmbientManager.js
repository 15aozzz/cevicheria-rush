import * as THREE from 'three';

export class AmbientManager {
    constructor(scene) {
        this.scene = scene;
        this.cars = [];
        this.pedestrians = [];

        this.carSpawnTimer = 0;
        this.pedSpawnTimer = 0;

        // Geometrias reusables
        this.carGeo = new THREE.BoxGeometry(4, 1.5, 2);
        this.wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 8);
        this.wheelMat = new THREE.MeshLambertMaterial({color: 0x111111});
        
        this.pedBodyGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.6, 6);
        this.pedHeadGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        this.pedHeadMat = new THREE.MeshLambertMaterial({color: 0xddaa99});

        // Spawn parked cars
        this.spawnParkedCars();
    }

    spawnParkedCars() {
        const positions = [];
        for (let i = 0; i < 20; i++) {
            const isLeft = Math.random() > 0.5;
            const xPos = (Math.random() - 0.5) * 200; // -100 to 100
            
            // No tapar el carrito del jugador que esta en z=-7, x=0
            if (Math.abs(xPos) < 20 && isLeft) continue;

            const zPos = isLeft ? -7 : 7;
            
            // Comprobar si hay otro carro muy cerca
            const overlap = positions.some(p => Math.abs(p.x - xPos) < 12 && p.z === zPos);
            
            if (!overlap) {
                positions.push({x: xPos, z: zPos});
                this.createCarMesh(xPos, zPos);
            }
        }
    }

    createCarMesh(x, z) {
        const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.4);
        const carMat = new THREE.MeshLambertMaterial({color});

        const mesh = new THREE.Group();
        
        const body = new THREE.Mesh(this.carGeo, carMat);
        body.position.y = 1.0;
        mesh.add(body);

        // Cabina
        const cabinGeo = new THREE.BoxGeometry(2, 1, 1.8);
        const cabinMat = new THREE.MeshLambertMaterial({color: 0x888888});
        const cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(-0.5, 2.0, 0); // Ligeramente tirado hacia atrás
        mesh.add(cabin);

        // Wheels
        const positions = [
            [-1.5, 0.5, 1.1], [1.5, 0.5, 1.1],
            [-1.5, 0.5, -1.1], [1.5, 0.5, -1.1]
        ];
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(this.wheelGeo, this.wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            mesh.add(wheel);
        });

        mesh.position.set(x, 0, z);
        this.scene.add(mesh);
        return mesh;
    }

    update(delta) {
        this.carSpawnTimer -= delta;
        if(this.carSpawnTimer <= 0) {
            this.carSpawnTimer = 10 + Math.random() * 10;
            this.spawnCar();
        }

        this.pedSpawnTimer -= delta;
        if(this.pedSpawnTimer <= 0) {
            this.pedSpawnTimer = 1 + Math.random() * 3;
            this.spawnPedestrian();
        }

        // Move cars
        this.cars.forEach(car => {
            car.mesh.position.x += car.speed * delta;
            if(Math.abs(car.mesh.position.x) > 200) {
                car.markedForDelete = true;
            }
        });

        // Move pedestrians
        this.pedestrians.forEach(ped => {
            ped.mesh.position.x += ped.speed * delta;
            // Bobbing animation
            ped.time += delta * 10;
            ped.mesh.position.y = Math.abs(Math.sin(ped.time)) * 0.2;

            if(Math.abs(ped.mesh.position.x) > 200) {
                ped.markedForDelete = true;
            }
        });

        // Cleanup
        this.cleanup(this.cars);
        this.cleanup(this.pedestrians);
    }

    cleanup(list) {
        for(let i = list.length - 1; i >= 0; i--) {
            if(list[i].markedForDelete) {
                this.scene.remove(list[i].mesh);
                list.splice(i, 1);
            }
        }
    }

    spawnCar() {
        const isLeftToRight = Math.random() > 0.5;
        const xPos = isLeftToRight ? -180 : 180;
        const zPos = isLeftToRight ? 3 : -3; // Carriles centrales
        
        const mesh = this.createCarMesh(xPos, zPos);
        const speed = 25 * (isLeftToRight ? 1 : -1); // Velocidad constante para no chocar

        this.cars.push({
            mesh,
            speed,
            markedForDelete: false
        });
    }

    spawnPedestrian() {
        const isLeftToRight = Math.random() > 0.5;
        const isNorthSidewalk = Math.random() > 0.5;
        
        const color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
        const bodyMat = new THREE.MeshLambertMaterial({color});

        const mesh = new THREE.Group();
        const body = new THREE.Mesh(this.pedBodyGeo, bodyMat);
        body.position.y = 0.8;
        const head = new THREE.Mesh(this.pedHeadGeo, this.pedHeadMat);
        head.position.y = 1.8;
        mesh.add(body, head);

        const speed = (3 + Math.random() * 3) * (isLeftToRight ? 1 : -1);
        const xPos = isLeftToRight ? -180 : 180;
        const zPos = isNorthSidewalk ? -11 : 11; // Nueva posicion de veredas

        mesh.position.set(xPos, 0, zPos);
        this.scene.add(mesh);

        this.pedestrians.push({
            mesh,
            speed,
            time: Math.random() * Math.PI,
            markedForDelete: false
        });
    }
}
