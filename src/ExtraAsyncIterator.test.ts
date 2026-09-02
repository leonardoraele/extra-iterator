import { describe, it, test } from 'node:test';
import { expect } from 'expect';
import { ExtraAsyncIterator } from './ExtraAsyncIterator.js';

describe(ExtraAsyncIterator.name, () => {
	const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
	const step = () => new Promise<void>(resolve => globalThis.queueMicrotask(resolve));

	describe(ExtraAsyncIterator.from.name, () => {
		it('accepts an iterable', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3]).toArray()).resolves.toEqual([1, 2, 3]);
		});

		it('accepts an iterator', async () => {
			const iterator = (function* () { yield 'a'; yield 'b'; })();
			await expect(ExtraAsyncIterator.from(iterator).toArray()).resolves.toEqual(['a', 'b']);
		});

		it('accepts an async iterable', async () => {
			const source = {
				[Symbol.asyncIterator]() {
					return (async function* () {
						await step();
						yield 10;
						await step();
						yield 20;
						await step();
					})();
				}
			};
			await expect(ExtraAsyncIterator.from(source).toArray()).resolves.toEqual([10, 20]);
		});

		it('accepts an async iterator', async () => {
			const source = (async function* () {
				await step();
				yield 10;
				await step();
				yield 20;
				await step();
			})();
			await expect(ExtraAsyncIterator.from(source).toArray()).resolves.toEqual([10, 20]);
		});

		it('accepts a readable stream', async () => {
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue('x');
					controller.enqueue('y');
					controller.close();
				},
			});
			await expect(ExtraAsyncIterator.from(stream).toArray()).resolves.toEqual(['x', 'y']);
		});
	});

	// TODO
	// describe(ExtraAsyncIterator.fromEvents.name, () => {
	// 	it('works', async () => {
	// 		const target = new EventTarget();
	// 		const controller = new AbortController();
	// 		const iterator = ExtraAsyncIterator.fromEvents(target, 'tick', { signal: controller.signal });
	// 		{
	// 			target.dispatchEvent(new CustomEvent('tick', { detail: 'payload' }));
	// 			const result = await iterator.next();
	// 			expect(result.done).toBe(false);
	// 			expect(result.value).toHaveLength(1);
	// 			expect((result.value as unknown[])[0]).toBeInstanceOf(CustomEvent);
	// 			expect((result.value as unknown[])[0]).toMatchObject({ type: 'tick', detail: 'payload' });
	// 		}
	// 		controller.abort();
	// 		{
	// 			target.dispatchEvent(new CustomEvent('tick', { detail: 'payload' }));
	// 			const result = await iterator.next();
	// 			expect(result.done).toBe(true);
	// 		}
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.fromInterval.name, () => {
	// 	it.skip('works'/*, async () => {
	// 		const iterator = ExtraAsyncIterator.fromInterval(10);
	// 		const result = await Promise.race([
	// 			iterator.next().then(result => ({ type: 'value', result })),
	// 			wait(50).then(() => ({ type: 'timeout' })),
	// 		]);
	// 		expect(result.type).toBe('value');
	// 		if (result.type === 'value') {
	// 			expect(result.result.done).toBe(false);
	// 			expect(result.result.value).toBeUndefined();
	// 		}
	// 		await iterator.return();
	// 	}*/);
	// });

	// TODO
	// describe(ExtraAsyncIterator.fromAnimationFrames.name, () => {
	// 	it('works', async () => {
	// 		const iterator = ExtraAsyncIterator.fromAnimationFrames();
	// 		const result = await Promise.race([
	// 			iterator.next().then(result => ({ type: 'value', result })),
	// 			wait(50).then(() => ({ type: 'timeout' })),
	// 		]);
	// 		expect(result.type).toBe('value');
	// 		if (result.type === 'value') {
	// 			expect(result.result.done).toBe(false);
	// 			expect(typeof result.result.value).toBe('number');
	// 		}
	// 		await iterator.return();
	// 	});

	// 	it('works when animation frames are delayed', async () => {
	// 		const original = globalThis.requestAnimationFrame.bind(globalThis);
	// 		const calls: Array<number> = [];
	// 		const shim = (callback: FrameRequestCallback) => {
	// 			const id = setTimeout(() => {
	// 				const delta = 16; calls.push(delta);
	// 				callback(delta);
	// 			}, 10);
	// 			return id as unknown as number;
	// 		};
	// 		globalThis.requestAnimationFrame = shim as typeof globalThis.requestAnimationFrame;
	// 		try {
	// 			const iterator = ExtraAsyncIterator.fromAnimationFrames();
	// 			const result = await iterator.next();
	// 			expect(result.done).toBe(false);
	// 			expect(result.value).toBe(16);
	// 			await iterator.return();
	// 		} finally {
	// 			globalThis.requestAnimationFrame = original;
	// 		}
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.merge.name, () => {
	// 	test('zero iterables', async () => {
	// 		await expect(ExtraAsyncIterator.merge().toArray()).resolves.toEqual([]);
	// 	});

	// 	test('one iterable', async () => {
	// 		await expect(ExtraAsyncIterator.merge(ExtraAsyncIterator.from([1, 2, 3])).toArray()).resolves.toEqual([1, 2, 3]);
	// 	});

	// 	test('multiple iterables', async () => {
	// 		const values = await ExtraAsyncIterator.merge(
	// 			ExtraAsyncIterator.from([1, 2]),
	// 			ExtraAsyncIterator.from([3, 4]),
	// 			ExtraAsyncIterator.from([5, 6]),
	// 		).toArray();
	// 		expect(new Set(values)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
	// 		expect(values).toHaveLength(6);
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.subscribe.name, () => {
	// 	it('works', async () => {
	// 		const values = await ExtraAsyncIterator.subscribe<number[]>(listener => {
	// 			const timeoutA = setTimeout(() => listener(1), 5);
	// 			const timeoutB = setTimeout(() => listener(2), 10);
	// 			return () => {
	// 				clearTimeout(timeoutA);
	// 				clearTimeout(timeoutB);
	// 			};
	// 		}).toArray();
	// 		expect(values).toEqual([[1], [2]]);
	// 	});
	// });

	describe(ExtraAsyncIterator.withController.name, () => {
		it('works', async () => {
			const { controller, iterator } = ExtraAsyncIterator.withController<number>();
			controller.enqueue(1);
			controller.enqueue(2);
			controller.close();
			await expect(iterator.toArray()).resolves.toEqual([1, 2]);
		});
	});

	describe(ExtraAsyncIterator.prototype.chunk.name, () => {
		test('size 0', async () => {
			await expect(async () => ExtraAsyncIterator.from([1, 2, 3]).chunk(0).toArray()).rejects.toThrow();
		});

		test('size 1', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3]).chunk(1).toArray()).resolves.toEqual([[1], [2], [3]]);
		});

		test('size 3', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3, 4]).chunk(3).toArray()).resolves.toEqual([[1, 2, 3], [4]]);
		});
	});

	describe(ExtraAsyncIterator.prototype.chunkBy.name, () => {
		test('works', async () => {
			await expect(
				ExtraAsyncIterator.from([1, 1, 3, 5, 2, 4, 1, 8, 2]).chunkBy(n => n % 2 === 0).toArray(),
			).resolves.toEqual([[1, 1, 3, 5], [2, 4], [1], [8, 2]]);
		});
	});

	describe(ExtraAsyncIterator.prototype.chunkWith.name, () => {
		test('works', async () => {
			await expect(
				ExtraAsyncIterator.from([1, 1, 3, 5, 2, 4, 1, 8, 2])
					.chunkWith((lhs, rhs, chunk) => lhs % 2 === rhs % 2 && chunk.length < 3)
					.toArray(),
			).resolves.toEqual([[1, 1, 3], [5], [2, 4], [1], [8, 2]]);
		});
	});

	// TODO
	// describe(ExtraAsyncIterator.prototype.chunkInterval.name, () => {
	// 	test('works', async () => {
	// 		const { controller, iterator } = ExtraAsyncIterator.withController<number>();
	// 		const chunked = iterator.chunkInterval(20);
	// 		controller.enqueue(1);
	// 		await wait(10);
	// 		controller.enqueue(2);
	// 		await wait(30);
	// 		controller.enqueue(3);
	// 		controller.close();
	// 		await expect(chunked.toArray()).resolves.toEqual([[1, 2], [3]]);
	// 	});
	// });

	describe(ExtraAsyncIterator.prototype.compact.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, null, 2, undefined, 3]).compact().toArray()).resolves.toEqual([1, 2, 3]);
		});
	});

	// TODO
	// describe(ExtraAsyncIterator.prototype.debounce.name, () => {
	// 	test('works', async () => {
	// 		await expect(ExtraAsyncIterator.from([1, 2, 3]).debounce(10).toArray()).resolves.toEqual([3]);
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.prototype.delay.name, () => {
	// 	test('works', async () => {
	// 		const start = Date.now();
	// 		const values = await ExtraAsyncIterator.from([1, 2, 3]).delay(10).toArray();
	// 		expect(values).toEqual([1, 2, 3]);
	// 		expect(Date.now() - start).toBeGreaterThanOrEqual(20);
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.prototype.delayWith.name, () => {
	// 	test('works', async () => {
	// 		await expect(ExtraAsyncIterator.from([1, 2, 3]).delayWith(item => item * 5).toArray()).resolves.toEqual([1, 2, 3]);
	// 	});
	// });

	describe(ExtraAsyncIterator.prototype.dropRepeats.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, 1, 2, 2, 3, 3]).dropRepeats().toArray()).resolves.toEqual([1, 2, 3]);
		});
	});

	describe(ExtraAsyncIterator.prototype.dropWhile.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3, 4]).dropWhile(x => x < 3).toArray()).resolves.toEqual([3, 4]);
		});
	});

	describe(ExtraAsyncIterator.prototype.flat.name, () => {
		test('works', async () => {
			await expect(
				ExtraAsyncIterator.from([[1, 2], [[3, [4, 5], 6], 7]]).flat().toArray(),
			).resolves.toEqual([1, 2, 3, 4, 5, 6, 7]);
		});
	});

	describe(ExtraAsyncIterator.prototype.scan.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3]).scan((acc, item) => acc + item, 0).toArray()).resolves.toEqual([1, 3, 6]);
		});
	});

	// TODO
	// describe(ExtraAsyncIterator.prototype.timeout.name, () => {
	// 	test('works', async () => {
	// 		const source = (async function* () {
	// 			yield 1;
	// 			await wait(20);
	// 			yield 2;
	// 		})();
	// 		await expect(ExtraAsyncIterator.from(source).timeout(10).toArray()).rejects.toThrow('Async iterator timed out.');
	// 	});
	// });

	// TODO
	// describe(ExtraAsyncIterator.prototype.throttle.name, () => {
	// 	test('works', async () => {
	// 		await expect(ExtraAsyncIterator.from([1, 2, 3, 4]).throttle(10).toArray()).resolves.toEqual([1]);
	// 	});
	// });

	describe(ExtraAsyncIterator.prototype.unique.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, 1, 2, 2, 3]).unique().toArray()).resolves.toEqual([1, 2, 3]);
		});
	});

	describe(ExtraAsyncIterator.prototype.count.name, () => {
		test('works', async () => {
			await expect(ExtraAsyncIterator.from([1, 2, 3]).count()).resolves.toBe(3);
		});
	});

	describe(ExtraAsyncIterator.prototype.first.name, () => {
		describe('no default value provided', () => {
			test('empty iterable', async () => {
				await expect(ExtraAsyncIterator.from([]).first()).resolves.toBeUndefined();
			});
			test('single item', async () => {
				await expect(ExtraAsyncIterator.from([42]).first()).resolves.toBe(42);
			});
			test('multiple items', async () => {
				await expect(ExtraAsyncIterator.from([1, 2, 3]).first()).resolves.toBe(1);
			});
		});
		describe('with default value provided', () => {
			test('empty iterable', async () => {
				await expect(ExtraAsyncIterator.from([]).first({ default: 99 })).resolves.toBe(99);
			});
			test('single item', async () => {
				await expect(ExtraAsyncIterator.from([42]).first({ default: 99 })).resolves.toBe(42);
			});
			test('multiple items', async () => {
				await expect(ExtraAsyncIterator.from([1, 2, 3]).first({ default: 99 })).resolves.toBe(1);
			});
		});
	});

	describe(ExtraAsyncIterator.prototype.last.name, () => {
		describe('no default value provided', () => {
			test('empty iterable', async () => {
				await expect(ExtraAsyncIterator.from([]).last()).resolves.toBeUndefined();
			});
			test('single item', async () => {
				await expect(ExtraAsyncIterator.from([42]).last()).resolves.toBe(42);
			});
			test('multiple items', async () => {
				await expect(ExtraAsyncIterator.from([1, 2, 3]).last()).resolves.toBe(3);
			});
		});
		describe('with default value provided', () => {
			test('empty iterable', async () => {
				await expect(ExtraAsyncIterator.from([]).last({ default: 99 })).resolves.toBe(99);
			});
			test('single item', async () => {
				await expect(ExtraAsyncIterator.from([42]).last({ default: 99 })).resolves.toBe(42);
			});
			test('multiple items', async () => {
				await expect(ExtraAsyncIterator.from([1, 2, 3]).last({ default: 99 })).resolves.toBe(3);
			});
		});
	});

	describe(ExtraAsyncIterator.prototype.toStream.name, () => {
		test('works', async () => {
			const stream = ExtraAsyncIterator.from([1, 2, 3]).toStream();
			const reader = stream.getReader();
			const values: number[] = [];
			for (;;) {
				const result = await reader.read();
				if (result.done) break;
				values.push(result.value);
			}
			expect(values).toEqual([1, 2, 3]);
		});
	});

	describe(ExtraAsyncIterator.prototype.catch.name, () => {
		test('works', async () => {
			let seen: unknown;
			const iterator = ExtraAsyncIterator.from(async function* () {
				yield 1;
				throw new Error('boom');
			}()).catch(error => {
				seen = error;
			});
			await expect(iterator.toArray()).resolves.toEqual([1]);
			expect(seen).toBeInstanceOf(Error);
		});
	});

	describe(ExtraAsyncIterator.prototype.finally.name, () => {
		test('works', async () => {
			let cleaned = false;
			const values = await ExtraAsyncIterator.from([1, 2, 3]).finally(() => {
				cleaned = true;
			}).toArray();
			expect(values).toEqual([1, 2, 3]);
			expect(cleaned).toBe(true);
		});
	});

	describe(ExtraAsyncIterator.prototype.tee.name, () => {
		test('works', async () => {
			const [left, right] = ExtraAsyncIterator.from([1, 2, 3]).tee();
			await expect(left.toArray()).resolves.toEqual([1, 2, 3]);
			await expect(right.toArray()).resolves.toEqual([1, 2, 3]);
		});
	});

	describe(ExtraAsyncIterator.prototype.then.name, () => {
		test('works', async () => {
			let called = false;
			const values = await ExtraAsyncIterator.from([1, 2, 3]).then(() => {
				called = true;
			}).toArray();
			expect(values).toEqual([1, 2, 3]);
			expect(called).toBe(true);
		});
	});

	describe(ExtraAsyncIterator.prototype.withEach.name, () => {
		test('works', async () => {
			const seen: number[] = [];
			const values = await ExtraAsyncIterator.from([1, 2, 3]).withEach(item => {
				seen.push(item);
			}).toArray();
			expect(values).toEqual([1, 2, 3]);
			expect(seen).toEqual([1, 2, 3]);
		});
	});
});
