import { EventBus } from '../src/services/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    jest.useFakeTimers();
    bus = new EventBus();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('on', () => {
    it('should register a handler and call it on emit', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('test', 'arg1', 'arg2');
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should return an unsubscribe function', async () => {
      const handler = jest.fn();
      const unsub = bus.on('test', handler);
      unsub();
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should call handlers in priority order (higher priority first)', async () => {
      const order: number[] = [];
      bus.on('test', () => { order.push(1); }, 1);
      bus.on('test', () => { order.push(10); }, 10);
      bus.on('test', () => { order.push(5); }, 5);
      await bus.emit('test');
      expect(order).toEqual([10, 5, 1]);
    });

    it('should use default priority of 0', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      expect(bus.listenerCount('test')).toBe(1);
      await bus.emit('test');
      expect(handler).toHaveBeenCalled();
    });

    it('should register wildcard listener with *', async () => {
      const handler = jest.fn();
      bus.on('*', handler);
      await bus.emit('someEvent', 'data');
      expect(handler).toHaveBeenCalledWith('someEvent', 'data');
    });

    it('should call wildcard handler for every event', async () => {
      const handler = jest.fn();
      bus.on('*', handler);
      await bus.emit('event1');
      await bus.emit('event2');
      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith('event1');
      expect(handler).toHaveBeenCalledWith('event2');
    });

    it('should sort wildcard listeners by priority', async () => {
      const order: number[] = [];
      bus.on('*', () => { order.push(1); }, 1);
      bus.on('*', () => { order.push(10); }, 10);
      await bus.emit('test');
      expect(order).toEqual([10, 1]);
    });

    it('should allow multiple handlers for the same event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      await bus.emit('test');
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not call handler for different event', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('other');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should call handler multiple times on multiple emits', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('test');
      await bus.emit('test');
      await bus.emit('test');
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('once', () => {
    it('should register a handler that fires only once', async () => {
      const handler = jest.fn();
      bus.once('test', handler);
      await bus.emit('test');
      await bus.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', async () => {
      const handler = jest.fn();
      const unsub = bus.once('test', handler);
      unsub();
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should pass arguments to the handler', async () => {
      const handler = jest.fn();
      bus.once('test', handler);
      await bus.emit('test', 'a', 'b');
      expect(handler).toHaveBeenCalledWith('a', 'b');
    });

    it('should respect priority ordering', async () => {
      const order: number[] = [];
      bus.once('test', () => { order.push(1); }, 1);
      bus.once('test', () => { order.push(10); }, 10);
      await bus.emit('test');
      expect(order).toEqual([10, 1]);
    });

    it('should register wildcard once listener', async () => {
      const handler = jest.fn();
      bus.once('*', handler);
      await bus.emit('event1');
      await bus.emit('event2');
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith('event1');
    });

    it('should remove once listener after emit and update listener count', async () => {
      const handler = jest.fn();
      bus.once('test', handler);
      expect(bus.listenerCount('test')).toBe(1);
      await bus.emit('test');
      expect(bus.listenerCount('test')).toBe(0);
    });

    it('should remove wildcard once listener after emit', async () => {
      const handler = jest.fn();
      bus.once('*', handler);
      expect(bus.listenerCount('*')).toBe(1);
      await bus.emit('test');
      expect(bus.listenerCount('*')).toBe(0);
    });
  });

  describe('off', () => {
    it('should remove a specific handler', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      bus.off('test', handler);
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not affect other handlers for the same event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.off('test', handler1);
      await bus.emit('test');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove wildcard handler', async () => {
      const handler = jest.fn();
      bus.on('*', handler);
      bus.off('*', handler);
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should do nothing if event has no listeners', () => {
      const handler = jest.fn();
      expect(() => bus.off('nonexistent', handler)).not.toThrow();
    });

    it('should do nothing if handler is not registered for the event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      bus.on('test', handler1);
      bus.off('test', handler2);
      await bus.emit('test');
      expect(handler1).toHaveBeenCalled();
    });

    it('should clean up the event entry when last handler is removed', () => {
      const handler = jest.fn();
      bus.on('test', handler);
      expect(bus.listenerCount('test')).toBe(1);
      bus.off('test', handler);
      expect(bus.listenerCount('test')).toBe(0);
    });
  });

  describe('emit', () => {
    it('should call all handlers for the event', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      await bus.emit('test');
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should pass arguments to handlers', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('test', 1, 'two', { three: 3 });
      expect(handler).toHaveBeenCalledWith(1, 'two', { three: 3 });
    });

    it('should call wildcard listeners with event name as first arg', async () => {
      const handler = jest.fn();
      bus.on('*', handler);
      await bus.emit('myEvent', 'data');
      expect(handler).toHaveBeenCalledWith('myEvent', 'data');
    });

    it('should call both specific and wildcard listeners', async () => {
      const specific = jest.fn();
      const wildcard = jest.fn();
      bus.on('test', specific);
      bus.on('*', wildcard);
      await bus.emit('test', 'arg');
      expect(specific).toHaveBeenCalledWith('arg');
      expect(wildcard).toHaveBeenCalledWith('test', 'arg');
    });

    it('should call specific listeners before wildcard listeners', async () => {
      const order: string[] = [];
      bus.on('test', () => { order.push('specific'); });
      bus.on('*', () => { order.push('wildcard'); });
      await bus.emit('test');
      expect(order).toEqual(['specific', 'wildcard']);
    });

    it('should throw AggregateError when handler throws', async () => {
      bus.on('test', () => { throw new Error('handler error'); });
      await expect(bus.emit('test')).rejects.toThrow(AggregateError);
    });

    it('should include all errors in AggregateError', async () => {
      bus.on('test', () => { throw new Error('error1'); });
      bus.on('test', () => { throw new Error('error2'); });
      try {
        await bus.emit('test');
        fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AggregateError);
        const aggErr = err as AggregateError;
        expect(aggErr.errors).toHaveLength(2);
        expect(aggErr.errors[0]).toEqual(new Error('error1'));
        expect(aggErr.errors[1]).toEqual(new Error('error2'));
      }
    });

    it('should convert non-Error throws to Error objects', async () => {
      bus.on('test', () => { throw 'string error'; });
      try {
        await bus.emit('test');
        fail('should have thrown');
      } catch (err) {
        const aggErr = err as AggregateError;
        expect(aggErr.errors[0]).toBeInstanceOf(Error);
        expect(aggErr.errors[0].message).toBe('string error');
      }
    });

    it('should include error count and event name in AggregateError message', async () => {
      bus.on('myEvent', () => { throw new Error('fail'); });
      try {
        await bus.emit('myEvent');
        fail('should have thrown');
      } catch (err) {
        const aggErr = err as AggregateError;
        expect(aggErr.message).toBe('1 handler(s) threw during "myEvent"');
      }
    });

    it('should still call all handlers even if some throw', async () => {
      const handler1 = jest.fn(() => { throw new Error('fail'); });
      const handler2 = jest.fn();
      bus.on('test', handler1, 10);
      bus.on('test', handler2, 1);
      try {
        await bus.emit('test');
      } catch {
        // expected
      }
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should handle async handlers', async () => {
      const handler = jest.fn(async () => {});
      bus.on('test', handler);
      await bus.emit('test');
      expect(handler).toHaveBeenCalled();
    });

    it('should handle async handler errors', async () => {
      bus.on('test', async () => {
        throw new Error('async error');
      });
      await expect(bus.emit('test')).rejects.toThrow(AggregateError);
    });

    it('should resolve without error when no listeners exist', async () => {
      await expect(bus.emit('nonexistent')).resolves.toBeUndefined();
    });

    it('should remove once handlers after emit but still call them', async () => {
      const onceHandler = jest.fn();
      const regularHandler = jest.fn();
      bus.once('test', onceHandler);
      bus.on('test', regularHandler);
      await bus.emit('test');
      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(regularHandler).toHaveBeenCalledTimes(1);
      await bus.emit('test');
      expect(onceHandler).toHaveBeenCalledTimes(1);
      expect(regularHandler).toHaveBeenCalledTimes(2);
    });

    it('should collect errors from both specific and wildcard handlers', async () => {
      bus.on('test', () => { throw new Error('specific error'); });
      bus.on('*', () => { throw new Error('wildcard error'); });
      try {
        await bus.emit('test');
        fail('should have thrown');
      } catch (err) {
        const aggErr = err as AggregateError;
        expect(aggErr.errors).toHaveLength(2);
      }
    });

    it('should emit with no arguments', async () => {
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('test');
      expect(handler).toHaveBeenCalledWith();
    });
  });

  describe('waitFor', () => {
    it('should resolve when the event is emitted', async () => {
      const promise = bus.waitFor('test');
      await bus.emit('test', 'data1', 'data2');
      const result = await promise;
      expect(result).toEqual(['data1', 'data2']);
    });

    it('should reject on timeout', async () => {
      const promise = bus.waitFor('test', 1000).catch((e: unknown) => e);
      jest.advanceTimersByTime(1000);
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('waitFor("test") timed out after 1000ms');
    });

    it('should use default timeout of 5000ms', async () => {
      const promise = bus.waitFor('test').catch((e: unknown) => e);
      jest.advanceTimersByTime(4999);
      // Should not have rejected yet
      jest.advanceTimersByTime(1);
      const error = await promise;
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('waitFor("test") timed out after 5000ms');
    });

    it('should not reject if event fires before timeout', async () => {
      const promise = bus.waitFor('test', 1000);
      await bus.emit('test', 'value');
      jest.advanceTimersByTime(1000);
      const result = await promise;
      expect(result).toEqual(['value']);
    });

    it('should resolve with empty array when event emitted with no args', async () => {
      const promise = bus.waitFor('test');
      await bus.emit('test');
      const result = await promise;
      expect(result).toEqual([]);
    });

    it('should only fire once (uses once internally)', async () => {
      const promise = bus.waitFor('test');
      await bus.emit('test', 'first');
      const result = await promise;
      expect(result).toEqual(['first']);
      expect(bus.listenerCount('test')).toBe(0);
    });

    it('should remove handler on timeout', async () => {
      const promise = bus.waitFor('test', 100).catch(() => {});
      expect(bus.listenerCount('test')).toBe(1);
      jest.advanceTimersByTime(100);
      await promise;
      expect(bus.listenerCount('test')).toBe(0);
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for event with no listeners', () => {
      expect(bus.listenerCount('test')).toBe(0);
    });

    it('should return correct count for registered listeners', () => {
      bus.on('test', jest.fn());
      bus.on('test', jest.fn());
      expect(bus.listenerCount('test')).toBe(2);
    });

    it('should return wildcard listener count for *', () => {
      bus.on('*', jest.fn());
      bus.on('*', jest.fn());
      bus.on('*', jest.fn());
      expect(bus.listenerCount('*')).toBe(3);
    });

    it('should not count listeners from other events', () => {
      bus.on('event1', jest.fn());
      bus.on('event2', jest.fn());
      expect(bus.listenerCount('event1')).toBe(1);
      expect(bus.listenerCount('event2')).toBe(1);
    });

    it('should decrease after off', () => {
      const handler = jest.fn();
      bus.on('test', handler);
      expect(bus.listenerCount('test')).toBe(1);
      bus.off('test', handler);
      expect(bus.listenerCount('test')).toBe(0);
    });

    it('should include once listeners in count', () => {
      bus.once('test', jest.fn());
      expect(bus.listenerCount('test')).toBe(1);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for a specific event', () => {
      bus.on('test', jest.fn());
      bus.on('test', jest.fn());
      bus.on('other', jest.fn());
      bus.removeAllListeners('test');
      expect(bus.listenerCount('test')).toBe(0);
      expect(bus.listenerCount('other')).toBe(1);
    });

    it('should remove all wildcard listeners when event is *', () => {
      bus.on('*', jest.fn());
      bus.on('*', jest.fn());
      bus.on('test', jest.fn());
      bus.removeAllListeners('*');
      expect(bus.listenerCount('*')).toBe(0);
      expect(bus.listenerCount('test')).toBe(1);
    });

    it('should remove all listeners when no event specified', () => {
      bus.on('event1', jest.fn());
      bus.on('event2', jest.fn());
      bus.on('*', jest.fn());
      bus.removeAllListeners();
      expect(bus.listenerCount('event1')).toBe(0);
      expect(bus.listenerCount('event2')).toBe(0);
      expect(bus.listenerCount('*')).toBe(0);
    });

    it('should not throw when removing listeners for event with none', () => {
      expect(() => bus.removeAllListeners('nonexistent')).not.toThrow();
    });

    it('should not affect functionality after removing all', async () => {
      bus.on('test', jest.fn());
      bus.removeAllListeners();
      const handler = jest.fn();
      bus.on('test', handler);
      await bus.emit('test');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle mixed on and once listeners correctly', async () => {
      const onHandler = jest.fn();
      const onceHandler = jest.fn();
      bus.on('test', onHandler);
      bus.once('test', onceHandler);
      await bus.emit('test');
      await bus.emit('test');
      expect(onHandler).toHaveBeenCalledTimes(2);
      expect(onceHandler).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe from on() return value', async () => {
      const handler = jest.fn();
      const unsub = bus.on('test', handler);
      await bus.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
      await bus.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe from once() return value', async () => {
      const handler = jest.fn();
      const unsub = bus.once('test', handler);
      unsub();
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle wildcard unsubscribe from on() return value', async () => {
      const handler = jest.fn();
      const unsub = bus.on('*', handler);
      unsub();
      await bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle priority across on and once', async () => {
      const order: string[] = [];
      bus.on('test', () => { order.push('on-low'); }, 1);
      bus.once('test', () => { order.push('once-high'); }, 10);
      bus.on('test', () => { order.push('on-mid'); }, 5);
      await bus.emit('test');
      expect(order).toEqual(['once-high', 'on-mid', 'on-low']);
    });

    it('should handle multiple waitFor on same event', async () => {
      const promise1 = bus.waitFor('test');
      const promise2 = bus.waitFor('test');
      await bus.emit('test', 'value');
      const result1 = await promise1;
      const result2 = await promise2;
      expect(result1).toEqual(['value']);
      expect(result2).toEqual(['value']);
    });

    it('should handle removing a handler that was never added', () => {
      expect(() => bus.off('test', jest.fn())).not.toThrow();
    });

    it('should handle emit with wildcard once listeners that throw', async () => {
      bus.once('*', () => { throw new Error('wildcard once error'); });
      try {
        await bus.emit('test');
      } catch (err) {
        const aggErr = err as AggregateError;
        expect(aggErr.errors).toHaveLength(1);
        expect(aggErr.errors[0].message).toBe('wildcard once error');
      }
      expect(bus.listenerCount('*')).toBe(0);
    });
  });
});