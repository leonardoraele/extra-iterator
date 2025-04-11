import { ExtraIterator } from './index.js';

export const toExtra = Symbol('toExtra');

declare global {
	interface Iterator<T> {
		[toExtra](): ExtraIterator<T>;
	}
	interface Array<T> {
		[toExtra](): ExtraIterator<T>;
	}
	interface Set<T> {
		[toExtra](): ExtraIterator<T>;
	}
	interface Map<K, V> {
		[toExtra](): ExtraIterator<[K, V]>;
	}
}

Iterator.prototype[toExtra] ??= function<T>(): ExtraIterator<T> {
	return ExtraIterator.from(this);
}

Array.prototype[toExtra] ??= function<T>(): ExtraIterator<T> {
	return ExtraIterator.from(this);
}

Set.prototype[toExtra] ??= function<T>(): ExtraIterator<T> {
	return ExtraIterator.from(this);
}

Map.prototype[toExtra] ??= function<K, V>(): ExtraIterator<[K, V]> {
	return ExtraIterator.from(this);
}
