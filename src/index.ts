/**
 * A type that represents all the possible sources that can be used to create an `ExtraIterator`.
 *
 * @remarks
 *
 * This includes any object that is either an `Iterator`, an `Iterable`, or an "array-like" object (i.e., an object that
 * has a `length` property that is a `number` and numerically indexed elements).
 *
 * @template T The type of the values yielded by the iterator; or the type of the elements of the array or array-like
 * object.
 */
export type ExtraIteratorSource<T> = Iterator<T, any, any> | Iterable<T, any, any> | ArrayLike<T>;

/**
 * Utility type that flattens nested iterables into an `ExtraIterator` or non-iterable type parameter.
 * @template T The type of the values yielded by the original iterator.
 * @returns A new type that represents the flattened version of the original iterator. If `T` is an iterable, it will be
 * recursively flattened; otherwise, it returns `ExtraIterator<T>`.
 *
 * @example
 *
 * FlattenedExtraIterator<number[][]>; // results in `ExtraIterator<number>`
 */
export type FlattenedExtraIterator<T>
	= T extends Iterable<infer U> ? FlattenedExtraIterator<U> : ExtraIterator<T>;

/**
 * An extended iterator class that provides additional chainable utility methods for working with iterables.
 *
 * @template T The type of values yielded by this iterator.
 *
 * @example
 * // Creating an iterator from an array
 * const iter = ExtraIterator.from([1, 2, 3, 4, 5]);
 *
 * @example
 * // Creating a sequence of ancestors of a given element
 * ExtraIterator.from([1, 2, 3, 4, 5])
 *   .filter(n => n % 2 === 0)
 *   .map(n => n * 2)
 *   .toArray()
 *   // returns [4, 8]
 *
 * @example
 * // Using static factory methods
 * ExtraIterator.range(1, 5)
 *   .map(n => n * n)
 *   .toArray()
 *   // returns [1, 4, 9, 16]
 */
export class ExtraIterator<T> extends Iterator<T, any, any> {

	// =================================================================================================================
	// STATIC FUNCTIONS
	// =================================================================================================================

	/**
	 * Creates a new `ExtraIterator` from an iterable, iterator, or array-like object.
	 *
	 * @param source The source to create the iterator from. This can be any object that is either an `Iterator`, an
	 * `Iterable`, or an array-like object (i.e., has a `length` property and numerically indexed elements).
	 * @returns A new `ExtraIterator` instance.
	 * @template T The type of the elements of the `source` parameter.
	 * @group Static methods
	 *
	 * @example
	 *
	 * // Creating an iterator from an array
	 * ExtraIterator.from([1, 2, 3]).toArray() // returns [1, 2, 3]
	 */
	static override from<T>(source: ExtraIteratorSource<T>): ExtraIterator<T> {
		if (!(Symbol.iterator in source) && 'length' in source) {
			return new ExtraIterator(function*() {
				for (let index = 0; index < source.length; index++) {
					yield source[index]!;
				}
			}());
		}
		return new ExtraIterator(source);
	}

