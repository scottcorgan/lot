var during = require('../');
var expect = require('expect.js');

var list = [{name: 'scott', age: 29}, {name: 'lindsay', age:25}];

during(list).filter(function (item, next) {
  next(null, item.age == 29);
}).then(function (items) {
  console.log(items);
});