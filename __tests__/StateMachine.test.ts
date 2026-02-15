import { StateMachine } from '../src/models/StateMachine';

type TestState = 'idle' | 'loading' | 'success' | 'error' | 'retry';
type TestEvent = 'FETCH' | 'RESOLVE' | 'REJECT' | 'RETRY' | 'RESET';

const createBasicTransitions = () => [
  { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState },
  { from: 'loading' as TestState, event: 'RESOLVE' as TestEvent, to: 'success' as TestState },
  { from: 'loading' as TestState, event: 'REJECT' as TestEvent, to: 'error' as TestState },
  { from: 'error' as TestState, event: 'RETRY' as TestEvent, to: 'loading' as TestState },
  { from: 'success' as TestState, event: 'RESET' as TestEvent, to: 'idle' as TestState },
  { from: 'error' as TestState, event: 'RESET' as TestEvent, to: 'idle' as TestState },
];

describe('StateMachine', () => {
  let sm: StateMachine<TestState, TestEvent>;

  beforeEach(() => {
    sm = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions());
  });

  describe('create', () => {
    it('should create a StateMachine instance with initial state', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions());
      expect(machine).toBeInstanceOf(StateMachine);
      expect(machine.getState()).toBe('idle');
    });

    it('should create a StateMachine with options', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        maxHistory: 10,
        context: { count: 0 },
      });
      expect(machine.getState()).toBe('idle');
      expect(machine.getContext()).toEqual({ count: 0 });
    });

    it('should create a StateMachine with hooks', () => {
      const onEnter = jest.fn();
      const onExit = jest.fn();
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        hooks: { onEnter, onExit },
      });
      expect(machine.getState()).toBe('idle');
    });

    it('should create a StateMachine with empty transitions array', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', []);
      expect(machine.getState()).toBe('idle');
      expect(machine.getAvailableEvents()).toEqual([]);
    });
  });

  describe('getState', () => {
    it('should return the initial state', () => {
      expect(sm.getState()).toBe('idle');
    });

    it('should return the current state after transition', () => {
      sm.transition('FETCH');
      expect(sm.getState()).toBe('loading');
    });

    it('should return the correct state after multiple transitions', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      expect(sm.getState()).toBe('success');
    });
  });

  describe('getContext', () => {
    it('should return empty context by default', () => {
      expect(sm.getContext()).toEqual({});
    });

    it('should return a copy of the context', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        context: { key: 'value' },
      });
      const ctx = machine.getContext();
      ctx.key = 'modified';
      expect(machine.getContext()).toEqual({ key: 'value' });
    });

    it('should return context set via options', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        context: { foo: 'bar', num: 42 },
      });
      expect(machine.getContext()).toEqual({ foo: 'bar', num: 42 });
    });
  });

  describe('setContext', () => {
    it('should update the context', () => {
      sm.setContext({ key: 'value' });
      expect(sm.getContext()).toEqual({ key: 'value' });
    });

    it('should merge with existing context', () => {
      sm.setContext({ a: 1 });
      sm.setContext({ b: 2 });
      expect(sm.getContext()).toEqual({ a: 1, b: 2 });
    });

    it('should overwrite existing keys', () => {
      sm.setContext({ a: 1 });
      sm.setContext({ a: 2 });
      expect(sm.getContext()).toEqual({ a: 2 });
    });

    it('should handle empty update', () => {
      sm.setContext({ a: 1 });
      sm.setContext({});
      expect(sm.getContext()).toEqual({ a: 1 });
    });
  });

  describe('getHistory', () => {
    it('should return empty history initially', () => {
      expect(sm.getHistory()).toEqual([]);
    });

    it('should return a copy of the history', () => {
      sm.transition('FETCH');
      const history = sm.getHistory();
      history.push('error');
      expect(sm.getHistory()).toEqual(['idle']);
    });

    it('should track state transitions in history', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      expect(sm.getHistory()).toEqual(['idle', 'loading']);
    });

    it('should respect maxHistory', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        maxHistory: 2,
      });
      machine.transition('FETCH');
      machine.transition('RESOLVE');
      machine.transition('RESET');
      expect(machine.getHistory()).toEqual(['loading', 'success']);
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transitions', () => {
      expect(sm.canTransition('FETCH')).toBe(true);
    });

    it('should return false for invalid transitions', () => {
      expect(sm.canTransition('RESOLVE')).toBe(false);
    });

    it('should return false for events not in transitions', () => {
      expect(sm.canTransition('RETRY')).toBe(false);
    });

    it('should respect guard conditions', () => {
      const transitions = [
        {
          from: 'idle' as TestState,
          event: 'FETCH' as TestEvent,
          to: 'loading' as TestState,
          guard: (ctx: Record<string, unknown>) => (ctx.allowed as boolean) === true,
        },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.canTransition('FETCH')).toBe(false);

      machine.setContext({ allowed: true });
      expect(machine.canTransition('FETCH')).toBe(true);
    });

    it('should return true when guard returns true', () => {
      const transitions = [
        {
          from: 'idle' as TestState,
          event: 'FETCH' as TestEvent,
          to: 'loading' as TestState,
          guard: () => true,
        },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.canTransition('FETCH')).toBe(true);
    });

    it('should return false when guard returns false', () => {
      const transitions = [
        {
          from: 'idle' as TestState,
          event: 'FETCH' as TestEvent,
          to: 'loading' as TestState,
          guard: () => false,
        },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.canTransition('FETCH')).toBe(false);
    });
  });

  describe('getAvailableEvents', () => {
    it('should return available events for current state', () => {
      expect(sm.getAvailableEvents()).toEqual(['FETCH']);
    });

    it('should return multiple events when available', () => {
      sm.transition('FETCH');
      sm.transition('REJECT');
      const events = sm.getAvailableEvents();
      expect(events).toContain('RETRY');
      expect(events).toContain('RESET');
      expect(events).toHaveLength(2);
    });

    it('should return empty array when no events available', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', []);
      expect(machine.getAvailableEvents()).toEqual([]);
    });

    it('should deduplicate events', () => {
      const transitions = [
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState, guard: () => true },
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'error' as TestState, guard: () => true },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.getAvailableEvents()).toEqual(['FETCH']);
    });

    it('should filter out events with failing guards', () => {
      const transitions = [
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState, guard: () => false },
        { from: 'idle' as TestState, event: 'RESET' as TestEvent, to: 'idle' as TestState },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.getAvailableEvents()).toEqual(['RESET']);
    });
  });

  describe('transition', () => {
    it('should transition to the correct state', () => {
      const result = sm.transition('FETCH');
      expect(result).toBe('loading');
      expect(sm.getState()).toBe('loading');
    });

    it('should throw error for invalid transition', () => {
      expect(() => sm.transition('RESOLVE')).toThrow(
        'No valid transition for event "RESOLVE" from state "idle". Available events: [FETCH]'
      );
    });

    it('should add previous state to history', () => {
      sm.transition('FETCH');
      expect(sm.getHistory()).toEqual(['idle']);
    });

    it('should call onExit hook', () => {
      const onExit = jest.fn();
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        hooks: { onExit },
      });
      machine.transition('FETCH');
      expect(onExit).toHaveBeenCalledWith('idle', 'loading');
    });

    it('should call onEnter hook', () => {
      const onEnter = jest.fn();
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        hooks: { onEnter },
      });
      machine.transition('FETCH');
      expect(onEnter).toHaveBeenCalledWith('loading', 'idle');
    });

    it('should call onExit before onEnter', () => {
      const callOrder: string[] = [];
      const onExit = jest.fn(() => callOrder.push('exit'));
      const onEnter = jest.fn(() => callOrder.push('enter'));
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        hooks: { onExit, onEnter },
      });
      machine.transition('FETCH');
      expect(callOrder).toEqual(['exit', 'enter']);
    });

    it('should respect guard conditions during transition', () => {
      const transitions = [
        {
          from: 'idle' as TestState,
          event: 'FETCH' as TestEvent,
          to: 'loading' as TestState,
          guard: (ctx: Record<string, unknown>) => (ctx.allowed as boolean) === true,
        },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(() => machine.transition('FETCH')).toThrow();

      machine.setContext({ allowed: true });
      expect(machine.transition('FETCH')).toBe('loading');
    });

    it('should enforce maxHistory limit', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        maxHistory: 2,
      });
      machine.transition('FETCH');       // history: ['idle']
      machine.transition('RESOLVE');     // history: ['idle', 'loading']
      machine.transition('RESET');       // history: ['loading', 'success'] (shifted 'idle')
      expect(machine.getHistory()).toEqual(['loading', 'success']);
    });

    it('should return the new state', () => {
      const result = sm.transition('FETCH');
      expect(result).toBe('loading');
    });

    it('should throw with available events in error message', () => {
      sm.transition('FETCH');
      expect(() => sm.transition('FETCH')).toThrow('Available events: [RESOLVE, REJECT]');
    });

    it('should throw with empty available events when none exist', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', []);
      expect(() => machine.transition('FETCH')).toThrow('Available events: []');
    });

    it('should find the first matching transition rule', () => {
      const transitions = [
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState },
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'error' as TestState },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.transition('FETCH')).toBe('loading');
    });

    it('should skip transition with failing guard and use next matching', () => {
      const transitions = [
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState, guard: () => false },
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'error' as TestState, guard: () => true },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);
      expect(machine.transition('FETCH')).toBe('error');
    });
  });

  describe('undo', () => {
    it('should undo the last transition', () => {
      sm.transition('FETCH');
      const result = sm.undo();
      expect(result).toBe('idle');
      expect(sm.getState()).toBe('idle');
    });

    it('should throw when no history to undo', () => {
      expect(() => sm.undo()).toThrow('No history to undo');
    });

    it('should undo multiple transitions', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      sm.undo();
      expect(sm.getState()).toBe('loading');
      sm.undo();
      expect(sm.getState()).toBe('idle');
    });

    it('should remove the last entry from history', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      expect(sm.getHistory()).toEqual(['idle', 'loading']);
      sm.undo();
      expect(sm.getHistory()).toEqual(['idle']);
    });

    it('should throw after undoing all history', () => {
      sm.transition('FETCH');
      sm.undo();
      expect(() => sm.undo()).toThrow('No history to undo');
    });
  });

  describe('reset', () => {
    it('should reset to the given state', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      sm.reset('idle');
      expect(sm.getState()).toBe('idle');
    });

    it('should clear history', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      sm.reset('idle');
      expect(sm.getHistory()).toEqual([]);
    });

    it('should clear context', () => {
      sm.setContext({ key: 'value' });
      sm.reset('idle');
      expect(sm.getContext()).toEqual({});
    });

    it('should allow resetting to a different state', () => {
      sm.reset('error');
      expect(sm.getState()).toBe('error');
    });

    it('should allow transitions after reset', () => {
      sm.transition('FETCH');
      sm.reset('idle');
      expect(sm.transition('FETCH')).toBe('loading');
    });
  });

  describe('serialize', () => {
    it('should serialize the current state', () => {
      const json = sm.serialize();
      const parsed = JSON.parse(json);
      expect(parsed.current).toBe('idle');
      expect(parsed.history).toEqual([]);
      expect(parsed.context).toEqual({});
    });

    it('should serialize after transitions', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      const json = sm.serialize();
      const parsed = JSON.parse(json);
      expect(parsed.current).toBe('success');
      expect(parsed.history).toEqual(['idle', 'loading']);
    });

    it('should serialize context', () => {
      sm.setContext({ key: 'value' });
      const json = sm.serialize();
      const parsed = JSON.parse(json);
      expect(parsed.context).toEqual({ key: 'value' });
    });

    it('should return valid JSON string', () => {
      const json = sm.serialize();
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should not be affected by modifying the serialized output', () => {
      sm.transition('FETCH');
      const json = sm.serialize();
      const parsed = JSON.parse(json);
      parsed.history.push('extra');
      expect(sm.getHistory()).toEqual(['idle']);
    });
  });

  describe('deserialize', () => {
    it('should restore state from JSON', () => {
      const snapshot = JSON.stringify({
        current: 'loading',
        history: ['idle'],
        context: { key: 'value' },
      });
      sm.deserialize(snapshot);
      expect(sm.getState()).toBe('loading');
      expect(sm.getHistory()).toEqual(['idle']);
      expect(sm.getContext()).toEqual({ key: 'value' });
    });

    it('should throw for invalid snapshot format (missing current)', () => {
      const snapshot = JSON.stringify({
        history: [],
        context: {},
      });
      expect(() => sm.deserialize(snapshot)).toThrow('Invalid snapshot format');
    });

    it('should throw for invalid snapshot format (missing history array)', () => {
      const snapshot = JSON.stringify({
        current: 'idle',
        history: 'not-an-array',
        context: {},
      });
      expect(() => sm.deserialize(snapshot)).toThrow('Invalid snapshot format');
    });

    it('should throw for invalid JSON', () => {
      expect(() => sm.deserialize('not-json')).toThrow();
    });

    it('should default context to empty object when not provided', () => {
      const snapshot = JSON.stringify({
        current: 'idle',
        history: [],
      });
      sm.deserialize(snapshot);
      expect(sm.getContext()).toEqual({});
    });

    it('should replace existing history completely', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      const snapshot = JSON.stringify({
        current: 'error',
        history: ['idle'],
        context: {},
      });
      sm.deserialize(snapshot);
      expect(sm.getHistory()).toEqual(['idle']);
      expect(sm.getState()).toBe('error');
    });

    it('should work with serialize (round-trip)', () => {
      sm.transition('FETCH');
      sm.transition('RESOLVE');
      sm.setContext({ round: 'trip' });
      const json = sm.serialize();

      const newMachine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions());
      newMachine.deserialize(json);

      expect(newMachine.getState()).toBe('success');
      expect(newMachine.getHistory()).toEqual(['idle', 'loading']);
      expect(newMachine.getContext()).toEqual({ round: 'trip' });
    });

    it('should throw for empty current string', () => {
      const snapshot = JSON.stringify({
        current: '',
        history: [],
        context: {},
      });
      expect(() => sm.deserialize(snapshot)).toThrow('Invalid snapshot format');
    });

    it('should handle deserialization with null context', () => {
      const snapshot = JSON.stringify({
        current: 'idle',
        history: [],
        context: null,
      });
      sm.deserialize(snapshot);
      expect(sm.getContext()).toEqual({});
    });

    it('should handle deserialization with undefined context (missing key)', () => {
      const snapshot = JSON.stringify({
        current: 'idle',
        history: ['loading'],
      });
      sm.deserialize(snapshot);
      expect(sm.getContext()).toEqual({});
      expect(sm.getHistory()).toEqual(['loading']);
    });
  });

  describe('integration scenarios', () => {
    it('should handle a full lifecycle: transition, undo, reset, serialize, deserialize', () => {
      sm.transition('FETCH');
      sm.transition('REJECT');
      sm.setContext({ retries: 1 });

      expect(sm.getState()).toBe('error');
      expect(sm.canTransition('RETRY')).toBe(true);

      sm.transition('RETRY');
      expect(sm.getState()).toBe('loading');

      sm.undo();
      expect(sm.getState()).toBe('error');

      const json = sm.serialize();
      sm.reset('idle');
      expect(sm.getState()).toBe('idle');
      expect(sm.getHistory()).toEqual([]);

      sm.deserialize(json);
      expect(sm.getState()).toBe('error');
      expect(sm.getContext()).toEqual({ retries: 1 });
    });

    it('should handle guard-based transitions with context changes', () => {
      const transitions = [
        {
          from: 'idle' as TestState,
          event: 'FETCH' as TestEvent,
          to: 'loading' as TestState,
          guard: (ctx: Record<string, unknown>) => (ctx.retries as number) < 3,
        },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions, {
        context: { retries: 0 },
      });

      expect(machine.canTransition('FETCH')).toBe(true);
      machine.setContext({ retries: 3 });
      expect(machine.canTransition('FETCH')).toBe(false);
      expect(machine.getAvailableEvents()).toEqual([]);
    });

    it('should handle maxHistory of 1', () => {
      const machine = StateMachine.create<TestState, TestEvent>('idle', createBasicTransitions(), {
        maxHistory: 1,
      });
      machine.transition('FETCH');
      machine.transition('RESOLVE');
      expect(machine.getHistory()).toEqual(['loading']);
      machine.transition('RESET');
      expect(machine.getHistory()).toEqual(['success']);
    });

    it('should handle default maxHistory of 50', () => {
      const transitions = [
        { from: 'idle' as TestState, event: 'FETCH' as TestEvent, to: 'loading' as TestState },
        { from: 'loading' as TestState, event: 'RESET' as TestEvent, to: 'idle' as TestState },
      ];
      const machine = StateMachine.create<TestState, TestEvent>('idle', transitions);

      for (let i = 0; i < 60; i++) {
        machine.transition('FETCH');
        machine.transition('RESET');
      }

      expect(machine.getHistory().length).toBe(50);
    });
  });
});