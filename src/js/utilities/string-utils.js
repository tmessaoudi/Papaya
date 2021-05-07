
/*jslint browser: true, node: true */
/*global */

"use strict";

import { ObjectUtils } from "./object-utils";

export class StringUtils {
  static isStringBlank(str) {
    if (str && (typeof str).toLowerCase() == "string") {
      return str.trim().length === 0;
    }

    return true;
  }

  static formatNumber(num, shortFormat) {
    var val = 0;

    if (ObjectUtils.isString(num)) {
      val = Number(num);
    } else {
      val = num;
    }

    if (shortFormat) {
      val = val.toPrecision(5);
    } else {
      val = val.toPrecision(7);
    }

    return parseFloat(val);
  }

  static getSizeString(imageFileSize) {
    var imageFileSizeString = null;

    if (imageFileSize > 1048576) {
      imageFileSizeString =
        StringUtils.formatNumber(imageFileSize / 1048576, true) + " Mb";
    } else if (imageFileSize > 1024) {
      imageFileSizeString =
        StringUtils.formatNumber(imageFileSize / 1024, true) + " Kb";
    } else {
      imageFileSizeString = imageFileSize + " Bytes";
    }

    return imageFileSizeString;
  }

  // http://james.padolsey.com/javascript/wordwrap-for-javascript/
  static wordwrap(str, width, brk, cut) {
    brk = brk || "\n";
    width = width || 75;
    cut = cut || false;

    if (!str) {
      return str;
    }

    var regex =
      ".{1," +
      width +
      "}(\\s|$)" +
      (cut ? "|.{" + width + "}|.+$" : "|\\S+?(\\s|$)");

    return str.match(new RegExp(regex, "g")).join(brk);
  }

  static truncateMiddleString(fullStr, strLen) {
    if (fullStr.length <= strLen) {
      return fullStr;
    }

    var separator = "...",
      sepLen = separator.length,
      charsToShow = strLen - sepLen,
      frontChars = Math.ceil(charsToShow / 2),
      backChars = Math.floor(charsToShow / 2);

    return (
      fullStr.substr(0, frontChars) +
      separator +
      fullStr.substr(fullStr.length - backChars)
    );
  }

  static pad(num, size) {
    return ("000000000" + num).substr(-size);
  }

  // https://stackoverflow.com/questions/36487636/javascript-convert-array-buffer-to-string
  static arrayBufferToString(buffer) {
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if (/[\u0080-\uffff]/.test(str)) {
      throw new Error(
        "this string seems to contain (still encoded) multibytes"
      );
    }
    return str;
  }
}

/*** String (Prototype Methods) ***/

if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function(){return this.replace(/^\s+|\s+$/g, '');};
}
