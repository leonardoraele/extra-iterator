interface ArrayIsh<T> {
	[index: number]: T;
	length: number;
}

export type ExtraIteratorSource<T> = Iterator<T, any, any> | Iterable<T, any, any> | ArrayIsh<T>;

export class ExtraIterator<T> extends Iterator<T, any, any> {
	// TODO Consider using a lib like `make-iterator` to transform things into iterators
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

	static empty<T = any>(): ExtraIterator<T> {
		return new ExtraIterator([]);
	}

	static count(): ExtraIterator<number>;
	static count(end: number): ExtraIterator<number>;
	static count(start: number, end: number): ExtraIterator<number>;
	static count(start: number, end: number, interval: number): ExtraIterator<number>;
	static count(...args: number[]): ExtraIterator<number> {
		const [start, end, interval] = args.length === 0 ? [0, Infinity, 1]
			: args.length === 1 ? [0, args[0]!, 1]
			: [args[0]!, args[1]!, args[2] ?? 1];
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

	concat(items: Iterable<T>): ExtraIterator<T> {
		return ExtraIterator.from(function*(this: ExtraIterator<T>) {
			yield* this;
			yield* items;
		}.call(this));
	}

	append(item: T): ExtraIterator<T> {
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

	prepend(item: T): ExtraIterator<T> {
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

	count(): number {
		let count = 0;
		for (let next; next = this.next(), !next.done;) {
			count++;
		}
		return count;
	}

	uniqueness(mapper?: (value: T) => unknown): boolean {
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
}
