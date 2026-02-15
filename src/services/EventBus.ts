export type EventHandler = (...args: unknown[]) => void | Promise<void>;

interface Subscription {
  handler: EventHandler;
  priority: number;
  once: boolean;
}

export class EventBus {
  private listeners = new Map<string, Subscription[]>();
  private wildcardListeners: Subscription[] = [];

  on(event: string, handler: EventHandler, priority = 0): () => void {
    if (event === '*') {
      this.wildcardListeners.push({ handler, priority, once: false });
      this.wildcardListeners.sort((a, b) => b.priority - a.priority);
      return () => this.off('*', handler);
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const subs = this.listeners.get(event)!;
    subs.push({ handler, priority, once: false });
    subs.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, handler);
  }

  once(event: string, handler: EventHandler, priority = 0): () => void {
    if (event === '*') {
      this.wildcardListeners.push({ handler, priority, once: true });
      this.wildcardListeners.sort((a, b) => b.priority - a.priority);
      return () => this.off('*', handler);
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const subs = this.listeners.get(event)!;
    subs.push({ handler, priority, once: true });
    subs.sort((a, b) => b.priority - a.priority);

    return () => this.off(event, handler);
  }

  off(event: string, handler: EventHandler): void {
    if (event === '*') {
      this.wildcardListeners = this.wildcardListeners.filter(
        (s) => s.handler !== handler
      );
      return;
    }

    const subs = this.listeners.get(event);
    if (!subs) return;

    const filtered = subs.filter((s) => s.handler !== handler);
    if (filtered.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filtered);
    }
  }

  async emit(event: string, ...args: unknown[]): Promise<void> {
    const errors: Error[] = [];

    const subs = this.listeners.get(event) ?? [];
    const toRemove: EventHandler[] = [];

    for (const sub of subs) {
      try {
        await sub.handler(...args);
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
      if (sub.once) {
        toRemove.push(sub.handler);
      }
    }

    for (const handler of toRemove) {
      this.off(event, handler);
    }

    // Wildcard listeners receive the event name as the first argument
    const wildcardToRemove: EventHandler[] = [];
    for (const sub of this.wildcardListeners) {
      try {
        await sub.handler(event, ...args);
      } catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
      }
      if (sub.once) {
        wildcardToRemove.push(sub.handler);
      }
    }

    for (const handler of wildcardToRemove) {
      this.off('*', handler);
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `${errors.length} handler(s) threw during "${event}"`
      );
    }
  }

  waitFor(event: string, timeout = 5000): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`waitFor("${event}") timed out after ${timeout}ms`));
      }, timeout);

      const handler: EventHandler = (...args) => {
        clearTimeout(timer);
        resolve(args);
      };

      this.once(event, handler);
    });
  }

  listenerCount(event: string): number {
    if (event === '*') {
      return this.wildcardListeners.length;
    }
    return (this.listeners.get(event) ?? []).length;
  }

  removeAllListeners(event?: string): void {
    if (event === '*') {
      this.wildcardListeners = [];
    } else if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
      this.wildcardListeners = [];
    }
  }
}
