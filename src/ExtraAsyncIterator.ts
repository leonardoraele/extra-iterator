import { AsyncIterator } from 'async-iterator-helpers-ponyfill';
import { ExtraIterator } from './ExtraIterator';

export type FlattenedExtraAsyncIterator<T>
	= T extends Iterable<infer U> ? FlattenedExtraAsyncIterator<U>
		: T extends AsyncIterable<infer U> ? FlattenedExtraAsyncIterator<U>
		: ExtraAsyncIterator<T>;

export class ExtraAsyncIterator<T> extends AsyncIterator<T> {

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
	): ExtraAsyncIterator<unknown[]>
	{
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

	public static fromInterval({ signal = null as AbortSignal | null } = {}): ExtraAsyncIterator<void> {
		const { iterator, controller } = ExtraAsyncIterator.withController<void>();

		const intervalId = setInterval(() => {
			controller.enqueue();
		}, 1000);

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

	public override drop(limit: number): ExtraAsyncIterator<T>
	{
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
	): ExtraAsyncIterator<TNew>
	{
		return ExtraAsyncIterator.from(super.flatMap(mapper));
	}

	public override map<TNew>(mapper: (value: T) => TNew | Promise<TNew>): ExtraAsyncIterator<TNew>
	{
		return ExtraAsyncIterator.from(super.map(mapper));
	}

	public override take(count: number): ExtraAsyncIterator<T>
	{
		return ExtraAsyncIterator.from(super.take(count));
	}

	// =================================================================================================================
	// TRANSFORMING METHODS
	// =================================================================================================================

	public compact(): ExtraAsyncIterator<Exclude<T, null|undefined>> {
		const predicate = (value => value !== null && value !== undefined) as
			(value: T) => value is Exclude<T, null|undefined>;
		return this.filter(predicate);
	}

	public debounce(delayMs: number): ExtraAsyncIterator<T>;
	public debounce(delay: Temporal.Duration): ExtraAsyncIterator<T>;
	public debounce(delay: unknown): ExtraAsyncIterator<T> {
		if (typeof delay === 'number') {
			delay = Temporal.Duration.from({ milliseconds: delay });
		}
		return ExtraAsyncIterator.from(async function*(this: ExtraAsyncIterator<T>) {
			// TODO
		}.call(this));
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

	flat({ arraylike = false } = {}): FlattenedExtraAsyncIterator<T> {
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

	// =================================================================================================================
	// AGGREGATING METHODS
	// =================================================================================================================

	public count(): Promise<number> {
		return this.reduce(count => count + 1, 0);
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

	public withEach(callback: (item: T) => void): ExtraAsyncIterator<T> {
		return ExtraAsyncIterator.from(async function* (this: ExtraAsyncIterator<T>) {
			for await (const item of this) {
				callback(item);
				yield item;
			}
		}.call(this));
	}
}
