import { EventBus, EVENTS } from './EventBus.js';

export class OrderManager {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.activeOrders = []; // Max 3
        this.currentSelection = [];
        this.baseIngredients = ['Pescado', 'Limón', 'Cebolla'];
        
        // HUD
        this.container = document.getElementById('orders-container');
    }

    canAddOrder() {
        return this.activeOrders.length < 3;
    }

    addOrder(client) {
        if (!this.canAddOrder()) return false;
        this.activeOrders.push(client);
        this.renderHUD();
        return true;
    }

    removeOrder(client) {
        this.activeOrders = this.activeOrders.filter(o => o !== client);
        this.renderHUD();
    }

    selectIngredient(name) {
        if (!this.currentSelection.includes(name)) {
            this.currentSelection.push(name);
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: `Añadido: ${name}`, color: '#aaffaa' });
            this.updateSelectionHUD();
        } else {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: `Ya elegiste: ${name}`, color: '#ffaaaa' });
        }
    }

    confirmOrder() {
        if (this.currentSelection.length === 0) {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡El plato está vacío!', color: '#ffaaaa' });
            return null;
        }

        const match = this.activeOrders.find(v => this.isOrderMatch(v.order, this.currentSelection));
        
        if (match) {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡Pedido Listo!', color: '#44ff44' });
            const preparedOrder = { ...match };
            this.currentSelection = []; 
            this.updateSelectionHUD();
            return preparedOrder; 
        } else {
            EventBus.emit(EVENTS.SHOW_FEEDBACK, { text: '¡Pedido equivocado! (Reiniciado)', color: '#ff4444' });
            this.currentSelection = [];
            this.updateSelectionHUD();
            return null;
        }
    }

    updateSelectionHUD() {
        const container = document.getElementById('current-selection-container');
        const span = document.getElementById('current-ingredients');
        
        if (this.currentSelection.length > 0) {
            container.style.display = 'block';
            span.textContent = this.currentSelection.join(', ');
        } else {
            container.style.display = 'none';
        }
    }

    isOrderMatch(required, current) {
        if (required.length !== current.length) return false;
        let c = [...current].sort();
        let r = [...required].sort();
        for(let i=0; i<r.length; i++){
            if(r[i] !== c[i]) return false;
        }
        return true;
    }

    renderHUD() {
        this.container.innerHTML = '';
        this.activeOrders.forEach(client => {
            const card = document.createElement('div');
            card.className = 'order-card';
            card.innerHTML = `
                <div style="color:${client.color}; font-weight: bold; display: flex; align-items: center; gap: 5px;">
                    <div style="width: 14px; height: 14px; background-color: ${client.shirtColor}; border: 1px solid #fff;"></div>
                    ${client.type}
                </div>
                <div style="font-size:10px; margin-top: 4px;">Ingredientes:</div>
                <div style="font-size:10px; color:#ccc">${client.order.join(', ')}</div>
                <div style="color:#00ff00; margin-top:4px;">+S/. ${client.price}</div>
                <div class="timer" style="height:4px; background:white; width:100%; margin-top:5px;" id="timer-${client.id}"></div>
            `;
            this.container.appendChild(card);
        });
    }

    updateTimers(delta) {
        for (let i = this.activeOrders.length - 1; i >= 0; i--) {
            const client = this.activeOrders[i];
            client.timeLeft -= delta;

            const timerDiv = document.getElementById(`timer-${client.id}`);
            if (timerDiv) {
                const pct = Math.max(0, client.timeLeft / client.maxTime) * 100;
                timerDiv.style.width = `${pct}%`;
                if (client.timeLeft < 5) {
                    timerDiv.style.background = 'red';
                }
            }

            if (client.timeLeft <= 0) {
                // Fracaso
                client.despawn(true);
                this.removeOrder(client);
            }
        }
    }
}
