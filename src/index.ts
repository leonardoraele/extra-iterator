interface ArrayIsh<T> {
	[index: number]: T;
	length: number;
}

export class ExtraIterator<T> extends Iterator<T, any, any> {
	// TODO Consider using a lib like `make-iterator` to transform things into iterators
	static override from<T>(
		source: Iterator<T, any, any> | Iterable<T, any, any> | ArrayIsh<T>,
	): ExtraIterator<T> {
		if (!(Symbol.iterator in source) && 'length' in source) {
			return new ExtraIterator(function*() {
				for (let index = 0; index < source.length; index++) {
					yield source[index]!;
				}
			}());
		}
		return new ExtraIterator(source);
	}

	static fromKeys<T extends {}>(subject: T): ExtraIterator<keyof T> {
		return new ExtraIterator(Object.keys(subject) as (keyof T)[]);
	}

	static fromValues<T extends {}>(subject: T): ExtraIterator<T[keyof T]> {
		return new ExtraIterator(Object.values(subject) as T[keyof T][]);
	}

	static fromEntries<T extends {}>(subject: T): ExtraIterator<[keyof T, T[keyof T]]> {
		return new ExtraIterator(Object.entries(subject) as [keyof T, T[keyof T]][]);
	}

	static empty<T = any>(): ExtraIterator<T> {
		return new ExtraIterator([]);
	}

	static count(max: number): ExtraIterator<number>;
	static count(start: number, end: number): ExtraIterator<number>;
	static count(start: number, end: number, interval: number): ExtraIterator<number>;
	static count(start: number, end?: number, interval?: number): ExtraIterator<number> {
		if (typeof end === 'undefined') {
			end = start;
			start = 0;
		}
		interval ??= 1;
		return new ExtraIterator(function*() {
			for (let counter = start; counter < end; counter += interval) {
				yield counter;
			}
		}());
	}

	static repeat<T>(count: number, value: T): ExtraIterator<T> {
		return new ExtraIterator(function*() {
			for (let index = 0; index < count; index++) {
				yield value;
			}
		}());
	}

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
			: ExtraIterator.from(this.takeLast(-limit));
	}

	private takeLast(count: number): T[] {
		const result: T[] = [];
		for (let item; item = this.next(), !item.done;) {
			result.push(item.value);
			if (result.length > count) {
				result.shift();
			}
		}
		return result;
	}

	override drop(count: number): ExtraIterator<T> {
		return count >= 0
			? ExtraIterator.from(super.drop(count))
			: ExtraIterator.from(this.toArray().toSpliced(count, -count));
	}

	override flatMap<U>(callback: (value: T, index: number) => Iterator<U, unknown, undefined> | Iterable<U, unknown, undefined>): ExtraIterator<U> {
		return ExtraIterator.from(super.flatMap(callback));
	}

	flatten(): T extends Iterable<infer U> ? ExtraIterator<U> : never {
		return this.flatMap(value => value as any) as any;
	}

	groupBy<K extends string|symbol>(callbackfn: (value: T, index: number) => K): Record<K, T[]> {
		const result: Record<K, T[]> = Object.create(null);
		for (let index = 0, next; next = this.next(), !next.done; index++) {
			const key = callbackfn(next.value, index);
			if (!result[key]) {
				result[key] = [];
			}
			result[key].push(next.value);
		}
		return result;
	}

	uniq(keyProvider: (value: T) => unknown = value => value): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			const seen = new Set<unknown>();
			for (let item; item = this.next(), !item.done;) {
				const key = keyProvider(item.value);
				if (!seen.has(key)) {
					yield item.value;
					seen.add(key);
				}
			}
		}.call(this));
	}

	compact(): ExtraIterator<Exclude<T, null|undefined>> {
		const predicate = (value => value !== null && value !== undefined) as
			(value: T) => value is Exclude<T, null|undefined>;
		return ExtraIterator.from(this.filter(predicate));
	}

	withEach(callbackfn: (value: T, index: number) => void): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let index = 0, next; next = this.next(), !next.done; index++) {
				callbackfn(next.value, index);
				yield next.value;
			}
		}.call(this));
	}

	first(): T|undefined {
		const next = this.next();
		return next.done ? undefined : next.value;
	}

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

	at(index: number): T|undefined {
		return index === -1 ? this.last()
			: index < 0 ? this.take(index).at(0)
			: this.drop(index).first();
	}

	appendMany(items: Iterable<T>): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* this;
			yield* items;
		}.call(this));
	}

	appendOne(item: T): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* this;
			yield item;
		}.call(this));
	}

	prependMany(items: Iterable<T>): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* items;
			yield* this;
		}.call(this));
	}

	prependOne(item: T): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield item;
			yield* this;
		}.call(this));
	}

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

	chunk(size: number): ExtraIterator<T[]> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			for (let next; next = this.next(), !next.done;) {
				yield [next.value, ...this.take(size - 1)];
			}
		}.call(this));
	}

	/**
	 * Pairs with another iterable to form an iterator of pairs.
	 * // TODO Expand to support more than 2 iterables
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
	 * Transforms from an iterator of pairs into a pair of iterators.
	 * // TODO Expand to support more than 2 iterables
	 */
	unzip(): T extends [infer U, infer V] ? [ExtraIterator<U>, ExtraIterator<V>] : never {
		return [
			this.map(value => (value as [T, T])[0]),
			this.map(value => (value as [T, T])[1]),
		] as any;
	}

	splice(startIndex: number, deleteCount: number, ...newItems: T[]): ExtraIterator<T> {
		if (startIndex < 0) {
			return ExtraIterator.from(this.toArray()
				.toSpliced(startIndex, deleteCount, ...newItems));
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

	with(index: number, value: T): ExtraIterator<T> {
		return this.splice(index, 1, value);
	}

	collect<U>(collectfn: ((iter: Iterable<T>) => U)): U {
		return collectfn(this);
	}

	toSortedBy(...keys: (keyof T)[]): T[] {
		return this.toArray()
			.sort((a, b) => {
				for (const key of keys) {
					if (a[key] < b[key]) return -1;
					if (a[key] > b[key]) return 1;
				}
				return 0;
			});
	}
}
