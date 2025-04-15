# extra-iterator

> ⚠ Documentation is still a TODO

## Install

```sh
npm install extra-iterator
```

## Usage

```js
import { ExtraIterator } from 'extra-iterator';

// Finds the nearest common ancestor of all <p> elements in the document
const commonAncestor = ExtraIterator.from(              // • First, get all <p> elements and wrap the node list on an
        document.querySelectorAll('p')                  //   ExtraIterator to get access to the extra functions.
    )
    .map(p => function*() {                             // • For each <p> element, get its hierarchy of ancestor nodes.
        for (let node = p.parentNode;
            node;
            node = node.parentNode
        ) {
            yield node;
        }
    })
    .map(ancestors => ancestors.toArray().reverse())    // • Reverse the sequences of the ancestor lists so that become
	                                                    //   top-to-bottom.
    .zip()                                              // • Iterate over all sequences of ancestors simutaneously.
    .takeWhile(nodes => {                               // • Filter only the iterations on which all ancestors are the
        return ExtraIterator.from(nodes).uniq().size(); //   same.
    })
    .map(nodes => node[0])                              // • Since all ancestors are the same, take only one of them.
    .last();                                            // • At this point, we have a list of nodes that go from the
	                                                    //   root of the document down to the most common ancestor of
                                                        //   all the <p> elements, so take the last one, which is the
														//   closest to the <p> elements.
```
