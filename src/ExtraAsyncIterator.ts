import { AsyncIterator } from 'async-iterator-helpers-ponyfill';
import { ExtraIterator } from './ExtraIterator';

export type FlattenedExtraAsyncIterator<T>
	= T extends Iterable<infer U> ? FlattenedExtraAsyncIterator<U>
		: T extends AsyncIterable<infer U> ? FlattenedExtraAsyncIterator<U>
		: ExtraAsyncIterator<T>;

export type UnsubscribeFn = () => void;

export type ListenerFn<T extends unknown[]> = (...args: [...T]) => void

export type SubscribeFn<T extends unknown[]> = (listener: ListenerFn<T>) => UnsubscribeFn;

export class ExtraAsyncIterator<T> extends AsyncIterator<T> implements AsyncIterable<T> {

	// =================================================================================================================
	// STATIC FUNCTIONS & CONSTRUCTOR
	// =================================================================================================================

	public static override from<T>(source: Parameters<typeof AsyncIterator.from<T>>[0]) {
		return new ExtraAsyncIterator(AsyncIterator.from(source));
	}

	public static fromEvents(
		target: EventTarget,
		event: string,
		{
			closeEvent = undefined as string | undefined,
			errorEvent = undefined as string | undefined,
			signal = undefined as AbortSignal | undefined,
		} = {},
	): ExtraAsyncIterator<unknown[]> {
		const { iterator, controller } = ExtraAsyncIterator.withController<unknown[]>();
		const aborter = new AbortController();

		if (signal) {
			signal.addEventListener('abort', () => {
				controller.close();
				aborter.abort();
			});
		} else {
			signal = aborter.signal;
		}
		target.addEventListener(event, (...args: unknown[]) => {
			controller.enqueue(args);
		}, { signal });
		if (closeEvent) {
			target.addEventListener(closeEvent, () => {
				controller.close();
				aborter.abort();
			}, { signal });
		}
		if (errorEvent) {
			target.addEventListener(errorEvent, error => {
				controller.error(error);
				aborter.abort();
			}, { signal });
		}

		return iterator;
	}

	public static fromInterval(
		duration: number | Temporal.Duration,
		{ signal = null as AbortSignal | null } = {},
	): ExtraAsyncIterator<void> {
		const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<void>();

		const intervalId = setInterval(() => {
			controller.enqueue();
		}, durationMs);

		signal?.addEventListener('abort', () => {
			clearInterval(intervalId);
			controller.close();
		});

		return iterator;
	}

	public static fromAnimationFrames({ signal = null as AbortSignal | null } = {}): ExtraAsyncIterator<void> {
		const { iterator, controller } = ExtraAsyncIterator.withController<void>();
		globalThis.requestAnimationFrame(function tick() {
			if (signal?.aborted) {
				controller.close();
				return;
			}
			controller.enqueue();
			globalThis.requestAnimationFrame(tick);
		});
		return iterator;
	}

	public static merge<T>(...iterators: AsyncIterator<T>[]): ExtraAsyncIterator<T> {
		const { iterator: merged, controller } = ExtraAsyncIterator.withController<T>();
		Promise.all(iterators.map(iterator => iterator.forEach(item => controller.enqueue(item))))
			.then(() => controller.close())
			.catch(error => controller.error(error));
		return merged;
	}

	public static subscribe<T extends unknown[]>(
		subscribe: SubscribeFn<T>,
		{ signal = null as AbortSignal | null } = {},
	): ExtraAsyncIterator<T> {
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();
		const unsubscribe = subscribe((...args: T) => {
			controller.enqueue(args);
		});
		signal?.addEventListener('abort', () => iterator.return());
		return iterator.then(() => {
			unsubscribe();
			controller.close();
		});
	}

	public static withController<T>() {
		let controller: ReadableStreamDefaultController<T>;
		const stream = new ReadableStream<T>({ start: c => controller = c });
		const iterator = new ExtraAsyncIterator(AsyncIterator.from(stream[Symbol.asyncIterator]()));
		return { controller: controller!, iterator };
	}

	constructor(source: AsyncIterator<T>) {
		super(source);
	}

	// =================================================================================================================
	// OVERRIDES
	// =================================================================================================================

