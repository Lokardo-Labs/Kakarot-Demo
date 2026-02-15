export interface TransitionRule<TState extends string, TEvent extends string> {
  from: TState;
  to: TState;
  event: TEvent;
  guard?: (context: Record<string, unknown>) => boolean;
}

export interface LifecycleHooks<TState extends string> {
  onEnter?: (state: TState, previous: TState | null) => void;
  onExit?: (state: TState, next: TState) => void;
}

export interface StateMachineSnapshot<TState extends string> {
  current: TState;
  history: TState[];
  context: Record<string, unknown>;
}

export class StateMachine<TState extends string, TEvent extends string> {
  private current: TState;
  private readonly transitions: TransitionRule<TState, TEvent>[];
  private readonly history: TState[] = [];
  private readonly maxHistory: number;
  private context: Record<string, unknown>;
  private hooks: LifecycleHooks<TState>;

  constructor(
    initial: TState,
    transitions: TransitionRule<TState, TEvent>[],
    options: {
      maxHistory?: number;
      context?: Record<string, unknown>;
      hooks?: LifecycleHooks<TState>;
    } = {}
  ) {
    this.current = initial;
    this.transitions = transitions;
    this.maxHistory = options.maxHistory ?? 50;
    this.context = options.context ?? {};
    this.hooks = options.hooks ?? {};
  }

  static create<S extends string, E extends string>(
    initial: S,
    transitions: TransitionRule<S, E>[],
    options?: { maxHistory?: number; context?: Record<string, unknown>; hooks?: LifecycleHooks<S> }
  ): StateMachine<S, E> {
    return new StateMachine(initial, transitions, options);
  }

  getState(): TState {
    return this.current;
  }

  getContext(): Record<string, unknown> {
    return { ...this.context };
  }

  setContext(update: Record<string, unknown>): void {
    this.context = { ...this.context, ...update };
  }

  getHistory(): TState[] {
    return [...this.history];
  }

  canTransition(event: TEvent): boolean {
    return this.transitions.some(
      (t) =>
        t.from === this.current &&
        t.event === event &&
        (!t.guard || t.guard(this.context))
    );
  }

  getAvailableEvents(): TEvent[] {
    return [
      ...new Set(
        this.transitions
          .filter(
            (t) =>
              t.from === this.current &&
              (!t.guard || t.guard(this.context))
          )
          .map((t) => t.event)
      ),
    ];
  }

  transition(event: TEvent): TState {
    const rule = this.transitions.find(
      (t) =>
        t.from === this.current &&
        t.event === event &&
        (!t.guard || t.guard(this.context))
    );

    if (!rule) {
      const available = this.getAvailableEvents();
      throw new Error(
        `No valid transition for event "${event}" from state "${this.current}". ` +
          `Available events: [${available.join(', ')}]`
      );
    }

    const previous = this.current;

    this.hooks.onExit?.(previous, rule.to);

    this.history.push(previous);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.current = rule.to;

    this.hooks.onEnter?.(this.current, previous);

    return this.current;
  }

  undo(): TState {
    const previous = this.history.pop();
    if (previous === undefined) {
      throw new Error('No history to undo');
    }
    this.current = previous;
    return this.current;
  }

  reset(initial: TState): void {
    this.current = initial;
    this.history.length = 0;
    this.context = {};
  }

  serialize(): string {
    const snapshot: StateMachineSnapshot<TState> = {
      current: this.current,
      history: [...this.history],
      context: this.context,
    };
    return JSON.stringify(snapshot);
  }

  deserialize(json: string): void {
    const snapshot: StateMachineSnapshot<TState> = JSON.parse(json);
    if (!snapshot.current || !Array.isArray(snapshot.history)) {
      throw new Error('Invalid snapshot format');
    }
    this.current = snapshot.current;
    this.history.length = 0;
    this.history.push(...snapshot.history);
    this.context = snapshot.context ?? {};
  }
}
