# during

Chainable async utilities for collections and arrays.

The backbone of this module is the [async]() module. The problem this is trying to solve is easy chaining of these useful functional methods. This module
also adds a few new methods based off ideas from [lodash](). Lodash is a very useful library, but it doesn't not allow you to perform async iterations.

At the end of each chain, you can add a ` then ` method which is based off of the [Promises/A+]() spec. It is not a real promise, but allows you to
have a ` success ` and ` error ` method passed to it as arguments

## install

```
npm install during --save
```

## Usage

```js
var during = require('during');

var list = [1, 2, 3];

during(list)
  .filter(function (item, next) {
    next(null, item < 3);
  })
  .map(function (item, next) {
    if (item === 1) next(null, 'one');
    if (item === 2) next (null, 'two');
  });
  .then(function (items) {
    // items will equal ['one', 'two'] now
  }, function (err) {
    // Something bad happend
  });
```

## Methods

### Collections

* [where](#whereobject)
* [findWhere](#findwhereobject)
* [pluck](#pluckstring)

### Arrays

* [each](#eachcallback)
* [eachRight](#eachrightcallback)
* [map](#mapcallback)
* [filter](#filtercallback)
* [reject](#rejectcallback)
* [some](#somecallback)
* [every](#everycallback)
* [reduce](#reducememo-callback)
* [reduceRight](#reducerightmemo-callback)
* [sortBy](#sortbycallback)
* [concat](#concatcallback)
 
## Collections

### where(object)

### findWhere(object)

### pluck(string)


## Arrays

### each(callback)

### eachRight(callback)

### map(callback)

### filter(callback)

### reject(callback)

### some(callback)

### every(callback)

### reduce(memo, callback)

### reduceRight(memo, callback)

### sortBy(callback)

### concat(callback)