	public override drop(limit: number): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(super.drop(limit));
	}

    public override filter<TYieldR extends T = T>(
		predicate: (value: T) => value is TYieldR,
	): ExtraAsyncIterator<TYieldR>;
    public override filter(predicate: (value: T) => boolean | Promise<boolean>): ExtraAsyncIterator<T>;
	public override filter(predicate: (value: T) => boolean): ExtraAsyncIterator<unknown> {
		return ExtraAsyncIterator.from(super.filter(predicate));
	}

	public override flatMap<TNew>(
		mapper: (value: T) => Iterable<TNew> | Iterator<TNew>
			| Promise<Iterable<TNew>> | Promise<Iterator<TNew>>
			| Iterable<Promise<TNew>> | Iterator<Promise<TNew>>
			| Promise<Iterable<Promise<TNew>>> | Promise<Iterator<Promise<TNew>>>
			| AsyncIterable<TNew> | AsyncIterator<TNew>,
	): ExtraAsyncIterator<TNew> {
		return ExtraAsyncIterator.from(super.flatMap(mapper));
	}

	public override map<TNew>(mapper: (value: T) => TNew | Promise<TNew>): ExtraAsyncIterator<TNew> {
		return ExtraAsyncIterator.from(super.map(mapper));
	}

	public override take(count: number): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(super.take(count));
	}

	// =================================================================================================================
	// TRANSFORMING METHODS
	// =================================================================================================================

	public chunk(count: number): ExtraAsyncIterator<T[]> {
		return ExtraAsyncIterator.from(async function*(this: ExtraAsyncIterator<T>) {
			let chunk: T[] = new Array(count);
			for (let i = 0, result; result = await this.next(), !result.done && i < count; i = (i + 1) % count) {
				chunk[i] = result.value;
				if (i === count - 1) {
					yield chunk;
				}
			}
			yield chunk;
		}.call(this));
	}

	public chunkBy(callback: (value: T) => unknown): ExtraAsyncIterator<T[]> {
		return ExtraAsyncIterator.from(async function*(this: ExtraAsyncIterator<T>) {
			let chunk: [T, ...T[]];
			let chunkKey: unknown;

			{
				const result = await this.next();
				if (result.done) {
					return;
				}
				chunk = [result.value];
				chunkKey = callback(result.value);
			}

			for await (const value of this) {
				const nextKey = callback(value);
				if (nextKey === chunkKey) {
					chunk.push(value);
				} else {
					yield chunk;
					chunk = [value];
					chunkKey = nextKey;
				}
			}

			yield chunk;
		}.call(this));
	}

	public chunkWith(predicate: (lhs: T, rhs: T, chunk: [T, ...T[]]) => boolean): ExtraAsyncIterator<T[]> {
		return ExtraAsyncIterator.from(async function*(this: ExtraAsyncIterator<T>) {
			let chunk: [T, ...T[]];

			{
				const result = await this.next();
				if (result.done) {
					return;
				}
				chunk = [result.value];
			}

			for await (const value of this) {
				if (predicate(chunk.at(-1)!, value, chunk)) {
					chunk.push(value);
				} else {
					yield chunk;
					chunk = [value];
				}
			}

			yield chunk;
		}.call(this));
	}

	public chunkInterval(durationMs: number): ExtraAsyncIterator<T[]>;
	public chunkInterval(duration: Temporal.Duration): ExtraAsyncIterator<T[]>;
	public chunkInterval(duration: number | Temporal.Duration): ExtraAsyncIterator<T[]> {
		const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<T[]>();

		let chunk: T[] = [];

		const intervalId = setInterval(() => {
			if (chunk.length > 0) {
				controller.enqueue(chunk);
				chunk = [];
			}
		}, durationMs);

		this.forEach(item => {
			chunk.push(item);
		}).then(() => {
			if (chunk.length > 0) {
				controller.enqueue(chunk);
				controller.close();
			}
		}).catch(error => {
			controller.error(error);
		}).finally(() => {
			clearInterval(intervalId);
		});

		return iterator;
	}

	public compact(): ExtraAsyncIterator<Exclude<T, null|undefined>> {
		const predicate = (value => value !== null && value !== undefined) as
			(value: T) => value is Exclude<T, null|undefined>;
		return this.filter(predicate);
	}

	public debounce(delayMs: number): ExtraAsyncIterator<T>;
	public debounce(delay: Temporal.Duration): ExtraAsyncIterator<T>;
	public debounce(delay: number | Temporal.Duration): ExtraAsyncIterator<T> {
		const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();
		{
			let queuedItem: T | undefined = undefined;
			let timeoutId: number | undefined = undefined;
			this.forEach(item => {
				if (timeoutId !== undefined)
					clearTimeout(timeoutId);
				timeoutId = setTimeout(() => {
					controller.enqueue(item);
					timeoutId = undefined;
					queuedItem = undefined;
				}, delayMs);
				queuedItem = item;
			}).then(() => {
				if (timeoutId !== undefined)
					controller.enqueue(queuedItem!);
				controller.close();
			}).catch(error => {
				controller.error(error);
			}).finally(() => {
				if (timeoutId !== undefined)
					clearTimeout(timeoutId);
			});
		}
		return iterator;
	}

	public delay(delayMs: number): ExtraAsyncIterator<T>;
	public delay(delay: Temporal.Duration): ExtraAsyncIterator<T>;
	public delay(delay: number | Temporal.Duration): ExtraAsyncIterator<T> {
		const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();
		let done = false;
		this.forEach(item => {
			setTimeout(() => {
				if (!done) {
					controller.enqueue(item);
				}
			}, delayMs);
		}).then(() => {
			controller.close();
		}).catch(error => {
			controller.error(error);
		}).finally(() => {
			done = true;
		});
		return iterator;
	}

	public delayWith(delayProvider: (item: T) => number | Temporal.Duration): ExtraAsyncIterator<T> {
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();
		let done = false;
		this.forEach(item => {
			const delay = delayProvider(item);
			const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
			setTimeout(() => {
				if (!done) {
					controller.enqueue(item);
				}
			}, delayMs);
		}).then(() => {
			controller.close();
		}).catch(error => {
			controller.error(error);
		}).finally(() => {
			done = true;
		});
		return iterator;
	}

	public dropRepeats<K>(
		options?: { keyProvider?: (item: T) => K, comparer?: (lhs: K, rhs: K) => boolean },
	): ExtraAsyncIterator<T>;
	public dropRepeats(
		options?: { keyProvider?: (item: T) => unknown, comparer?: (lhs: unknown, rhs: unknown) => boolean },
	): ExtraAsyncIterator<T>;
	public dropRepeats({
		keyProvider = (item: T): unknown => item,
		comparer = (lhs: unknown, rhs: unknown) => lhs === rhs,
	} = {}): ExtraAsyncIterator<T> {
		let oldKey: unknown;
		return this.filter(item => {
			const newKey = keyProvider(item);
			const equals = comparer(newKey, oldKey);
			oldKey = newKey;
			return !equals;
		});
	}

	public dropWhile(predicate: (item: T) => boolean): ExtraAsyncIterator<T> {
		let dropping = true;
		return this.filter(item => {
			if (dropping) {
				if (!predicate(item)) {
					dropping = false;
					return true;
				}
				return false;
			}
			return true;
		});
	}

	public flat({ arraylike = false } = {}): FlattenedExtraAsyncIterator<T> {
		return this.flatMap(async value => {
			value = await value;
			if (typeof value === 'object' && value !== null) {
				if (Symbol.iterator in value) {
					return ExtraIterator.from(value as Iterable<unknown>).flat() as any;
				}
				if (Symbol.asyncIterator in value) {
					return ExtraAsyncIterator.from(value as AsyncIterable<unknown>).flat() as any;
				}
				if (arraylike && 'length' in value && typeof value.length === 'number') {
					return ExtraIterator.from(value as ArrayLike<unknown>).flat() as any;
				}
			}
			return [value] as any;
		}) as any;
	}

	public scan<R>(accumulator: (acc: R, item: T) => R | Promise<R>, initialValue: R): ExtraAsyncIterator<R> {
		let acc = initialValue;
		return this.map(item => accumulator(acc, item));
	}

	public timeout(
		duration: number | Temporal.Duration,
		{ message = 'Async iterator timed out.' } = {},
	): ExtraAsyncIterator<T> {
		const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();

		let timeoutId: number;

		function stopTimer() {
			clearTimeout(timeoutId);
		}

		function startTimer() {
			timeoutId = setTimeout(() => {
				controller.error(new Error(message));
			}, durationMs);
		}

		startTimer();

		this.forEach(item => {
			controller.enqueue(item);
			stopTimer();
			startTimer();
		}).then(() => {
			controller.close();
		}).catch(error => {
			controller.error(error);
		}).finally(() => {
			stopTimer();
		});

		return iterator;
	}

	public throttle(delay: number | Temporal.Duration): ExtraAsyncIterator<T>
	{
		const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
		const { iterator, controller } = ExtraAsyncIterator.withController<T>();

		{
			let blocked = false;
			let timeoutId: number | undefined = undefined;
			this.forEach(item => {
				if (blocked) {
					return;
				}
				controller.enqueue(item);
				blocked = true;
				timeoutId = setTimeout(() => {
					blocked = false;
					timeoutId = undefined;
				}, delayMs);
			}).then(() => {
				controller.close();
			}).catch(error => {
				controller.error(error);
			}).finally(() => {
				if (timeoutId !== undefined) {
					clearTimeout(timeoutId);
				}
			});
		}

		return iterator;
	}

	public unique(keyProvider: (item: T) => unknown = item => item): ExtraAsyncIterator<T> {
		const seen = new Set<unknown>();
		return this.filter(item => {
			const key = keyProvider(item);
			if (seen.has(key)) {
				return false;
			}
			seen.add(key);
			return true;
		});
	}

	// =================================================================================================================
	// AGGREGATING METHODS
	// =================================================================================================================

	public count(): Promise<number> {
		return this.reduce(count => count + 1, 0);
	}

	public async first(): Promise<T | undefined>;
	public async first<U>(options: { default: U }): Promise<T | U>;
	public async first<U>(options: { defaultComputed: () => U }): Promise<T | U>;
	public async first(options?: { default?: unknown, defaultComputed?: () => unknown }): Promise<unknown> {
		const { value, done } = await this.next();

		if (!done) {
			return value;
		}

		if (options && 'default' in options) {
			return options.default;
		}

		if (options && 'defaultComputed' in options) {
			return options.defaultComputed();
		}

		return undefined;
	}

	public async last(): Promise<T | undefined>;
	public async last<U>(options: { default: U }): Promise<T | U>;
	public async last<U>(options: { defaultComputed: () => U }): Promise<T | U>;
	public async last(options?: { default?: unknown, defaultComputed?: () => unknown }): Promise<unknown> {
		let lastValue;

		{
			const { value, done } = await this.next();
			if (done) {
				if (options) {
					if ('default' in options) {
						return options.default;
					}
					if ('defaultComputed' in options) {
						return options.defaultComputed();
					}
				}
				return undefined;
			}
			lastValue = value;
		}

		for (let result; result = await this.next(), !result.done;) {
			lastValue = result.value;
		}

		return lastValue;
	}

	public async single(): Promise<T> {
		const first = await this.next();
		if (first.done) {
			throw new Error("No elements in iterator");
		}
		const singleValue = first.value;
		const second = await this.next();
		if (!second.done) {
			throw new Error("More than one element in iterator");
		}
		return singleValue;
	}

	public toStream(): ReadableStream<T> {
		return new ReadableStream<T>({
			start: controller => {
				this.forEach(item => controller.enqueue(item))
					.then(() => controller.close())
					.catch(error => controller.error(error));
			}
		});
	}

	// =================================================================================================================
	// MISC METHODS
	// =================================================================================================================

	public catch(callback: (error: unknown) => void): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			try {
				yield* this;
			} catch (error) {
				callback(error);
			}
		}.call(this));
	}

	public finally(callback: () => unknown): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			try {
				yield* this;
			} finally {
				callback();
			}
		}.call(this));
	}

	public tee(): [ExtraAsyncIterator<T>, ExtraAsyncIterator<T>] {
		const a = ExtraAsyncIterator.withController<T>();
		const b = ExtraAsyncIterator.withController<T>();
		this.forEach(item => {
			a.controller.enqueue(item);
			b.controller.enqueue(item);
		}).then(() => {
			a.controller.close();
			b.controller.close();
		}).catch(error => {
			a.controller.error(error);
			b.controller.error(error);
		});
		return [a.iterator, b.iterator];
	}

	public then(callback: () => unknown): ExtraAsyncIterator<T>
	{
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			yield* this;
			callback();
		}.call(this));
	}

	public withEach(callback: (item: T) => void): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			for await (const item of this) {
				callback(item);
				yield item;
			}
		}.call(this));
	}
}
