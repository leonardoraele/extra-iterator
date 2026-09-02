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

	/**
	 * Creates an async iterator that listens for events on the specified target and yields an array for each event
	 * occurrence. The array contains the arguments passed to the event listener.
	 *
	 * @param target The target EventTarget to listen for events on.
	 * @param event The name of the event to listen for.
	 * @param param2 An object containing optional parameters: closeEvent, errorEvent, and signal.
	 * @returns An ExtraAsyncIterator that yields arrays of event arguments.
	 */
	// TODO
	// public static fromEvents(
	// 	target: EventTarget,
	// 	event: string,
	// 	{
	// 		closeEvent = undefined as string | undefined,
	// 		errorEvent = undefined as string | undefined,
	// 		signal = undefined as AbortSignal | undefined,
	// 	} = {},
	// ): ExtraAsyncIterator<unknown[]> {
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<unknown[]>();
	// 	const aborter = new AbortController();

	// 	if (signal) {
	// 		signal.addEventListener('abort', () => {
	// 			controller.close();
	// 			aborter.abort();
	// 		});
	// 	} else {
	// 		signal = aborter.signal;
	// 	}

	// 	target.addEventListener(event, (...args: unknown[]) => {
	// 		controller.enqueue(args);
	// 	}, { signal });

	// 	if (closeEvent) {
	// 		target.addEventListener(closeEvent, () => {
	// 			controller.close();
	// 			aborter.abort();
	// 		}, { signal });
	// 	}

	// 	if (errorEvent) {
	// 		target.addEventListener(errorEvent, error => {
	// 			controller.error(error);
	// 			aborter.abort();
	// 		}, { signal });
	// 	}

	// 	return iterator;
	// }

	/**
	 * Creates an async iterator that yields a void value at regular intervals specified by the duration.
	 *
	 * @param duration The interval duration in milliseconds or as a Temporal.Duration object.
	 * @param param1 An object containing optional parameters: signal.
	 * @returns An ExtraAsyncIterator that yields a void value at each interval.
	 */
	// TODO
	// public static fromInterval(
	// 	duration: number | Temporal.Duration,
	// 	{ signal = null as AbortSignal | null } = {},
	// ): ExtraAsyncIterator<void> {
	// 	const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<void>();

	// 	const intervalId = setInterval(() => {
	// 		controller.enqueue();
	// 	}, durationMs);

	// 	signal?.addEventListener('abort', () => {
	// 		clearInterval(intervalId);
	// 		controller.close();
	// 	});

	// 	return iterator;
	// }

	/**
	 * Creates an async iterator that repeatedly calls {@link requestAnimationFrame} and, for each animation frame,
	 * it yields the delta time for that animation frame.
	 *
	 * @param options.signal An optional AbortSignal to stop requesting animation frames and close the iterator.
	 * @returns An ExtraAsyncIterator that yields the delta time for each animation frame.
	 */
	// TODO
	// public static fromAnimationFrames(
	// 	{ signal = null as AbortSignal | null } = {},
	// ): ExtraAsyncIterator<DOMHighResTimeStamp> {
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<DOMHighResTimeStamp>();
	// 	globalThis.requestAnimationFrame(function tick(delta: DOMHighResTimeStamp) {
	// 		if (signal?.aborted) {
	// 			controller.close();
	// 			return;
	// 		}
	// 		controller.enqueue(delta);
	// 		globalThis.requestAnimationFrame(tick);
	// 	});
	// 	return iterator;
	// }

	/**
	 * Creates an async iterator that combines all the other async iterators passed as arguments. The returned iterator
	 * yields all the values from the other async iterators.
	 *
	 * @param iterators The async iterators to merge.
	 * @returns An ExtraAsyncIterator that yields values from all the provided async iterators.
	 */
	// TODO
	// public static merge<T>(...iterators: AsyncIterator<T>[]): ExtraAsyncIterator<T> {
	// 	const { iterator: merged, controller } = ExtraAsyncIterator.withController<T>();
	// 	Promise.all(iterators.map(iterator => iterator.forEach(item => controller.enqueue(item))))
	// 		.then(() => controller.close())
	// 		.catch(error => controller.error(error));
	// 	return merged;
	// }'

	/**
	 * Creates an async iterator using a subscribe function. The passed subscribe function is called once with a
	 * callback function. The subscribe function should subscribe to any sources of events and call the callback
	 * whenever an event occurs. The callback function should also return a clanup function that unsubscribes to the
	 * underlying event source. The iteration can be ended by calling the `return` method on the iterator or by aborting
	 * the provided abort signal.
	 *
	 * @param subscribe The function used to subscribe to the source of events.
	 * @param options.signal An optional AbortSignal to stop receiving events and close the iterator.
	 * @returns An ExtraAsyncIterator that yields the values received from the subscribe function.
	 */
	// TODO
	// public static subscribe<T extends unknown[]>(
	// 	subscribe: SubscribeFn<T>,
	// 	{ signal = null as AbortSignal | null } = {},
	// ): ExtraAsyncIterator<T> {
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();
	// 	const unsubscribe = subscribe((...args: T) => {
	// 		controller.enqueue(args);
	// 	});
	// 	signal?.addEventListener('abort', () => iterator.return());
	// 	return iterator.then(() => {
	// 		unsubscribe();
	// 		controller.close();
	// 	});
	// }

	/**
	 * Creates an async iterator and returns it along with its controller, allowing you to manually push data to the
	 * async iterator and close it when desired. This is useful to create an async iterator based on a custom data
	 * source that doesn't normally support async iterators.
	 *
	 * @remarks
	 *
	 * The returned async iterator is backed by a {@link ReadableStream} and the controller is a
	 * {@link ReadableStreamDefaultController} that controls the stream. Whenever you enqueue a value using the
	 * controller, it will be yielded by the iterator.
	 *
	 * If you call `close()` on the controller, the async iterator will be completed, meaning the next call to `next()`
	 * will return `{ done: true }` and ongoing `for await` loops on the iterator will break.
	 *
	 * If you call `error()` on the controller, the async iterator will be errored, meaning and subsequent calls to
	 * `next()` will throw the error, and ongoing `for await` loops on the iterator will throw the error.
	 *
	 * You must call either `close()` or `error()` on the controller eventually, otherwise the async iterator will never
	 * end.
	 *
	 * @example
	 *
	 * const { iterator, controller } = ExtraAsyncIterator.withController();
	 *
	 * function handleEvent(event) {
	 *     controller.enqueue(event);
	 * }
	 *
	 * function handleError(error) {
	 *     controller.error(error);
	 * }
	 *
	 * eventTarget.addEventListener('someevent', handleEvent);
	 * eventTarget.addEventListener('error', handleError);
	 *
	 * setTimeout(() => {
	 *     eventTarget.removeEventListener('someevent', handleEvent);
	 *     eventTarget.removeEventListener('error', handleError);
	 *     controller.close();
	 * }, 1000);
	 *
	 * @returns An object containing the async iterator and its controller.
	 */
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

	/**
	 * Splits the async iterator into chunks of the specified size. The iterator will only yield a chunk when it has
	 * enough elements to form a complete chunk of the specified size. If the iterator ends before a complete chunk is
	 * formed, the remaining elements will be yielded as a smaller chunk.
	 *
	 * @remarks
	 *
	 * The elements in each chunk are placed in the same order they were encountered in the original async iterator.
	 *
	 * @param count The number of elements in each chunk.
	 * @returns An async iterator that yields chunks of the specified size.
	 */
	public chunk(count: number): ExtraAsyncIterator<T[]> {
		return ExtraAsyncIterator.from(async function*(this: ExtraAsyncIterator<T>) {
			let chunk: T[] = new Array(count);
			for (let i = 0, result; result = await this.next(), !result.done && i < count; i = (i + 1) % count) {
				chunk[i] = result.value;
				if (i === count - 1) {
					yield chunk;
					chunk = new Array(count);
				}
			}
			yield chunk;
		}.call(this));
	}

	/**
	 * Splits the async iterator into chunks of variable size. Each chunk will contain all consecutive elements for
	 * which the callback function has returned the same result.
	 *
	 * @remarks
	 *
	 * The elements in each chunk are placed in the same order they were encountered in the original async iterator.
	 *
	 * @example
	 *
	 * // Yields chunks of only odd or only even numbers.
	 * ExtraAsyncIterator.from([1, 1, 3, 5, 2, 4, 1, 8, 2]).chunkBy(n => n % 2 === 0);
	 * // Output: [1, 1, 3, 5], [2, 4], [1], [8, 2]
	 *
	 * @param callback The function used to determine the chunk boundaries.
	 * @returns An async iterator that yields chunks based on the callback function.
	 */
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

	/**
	 * Splits the async iterator into chunks based on a predicate function. The predicate function is called once for
	 * each pair of adjacent elements in the sequence and it must return a boolean indicating whether they belong in the
	 * same chunk.
	 *
	 * @remarks
	 *
	 * The third argument of the predicate function is the current chunk being constructed, which allows you to make
	 * decisions based on the entire chunk instead of just the previous element.
	 *
	 * The first argument passed to the predicate function is always also the last element of the current chunk, and the
	 * second argument is the next element to be considered for inclusion in the current chunk.
	 *
	 * The elements in each chunk are placed in the same order they were encountered in the original async iterator.
	 *
	 * @example
	 *
	 * // Yields chunks of only odd or only even numbers, with a maximum chunk length of 3.
	 * ExtraAsyncIterator.from([1, 1, 3, 5, 2, 4, 1, 8, 2])
	 *     .chunkWith((lhs, rhs, chunk) => lhs % 2 === rhs % 2 && chunk.length < 3);
	 * // Output: [1, 1, 3], [5], [2, 4], [1], [8, 2]
	 *
	 * @param predicate The function used to determine whether two adjacent elements should be in the same chunk.
	 * @returns An async iterator that yields chunks based on the predicate function.
	 */
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

	/**
	 * Splits the async iterator into chunks based on a time interval.
	 *
	 * @remarks
	 *
	 * The async iterator will yield arrays of elements that were collected within the specified time interval.
	 * If no elements are collected during an interval, the iterator will not yield anything.
	 *
	 * @example
	 *
	 * let { iterator, controller } = ExtraAsyncIterator.withController();
	 *
	 * iterator = iterator.chunkInterval(1000);
	 *
	 * {
	 *     controller.enqueue('first (time 0)');
	 *
	 *     await new Promise(resolve => setTimeout(resolve, 600));
	 *
	 *     controller.enqueue('second (time 600)');
	 *
	 *     await new Promise(resolve => setTimeout(resolve, 600));
	 *
	 *     controller.enqueue('third (time 1200)');
	 *
	 *     await new Promise(resolve => setTimeout(resolve, 600));
	 *
	 *     controller.enqueue('fourth (time 1800)');
	 *
	 *     await new Promise(resolve => setTimeout(resolve, 600));
	 *
	 *     controller.enqueue('fifth (time 2400)');
	 *
	 *     controller.close();
	 * }
	 *
	 * console.log(await iterator.toArray());
	 * // Output:
	 * // [
	 * //   ['first (time 0)', 'second (time 600)'],
	 * //   ['third (time 1200)', 'fourth (time 1800)'],
	 * //   ['fifth (time 2400)']
	 * // ]
	 *
	 * @param duration The time interval for chunking the async iterator. Can be a number (milliseconds) or a Temporal.Duration.
	 * @returns An async iterator that yields arrays of elements collected within the specified time interval.
	 */
	// TODO
	// public chunkInterval(durationMs: number): ExtraAsyncIterator<T[]>;
	// public chunkInterval(duration: Temporal.Duration): ExtraAsyncIterator<T[]>;
	// public chunkInterval(duration: number | Temporal.Duration): ExtraAsyncIterator<T[]> {
	// 	const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T[]>();

	// 	let chunk: T[] = [];

	// 	const intervalId = setInterval(() => {
	// 		if (chunk.length > 0) {
	// 			controller.enqueue(chunk);
	// 			chunk = [];
	// 		}
	// 	}, durationMs);

	// 	this.forEach(item => {
	// 		chunk.push(item);
	// 	}).then(() => {
	// 		if (chunk.length > 0) {
	// 			controller.enqueue(chunk);
	// 			controller.close();
	// 		}
	// 	}).catch(error => {
	// 		controller.error(error);
	// 	}).finally(() => {
	// 		clearInterval(intervalId);
	// 	});

	// 	return iterator;
	// }

	/**
	 * Removes all `null` and `undefined` values from the async iterator.
	 *
	 * @returns An async iterator that yields only non-null and non-undefined values.
	 */
	public compact(): ExtraAsyncIterator<Exclude<T, null|undefined>> {
		const predicate = (value => value !== null && value !== undefined) as
			(value: T) => value is Exclude<T, null|undefined>;
		return this.filter(predicate);
	}

	/**
	 * Debounces the async iterator, ensuring that only the last item within the specified delay interval is emitted.
	 *
	 * @remarks
	 *
	 * Items yielded by the async iterator will be delayed based on the {@link delay} argument. If a new item arrives
	 * before the delay has elapsed, the previous item will be discarded and the delay will be restarted for the new
	 * item.
	 *
	 * @param delayMs The debounce delay in milliseconds.
	 * @returns An async iterator that yields debounced items.
	 */
	// TODO
	// public debounce(delayMs: number): ExtraAsyncIterator<T>;
	// public debounce(delay: Temporal.Duration): ExtraAsyncIterator<T>;
	// public debounce(delay: number | Temporal.Duration): ExtraAsyncIterator<T> {
	// 	const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();
	// 	{
	// 		let queuedItem: T | undefined = undefined;
	// 		let timeoutId: NodeJS.Timeout | number | undefined = undefined;
	// 		this.forEach(item => {
	// 			if (timeoutId !== undefined)
	// 				clearTimeout(timeoutId);
	// 			timeoutId = setTimeout(() => {
	// 				controller.enqueue(item);
	// 				timeoutId = undefined;
	// 				queuedItem = undefined;
	// 			}, delayMs);
	// 			queuedItem = item;
	// 		}).then(() => {
	// 			if (timeoutId !== undefined)
	// 				controller.enqueue(queuedItem!);
	// 			controller.close();
	// 		}).catch(error => {
	// 			controller.error(error);
	// 		}).finally(() => {
	// 			if (timeoutId !== undefined)
	// 				clearTimeout(timeoutId);
	// 		});
	// 	}
	// 	return iterator;
	// }

	/**
	 * Delays the emission of each item from the async iterator by the specified delay interval.
	 *
	 * @param delayMs The delay in milliseconds.
	 * @returns An async iterator that yields items after the specified delay.
	 */
	// TODO
	// public delay(delayMs: number): ExtraAsyncIterator<T>;
	// public delay(delay: Temporal.Duration): ExtraAsyncIterator<T>;
	// public delay(delay: number | Temporal.Duration): ExtraAsyncIterator<T> {
	// 	const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();
	// 	let done = false;
	// 	this.forEach(item => {
	// 		setTimeout(() => {
	// 			if (!done) {
	// 				controller.enqueue(item);
	// 			}
	// 		}, delayMs);
	// 	}).then(() => {
	// 		controller.close();
	// 	}).catch(error => {
	// 		controller.error(error);
	// 	}).finally(() => {
	// 		done = true;
	// 	});
	// 	return iterator;
	// }

	/**
	 * Delays the emission of each item from the async iterator. The delay for each item is determined by invoking the
	 * {@link delayProvider} function with the item as an argument.
	 *
	 * @remarks
	 *
	 * Note that, because the delay is determined asynchronously for each item, the order of items may not be preserved
	 * if the delays vary.
	 *
	 * @param delayProvider A function that takes an item and returns the delay in milliseconds or a
	 * {@link Temporal.Duration}.
	 * @returns An async iterator that yields items after the specified delay.
	 */
	// TODO
	// public delayWith(delayProvider: (item: T) => number | Temporal.Duration): ExtraAsyncIterator<T> {
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();
	// 	let done = false;
	// 	this.forEach(item => {
	// 		const delay = delayProvider(item);
	// 		const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
	// 		setTimeout(() => {
	// 			if (!done) {
	// 				controller.enqueue(item);
	// 			}
	// 		}, delayMs);
	// 	}).then(() => {
	// 		controller.close();
	// 	}).catch(error => {
	// 		controller.error(error);
	// 	}).finally(() => {
	// 		done = true;
	// 	});
	// 	return iterator;
	// }

	/**
	 * Drops consecutive repeated items from the async iterator.
	 *
	 * @remarks
	 *
	 * You can optionally provide a "key provider" function as argument. This function will be called with each item
	 * in this async iterator and should return the key value to be compared between that item and its neighbors. If the
	 * values are the same, the item will be considered a duplicate and dropped.
	 *
	 * @param keyProvider A function that takes an item and returns the key value to be compared for consecutive items.
	 * @returns An async iterator that yields items with consecutive duplicates removed.
	 */
	public dropRepeats(keyProvider: (item: T) => unknown = item => item): ExtraAsyncIterator<T> {
		let oldKey: unknown;
		return this.filter(item => {
			const newKey = keyProvider(item);
			const equals = newKey === oldKey;
			oldKey = newKey;
			return !equals;
		});
	}

	/**
	 * Drops the items from the async iterator for as long as the provided predicate function returns `true`. Once the
	 * predicate returns `false`, the predicate function stops being called and all subsequent items are yielded.
	 *
	 * @param predicate A function that takes an item and returns `true` if the item should be dropped, or `false`
	 * otherwise.
	 * @returns An async iterator that yields items after the predicate returns `false` for the first time.
	 */
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

	/**
	 * Creates a new async iterator that is a "flattened" version of this async iterator. This means if this iterator
	 * yields nested iterable items, the returned iterator will instead yield their individual elements.
	 *
	 * @example
	 *
	 * const flattened = ExtraAsyncIterator.from([[1, 2], [[3, [4, 5], 6], 7]]).flat();
	 * for await (const item of flattened) {
	 *     console.log(item); // 1, 2, 3, 4, 5, 6, 7
	 * }
	 *
	 * @param options An object with optional arguments.
	 * @param options.arrayLike A boolean indicating whether array-like objects should also be flattened. For the
	 * purposes of this method, an "array-like" object is an object with a `length` property that is a number, and that
	 * many 0-indexed numeric properties. (default is `false`)
	 * @returns A flattened async iterator containing the individual elements of any nested iterables or array-like
	 * objects.
	 */
	public flat({ arrayLike = false } = {}): FlattenedExtraAsyncIterator<T> {
		return this.flatMap(async value => {
			value = await value;
			if (typeof value === 'object' && value !== null) {
				if (Symbol.iterator in value) {
					return ExtraIterator.from(value as Iterable<unknown>).flat() as any;
				}
				if (Symbol.asyncIterator in value) {
					return ExtraAsyncIterator.from(value as AsyncIterable<unknown>).flat() as any;
				}
				if (arrayLike && 'length' in value && typeof value.length === 'number') {
					return ExtraIterator.from(value as ArrayLike<unknown>).flat() as any;
				}
			}
			return [value] as any;
		}) as any;
	}

	/**
	 * Creates a new async iterator that applies an accumulator function to each item, yielding the accumulated result
	 * at each step.
	 *
	 * @remarks
	 *
	 * This is similar to the {@link reduce} method, the difference being this method returns an async iterator that
	 * yields the accumulated value at each iteration, rather than only the final result like {@link reduce}.
	 *
	 * @param accumulator The function that will be applied to each item and the accumulated value.
	 * @param initialValue The initial value for the accumulator.
	 * @returns An async iterator that yields the accumulated result at each step.
	 */
	public scan<R>(accumulator: (acc: R, item: T) => R | Promise<R>, initialValue: R): ExtraAsyncIterator<R> {
		let acc = initialValue;
		return this.map(item => accumulator(acc, item));
	}

	/**
	 * Adds a time limit to the production of each item in the async iterator.
	 *
	 * @remarks
	 *
	 * This method creates a new iterator that mirrors this iterator, but will keep track of the time elapsed between
	 * each item and the previous one. It throws an error if this iterator takes longer than the specified duration to
	 * yield a new item.
	 *
	 * @param duration The maximum allowed duration for each item to be produced.
	 * @param options An object with optional arguments.
	 * @param options.message The error message to be used if the timeout is exceeded.
	 * @returns A new async iterator that enforces the specified timeout for each item.
	 */
	// TODO
	// public timeout(
	// 	duration: number | Temporal.Duration,
	// 	{ message = 'Async iterator timed out.' } = {},
	// ): ExtraAsyncIterator<T> {
	// 	const durationMs = typeof duration === 'number' ? duration : duration.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();

	// 	let timeoutId: NodeJS.Timeout | number;

	// 	function stopTimer() {
	// 		clearTimeout(timeoutId);
	// 	}

	// 	function startTimer() {
	// 		timeoutId = setTimeout(() => {
	// 			controller.error(new Error(message));
	// 		}, durationMs);
	// 	}

	// 	startTimer();

	// 	this.forEach(item => {
	// 		controller.enqueue(item);
	// 		stopTimer();
	// 		startTimer();
	// 	}).then(() => {
	// 		controller.close();
	// 	}).catch(error => {
	// 		controller.error(error);
	// 	}).finally(() => {
	// 		stopTimer();
	// 	});

	// 	return iterator;
	// }

	/**
	 * Slows down the production of items in the async iterator by dropping items that are produced too quickly after
	 * the previous one, ensuring a minimum delay between each pair of consecutive item.
	 *
	 * @param delay The delay duration between each item. Items produced during the delay are dropped.
	 * @returns A new async iterator that enforces the specified delay between items.
	 */
	// TODO
	// public throttle(delay: number | Temporal.Duration): ExtraAsyncIterator<T>
	// {
	// 	const delayMs = typeof delay === 'number' ? delay : delay.total({ unit: 'milliseconds' });
	// 	const { iterator, controller } = ExtraAsyncIterator.withController<T>();

	// 	{
	// 		let blocked = false;
	// 		let timeoutId: NodeJS.Timeout | number | undefined = undefined;
	// 		this.forEach(item => {
	// 			if (blocked) {
	// 				return;
	// 			}
	// 			controller.enqueue(item);
	// 			blocked = true;
	// 			timeoutId = setTimeout(() => {
	// 				blocked = false;
	// 				timeoutId = undefined;
	// 			}, delayMs);
	// 		}).then(() => {
	// 			controller.close();
	// 		}).catch(error => {
	// 			controller.error(error);
	// 		}).finally(() => {
	// 			if (timeoutId !== undefined) {
	// 				clearTimeout(timeoutId);
	// 			}
	// 		});
	// 	}

	// 	return iterator;
	// }

	/**
	 * Returns a new async iterator that yields only unique items. You can optionally provide a `keyProvider` function
	 * that provides a key for each item. Items with duplicate keys are dropped.
	 *
	 * @param keyProvider A function that provides a key for each item. Items with duplicate keys are skipped.
	 * @returns A new async iterator that yields only unique items.
	 */
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

	/**
	 * Counts the number of items in the async iterator.
	 */
	public count(): Promise<number> {
		return this.reduce(count => count + 1, 0);
	}

	/**
	 * Returns the first item in the async iterator, or a default value if the iterator is empty.
	 */
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

	/**
	 * Returns the last item in the async iterator, or a default value if the iterator is empty.
	 */
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

	/**
	 * Created a {@link ReadableStream} object from this async iterator.
	 *
	 * @returns A {@link ReadableStream} object that mirrors this async iterator.
	 */
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

	/**
	 * Catches errors thrown during the iteration and invokes the provided callback with the error.
	 *
	 * @param callback - The function to call when an error is caught.
	 * @returns A new {@link ExtraAsyncIterator} that handles errors using the provided callback.
	 */
	public catch(callback: (error: unknown) => void): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			try {
				yield* this;
			} catch (error) {
				callback(error);
			}
		}.call(this));
	}

	/**
	 * Invokes the provided callback when the iteration is complete, regardless of whether it ended normally or due to
	 * an error.
	 *
	 * @param callback - The function to call when the iteration is complete.
	 * @returns A new {@link ExtraAsyncIterator} that invokes the callback when the iteration is complete.
	 */
	public finally(callback: () => unknown): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			try {
				yield* this;
			} finally {
				callback();
			}
		}.call(this));
	}

	/**
	 * Creates two separate {@link ExtraAsyncIterator} instances that both receive the same items from this iterator.
	 * They can be consumed independently of each other.
	 *
	 * @returns A tuple containing the two new {@link ExtraAsyncIterator} instances.
	 */
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

	/**
	 * Invokes the provided callback after the iteration is complete.
	 *
	 * @param callback - The function to call after the iteration is complete.
	 * @returns A new {@link ExtraAsyncIterator} that invokes the callback after the iteration is complete.
	 */
	public then(callback: () => unknown): ExtraAsyncIterator<T>
	{
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			yield* this;
			callback();
		}.call(this));
	}

	/**
	 * Invokes the provided callback for each item in the iteration. This method is intended to allow side effects
	 * that do not affect the output of the iterator.
	 *
	 * @param callback - The function to call for each item in the iteration.
	 * @returns A new {@link ExtraAsyncIterator} that invokes the callback for each item in the iteration.
	 */
	public withEach(callback: (item: T) => void): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			for await (const item of this) {
				callback(item);
				yield item;
			}
		}.call(this));
	}
}
