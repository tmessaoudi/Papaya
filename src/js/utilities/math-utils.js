
/*jslint browser: true, node: true */
/*global */

"use strict";

export class MathUtils {
  static EPSILON = 0.00000001;

  static signum(val) {
    return val ? (val < 0 ? -1 : 1) : 0;
  }

  static lineDistance(point1x, point1y, point2x, point2y) {
    var xs, ys;

    xs = point2x - point1x;
    xs = xs * xs;

    ys = point2y - point1y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
  }

  static lineDistance3d(point1x, point1y, point1z, point2x, point2y, point2z) {
    var xs, ys, zs;

    xs = point2x - point1x;
    xs = xs * xs;

    ys = point2y - point1y;
    ys = ys * ys;

    zs = point2z - point1z;
    zs = zs * zs;

    return Math.sqrt(xs + ys + zs);
  }
  
  static essentiallyEqual (a, b) {
    return (a === b) || (Math.abs(a - b) <= ((Math.abs(a) > Math.abs(b) ? Math.abs(b) : Math.abs(a)) * MathUtils.EPSILON));
  };
  
  static getPowerOfTwo(value, pow) {
    var pow = pow || 1;
    
    while (pow < value) {
      pow *= 2;
    }
    
    return pow;
  };
  
}


export function papayaRoundFast(val) {
    /*jslint bitwise: true */
    if (val > 0) {
        return (val + 0.5) | 0;
    }

    return (val - 0.5) | 0;
}



export function papayaFloorFast(val) {
    /*jslint bitwise: true */
    return val | 0;
}
