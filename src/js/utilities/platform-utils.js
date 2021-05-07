
/*jslint browser: true, node: true */
/*global $, PAPAYA_BROWSER_MIN_FIREFOX, PAPAYA_BROWSER_MIN_CHROME, PAPAYA_BROWSER_MIN_IE, PAPAYA_BROWSER_MIN_SAFARI,
PAPAYA_BROWSER_MIN_OPERA, bowser, File, PAPAYA_MANGO_INSTALLED, confirm */

"use strict";

import * as constant from "../constants";
import { UrlUtils } from "./";


// Reasonable defaults
var PIXEL_STEP  = 10;
var LINE_HEIGHT = 40;
var PAGE_HEIGHT = 800;
export class PlatformUtils {
  static os = null;
  static browser = bowser.name;
  static browserVersion = bowser.version;
  static ios = bowser.ios;
  static mobile = bowser.mobile;
  static lastScrollEventTimestamp = 0;
  static smallScreen = window.matchMedia && window.matchMedia("only screen and (max-width: 760px)").matches;

  static detectOs() {
    if (navigator.appVersion.indexOf("Win") !== -1) {
      return "Windows";
    } else if (navigator.appVersion.indexOf("Mac") !== -1) {
      return "MacOS";
    } else if (
      navigator.appVersion.indexOf("X11") !== -1 ||
      navigator.appVersion.indexOf("Linux") !== -1
    ) {
      return "Linux";
    } else {
      return "Unknown";
    }
  }

  static checkForBrowserCompatibility() {
    if (PlatformUtils.browser === "Firefox") {
      if (PlatformUtils.browserVersion < constant.PAPAYA_BROWSER_MIN_FIREFOX) {
        return (
          "Papaya requires Firefox version " +
          constant.PAPAYA_BROWSER_MIN_FIREFOX +
          " or higher."
        );
      }
    } else if (PlatformUtils.browser === "Chrome") {
      if (PlatformUtils.browserVersion < constant.PAPAYA_BROWSER_MIN_CHROME) {
        return (
          "Papaya requires Chrome version " +
          constant.PAPAYA_BROWSER_MIN_CHROME +
          " or higher."
        );
      }
    } else if (PlatformUtils.browser === "Internet Explorer") {
      if (PlatformUtils.browserVersion < constant.PAPAYA_BROWSER_MIN_IE) {
        return (
          "Papaya requires Internet Explorer version " +
          constant.PAPAYA_BROWSER_MIN_IE +
          " or higher."
        );
      }
    } else if (PlatformUtils.browser === "Safari") {
      if (PlatformUtils.browserVersion < constant.PAPAYA_BROWSER_MIN_SAFARI) {
        return (
          "Papaya requires Safari version " +
          constant.PAPAYA_BROWSER_MIN_SAFARI +
          " or higher."
        );
      }
    } else if (PlatformUtils.browser === "Opera") {
      if (PlatformUtils.browserVersion < constant.PAPAYA_BROWSER_MIN_OPERA) {
        return (
          "Papaya requires Opera version " +
          constant.PAPAYA_BROWSER_MIN_OPERA +
          " or higher."
        );
      }
    }

    return null;
  }

  static isWebGLSupported() {
    var canvas;
    var ctx;
    var ext;

    try {
      canvas = document.createElement("canvas");
      ctx =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      ext = ctx.getExtension("OES_element_index_uint");
      if (!ext) {
        return false;
      }
    } catch (e) {
      console.log("There was a problem detecting WebGL! " + e);
      return false;
    }

    canvas = null;
    ctx = null;
    ext = null;

    return true;
  }

  static getMousePositionX(ev) {
    var touch;

    if (ev.originalEvent) {
      ev = ev.originalEvent;
    }

    if (ev.targetTouches) {
      if (ev.targetTouches.length === 1) {
        touch = ev.targetTouches[0];
        if (touch) {
          return touch.pageX;
        }
      }
    } else if (ev.changedTouches) {
      if (ev.changedTouches.length === 1) {
        touch = ev.changedTouches[0];
        if (touch) {
          return touch.pageX;
        }
      }
    }

    return ev.pageX;
  }

  static getMousePositionY(ev) {
    var touch;

    if (ev.targetTouches) {
      if (ev.targetTouches.length === 1) {
        touch = ev.targetTouches[0];
        if (touch) {
          return touch.pageY;
        }
      }
    } else if (ev.changedTouches) {
      if (ev.changedTouches.length === 1) {
        touch = ev.changedTouches[0];
        if (touch) {
          return touch.pageY;
        }
      }
    }

    return ev.pageY;
  }

  // a somewhat more consistent scroll across platforms
  static getScrollSign(ev, slow) {
    var wait, sign, rawValue, value;

    if (slow) {
      wait = 75;
    } else if (PlatformUtils.browser === "Firefox") {
      wait = 10;
    } else if (PlatformUtils.browser === "Chrome") {
      wait = 50;
    } else if (PlatformUtils.browser === "Internet Explorer") {
      wait = 0;
    } else if (PlatformUtils.browser === "Safari") {
      wait = 50;
    } else {
      wait = 10;
    }

    var now = Date.now();

    if (now - PlatformUtils.lastScrollEventTimestamp > wait) {
      PlatformUtils.lastScrollEventTimestamp = now;
      rawValue = PlatformUtils.normalizeWheel(ev).spinY;
      sign =
        -1 * PlatformUtils.normalizeWheel(ev).spinY > 0
          ? 1
          : -1;
      value = Math.ceil(Math.abs(rawValue / 10.0)) * sign;
      return value;
    }

    return 0;
  }

