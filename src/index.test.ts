import { ExtraIterator } from './index';
import { describe, it } from 'node:test';
import { expect } from 'expect';

describe(ExtraIterator.name, () => {
	it('should create an ExtraIterator from an array', () => {
		const array = [1, 2, 3];
		const iterator = ExtraIterator.from(array);
		expect(iterator.toArray()).toEqual(array);
	});
	it('should create an ExtraIterator from an "array-like" object', () => {
		const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
		const iterator = ExtraIterator.from(arrayLike);
		expect(iterator.toArray()).toEqual(['a', 'b', 'c']);
	});

	it('should zip two iterators', () => {
		const a = ExtraIterator.from([1, 2, 3]);
		const b = ExtraIterator.from(['a', 'b', 'c']);
		const zipped = a.zip(b);
		expect(zipped.toArray()).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
	});

	it('should zip three iterators', () => {
		const a = ExtraIterator.from([1, 2, 3]);
		const b = ExtraIterator.from(['a', 'b', 'c']);
		const c = ExtraIterator.from([true, false, true]);
		const zipped = ExtraIterator.zip(a, b, c);
		expect(zipped.toArray()).toEqual([[1, 'a', true], [2, 'b', false], [3, 'c', true]]);
	});

	it('should zip its own iterable values', () => {
		const iterator = ExtraIterator.from([
			[1, 2, 3],
			['a', 'b', 'c'],
			[true, false, true],
		]);
		const zipped = iterator.zip();
		expect(zipped.toArray()).toEqual([[1, 'a', true], [2, 'b', false], [3, 'c', true]]);
	});

	it('should count from 0 to a given number', () => {
		const iterator = ExtraIterator.count().take(5);
		expect(iterator.toArray()).toEqual([0, 1, 2, 3, 4]);
	});

	it('should count in 2s, starting from 5', () => {
		const iterator = ExtraIterator.count({ start: 5, increment: 2 }).take(5);
		expect(iterator.toArray()).toEqual([5, 7, 9, 11, 13]);
	});

	it('should repeat a value a given number of times', () => {
		const iterator = ExtraIterator.repeat('x').take(3);
		expect(iterator.toArray()).toEqual(['x', 'x', 'x']);
	});

	it('should yield random numbers', () => {
		const values = ExtraIterator.random().take(10000).toArray();
		expect(values.length).toBe(10000);
		expect(values.every(value => typeof value === 'number' && value >= 0 && value < 1)).toBe(true);
	});

	it('should yield random bytes', () => {
		const values = ExtraIterator.randomBytes({ bufferSize: 1024 }).take(1).flat().toArray();
		expect(values.length).toBe(1024);
		expect(values.every(value => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255)).toBe(true);
	});

	it('should filter values based on a predicate', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).filter(x => x % 2 === 0);
		expect(iterator.toArray()).toEqual([2, 4]);
	});

	it('should map values using a callback function', () => {
		const iterator = ExtraIterator.from([1, 2, 3]).map(x => x * 2);
		expect(iterator.toArray()).toEqual([2, 4, 6]);
	});

	it('should take a limited number of values', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).take(2);
		expect(iterator.toArray()).toEqual([1, 2]);
	});

	it('should take the last values of the sequence', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).take(-2);
		expect(iterator.toArray()).toEqual([3, 4]);
	});

	it('should drop a given number of values', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).drop(2);
		expect(iterator.toArray()).toEqual([3, 4]);
	});

	describe(ExtraIterator.prototype.flat.name, () => {
		it('should flatten nested iterables', () => {
			const iterator = ExtraIterator.from([0, [1, [2, [3, 4]]], [5, [6]], 7]).flat();
			expect(iterator.toArray()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
		});
		it('should flatten arraylike iterables if option is set', () => {
			const first = { 0: 0, 1: 1, length: 2 };
			const second = { 0: 2, 1: 3, length: 2 };
			const iterator = ExtraIterator.from([first, second]).flat({ arraylike: true });
			expect(iterator.toArray()).toEqual([0, 1, 2, 3]);
		});
		it('should not flatten arraylike iterables if option is not set', () => {
			const first = { 0: 0, 1: 1, length: 2 };
			const second = { 2: 2, 3: 3, length: 2 };
			const iterator = ExtraIterator.from([first, second]).flat();
			expect(iterator.toArray()).toEqual([first, second]);
		});
	});

	it('should return the first value', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		expect(iterator.first()).toBe(1);
	});

	it('should have a single value', () => {
		const iterator = ExtraIterator.single(42);
		expect(iterator.first()).toBe(42);
	});

	describe(ExtraIterator.prototype.last.name, () => {
		it('should return the last value if the iterator is not empty', () => {
			const iterator = ExtraIterator.from([1, 2, 3]);
			expect(iterator.last()).toBe(3);
		});
		it('should return undefined if the iterator is empty', () => {
			const iterator = ExtraIterator.empty<number>();
			expect(iterator.last()).toBeUndefined();
		});
	});

	it('should return a value at a specific index', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		expect(iterator.at(1)).toBe(2);
	});

	it('should interpose a separator between values', () => {
		const iterator = ExtraIterator.from([1, 2, 3]).interpose(0);
		expect(iterator.toArray()).toEqual([1, 0, 2, 0, 3]);
	});

	it('should interpose with a function', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 5, 8, 13]).interposeWith((a, b) => (a + b) / 2);
		expect(iterator.toArray()).toEqual([1, 1.5, 2, 2.5, 3, 4, 5, 6.5, 8, 10.5, 13]);
	});

	it('should chunk values into groups of a given size', () => {
		expect(ExtraIterator.from([1, 2, 3, 4]).chunk(1).toArray()).toEqual([[1], [2], [3], [4]]);
		expect(ExtraIterator.from([1, 2, 3, 4]).chunk(2).toArray()).toEqual([[1, 2], [3, 4]]);
		expect(ExtraIterator.from([1, 2, 3, 4]).chunk(3).toArray()).toEqual([[1, 2, 3], [4]]);
		expect(ExtraIterator.from([1, 2, 3, 4]).chunk(4).toArray()).toEqual([[1, 2, 3, 4]]);
		expect(ExtraIterator.from([1, 2, 3, 4]).chunk(5).toArray()).toEqual([[1, 2, 3, 4]]);
	});

	it('should not chunk values into groups of invalid size', () => {
		expect(() => ExtraIterator.from([1, 2, 3, 4]).chunk(0).toArray()).toThrow();
		expect(() => ExtraIterator.from([1, 2, 3, 4]).chunk(-1).toArray()).toThrow();
		expect(() => ExtraIterator.from([1, 2, 3, 4]).chunk(1.5).toArray()).toThrow();
	});

	it('should remove duplicate values', () => {
		const iterator = ExtraIterator.from([1, 2, 2, 3]).unique();
		expect(iterator.toArray()).toEqual([1, 2, 3]);
	});

	it('should compact values by removing null and undefined', () => {
		const iterator = ExtraIterator.from([1, null, 2, undefined, 3]).compact();
		expect(iterator.toArray()).toEqual([1, 2, 3]);
	});

	it('should concatenate two iterators', () => {
		const a = ExtraIterator.from([1, 2]);
		const b = ExtraIterator.from([3, 4]);
		const concatenated = a.concat(b);
		expect(concatenated.toArray()).toEqual([1, 2, 3, 4]);
	});

	it('should build a new iterator by concatenating multiple iterators, iterables, or array-like objects', () => {
		const iterator = Iterator.from([1, 2]);
		const iterable = [3, 4];
		const arraylike = { 0: 5, 1: 6, length: 2 };
		const concatenated = ExtraIterator.concat(iterator, iterable, arraylike);
		expect(concatenated.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('should prepend a value to the iterator', () => {
		const iterator = ExtraIterator.from([2, 3]).prepend(1);
		expect(iterator.toArray()).toEqual([1, 2, 3]);
	});

	it('should prepend multiple values to the iterator', () => {
		const iterator = ExtraIterator.from([4, 5, 6]).prependAll([1, 2, 3]);
		expect(iterator.toArray()).toEqual([1, 2, 3, 4, 5, 6]);
	});

	it('should append a value to the iterator', () => {
		const iterator = ExtraIterator.from([1, 2]).append(3);
		expect(iterator.toArray()).toEqual([1, 2, 3]);
	});

	describe(ExtraIterator.prototype.take.name, () => {
		it('should take a given number of values', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4]).take(2);
			expect(iterator.toArray()).toEqual([1, 2]);
		});
		it('should take the last values of the sequence', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4]).take(-2);
			expect(iterator.toArray()).toEqual([3, 4]);
		});
		it('should take only as many values as the iterator contains', async t => {
			await t.test('positive count', () => expect(ExtraIterator.from([1, 2]).take(5).toArray()).toEqual([1, 2]));
			await t.test('negative count', () => expect(ExtraIterator.from([1, 2]).take(-5).toArray()).toEqual([1, 2]));
		});
	});

	describe(ExtraIterator.prototype.drop.name, () => {
		it('should drop a given number of values', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4]).drop(2);
			expect(iterator.toArray()).toEqual([3, 4]);
		});
		it('should drop the last values of the sequence', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4]).drop(-2);
			expect(iterator.toArray()).toEqual([1, 2]);
		});
		it('should drop only as many values as the iterator contains', () => {
			expect(ExtraIterator.from([1, 2]).drop(5).toArray()).toEqual([]);
			expect(ExtraIterator.from([1, 2]).drop(-5).toArray()).toEqual([]);
		});
	});

	it('should take values while a predicate is true', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).takeWhile(x => x < 3);
		expect(iterator.toArray()).toEqual([1, 2]);
	});

	it('should drop values while a predicate is true', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).dropWhile(x => x < 3);
		expect(iterator.toArray()).toEqual([3, 4]);
	});

	it('should interleave two iterators', () => {
		const a = ExtraIterator.from([1, 3]);
		const b = ExtraIterator.from([2, 4]);
		const interleaved = a.interleave(b);
		expect(interleaved.toArray()).toEqual([1, 2, 3, 4]);
	});

	it('should splice values in the iterator', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).splice(1, 2, 5, 6);
		expect(iterator.toArray()).toEqual([1, 5, 6, 4]);
	});

	it('should splice values from the end of the iterator', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).splice(-3, 2, 5, 6);
		expect(iterator.toArray()).toEqual([1, 5, 6, 4]);
	});

	describe(ExtraIterator.prototype.defaultIfEmpty.name, () => {
		it('should provide a default value if the iterator is empty', () => {
			const iterator = ExtraIterator.empty<number>().defaultIfEmpty(42);
			expect(iterator.toArray()).toEqual([42]);
		});

		it('should relay the iterator itself if it is not empty', () => {
			const iterator = ExtraIterator.from([1, 2, 3]).defaultIfEmpty(42);
			expect(iterator.toArray()).toEqual([1, 2, 3]);
		});
	});

	describe(ExtraIterator.prototype.defaultIfEmptyWith.name, () => {
		it('should provide a default value if the iterator is empty', () => {
			const iterator = ExtraIterator.empty<number>().defaultIfEmptyWith(() => 42);
			expect(iterator.toArray()).toEqual([42]);
		});

		it('should relay the iterator itself if it is not empty', () => {
			const iterator = ExtraIterator.from([1, 2, 3]).defaultIfEmptyWith(() => 42);
			expect(iterator.toArray()).toEqual([1, 2, 3]);
		});
	});

	it('should group values by a key', () => {
		const iterator = ExtraIterator.from(['apple', 'banana', 'apricot']);
		const grouped = iterator.groupBy(word => word[0]!);
		expect(grouped).toEqual({
			a: ['apple', 'apricot'],
			b: ['banana'],
		});
	});

	it('should convert to a Map', () => {
		const iterator = ExtraIterator.from([{ key: 'a', value: 1 }, { key: 'b', value: 2 }, { key: 'a', value: 3 }]);
		const map = iterator.toMap(item => item.key);
		expect(map).toBeInstanceOf(Map);
		expect(map).toEqual(new Map([
			['a', [{ key: 'a', value: 1 }, { key: 'a', value: 3 }]],
			['b', [{ key: 'b', value: 2 }]],
		]));
	});

	it('should convert to a Set', () => {
		const iterator = ExtraIterator.from([3, 1, 3, 2, 2, 1, 3]);
		const set = iterator.toSet();
		expect(set).toBeInstanceOf(Set);
		expect(set.size).toBe(3);
		expect(set.has(1)).toBe(true);
		expect(set.has(2)).toBe(true);
		expect(set.has(3)).toBe(true);
		expect(set).toEqual(new Set([3, 1, 2]));
	});

	it('should collect values using a custom collector', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		const sum = iterator.collect(iter => Array.from(iter).reduce((a, b) => a + b, 0));
		expect(sum).toBe(6);
	});

	describe('sum', () => {
		it('should sum numbers', () => {
			const iter = ExtraIterator.from([5, 8, 13]);
			expect(iter.sum()).toBe(26);
		});
		it('should sum the numeric value of objects', () => {
			const iter = ExtraIterator.from([
				{ valueOf: () => 5 },
				{ valueOf: () => 8 },
				{ valueOf: () => 13 },
			]);
			expect(iter.sum()).toBe(26);
		});
	});

	describe('chunkWith', () => {
		it('should chunk using a comparer function', () => {
			const result = ExtraIterator.from([1, 1, 2, 3, 3, 3, 2, 2])
				.chunkWith((lhs, rhs) => lhs === rhs)
				.toArray();
			expect(result).toEqual([[1, 1], [2], [3, 3, 3], [2, 2]]);
		});
		it('should chunk using a key selector function', () => {
			const result = ExtraIterator.from(['apple', 'apricot', 'banana', 'avocado'])
				.chunkWith((lhs, rhs) => lhs[0] === rhs[0])
				.toArray();
			expect(result).toEqual([['apple', 'apricot'], ['banana'], ['avocado']]);
		});
		it('should build an empty iterator for an empty iterator', () => {
			const result = ExtraIterator.from([]).chunkWith((lhs, rhs) => lhs === rhs).toArray();
			expect(result).toEqual([]);
		});
	});

	describe(ExtraIterator.prototype.chunkBy.name, () => {
		it('should chunk values based on a key selector function', () => {
			const result = ExtraIterator.from(['apple', 'apricot', 'banana', 'avocado'])
				.chunkBy(word => word[0])
				.toArray();
			expect(result).toEqual([['apple', 'apricot'], ['banana'], ['avocado']]);
		});
		it('should chunk values with unique keys', () => {
			const result = ExtraIterator.from(['apple', 'apricot', 'banana', 'avocado'])
				.chunkBy(() => Symbol())
				.toArray();
			expect(result).toEqual([['apple'], ['apricot'], ['banana'], ['avocado']]);
		});
		it('should chunk values with the same key', () => {
			const result = ExtraIterator.from(['apple', 'apricot', 'banana', 'avocado'])
				.chunkBy(() => 'key')
				.toArray();
			expect(result).toEqual([['apple', 'apricot', 'banana', 'avocado']]);
		});
		it('should build an empty iterator for an empty iterator', () => {
			const result = ExtraIterator.from([]).chunkBy(() => Symbol()).toArray();
			expect(result).toEqual([]);
		});
	});

	it('should create a chain of responsibility function', () => {
		const humanizeDuration = ExtraIterator.from<(next: (duration: number) => string, duration: number) => string>([
			(next, miliseconds) => miliseconds < 1000 ? `${miliseconds} miliseconds` : next(miliseconds / 1000),
			(next, seconds) => seconds < 60 ? `${seconds} seconds` : next(seconds / 60),
			(next, minutes) => minutes < 60 ? `${minutes} minutes` : next(minutes / 60),
			(next, hours) => hours < 24 ? `${hours} hours` : next(hours / 24),
			(_next, days) => `${days} days`,
		]).toChainOfResponsibilityFunction<string, [number]>((handler, next, value) => handler(next, value));

		expect(humanizeDuration(500)).toBe('500 miliseconds');
		expect(humanizeDuration(2000)).toBe('2 seconds');
		expect(humanizeDuration(120000)).toBe('2 minutes');
		expect(humanizeDuration(7200000)).toBe('2 hours');
		expect(humanizeDuration(172800000)).toBe('2 days');
	});

	it('should throw an error if no handlers are available', () => {
		const handlers = ExtraIterator.empty();
		const chain = handlers.toChainOfResponsibilityFunction(next => next());

		expect(() => chain()).toThrow();
	});

	describe(ExtraIterator.prototype.loop.name, () => {
		it('should loop a specified number of times', () => {
			const iterator = ExtraIterator.from([1, 2, 3]).loop(3);
			expect(iterator.toArray()).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);
		});
		it('should loop infinitely if the count is not specified', () => {
			const iterator = ExtraIterator.from([1, 2, 3]).loop();
			expect(iterator.take(10).toArray()).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3, 1]);
		});
		it('should not throw if the count is not integer', () => {
			expect(ExtraIterator.from([1, 2, 3]).loop(2.7).toArray()).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);
			expect(ExtraIterator.from([1, 2, 3]).loop(2.3).toArray()).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);
			expect(ExtraIterator.from([1, 2, 3]).loop(2.5).toArray()).toEqual([1, 2, 3, 1, 2, 3, 1, 2, 3]);
		});
		it('should loop in ping-pong mode', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4, 5]).loop(5, { pingpong: true });
			expect(iterator.toArray()).toEqual([1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5]);
		});
		it('should loop infinitely in ping-pong mode', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4, 5]).loop({ pingpong: true }).take(25);
			expect(iterator.toArray()).toEqual([1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5]);
		});
		it('should loop in reverse if the count is negative', () => {
			const iterator = ExtraIterator.from([1, 2, 3]).loop(-2);
			expect(iterator.toArray()).toEqual([3, 2, 1, 3, 2, 1]);
		});
		it('should loop in reverse in ping-pong mode if the count is negative', () => {
			const iterator = ExtraIterator.from([1, 2, 3, 4, 5]).loop(-5, { pingpong: true });
			expect(iterator.toArray()).toEqual([5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1]);
		});
		it('should yield an empty iterator if the count is 0', () => {
			expect(ExtraIterator.from([1, 2, 3]).loop(0).toArray()).toEqual([]);
			expect(ExtraIterator.from([1, 2, 3]).loop(Number.EPSILON).toArray()).toEqual([1, 2, 3]);
			expect(ExtraIterator.from([1, 2, 3]).loop(-Number.EPSILON).toArray()).toEqual([3, 2, 1]);
		});
	});

	describe(ExtraIterator.range.name, () => {
		it('should iterate over ranges', () => {
			expect(ExtraIterator.range(5, 10).toArray()).toEqual([5, 6, 7, 8, 9]);
			expect(ExtraIterator.range(5, 10).append(10).toArray()).toEqual([5, 6, 7, 8, 9, 10]);
		});
		it('should iterate over ranges with steps', () => {
			expect(ExtraIterator.range(1, 10, { step: 2 }).toArray()).toEqual([1, 3, 5, 7, 9]);
			expect(ExtraIterator.range(0, 1, { step: 0.25 }).toArray()).toEqual([0, 0.25, 0.5, 0.75]);
			expect(ExtraIterator.range(10, 0, { step: 2 }).toArray()).toEqual([10, 8, 6, 4, 2]);
			expect(ExtraIterator.range(10, 0, { step: -2 }).toArray()).toEqual([10, 8, 6, 4, 2]);
		});
		it('should iterate over inclusive ranges', () => {
			expect(ExtraIterator.range(1, 10, { inclusive: true }).toArray()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
			expect(ExtraIterator.range(1, 10, { inclusive: true, step: 2 }).toArray()).toEqual([1, 3, 5, 7, 9]);
			expect(ExtraIterator.range(0, 1, { inclusive: true, step: 0.25 }).toArray()).toEqual([0, 0.25, 0.5, 0.75, 1]);
			expect(ExtraIterator.range(10, 0, { inclusive: true, step: -2 }).toArray()).toEqual([10, 8, 6, 4, 2, 0]);
		});
		it('should throw an error if the step is 0', () => {
			expect(() => ExtraIterator.range(0, 10, { step: 0 }).toArray()).toThrow();
		});
	});

	it('should count the number of elements in the iterator', () => {
		expect(ExtraIterator.from([1, 2, 3]).count()).toBe(3);
		expect(ExtraIterator.empty().count()).toBe(0);
	});

	describe(ExtraIterator.prototype.testUnique.name, () => {
		it('should return true if all values are unique', () => {
			expect(ExtraIterator.from([1, 2, 3]).testUnique()).toBe(true);
		});
		it('should return false if there are duplicate values', () => {
			expect(ExtraIterator.from([1, 2, 2, 3]).testUnique()).toBe(false);
		});
		it('should return true for an empty iterator', () => {
			expect(ExtraIterator.empty().testUnique()).toBe(true);
		});
	});

	describe(ExtraIterator.prototype.withEach.name, () => {
		it('should perform a side effect for each value', () => {
			const sideEffects: number[] = [];
			const iterator = ExtraIterator.from([1, 2, 3]).withEach(x => void sideEffects.push(x));
			expect(iterator.toArray()).toEqual([1, 2, 3]);
			expect(sideEffects).toEqual([1, 2, 3]);
		});

		it('should not perform side effects if the iterator is not consumed', () => {
			const sideEffects: number[] = [];
			ExtraIterator.from([1, 2, 3]).withEach(x => void sideEffects.push(x));
			expect(sideEffects).toEqual([]);
		});

		it('should perform side effects even if the iterator is only partially consumed', () => {
			const sideEffects: number[] = [];
			const iterator = ExtraIterator.from([1, 2, 3]).withEach(x => void sideEffects.push(x));
			iterator.next();
			expect(sideEffects).toEqual([1]);
		});

		it('should perform side effects on objects', () => {
			const iterator = ExtraIterator.from([{ value: 1 }, { value: 2 }, { value: 3 }]).withEach(obj => obj.value *= 2);
			expect(iterator.toArray()).toEqual([{ value: 2 }, { value: 4 }, { value: 6 }]);
		});
	});
});
