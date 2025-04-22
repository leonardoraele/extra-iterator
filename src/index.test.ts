import { ExtraIterator } from './index';
import { describe, it } from 'node:test';
import { expect } from 'expect';

describe('ExtraIterator', () => {
	it('should create an ExtraIterator from an array', () => {
		const array = [1, 2, 3];
		const iterator = ExtraIterator.from(array);
		expect(iterator.toArray()).toEqual(array);
	});

	it('should zip two iterators', () => {
		const a = ExtraIterator.from([1, 2, 3]);
		const b = ExtraIterator.from(['a', 'b', 'c']);
		const zipped = ExtraIterator.zip(a, b);
		expect(zipped.toArray()).toEqual([[1, 'a'], [2, 'b'], [3, 'c']]);
	});

	it('should count from 0 to a given number', () => {
		const iterator = ExtraIterator.count(5);
		expect(iterator.toArray()).toEqual([0, 1, 2, 3, 4]);
	});

	it('should repeat a value a given number of times', () => {
		const iterator = ExtraIterator.repeat(3, 'x');
		expect(iterator.toArray()).toEqual(['x', 'x', 'x']);
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

	it('should drop a given number of values', () => {
		const iterator = ExtraIterator.from([1, 2, 3, 4]).drop(2);
		expect(iterator.toArray()).toEqual([3, 4]);
	});

	it('should flatten nested iterables', () => {
		const iterator = ExtraIterator.from([[1, 2], [3, 4]]).flatten();
		expect(iterator.toArray()).toEqual([1, 2, 3, 4]);
	});

	it('should return the first value', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		expect(iterator.first()).toBe(1);
	});

	it('should return the last value', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		expect(iterator.last()).toBe(3);
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
		const iterator = ExtraIterator.from([1, 2, 3, 4]).chunk(2);
		expect(iterator.toArray()).toEqual([[1, 2], [3, 4]]);
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

	it('should prepend a value to the iterator', () => {
		const iterator = ExtraIterator.from([2, 3]).prepend(1);
		expect(iterator.toArray()).toEqual([1, 2, 3]);
	});

	it('should append a value to the iterator', () => {
		const iterator = ExtraIterator.from([1, 2]).append(3);
		expect(iterator.toArray()).toEqual([1, 2, 3]);
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

	it('should provide a default value if the iterator is empty', () => {
		const iterator = ExtraIterator.empty<number>().defaultIfEmpty(() => 42);
		expect(iterator.toArray()).toEqual([42]);
	});

	it('should group values by a key', () => {
		const iterator = ExtraIterator.from(['apple', 'banana', 'apricot']);
		const grouped = iterator.groupBy(word => word[0]!);
		expect(grouped).toEqual({
			a: ['apple', 'apricot'],
			b: ['banana'],
		});
	});

	it('should collect values using a custom collector', () => {
		const iterator = ExtraIterator.from([1, 2, 3]);
		const sum = iterator.collect(iter => Array.from(iter).reduce((a, b) => a + b, 0));
		expect(sum).toBe(6);
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
});
