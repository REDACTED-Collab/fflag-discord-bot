export class BotState {
    private static instance: BotState;
    private states: Map<string, any>;

    private constructor() {
        this.states = new Map();
    }

    public static getInstance(): BotState {
        if (!BotState.instance) {
            BotState.instance = new BotState();
        }
        return BotState.instance;
    }

    public setState(key: string, value: any): void {
        this.states.set(key, value);
    }

    public getState(key: string): any {
        return this.states.get(key);
    }
}

export const botState = BotState.getInstance();
