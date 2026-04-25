class EventBusClass {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, payload) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(payload));
    }
}

export const EventBus = new EventBusClass();

export const EVENTS = {
    CART_KNOCKED_DOWN: 'CART_KNOCKED_DOWN',
    CART_RECOVERED: 'CART_RECOVERED',
    MONEY_CHANGED: 'MONEY_CHANGED',
    GAME_OVER: 'GAME_OVER',
    SHOW_FEEDBACK: 'SHOW_FEEDBACK',
    CINEMATIC_START: 'CINEMATIC_START'
};
