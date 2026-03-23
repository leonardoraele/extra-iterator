import { describe, it } from 'node:test';
import { toExtra } from './to-extra';
import { expect } from 'expect';
import { ExtraIterator } from './index';

describe(String(toExtra), () => {
	it('should convert an array into an ExtraIterator', () => {
		expect([1, 2, 3][toExtra]()).toBeInstanceOf(ExtraIterator);
	});

	it('should convert Map objects into ExtraIterators', () => {
		expect(new Map([['a', 1], ['b', 2]])[toExtra]()).toBeInstanceOf(ExtraIterator);
	});

	it('should convert Set objects into ExtraIterators', () => {
		expect(new Set([1, 2, 3])[toExtra]()).toBeInstanceOf(ExtraIterator);
	});

	it('should convert any iterable into an ExtraIterator', () => {
		class CustomIterable<T> implements Iterable<T> {
			constructor(private items: Iterable<T>) {}
			*[Symbol.iterator](): Iterator<T> {
				yield* this.items;
			}
		}

		expect(new CustomIterable([1, 2, 3])[toExtra]()).toBeInstanceOf(ExtraIterator);
	});

	it('should throw an error when trying to convert a non-iterable object', () => {
		expect(() => ({ a: 1, b: 2 })[toExtra]()).toThrow();
		expect(() => (new class A {})[toExtra]()).toThrow();
		expect(() => new Object(null)[toExtra]()).toThrow();
		expect(() => ({ 0: 0, 1: 1, length: 2 })[toExtra]()).toThrow();
		expect(() => ({ next: () => undefined })[toExtra]()).toThrow();
	});
});
