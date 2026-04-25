import { EventBus, EVENTS } from './EventBus.js';
import { Config } from './Config.js';

export class GameManager {
    constructor() {
        this.money = 490; // Empezar con 490 para probar rápido
        this.goal = Config.WIN_MONEY;
        this.isGameOver = false;

        this.updateHUD();

        // Listeners globales del HUD
        EventBus.on(EVENTS.SHOW_FEEDBACK, (data) => this.showFeedback(data.text, data.color));
    }

    addMoney(amount) {
        if (this.isGameOver) return;
        this.money += amount;
        this.updateHUD();

        if (this.money >= this.goal) {
            this.winGame();
        }
    }

    updateHUD() {
        document.getElementById('money-amount').innerText = this.money;
    }

    showFeedback(text, color) {
        const prompt = document.getElementById('interaction-prompt');
        prompt.innerText = text;
        prompt.style.color = color;
        prompt.style.display = 'block';
        setTimeout(() => {
            prompt.style.display = 'none';
        }, 2000);
    }

    winGame() {
        this.isGameOver = true;
        document.exitPointerLock();
        EventBus.emit(EVENTS.CINEMATIC_START, { goal: this.goal });
    }
}
