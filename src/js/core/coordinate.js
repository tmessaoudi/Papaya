
/*jslint browser: true, node: true */
/*global */

"use strict";

export class Coordinate {
  constructor(xLoc, yLoc, zLoc) {
    this.x = xLoc;
    this.y = yLoc;
    this.z = zLoc;
  }

  setCoordinate(xLoc, yLoc, zLoc, round) {
    if (round) {
      this.x = Math.round(xLoc);
      this.y = Math.round(yLoc);
      this.z = Math.round(zLoc);
    } else {
      this.x = xLoc;
      this.y = yLoc;
      this.z = zLoc;
    }
  }

  toString() {
    return "(" + this.x + "," + this.y + "," + this.z + ")";
  }

  isAllZeros() {
    return this.x === 0 && this.y === 0 && this.z === 0;
  };
}

