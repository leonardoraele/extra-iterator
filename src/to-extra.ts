import { ExtraIterator } from './index.js';

/**
 * A symbol that can be used as a method to convert any `Iterable` object into an `ExtraIterator`. Useful for chaining
 * methods on iterables without needing to explicitly create an `ExtraIterator` instance.
 *
 * @remarks
 *
 * The module that exports this symbol has the side-effect to extend the `Object` prototype with this symbol's method.
 * This symbol is intentionally contained in a separate module to the `ExtraIterator` class so that you can choose to
 * import it or not, depending on whether you want this behavior.
 *
 * This means by importing this module, you opt-in to this side-effect. and If you want to prevent any "polution" to the
 * global `Object` prototype, simply don't import this symbol and its module and your project will remain unaffected.
 *
 * @example
 *
 * [1, 2, 3, 4].filter(n => n % 2 === 0)
 * 		[toExtra]() // Returns an ExtraIterator of the filtered array
 * 		.prepend(7)
 * 		.loop(3)
 * 		.toArray(); // Returns [7, 2, 4, 7, 2, 4, 7, 2, 4]
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