	static zip<A, B>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>): ExtraIterator<[A, B]>;
	static zip<A, B, C>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>): ExtraIterator<[A, B, C]>;
	static zip<A, B, C, D>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>, d: ExtraIteratorSource<D>): ExtraIterator<[A, B, C, D]>;
	static zip<A, B, C, D, E>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>, d: ExtraIteratorSource<D>, e: ExtraIteratorSource<E>): ExtraIterator<[A, B, C, D, E]>;
	static zip<A, B, C, D, E, F>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>, d: ExtraIteratorSource<D>, e: ExtraIteratorSource<E>, f: ExtraIteratorSource<F>): ExtraIterator<[A, B, C, D, E, F]>;
	static zip<A, B, C, D, E, F, G>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>, d: ExtraIteratorSource<D>, e: ExtraIteratorSource<E>, f: ExtraIteratorSource<F>, g: ExtraIteratorSource<G>): ExtraIterator<[A, B, C, D, E, F, G]>;
	static zip<A, B, C, D, E, F, G, H>(a: ExtraIteratorSource<A>, b: ExtraIteratorSource<B>, c: ExtraIteratorSource<C>, d: ExtraIteratorSource<D>, e: ExtraIteratorSource<E>, f: ExtraIteratorSource<F>, g: ExtraIteratorSource<G>, h: ExtraIteratorSource<H>): ExtraIterator<[A, B, C, D, E, F, G, H]>;

	/**
	 * Creates a new iterator that iterates over all the provided iterators simultaneously. The returned iterator yields
	 * arrays containing the values yielded by each of the provided iterators.
	 *
	 * @param iterables Several iterables or array-like objects to iterate over.
	 * @returns An iterator that iterates over all the provided iterables simultaneously. For each iteration, it yields
	 * an array with the elements of each iterable at the corresponding position.
	 * @template T The type of values yielded by the provided iterables.
	 * @group Static methods
	 *
	 * @example
	 *
	 * ExtraIterator.zip([1, 2, 3], ['a', 'b', 'c']).toArray() // returns [ [1, 'a'], [2, 'b'], [3, 'c'] ]
	 */
	static zip<T>(...iterables: ExtraIteratorSource<T>[]): ExtraIterator<T[]>;
	static zip<T>(...iterables: ExtraIteratorSource<T>[]): ExtraIterator<T[]> {
		return new ExtraIterator(function*() {
			for (
				let iterators = iterables.map(iterable => ExtraIterator.from(iterable)),
					results;
				results = iterators.map(iterator => iterator.next()),
				results.every(value => !value.done);
			) {
				yield results.map(value => value.value);
			}
		}().toArray());
	}

	/**
	 * Creates an iterator that yields no value.
	 *
	 * @returns An iterator that yields no value.
	 * @template T The type parameter of the returned iterator. If omitted, the returned iterator will be of `any` type.
	 * @group Static methods
	 *
	 * @example ExtraIterator.empty().toArray() // returns []
	 */
	static empty<T = any>(): ExtraIterator<T> {
		return new ExtraIterator([]);
	}

	/**
	 * Creates an iterator that yields a single value.
	 *
	 * @param value The value the returned iterator will yield.
	 * @returns An iterator that yields the provided value once, then ends.
	 * @template T The type of the value yielded by the returned iterator.
	 * @group Static methods
	 *
	 * @example ExtraIterator.single(42).toArray() // returns [42]
	 */
	static single<T>(value: T): ExtraIterator<T> {
		return new ExtraIterator([value]);
	}

	/**
	 * Creates an iterator that yields incrementing numbers.
	 *
	 * @remarks
	 *
	 * > ⚠ This iterator is infinite. Use {@link take} method if you want a specific number of values.
	 *
	 * @param options An optional object to configure the behavior of the returned iterator.
	 * @param options.start The first number yielded by the iterator. Default is `0`.
	 * @param options.increment The difference between each pair of consecutive numbers yielded by the returned
	 * iterator. If you set a negative increment, the iterator will count downwards. Default is `1`.
	 * @return An iterator that yields incrementing numbers starting from `start` and incrementing by `increment`.
	 * @group Static methods
	 *
	 * @example
	 *
	 * ExtraIterator.count().take(5).toArray() // returns [0, 1, 2, 3, 4]
	 * ExtraIterator.count({ start: 10, increment: -1 }).take(5).toArray() // returns [10, 9, 8, 7, 6]
	 */
	static count({ start = 0, increment = 1 } = {}): ExtraIterator<number> {
		return new ExtraIterator(function*() {
			while (true) {
				yield start
				start += increment;
			}
		}());
	}

	/**
	 * Creates an iterator that yields numbers in a "from-to" range. (exclusive)
	 *
	 * @remarks
	 *
	 * The returned iterator yields all numbers in the specified range. By default, the `end` value is not included in
	 * the range. If you want to include the `end` value as well, you can set the `inclusive` option to `true`.
	 *
	 * The third argument is an optional "step" that defines the increment (or decrement) between each yielded number.
	 *
	 * Note that setting `inclusive` option to `true` does not guarantee that the `end` value will be yielded, since it
	 * also depends on the `step` value. For example, if `start` is `0`, `end` is `5`, and `step` is `2`, the returned
	 * iterator will not yield `5` regardless of the `inclusive` option, because it is not included in the range.
	 *
	 * @param start The number at which the returned iterator starts yielding values.
	 * @param end The number at which the returned iterator stops yielding values. This value is not included in the
	 * range unless `inclusive` is set to `true`.
	 * @param options An optional object to configure the behavior of the returned iterator.
	 * @param options.inclusive A boolean that indicates whether the `end` value should be included in the range.
	 * Default is `false`.
	 * @param options.step The increment (or decrement) between each yielded number. Default is `1`.
	 * @returns An iterator that yields numbers starting from `start` and incrementing (or decrementing) by `step`, up
	 * to `end`.
	 * @group Static methods
	 *
	 * @examples
	 *
	 * ExtraIterator.range(5, 10).toArray() // returns [5, 6, 7, 8, 9]
	 * ExtraIterator.range(5, 10, { inclusive: true }).toArray() // returns [5, 6, 7, 8, 9, 10]
	 *
	 * // Counting down:
	 * ExtraIterator.range(10, 0).toArray() // return [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
	 * ExtraIterator.range(10, 0, { inclusive: true }).toArray() // return [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
	 *
	 * // Custom stepping value:
	 * ExtraIterator.range(1, 10, { step: 2 }).toArray() // returns [1, 3, 5, 7, 9]
	 * ExtraIterator.range(0, 1, { step: 0.25 }).toArray() // returns [0, 0.25, 0.5, 0.75]
	 * ExtraIterator.range(10, 0, { step: 2 }).toArray() // returns [10, 8, 6, 4, 2]
	 */
	static range(start: number, end: number, { inclusive = false, step = 1 } = {}): ExtraIterator<number> {
		return ExtraIterator.from(function*() {
			step = Math.abs(step);
			if (step < Number.EPSILON) {
				throw new Error('Failed to create range. Cause: Range step cannot be 0.');
			} else if (end > start) {
				for (let i = start; inclusive ? i <= end : i < end; i += step) {
					yield i;
				}
			} else {
				for (let i = start; inclusive ? i >= end : i > end; i -= step) {
					yield i;
				}
			}
		}());
	}

	/**
	 * Creates an iterator that repeatedly yields the provided value.
	 *
	 * @remarks
	 *
	 * > ⚠ This iterator is infinite. Use {@link take} method if you want a specific number of values.
	 *
	 * @param value The value to be repeatedly yielded by the returned iterator.
	 * @returns An iterator that repeatedly yields the provided value.
	 * @template T The type of the value yielded by the returned iterator.
	 * @group Static methods
	 *
	 * @example ExtraIterator.repeat(3, 'a').toArray() // returns ['a', 'a', 'a']
	 */
	static repeat<T>(value: T): ExtraIterator<T> {
		return new ExtraIterator(function*() {
			while (true) {
				yield value;
			}
		}());
	}

	/**
	 * Generates an infinite sequence of random numbers between 0 and 1 (inclusive–exclusive) using `Math.random` or
	 * another specified random number generator.
	 *
	 * @remarks
	 *
	 * > ⚠ This iterator is infinite. Use {@link take} method if you want a specific number of values.
	 *
	 * @param rng An optional random number generator function that returns a number between 0 and 1
	 * (inclusive–exclusive). If not provided, `Math.random` will be used as the default random number generator.
	 * @returns An iterator that generates an infinite sequence of random numbers between 0 and 1.
	 * @group Static methods
	 *
	 * @example
	 *
	 * // Produces an array of 5 random numbers, e.g. `[0.123, 0.456, 0.789, 0.012, 0.345]`
	 * const randomNumbers = ExtraIterator.random().take(5).toArray()
	 */
	static random(rng = Math.random): ExtraIterator<number> {
		return ExtraIterator.from(function*() {
			while (true) {
				yield rng();
			}
		}());
	}

	/**
	 * Generates an infinite sequence of cryptographically strong random bytes using `crypto.getRandomValues`, in
	 * chunks of `bufferSize` bytes.
	 *
	 * @remarks
	 *
	 * If you want a flat sequence of individual byte values instead of chunks, you can chain the returned iterator with
	 * the {@link flatten} method. The resulting iterator will contain interger values from 0 to 255 (inclusive).
	 *
	 * > ⚠ This iterator is infinite. Use {@link take} method if you want a specific number of values.
	 *
	 * @param options An optional object to configure the behavior of the returned iterator.
	 * @param options.bufferSize The number of random bytes to generate in each chunk. Default is `1024`.
	 * @param options.sharedBuffer If `false` (which is the default), each yielded `Uint8Array` instance owns its own
	 * buffer containing the random bytes. This is safer since you won't accidentally modify the values of a previously
	 * yielded chunk by modifying a later one, but the iterator has to allocate a new buffer for each chunk. If this
	 * option is set to `true`, the resulting iterator will yield new `Uint8Array` views of the same underlying buffer,
	 * refilling the buffer with new random bytes between each iteration. This is more performant, but you should be
	 * careful to not keep references to the old views since the values will change.
	 * @returns An iterator that generates an infinite sequence of cryptographically strong random bytes in chunks of
	 * `bufferSize` bytes.
	 * @group Static methods
	 *
	 * @example
	 *
	 * // Produces an array with 3 chunks of random bytes, each containing 16 bytes, e.g.
	 * // ```
	 * // [
	 * //     Uint8Array(16) [ 0x12, 0x34, ..., 0x56 ],
	 * //     Uint8Array(16) [ 0x78, 0x9a, ..., 0xbc ],
	 * //     Uint8Array(16) [ 0xde, 0xf0, ..., 0x12 ],
	 * // ]
	 * // ```
	 * const chunks = ExtraIterator.randomBytes({ bufferSize: 16 })
	 * 		.take(3)
	 * 		.toArray();
	 *
	 * @example
	 *
	 * // Produces an array of 128 random byte values (integers from 0 to 255)
	 * const bytes = ExtraIterator.randomBytes().flatten().take(128).toArray();
	 */
	static randomBytes({ bufferSize = 1024, sharedBuffer = false } = {}): ExtraIterator<Uint8Array> {
		const bytes = new Uint8Array(bufferSize);
		return new ExtraIterator(function*() {
				globalThis.crypto.getRandomValues(bytes);
				yield sharedBuffer
					? new Uint8Array(bytes.buffer) // Creates a view of the local buffer
					: new Uint8Array(bytes); // Copies the data into a new buffer
			}())
			.loop();
	}

	// =================================================================================================================
	// PRIVATES
	// =================================================================================================================

	private constructor(source: Iterator<T, any, any> | Iterable<T, any, any>) {
		super();
		this.source = Iterator.from<T>(source);
		if (this.source.return) {
			this.return = this.source.return.bind(this.source);
		}
		if (this.source.throw) {
			this.throw = this.source.throw.bind(this.source);
		}
	}

	private source: IteratorObject<T, any, any>;

	// =================================================================================================================
	// OVERRIDES
	// =================================================================================================================

	override next(value?: any): IteratorResult<T, any> {
		return this.source.next(value);
	}

	override map<U>(callbackfn: (value: T, index: number) => U): ExtraIterator<U> {
		return ExtraIterator.from(super.map(callbackfn));
	}

	override filter<S extends T>(predicate: (value: T, index: number) => value is S): ExtraIterator<S>;
	override filter(predicate: (value: T, index: number) => unknown): ExtraIterator<T>;
	override filter(predicate: (value: T, index: number) => unknown): ExtraIterator<T> {
		return ExtraIterator.from(super.filter(predicate));
	}

	override take(limit: number): ExtraIterator<T> {
		return limit >= 0
			? ExtraIterator.from(super.take(limit))
			: this.takeLast(-limit);
	}

	private takeLast(count: number): ExtraIterator<T> {
		const ringbuffer: T[] = new Array(count);
		let index = 0;
		for (let item; item = this.next(), !item.done; index = (index + 1) % count) {
			ringbuffer[index] = item.value;
		}
		return ExtraIterator.from(function*() {
			for (let i = index; i < count + index; i++) {
				yield ringbuffer[i % count]!;
			}
		}());
	}

	override drop(count: number): ExtraIterator<T> {
		return count >= 0
			? ExtraIterator.from(super.drop(count))
			: ExtraIterator.from(this.toArray().toSpliced(count, -count));
	}

	override flatMap<U>(
		callback: (value: T, index: number) => Iterator<U, unknown, undefined> | Iterable<U, unknown, undefined>,
	): ExtraIterator<U> {
		return ExtraIterator.from(super.flatMap(callback));
	}

	// =================================================================================================================
	// TRANSFORMING FUNCTIONS
	// -----------------------------------------------------------------------------------------------------------------
	// These functions transform the iterator somehow and returns a new iterator.
	// =================================================================================================================

	/**
	 * Flattens the iterator by one level. If the iterator yields iterables, it will yield their values.
	 * If the iterator yields non-iterables, it will yield the values as is.
	 *
	 * @remarks
	 *
	 * This methods recursivelly flattens the iterator until all yielded values are non-iterable. This means that if the
	 * iterator yields nested iterables, all of them will be flattened.
	 *
	 * @param options An optional object to configure the behavior of the flattening process.
	 * @param options.arraylike If `true`, the flattening process will also flatten "array-like" objects (i.e., objects
	 * that have a `length` property and numerically indexed elements) as iterables. By default, only objects that
	 * implement the iterable protocol (i.e., have a `[Symbol.iterator]` method) are flattened.
	 * @returns A new iterator that yields the flattened values of this iterator.
	 *
	 * @example ExtraIterator.from([[1, 2], [3, 4]]).flatten().toArray() // returns [1, 2, 3, 4]
	 */
	flatten({ arraylike = false } = {}): FlattenedExtraIterator<T> {
		return this.flatMap(value => {
			if (typeof value === 'object' && value !== null) {
				if (Symbol.iterator in value) {
					return new ExtraIterator(value as Iterable<unknown>).flatten();
				}
				if (arraylike && 'length' in value && typeof value.length === 'number') {
					return ExtraIterator.from(value as ArrayLike<unknown>).flatten();
				}
			}
			return [value];
		}) as any;
	}

	/**
	 * Creates a new iterator that yields the values of this iterator, but won't yield any duplicates.
	 *
	 * @param keyProvider An optional function that returns a key for each value. The keys are used to determine whether
	 * two values are equal or not. If two values have the same key, only the first one will be yielded. The other is
	 * ignored.
	 *
	 * @example ExtraIteartor.from('determination')
	 *     .unique()
	 *     .toArray()
	 *      // returns ['d', 'e', 't', 'r', 'm', 'i', 'n', 'a', 'o']
	 */
	unique(keyProvider: (value: T) => unknown = value => value): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const seen = new Set<unknown>();
			for (let item; item = this.next(), !item.done;) {
				const key = keyProvider(item.value);
				if (!seen.has(key)) {
					seen.add(key);
					yield item.value;
				}
			}
		}.call(this));
	}

	/**
	 * Creates a new iterator that yields the values of this iterator, but won't yield any null or undefined values.
	 *
	 * @example ExtraIterator.from([0, 1, null, 3, undefined, 5])
	 *    .compact()
	 *    .toArray()
	 *    // returns [0, 1, 3, 5]
	 */
	compact(): ExtraIterator<Exclude<T, null|undefined>> {
		const predicate = (value => value !== null && value !== undefined) as
			(value: T) => value is Exclude<T, null|undefined>;
		return ExtraIterator.from(this.filter(predicate));
	}

	/**
	 * Appends a new value to the end of the iterator.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3])
	 *     .append(4)
	 *     .toArray()
	 *     // returns [1, 2, 3, 4]
	 */
	append<U>(item: U): ExtraIterator<T | U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* this;
			yield item;
		}.call(this));
	}

	/**
	 * Prepends a new value to the beginning of the iterator. The new value will be yielded first, then the rest of this
	 * iterator will be yielded.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3])
	 *     .prepend(0)
	 *     .toArray()
	 *     // returns [0, 1, 2, 3]
	 */
	prepend<U>(item: U): ExtraIterator<T | U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield item;
			yield* this;
		}.call(this));
	}

	/**
	 * Concatenates multiple values to the end of this iterator.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3])
	 *     .concat([4, 5, 6])
	 *     .toArray()
	 *     // returns [1, 2, 3, 4, 5, 6]
	 */
	concat<U>(items: Iterable<U>): ExtraIterator<T | U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* this;
			yield* items;
		}.call(this));
	}

	/**
	 * Concatenates multiple values to the start of this iterator.
	 *
	 * The order of the values is preserved. This means the first element yielded by the returning iterator will be the
	 * first element of the `items` param; and the first element of this iterator will be yielded after the last element
	 * of the `items` param.
	 *
	 * @example
	 *
	 * ExtraIterator.from([4, 5, 6])
	 *     .prependAll([1, 2, 3])
	 *     .toArray()
	 *     // returns [1, 2, 3, 4, 5, 6]
	 */
	prependAll<U>(items: Iterable<U>): ExtraIterator<T | U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* items;
			yield* this;
		}.call(this));
	}

	/**
	 * Creates a new iterator that invokes the provided callback function over each element of this iterator and yields
	 * the elements for which the callback returns `true`, only for as long as the callback returns `true`.
	 *
	 * This is similar to {@link filter}, except iteration stops once the callback returns `false` for the first time.
	 *
	 * @example
	 *
	 * ExtraIterator.from(['Alice', 'Antony', 'Charlie', 'Ashley'])
	 *     .takeWhile(name => name[0] === 'A')
	 *     .toArray()
	 *     // returns ['Alice', 'Antony']
	 *
	 * // ℹ Note that, in the example above, `filter()` would have returned `['Alice', 'Antony', 'Ashley']` instead.
	 */
	takeWhile(predicate: (value: T, index: number) => boolean): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let index = 0, next; next = this.next(), !next.done; index++) {
				if (!predicate(next.value, index)) {
					break;
				}
				yield next.value;
			}
		}.call(this));
	}

	/**
	 * Creates a new iterator that invokes the provided callback function over each element of this iterator and skips
	 * the elements for which the callback returns `true`, but only for as long as the callback returns `true`.
	 *
	 * Once the callback function returns `false`, it will no longer be called. The iterator yields the element that
	 * caused the callback to return `false`, and well as the subsequent elements.
	 *
	 * @example
	 *
	 * ExtraIterator.from(['Alice', 'Antony', 'Charlie', 'Ashley'])
	 *    .dropWhile(name => name[0] === 'A')
	 *    .toArray()
	 *    // returns ['Charlie', 'Ashley']
	 */
	dropWhile(predicate: (value: T, index: number) => boolean): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let index = 0, next; next = this.next(), !next.done; index++) {
				if (!predicate(next.value, index)) {
					yield next.value;
					break;
				}
			}
			yield* this;
		}.call(this));
	}

	/**
	 * Groups the elements in this iterator into arrays of fixed size.
	 * The last array might be smaller than the others if the number of elements in this iterator is not divisible by
	 * the provided `size` param.
	 *
	 * @example ExtraIterator.from([1, 2, 3, 4, 5, 6, 7])
	 *     .chunk(3)
	 *     .toArray()
	 *     // returns [[1, 2, 3], [4, 5, 6], [7]]
	 */
	chunk(size: number): ExtraIterator<T[]> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let next; next = this.next(), !next.done;) {
				yield [next.value, ...this.take(size - 1)];
			}
		}.call(this));
	}

	/**
	 * Groups the elements in this iterator into groups of variable size.
	 *
	 * This method calls the provided predicate function for each pair of adjacent elements in this iterator. The
	 * function should return `true` if the elements should belong to the same group, or `false` if they should belong
	 * to different groups.
	 *
	 * The resulting iterator yields arrays of elements that belong to the same group.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 1, 2, 3, 3, 3, 2, 2])
	 *     .chunkWith((lhs, rhs) => lhs === rhs)
	 *     .toArray()
	 *     // returns [[1, 1], [2], [3, 3, 3], [2, 2]]
	 */
	chunkWith(predicate: (lhs: T, rhs: T, index: number, chunk: [T, ...T[]]) => boolean): ExtraIterator<T[]> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const first = this.next();
			if (first.done) {
				return;
			}
			let chunk: [T, ...T[]] = [first.value];
			for (
				let left = first, right: IteratorResult<T>, index = 0;
				right = this.next(), !right.done;
				left = right, index++
			) {
				if (predicate(left.value, right.value, index, chunk)) {
					chunk.push(right.value);
				} else {
					yield chunk;
					chunk = [right.value];
				}
			}
			yield chunk;
		}.call(this));
	}

	/**
	 * Creates a new iterator that iterates on this iterator and the proviuded other iterator, yielding arrays of pairs
	 * of elements from this iterator and the other.
	 *
	 * The elements in this iterator are the first elements of the pairs, and the elements in the other iterator are the
	 * second elements of the pairs.
	 *
	 * @example ExtraIterator.from([1, 2, 3])
	 *     .zip(['a', 'b', 'c'])
	 *     .toArray()
	 *     // returns [[1, 'a'], [2, 'b'], [3, 'c']]
	 */
	zip<U>(other: Iterable<U>): ExtraIterator<[T, U]> {
		return ExtraIterator.from(
			function*(this: ExtraIterator<T>): Generator<[T, U]> {
				const otherIterator = Iterator.from(other);
				for (
					let thisNext: IteratorResult<T>, otherNext: IteratorResult<U>;
					thisNext = this.next(), otherNext = otherIterator.next(), !thisNext.done && !otherNext.done;
				) {
					yield [thisNext.value, otherNext.value];
				}
			}.call(this)
		);
	}

	/**
	 * Creates a new iterator that yields the values of this iterator interposed by the provided separator. i.e. The
	 * separator is inserted between each pair of subsequent elements of this iterator.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3, 4])
	 *     .interpose('a')
	 *     .toArray()
	 *     // returns [1, 'a', 2, 'a', 3, 'a', 4]
	 */
	interpose<U>(separator: U): ExtraIterator<T|U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let next = this.next(); !next.done;) {
				yield next.value;
				next = this.next();
				if (!next.done) {
					yield separator;
				}
			}
		}.call(this));
	}

	/**
	 * Creates a new iterator that yields the values of this iterator interposed by separator values produced by calling
	 * the callback function provided as argument.
	 *
	 * @example
	 *
	 * ExtraIterator.from([2, 3, 5, 8])
	 *     .interposeWith((lhs, rhs) => (lhs + rhs) / 2)
	 *     .toArray()
	 *     // returns [2, 2.5, 3, 4, 5, 6.5, 8]
	 */
	interposeWith<U>(separatorProvider: (lhs: T, rhs: T, index: number) => U): ExtraIterator<T|U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let previous = this.next(), next: IteratorResult<T>, index = 0;
				!previous.done;
				previous = next, index++
			) {
				yield previous.value;
				next = this.next();
				if (!next.done) {
					yield separatorProvider(previous.value, next.value, index);
				}
			}
		}.call(this));
	}

	/**
	 * Creates a new iterator that yields the values of this iterator and the values of the provided iterator
	 * interleaved (alternating). The elements of this iterator always come before the elements of the other iterator.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3])
	 *     .interleave(['a', 'b', 'c'])
	 *     .toArray()
	 *     // returns [1, 'a', 2, 'b', 3, 'c']
	 */
	interleave<U>(other: ExtraIteratorSource<U>): ExtraIterator<T|U> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const otherIterator = ExtraIterator.from(other);
			for (let next, otherNext;
				next = this.next(),
				otherNext = otherIterator.next(),
				!next.done || !otherNext.done;
			) {
				if (!next.done) {
					yield next.value;
				}
				if (!otherNext.done) {
					yield otherNext.value;
				}
			}
		}.call(this));
	}

	/**
	 * Replaces some elements of this iterator with new values.
	 *
	 * @param startIndex The index of the first element to be replaced.
	 * @param deleteCount The number of elements to be replaced.
	 * @param newItems The new elements to be inserted.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3, 4])
	 *     .splice(1, 2, 5, 6)
	 *     .toArray()
	 *     // returns [1, 5, 6, 4]
	 */
	splice(startIndex: number, deleteCount: number, ...newItems: T[]): ExtraIterator<T> {
		if (startIndex < 0) {
			return ExtraIterator.from(this.toArray().toSpliced(startIndex, deleteCount, ...newItems));
		}
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let index = 0, next; next = this.next(), !next.done; index++) {
				if (index === startIndex) {
					yield* newItems;
				}
				if (index < startIndex || index >= startIndex + deleteCount) {
					yield next.value;
				}
			}
		}.call(this));
	}

	/**
	 * If this iterator is empty, returns an iterator with the provided element as its only element; otherwise, it
	 * returns a copy of this iterator.
	 */
	defaultIfEmpty(provider: () => T): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const result = this.next();
			if (result.done) {
				yield provider();
			} else {
				yield result.value;
				yield* this;
			}
		}.call(this));
	}

	/**
	 * Creates a new iterator that yields the values of this iterator and then reiterates over the same values and
	 * yields each of them again, a number of times determined by the {@param times} parameter. If omitted, loops
	 * infinitely.
	 *
	 * @example ExtraIterator.from([1, 2, 3]).loop(3).toArray() // returns [1, 2, 3, 1, 2, 3, 1, 2, 3]
	 */
	loop(times: number = Infinity): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const values = this.toArray();
			for (let i = 0; i < times; i++) {
				yield* values;
			}
		}.call(this));
	}

	// =================================================================================================================
	// AGGREGATING FUNCTIONS
	// -----------------------------------------------------------------------------------------------------------------
	// These functions consume the iterator and return a new value.
	// =================================================================================================================

	/**
	 * Returns the first element of the iterator, or `undefined` if the iterator is empty.
	 */
	first(): T|undefined {
		const next = this.next();
		return next.done ? undefined : next.value;
	}

	/**
	 * Consumes the iteratror and returns the last value yielded.
	 *
	 * Returns `undefined` if the iterator is empty.
	 */
	last(): T|undefined {
		let previousItem = this.next();
		if (previousItem.done) {
			return undefined;
		}
		for (
			let currentItem;
			currentItem = this.next(), !currentItem.done;
			previousItem = currentItem
		);
		return previousItem.value;
	}

	/**
	 * Consumes the iterator and returns the value at the provided index.
	 */
	at(index: number): T|undefined {
		return index === -1 ? this.last()
			: index < 0 ? this.take(index).at(0)
			: this.drop(index).first();
	}

	/**
	 * Groups the elements in this iterator into separate arrays and returns an object containing all the groups.
	 *
	 * The returned object is composed of keys generated by calling the provided callback function on each element of
	 * this iterator, and the value for each key is an array containing all the elements that were assigned to that key.
	 *
	 * This method is similar to {@link toMap}, but the returned object is a plain, null-prototype, object, instead of a
	 * `Map`.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3, 4, 5])
	 *  .groupBy(value => value % 2 === 0 ? 'even' : 'odd')
	 *  .toArray()
	 *  // returns { even: [2, 4], odd: [1, 3, 5] }
	 */
	groupBy<K extends string|symbol>(callbackfn: (value: T, index: number) => K): Partial<Record<K, T[]>> {
		return this.collect(items => Object.groupBy(items, callbackfn));
	}

	/**
	 * Groups elements into separate arrays and returns a Map containing each group.
	 *
	 * The returned Map is composed of keys generated by calling the provided callback function on each element of this
	 * iterator, and the value for each key is an array containing all the elements to which the callback function
	 * returned that key.
	 *
	 * This method is similart to {@link groupBy}, but the returned object is a Map instead of a plain object.
	 */
	toMap<K extends string|symbol>(callbackfn: (value: T, index: number) => K): Map<K, T[]> {
		return this.collect(items => Map.groupBy(items, callbackfn));
	}

	/**
	 * Creates a set containing all the values yielded by this iterator.
	 */
	toSet(): Set<T> {
		return new Set(this);
	}

	toChainOfResponsibilityFunction<ResultType = void|Promise<void>, ParamsType extends any[] = []>(
		invokeHandler: (handler: T, next: (...args: ParamsType) => ResultType, ...args: ParamsType) => ResultType,
	): (...args: ParamsType) => ResultType {
		const handlers = this.toArray();
		return (...initialArgs: ParamsType): ResultType => {
			const iterator = Iterator.from(handlers);
			function nextFn(...args: ParamsType): ResultType {
				const next = iterator.next();
				if (next.done) {
					throw new Error('Chain of responsibility exhausted. No more handlers available.');
				}
				return invokeHandler(next.value, nextFn, ...args);
			};
			return nextFn(...initialArgs);
		};
	}

	/**
	 * Consumes the iterator and returns a value determined by calling the provided function using the iterator as
	 * argument.
	 *
	 * @example
	 *
	 * ExtraIterator.from(Object.entries({ a: 1, b: 2 }))
	 *     .map(([key, value]) => ['_' + key, value * 2])
	 *     .collect(Object.fromEntries)
	 *     // returns { _a: 2, _b: 4 }
	 */
	collect<U>(collectfn: ((iter: Iterable<T>) => U)): U {
		return collectfn(this);
	}

	/**
	 * Sums the numeric value of all elements in the iterator and returns the total.
	 *
	 * @example ExtraIterator.from([5, 8, 13]).sum() // returns 26
	 */
	sum(): number {
		return this.reduce((a, b) => a + Number(b), 0);
	}

	/**
	 * Consumes the iterator and returns the number of elements it contained.
	 *
	 * @example ExtraIterator.from([1, 2, 3, 4]).count() // returns 4
	 */
	count(): number {
		let count = 0;
		for (let next; next = this.next(), !next.done;) {
			count++;
		}
		return count;
	}

	/**
	 * Consumes the iterator and returns a boolean indicating whether all elements in the iterator were unique.
	 *
	 * If it returns false, then the iterator had at least one duplicated element.
	 *
	 * @example
	 *
	 * ExtraIterator.from([1, 2, 3]).testUnique() // returns true
	 * ExtraIterator.from([1, 2, 3, 1]).testUnique() // returns false
	 */
	testUnique(mapper?: (value: T) => unknown): boolean {
		const seen = new Set<unknown>();
		for (let next; next = this.next(), !next.done;) {
			const value = mapper ? mapper(next.value) : next.value;
			if (seen.has(value)) {
				return false;
			}
			seen.add(value);
		}
		return true;
	}

	// =================================================================================================================
	// MISC FUNCTIONS
	// =================================================================================================================

	/**
	 * Lazily executes a function over each element of this iterator as the values are iterated.
	 *
	 * This method does not change the output values of the iterator.
	 *
	 * This method is equivalent to {@link map} when the callback function returns the iterated value.
	 *
	 * This is similar to {@link forEach}, except the callback function is not executed immediately (instead, it is
	 * executed when the iterator is iterated), and this method returns the iterator itself.
	 */
	withEach(callbackfn: (value: T, index: number) => void): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let index = 0, next; next = this.next(), !next.done; index++) {
				callbackfn(next.value, index);
				yield next.value;
			}
		}.call(this));
	}
}
