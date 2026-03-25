# `extra-iterator`

[![Static Badge](https://img.shields.io/badge/github-gray?logo=github)
](https://github.com/leonardoraele/extra-iterator)
[![Static Badge](https://img.shields.io/badge/npm-red?logo=npm)
](https://www.npmjs.com/package/extra-iterator)
[![GitHub License](https://img.shields.io/github/license/leonardoraele/extra-iterator)](./LICENSE.txt)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/extra-iterator)](https://bundlephobia.com/package/extra-iterator)

An extension of JavaScript's built-in Iterator class, with several utility functions for transforming and aggregating
sequences of values.

> Contributions are welcome. 🤗

## Features

- 30+ utility methods
- Lazy operations
- Zero dependencies 🎉
- Fully typed with TypeScript
- 100% test coverage

## Installation

```sh
npm install extra-iterator
```

## Runtime requirements

This package extends the built-in `Iterator` class and uses the Iterator Helpers API.

Use it in a runtime that already supports iterator helpers, or load an appropriate polyfill.

## Usage Examples

### Work with ranges

```js
import { ExtraIterator } from 'extra-iterator';

const range = ExtraIterator.range(1, 6)
    .map(n => n * 2)
    .toArray();

console.log(range); // [1, 2, 3, 4, 5]
```

### Manipulate the sequence

```js
import { ExtraIterator } from 'extra-iterator';

const result = ExtraIterator.concat([1, 2, 3], [4, 5, 6])
    .dropWhile(n => n < 3)
    .take(3)
    .loop(4)
    .toArray();

console.log(result); // [3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 4, 5]
```

### Map an object's key-values pairs

```js
import { ExtraIterator } from 'extra-iterator';

const example = {
    first: 1,
    second: 2,
    third: 3,
};

const result = ExtraIterator.from(Object.entries(example))
    .append(['fourth', 4])
    .interposeWith(([leftKey, leftValue], [rightKey, rightValue]) =>
        [`${leftKey}_${rightKey}`, (leftValue + rightValue) / 2]
    )
    .collect(Object.fromEntries);

console.log(result);
// {
//   first: 1,
//   first_second: 1.5,
//   second: 2,
//   second_third: 2.5,
//   third: 3,
//   third_fourth: 3.5,
//   fourth: 4
// }
```

### Use `ExtraIterator.from()` to wrap an iterable, iterator, or array-like object

```js
import { ExtraIterator } from 'extra-iterator';

const fromIterable = ExtraIterator.from(new Set([1, 2, 3]));
const fromGenerator = ExtraIterator.from(function*() {
    yield 'a';
    yield 'b';
}());
const fromArrayLike = ExtraIterator.from({ 0: 'x', 1: 'y', length: 2 });

console.log(fromGenerator.toArray()); // ['a', 'b']
console.log(fromArrayLike.toArray()); // ['x', 'y']
```

### Laziness and consumption

Transformation methods are lazy. Nothing happens until you consume the iterator.

```js
const iter = ExtraIterator.from([1, 2, 3])
    .map(value => value * 2)
    .withEach(value => console.log('seen:', value));

// No output yet.

console.log(iter.take(2).toArray());
// seen: 2
// seen: 4
// [2, 4]
```

Like native iterators, `ExtraIterator` instances are generally one-shot. Once consumed, the values are gone unless you
create a new iterator.

### Work with infinite sequences

```js
import { ExtraIterator } from 'extra-iterator';

const evens = ExtraIterator.count({ start: 0, increment: 2 })
    .take(5)
    .toArray();

console.log(evens); // [0, 2, 4, 6, 8]
```

### Flatten nested arrays

```js
import { ExtraIterator } from 'extra-iterator';

const values = ExtraIterator.from([0, [1, [2, [3, 4]]], [5, [6]], 7])
    .flat()
    .toArray();

console.log(values); // [0, 1, 2, 3, 4, 5, 6, 7]
```

### Group adjacent values into chunks

```js
import { ExtraIterator } from 'extra-iterator';

const chunks = ExtraIterator.from([1, 1, 2, 3, 3, 3, 2, 2])
    .chunkWith((left, right) => left === right)
    .toArray();

console.log(chunks); // [[1, 1], [2], [3, 3, 3], [2, 2]]
```

### Find the nearest common ancestor between all DOM paragraph elements

```js
import { ExtraIterator } from 'extra-iterator';

const commonAncestor = ExtraIterator.from(document.querySelectorAll('p'))
    .map(element => ExtraIterator.from(function*() {
        for (let node = element.parentNode; node; node = node.parentNode) {
            yield node;
        }
    }()))
    .map(ancestorList => ancestorList.toArray().reverse())
    .zip()
    .takeWhile(nodes => new Set(nodes).size === 1)
    .last()
    .first();
```

## API overview

See full API documentation at: **[leonardoraele.github.io/extra-iterator](https://leonardoraele.github.io/extra-iterator/classes/.ExtraIterator.html)**

### Static constructors

- `ExtraIterator.from(source)` - Iterates over any iterable object or array-like object.
- `ExtraIterator.empty()` - Creates an empty iterator.
- `ExtraIterator.single(value)` - Creates an iterator with a single value.
- `ExtraIterator.count()` - An infinite incremental number iterator.
- `ExtraIterator.range(start, end)` - Iterates over a specific range.
- `ExtraIterator.repeat(value)` - An iterator that repeats a single value infinitely.
- `ExtraIterator.random()` - An iterator that yields infinite random numbers.
- `ExtraIterator.randomBytes()` - An iterator that yields infinite chunks of random bytes.
- `ExtraIterator.zip(...sources)` - Iterates over multiple sequences simultaneously.

### Standard iterator helpers that remain chainable

These native iterator-helper methods work just like the built-in methods, but return chainable `ExtraIterator` instances instead of built-in `Iterator` objects.

- `filter()`
- `flatMap()`
- `map()`
- `take()`
- `drop()`

`take()` and `drop()` also support negative counts:

- `take(n)` keeps the first `n` elements of the iterator (or the last ones if `n` is negative), and discard the rest.
- `drop(n)` discards the first `n` elements (or the last ones if `n` is negative), and keep the rest.

### Transformation helpers

- `flat()` - Similar to `Array.prototype.flat()`, but recursive.
- `unique()` - Filters repeated elements out of the iterator.
- `compact()` - Filters `null` and `undefined` values out of the iterator.
- `append(value)` - Appends one value to the end of the iterator.
- `prepend(value)` - Prepends one value to the beginning of the iterator.
- `concat(iterable)` - Concatenates multiple values to the end of the iterator.
- `prependAll(iterable)` - Prepends multiple values to the beginning of the iterator.
- `takeWhile(predicate)` - Similar to `Iterator.prototype.take()`, but with a condition instead of a fixed count.
- `dropWhile(predicate)` - Similar to `Iterator.prototype.drop()`, but with a condition instead of a fixed count.
- `chunk(size)` - Groups the elements into chunks of fixed size.
- `chunkWith(predicate)` - Groups adjacent elements based on a predicate function.
- `zip(others)` - Creates a new iterator that yields the values of this and the other iterators in tuples.
- `interpose(separator)` - Adds a separator value between each pair of adjacent elements.
- `interposeWith(separatorProvider)` - Adds a separate value between each pair of elements based on a function.
- `interleave(other)` - Interleave the values of this iterator with those of another iterator.
- `splice(startIndex, deleteCount, ...newItems)` - Similar to `Array.prototype.splice()`.
- `defaultIfEmpty(provider)` - If the iterator is empty, adds a default value to it.
- `loop(n = Infinity)` - Expands the iterator by repeating its values `n` times.
- `withEach(callback)` - Similar to `Iterator.prototype.forEach()`, but returns `this` iterator.

### Aggregation helpers

These methods consume the iterator and return a final value instead of another iterator:

- `first()` - Returns the first value or `undefined` if empty.
- `last()` - Returns the last value or `undefined` if empty.
- `at(index)` - Returns the value at the index, or `undefined`.
- `groupBy(callback)` - Similar to `Object.groupBy()`.
- `toMap(callback)` - Similar to `Map.groupBy()`.
- `toSet()` - Creates a `Set` object with the elements of this iterator.
- `toChainOfResponsibilityFunction(invokeHandler)`
- `collect(callback)` - Reduce the iterator to a single value by calling a callback function.
- `sum()` - Sum all numbers in the iterator.
- `count()` - Returns the number of elements in the iterator.
- `testUnique()` - Checks whether the iterator has duplicated elements.

You also still have the native consuming helpers provided by iterator helpers, such as `reduce()`, `some()`, `every()`,
`find()`, `forEach()`, and `toArray()`.

### Optional `[toExtra]()` helper

An optional, chainable helper method that transforms any iterable object into an `ExtraIterator`.

```js
import { toExtra } from 'extra-iterator/to-extra';

const result = [1, 2, 3]
    [toExtra]()    // The `[toExtra]()` method transforms the built-in array into an `ExtraIterator` object...
    .prepend(0)    // Allowing you to chain into the new  helper methods:
    .splice(2, 0, 0.5)
    .drop(-2)
    .loop(3)
    .toArray();

console.log(result);
// [0, 0.5, 1, 0, 0.5, 1, 0, 0.5, 1]
```

By importing the optional `extra-iterator/to-extra` submodule, you opt-in to expanding the global `Object` prototype
with the `[toExtra]()` method as a side-effect.

This side-effect is optional. If you don't want to "polute" the global prototypes, you can still use this package as
normal. Simply don't import `extra-iterator/to-extra` and the global prototypes will remain unchanged.

## License

This project is licensed under the MIT License.
See the [LICENSE.txt](./LICENSE.txt) file for the full license text.
