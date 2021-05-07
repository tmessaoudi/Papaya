
/*jslint browser: true, node: true */
/*global */

"use strict";

export class ArrayUtils {

  // http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
  static createArray(length) {
    var arr = new Array(length || 0),
      ctr;

    if (arguments.length > 1) {
      var args = Array.prototype.slice.call(arguments, 1);
      for (ctr = 0; ctr < length; ctr += 1) {
        arr[ctr] = papaya.utilities.ArrayUtils.createArray.apply(this, args);
      }
    }

    return arr;
  };

  static contains(a, obj) {
    var i = a.length;
    while (i--) {
      if (a[i] === obj) {
        return true;
      }
    }
    return false;
  };

  // https://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
  static cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i]);
        }
    }
    return newArray;
  };

}

// http://stackoverflow.com/questions/2294703/multidimensional-array-cloning-using-javascript
Array.prototype.clone = function () {
    var arr, i;

    arr = this.slice(0);
    for (i = 0; i < this.length; i += 1) {
        if (this[i].clone) {
            //recursion
            arr[i] = this[i].clone();
        }
    }

    return arr;
};
