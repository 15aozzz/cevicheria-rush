import * as THREE from 'three';

export class TextureManager {
    static generateBricks(color1 = '#8B4513', color2 = '#A0522D', line = '#4A3018') {
        const canvas = document.createElement('canvas');
        canvas.width = 64; 
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = line;
        ctx.fillRect(0, 0, 64, 64);
        
        const rows = 8;
        const cols = 4;
        const width = 64 / cols;
        const height = 64 / rows;
        
        for (let r = 0; r < rows; r++) {
            const offset = (r % 2 === 0) ? 0 : width / 2;
            for (let c = -1; c < cols; c++) {
                ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
                // Leave 1px border for mortar
                ctx.fillRect(c * width + offset + 1, r * height + 1, width - 2, height - 2);
            }
        }
        
        // Add PS1 dirty noise (dithering style)
        this.addNoise(ctx, 64, 64, 0.15);
        return this.createTextureFromCanvas(canvas);
    }
    
    static generateAsphalt() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, 128, 128);
        this.addNoise(ctx, 128, 128, 0.08); // Mucho menos ruido para la pista
        
        // Añadir algunos parches oscuros en lugar de ruido para darle textura
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for(let i=0; i<8; i++) {
            ctx.fillRect(Math.random()*128, Math.random()*128, 15 + Math.random()*20, 15 + Math.random()*20);
        }

        return this.createTextureFromCanvas(canvas);
    }
    
    static generateRoadLines() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#222222';
        ctx.fillRect(0, 0, 64, 128);
        this.addNoise(ctx, 64, 128, 0.08);
        
        ctx.fillStyle = '#cccccc'; // Worn white line
        ctx.fillRect(28, 0, 8, 64); // Half line, half empty for dashing
        
        return this.createTextureFromCanvas(canvas);
    }

    static generateConcrete() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#8a8a8a';
        ctx.fillRect(0, 0, 128, 128);
        this.addNoise(ctx, 128, 128, 0.05); // Menos ruido
        
        // Dibujar un patrón de baldosas (tiles)
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 128; i += 32) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 128);
            ctx.moveTo(0, i);
            ctx.lineTo(128, i);
        }
        ctx.stroke();
        
        return this.createTextureFromCanvas(canvas);
    }
    
    static generateSign() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#ffffe0'; // Yellowish background
        ctx.fillRect(0, 0, 256, 128);
        
        // Bordes oxidados
        ctx.strokeStyle = '#b87333';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 252, 124);
        
        ctx.font = 'bold 36px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        
        // Texto 1
        ctx.fillStyle = '#0055aa';
        ctx.fillText('CEVICHERÍA', 128, 40);
        ctx.fillText('"EL RICO PEZ"', 128, 80);
        
        // Texto 2
        ctx.font = 'bold 24px "Courier New", Courier, monospace';
        ctx.fillStyle = '#cc0000';
        ctx.fillText('¡Al Toque Nomás!', 128, 115);
        
        this.addNoise(ctx, 256, 128, 0.1);
        
        return this.createTextureFromCanvas(canvas);
    }

    static generateMetalRust() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#6ab';
        ctx.fillRect(0, 0, 64, 64);
        
        // Rust spots
        for(let i=0; i<400; i++){
            ctx.fillStyle = Math.random() > 0.5 ? '#8b4513' : '#a0522d';
            ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
        }
        
        return this.createTextureFromCanvas(canvas);
    }

    static generateCanopy() {
        // Stripes blue and yellow
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        for (let i = 0; i < 64; i += 16) {
            ctx.fillStyle = (i % 32 === 0) ? '#0066cc' : '#ffcc00';
            ctx.fillRect(i, 0, 16, 64);
        }
        this.addNoise(ctx, 64, 64, 0.1);
        
        return this.createTextureFromCanvas(canvas);
    }
    
    static generateChichaSign() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#4a004a'; // purple chicha
        ctx.fillRect(0, 0, 128, 64);
        
        ctx.font = 'bold 20px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Chicha', 64, 25);
        ctx.fillText('Morada', 64, 50);
        
        return this.createTextureFromCanvas(canvas);
    }

    static generatePaintedWall(baseColorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = baseColorHex;
        ctx.fillRect(0, 0, 128, 128);
        
        // Ruido tipo estuco/yeso
        this.addNoise(ctx, 128, 128, 0.15);
        
        // Suciedad/humedad en la parte inferior (suelo)
        const grad = ctx.createLinearGradient(0, 96, 0, 128);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(50,40,30,0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 96, 128, 32);
        
        // Algunas imperfecciones o desgaste
        for(let i=0; i<15; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.15})`;
            ctx.fillRect(Math.random()*128, Math.random()*128, 5 + Math.random()*15, 5 + Math.random()*15);
        }

        return this.createTextureFromCanvas(canvas);
    }

    static generateIngredientTexture(ingredientName) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Colores y dibujo especifico por ingrediente
        if (ingredientName === 'Pescado') {
            ctx.fillStyle = '#eeeeee';
            ctx.fillRect(0, 0, 32, 32);
            for(let i=0; i<15; i++) {
                ctx.fillStyle = Math.random() > 0.5 ? '#cccccc' : '#ffaaaa'; // Trocitos y ají
                ctx.fillRect(Math.random()*28, Math.random()*28, 4+Math.random()*4, 4+Math.random()*4);
            }
        } else if (ingredientName === 'Limón') {
            ctx.fillStyle = '#22aa22';
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = '#55ff55';
            ctx.beginPath();
            ctx.arc(16, 16, 14, 0, Math.PI*2);
            ctx.fill();
            ctx.strokeStyle = '#22aa22';
            ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
                ctx.beginPath();
                ctx.moveTo(16, 16);
                ctx.lineTo(16 + Math.cos(i*Math.PI/4)*14, 16 + Math.sin(i*Math.PI/4)*14);
                ctx.stroke();
            }
        } else if (ingredientName === 'Cebolla') {
            ctx.fillStyle = '#aa55aa';
            ctx.fillRect(0, 0, 32, 32);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
                ctx.beginPath();
                ctx.arc(Math.random()*32, Math.random()*32, 8+Math.random()*8, 0, Math.PI);
                ctx.stroke();
            }
        } else if (ingredientName === 'Choclo') {
            ctx.fillStyle = '#ddcc00';
            ctx.fillRect(0, 0, 32, 32);
            ctx.strokeStyle = '#aa8800';
            ctx.lineWidth = 2;
            for(let i=0; i<=32; i+=6) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 32); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(32, i); ctx.stroke();
            }
            ctx.fillStyle = '#ffffff';
            for(let y=3; y<32; y+=6) {
                for(let x=3; x<32; x+=6) {
                    if(Math.random()>0.2) ctx.fillRect(x-1, y-1, 2, 2); // Brillos
                }
            }
        } else if (ingredientName === 'Camote') {
            ctx.fillStyle = '#ff8c00';
            ctx.fillRect(0, 0, 32, 32);
            ctx.fillStyle = '#cc5500';
            for(let i=0; i<8; i++) {
                ctx.beginPath();
                ctx.arc(Math.random()*32, Math.random()*32, 6+Math.random()*6, 0, Math.PI*2);
                ctx.fill();
            }
        } else if (ingredientName === 'Cancha') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(0, 0, 32, 32);
            for(let i=0; i<20; i++) {
                const x = Math.random()*32;
                const y = Math.random()*32;
                ctx.fillStyle = '#cd853f';
                ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#5c2e0b';
                ctx.fillRect(x-1, y-1, 2, 2); // Ojo tostado
            }
        } else if (ingredientName === 'Chicharrón') {
            ctx.fillStyle = '#5c2e0b';
            ctx.fillRect(0, 0, 32, 32);
            for(let i=0; i<12; i++) {
                ctx.fillStyle = '#d2b48c'; // Parte dorada
                ctx.beginPath();
                ctx.arc(Math.random()*32, Math.random()*32, 5+Math.random()*5, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(Math.random()*32, Math.random()*32, 4, 4); // Quemado
            }
        } else {
            // Fallback general
            ctx.fillStyle = '#aaaaaa';
            ctx.fillRect(0, 0, 32, 32);
            this.addNoise(ctx, 32, 32, 0.2);
        }

        return this.createTextureFromCanvas(canvas);
    }

    static addNoise(ctx, width, height, opacity = 0.1) {
        const idata = ctx.getImageData(0, 0, width, height);
        const data = idata.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255 * opacity;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        ctx.putImageData(idata, 0, 0);
    }

    static createTextureFromCanvas(canvas) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter; // PS1 NO-ANTIALIASING EN TEXTURAS (Crucial)
        tex.minFilter = THREE.NearestFilter;
        tex.anisotropy = 1;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }
}
