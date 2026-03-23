import { ExtraIterator } from './index.js';

/**
 * A symbol that can be used to convert an `Iterator`, an `Iterable`, or an "array-like" object into an `ExtraIterator`.
 */
export const toExtra = Symbol('toExtra');

declare global {
	interface Object {
		[toExtra]<T extends Object>(this: T): T extends Iterable<infer U> ? ExtraIterator<U> : never;
	}
}

Object.prototype[toExtra] ??= function<T extends Object>(this: T): T extends Iterable<infer U> ? ExtraIterator<U> : never {
	if (Symbol.iterator in this) {
		return ExtraIterator.from(this as any) as any;
	}
	throw new Error('The object is not iterable and cannot be converted to an ExtraIterator.');
}
