
/*jslint browser: true, node: true */
/*global Ext */

"use strict";

export class ObjectUtils {
  static bind(scope, fn, args, appendArgs) {
    if (arguments.length === 2) {
      return function () {
        return fn.apply(scope, arguments);
      };
    }

    var method = fn,
      slice = Array.prototype.slice;

    return function () {
      var callArgs = args || arguments;

      if (appendArgs === true) {
        callArgs = slice.call(arguments, 0);
        callArgs = callArgs.concat(args);
      } else if (typeof appendArgs === "number") {
        callArgs = slice.call(arguments, 0); // copy arguments first
        Ext.Array.insert(callArgs, appendArgs, args);
      }

      return method.apply(scope || window, callArgs);
    };
  }

  static isString(obj) {
    return typeof obj === "string" || obj instanceof String;
  }

  // adapted from: http://stackoverflow.com/questions/724857/how-to-find-javascript-variable-by-its-name
  static dereference(name) {
    return ObjectUtils.dereferenceIn(window, name);
  }

  static dereferenceIn(parent, name) {
    var obj, M;

    if (!ObjectUtils.isString(name)) {
      return null;
    }

    M = name.replace(/(^[' "]+|[" ']+$)/g, "").match(/(^[\w\$]+(\.[\w\$]+)*)/);

    if (M) {
      M = M[1].split(".");
      obj = parent[M.shift()];
      while (obj && M.length) {
        obj = obj[M.shift()];
      }
    }

    return obj || null;
  }
  
}