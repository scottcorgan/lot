var util = require('util');
var async = require('async');

var Lot = function (items) {
  var self = this;
  
  this._items = items;
  this._fns = [];
  this._tasksComplete = false;
  
  this.cargo = async.cargo(function (tasks, callback) {
    var waterfallList = self._buildTaskWaterfall(tasks);
    
    async.waterfall(waterfallList, function (err, items) {
      callback();
      
      async.nextTick(function () {
        if (self.onComplete && !self._tasksComplete) self.onComplete(items);
        
        // Track this progress
        self._items = items;
        self._tasksComplete = true;
      });
    });
  });
  
  async.nextTick(function () {
    self.cargo.push(self._fns);
  });
};

Lot.prototype._buildTaskWaterfall = function (tasks) {
  var self = this;
  
  var waterfallList = [function (next) {
    next(null, self._items);
  }];
  
  tasks.forEach(function (task) {
    waterfallList.push(function (originalItems, next) {
      self.run(task.type, originalItems, task.args, function (err, newItems) {
        next(err, newItems);
      });
    });
  });
  
  return waterfallList;
};

Lot.prototype._addFn = function (type, fn, args) {
  this._fns.push({
    type: type,
    args: args,
    fn: fn
  });
};

Lot.prototype.run = function () {
  var args = Array.prototype.slice.call(arguments, 0);
  var methodName = args.shift();
  this['run_' + methodName].apply(this, args);
}

Lot.prototype.then = function (thenCallback, errorCallback) {
  this.onComplete = thenCallback;
  this.onError = errorCallback;
};

// Methods
[
  {
    name: 'each',
    run: function (items, args, filterFn, callback) {
      async.each(items, filterFn, callbackWithErrorHandler(this, callback));
    }
  },
  {
    name: 'eachRight',
    run: function (items, args, filterFn, callback) {
      this.run('each', items.reverse(), filterFn, callback);
    }
  },
  {
    name: 'map',
    run: function (items, args, filterFn, callback) {
      async.map(items, filterFn, callbackWithErrorHandler(this, callback));
    }
  },
  {
    name: 'reduce',
    run: function (items, args, filterFn, callback) {
      async.reduce(items, args[0], function (memo, item, cb) {
        filterFn(item, memo, cb);
      }, callbackWithErrorHandler(this, callback));
    }
  },
  {
    name: 'reduceRight',
    run: function (items, args, filterFn, callback) {
      async.reduceRight(items, args[0], function (memo, item, cb) {
        filterFn(item, memo, cb);
      }, callbackWithErrorHandler(this, callback));
    }
  },
  {
    name: 'concat',
    run: function (items, args, filterFn, callback) {
      async.concat(items, filterFn, callbackWithErrorHandler(this, callback));
    }
  },
  {
    name: 'filter',
    run: function (items, args, filterFn, callback) {
      var self = this;
      var error;
      
      async.filter(items, function (item, cb) {
        filterFn(item, function (err, result) {
          if (err && !error) error = err;
          cb(result);
        });
      }, function (results) {
        if (error) self.onError(error);
        else callback(null, results);
      });
    }
  },
  {
    name: 'reject',
    run: function (items, args, filterFn, callback) {
      var self = this;
      var error;
      
      async.reject(items, function (item, cb) {
       filterFn(item, function (err, result) {
         if (err && !error) error = err;
         cb(result);
       });
     }, function (results) {
       if (error) self.onError(error);
       else callback(null, results);
     });
    }
  },
  {
    name: 'find',
    run: function (items, args, filterFn, callback) {
       var self = this;
       var error;
       
       async.detect(items, function (item, cb) {
        filterFn(item, function (err, result) {
          if (err && !error) error = err;
          cb(result);
        });
      }, function (results) {
        if (error) self.onError(error);
        else callback(null, results);
      });
    }
  },
  {
    name: 'some',
    run: function (items, args, filterFn, callback) {
       var self = this;
       var error;
       
       async.some(items, function (item, cb) {
        filterFn(item, function (err, result) {
          if (err && !error) error = err;
          cb(result);
        });
      }, function (results) {
        if (error) self.onError(error);
        else callback(null, results);
      });
    }
  },
  {
    name: 'every',
    run: function (items, args, filterFn, callback) {
       var self = this;
       var error;
       
       async.every(items, function (item, cb) {
        filterFn(item, function (err, result) {
          if (err && !error) error = err;
          cb(result);
        });
      }, function (results) {
        if (error) self.onError(error);
        else callback(null, results);
      });
    }
  },
  {
    name: 'sortBy',
    run: function (items, args, filterFn, callback) {
      async.sortBy(items, filterFn, callbackWithErrorHandler(this, callback));
    }
  },
  
  // Collections
  {
    name: 'where', 
    run: function (items, args, comparison, callback) {
      var self = this;
      var comparisonKeys = Object.keys(comparison);

      this.run('filter', items, function (item, next) {
        self.run('every', comparisonKeys, function (key, everyNext) {
          everyNext(null, item[key] === comparison[key]);
        }, next);
      }, callback);
    }
  },
  {
    name: 'findWhere', 
    run: function (items, args, comparison, callback) {
      var self = this;
      var comparisonKeys = Object.keys(comparison);
      
      this.run('find', items, function (item, next) {
        self.run('every', comparisonKeys, function (key, everyNext) {
          everyNext(null, item[key] === comparison[key]);
        }, next);
      }, callback);
    }
  },
  {
    name: 'pluck',
    run: function (items, args, keyToPluck, callback) {
      this.run('map', items, function (item, next) {
        next(null, item[keyToPluck]);
      }, callback);
    }
  }
].forEach(addMethod);

//
function addMethod (fn) {
  // Public method
  Lot.prototype[fn.name] = function () {
    var lastArg = arguments.length -1;
    var filterFn = arguments[lastArg];
    var args = Array.prototype.slice.call(arguments, 0);
    
    this._addFn(fn.name, filterFn, args);
    return this;
  };
  
  // Runner
  Lot.prototype['run_' + fn.name] = function (items, args, callback) {
    if (!util.isArray(items)) items = [items];
    if (!util.isArray(args)) args = [args];
    var filterFn = args.pop();
    
    fn.run.call(this, items, args, filterFn, callback);
  }
}

function addNullAsFirstArgumentFor (callback) {
  return function (result) {
    callback(null, result);
  }
}

function addNullToCallback (fn) {
  return function (item, cb) {
    fn(item, function (result) {
      cb(null, result);
    });
  }
}

function callbackWithErrorHandler (context, callback) {
  return function (err, results) {
    if (err) return context.onError(err);
    callback(err, results);
  }
}


module.exports = function (list) {
  return new Lot(list);
};