  // Cross-browser slice method.
  static makeSlice(file, start, length) {
    var fileType = (typeof File);

    if (fileType === 'undefined') {
        return function () {};
    }

    if (File.prototype.slice) {
        return file.slice(start, start + length);
    }

    if (File.prototype.mozSlice) {
        return file.mozSlice(start, length);
    }

    if (File.prototype.webkitSlice) {
        return file.webkitSlice(start, length);
    }

    return null;
  };

  static isPlatformLittleEndian() {
    var buffer = new ArrayBuffer(2);
    new DataView(buffer).setInt16(0, 256, true);
    return new Int16Array(buffer)[0] === 256;
  };

  static isInputRangeSupported() {
    var test = document.createElement("input");
    test.setAttribute("type", "range");
    return (test.type === "range");
  };

  // adapted from: http://www.rajeshsegu.com/2012/09/browser-detect-custom-protocols/comment-page-1/
  static launchCustomProtocol(container, url, callback) {
    var iframe, myWindow, cookie, success = false;

    if (PlatformUtils.browser === "Internet Explorer") {
        myWindow = window.open('', '', 'width=0,height=0');
        myWindow.document.write("<iframe src='" + url + "'></iframe>");

        setTimeout(function () {
            try {
                myWindow.location.href;
                success = true;
            } catch (ex) {
                console.log(ex);
            }

            if (success) {
                myWindow.setTimeout('window.close()', 100);
            } else {
                myWindow.close();
            }

            callback(success);
        }, 100);
    } else if (PlatformUtils.browser === "Firefox") {
        try {
            iframe = $("<iframe />");
            iframe.css({"display": "none"});
            iframe.appendTo("body");
            iframe[0].contentWindow.location.href = url;

            success = true;
        } catch (ex) {
            success = false;
        }

        iframe.remove();

        callback(success);
    } else if (PlatformUtils.browser === "Chrome") {
        container.viewerHtml.css({"outline": 0});
        container.viewerHtml.attr("tabindex", "1");
        container.viewerHtml.focus();

        container.viewerHtml.blur(function () {
            success = true;
            callback(true);  // true
        });

        location.href = url;

        setTimeout(function () {
            container.viewerHtml.off('blur');
            container.viewerHtml.removeAttr("tabindex");

            if (!success) {
                callback(false);  // false
            }
        }, 2000);
    } else {
        cookie = UrlUtils.readCookie(Preferences.COOKIE_PREFIX + constant.PAPAYA_MANGO_INSTALLED); // !! Viewer Preferences !! 

        if (cookie || papaya.mangoinstalled) {
            success = true;
        } else {
            if (confirm("This feature requires that " + (PlatformUtils.ios ? "iMango" : "Mango") + " is installed.  Continue?")) {
                UrlUtils.createCookie(Preferences.COOKIE_PREFIX + constant.PAPAYA_MANGO_INSTALLED, true, Preferences.COOKIE_EXPIRY_DAYS);
                success = true;
            }
        }

        if (success) {
            location.href = url;
        }

        callback(success);
    }
  };

  static getSupportedScrollEvent() {
    var support;
    if (PlatformUtils.browser === "Firefox") {
        support = "DOMMouseScroll";
    } else {
        // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        support = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
            document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
                "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
    }

    return support;
  };


  /**
   * Copyright (c) 2015, Facebook, Inc.
   * All rights reserved.
   *
   * This source code is licensed under the BSD-style license found in the
   * LICENSE file in the root directory of this source tree. An additional grant
   * of patent rights can be found in the PATENTS file in the same directory.
   *
   * @providesModule normalizeWheel
   * @typechecks
   */
  // https://github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
  // http://stackoverflow.com/questions/5527601/normalizing-mousewheel-speed-across-browsers
  static normalizeWheel(/*object*/ event) /*object*/ {
    var sX = 0, sY = 0,       // spinX, spinY
        pX = 0, pY = 0;       // pixelX, pixelY

    // Legacy
    if ('detail'      in event) { sY = event.detail; }
    if ('wheelDelta'  in event) { sY = -event.wheelDelta / 120; }
    if ('wheelDeltaY' in event) { sY = -event.wheelDeltaY / 120; }
    if ('wheelDeltaX' in event) { sX = -event.wheelDeltaX / 120; }

    // side scrolling on FF with DOMMouseScroll
    if ( 'axis' in event && event.axis === event.HORIZONTAL_AXIS ) {
        sX = sY;
        sY = 0;
    }

    pX = sX * PIXEL_STEP;
    pY = sY * PIXEL_STEP;

    if ('deltaY' in event) { pY = event.deltaY; }
    if ('deltaX' in event) { pX = event.deltaX; }

    if ((pX || pY) && event.deltaMode) {
        if (event.deltaMode == 1) {          // delta in LINE units
            pX *= LINE_HEIGHT;
            pY *= LINE_HEIGHT;
        } else {                             // delta in PAGE units
            pX *= PAGE_HEIGHT;
            pY *= PAGE_HEIGHT;
        }
    }

    // Fall-back if spin cannot be determined
    if (pX && !sX) { sX = (pX < 1) ? -1 : 1; }
    if (pY && !sY) { sY = (pY < 1) ? -1 : 1; }

    return { spinX  : sX,
        spinY  : sY,
        pixelX : pX,
        pixelY : pY };
  };

}

PlatformUtils.os = PlatformUtils.detectOs()