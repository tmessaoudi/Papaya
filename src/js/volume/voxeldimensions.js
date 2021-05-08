
/*jslint browser: true, node: true */
/*global */

"use strict"

export class VoxelDimensions {

  /*** Constructor ***/
  constructor(colSize, rowSize, sliceSize, timeSize) {
    this.colSize = Math.abs(colSize)
    this.rowSize = Math.abs(rowSize)
    this.sliceSize = Math.abs(sliceSize)
    this.xSize = 0
    this.ySize = 0
    this.zSize = 0
    this.flip = false
    this.timeSize = timeSize
    this.spatialUnit = VoxelDimensions.UNITS_UNKNOWN
    this.temporalUnit = VoxelDimensions.UNITS_UNKNOWN
  };

  /*** Static Pseudo-constants ***/

  static UNITS_UNKNOWN = 0;
  static UNITS_METER = 1;
  static UNITS_MM = 2;
  static UNITS_MICRON = 3;
  static UNITS_SEC = 8;
  static UNITS_MSEC = 16;
  static UNITS_USEC = 24;
  static UNITS_HZ = 32;
  static UNITS_PPM = 40;
  static UNITS_RADS = 48;

  // !! Idk how to assign a static array 
  static UNIT_STRINGS = {
    0: "Unknown Unit", // UNITS_UNKNOWN
    1: "Meters", //
    2: "Millimeters",
    3: "Microns",
    8: "Seconds",
    16: "Milliseconds",
    24: "Microseconds",
    32: "Hertz",
    40: "Parts-per-million",
    48: "Radians-per-second", // UNITS_RADS
  };


  /*** Prototype Methods ***/

  isValid() {
    return ((this.colSize > 0) && (this.rowSize > 0) && (this.sliceSize > 0) && (this.timeSize >= 0))
  };

  getSpatialUnitString() {
    return VoxelDimensions.UNIT_STRINGS[this.spatialUnit]
  };

  getTemporalUnitString() {
    return VoxelDimensions.UNIT_STRINGS[this.temporalUnit]
  };

  getTemporalUnitMultiplier() {
    if (this.temporalUnit === VoxelDimensions.UNITS_MSEC) {
      return 0.001
    }

    if (this.temporalUnit === VoxelDimensions.UNITS_USEC) {
      return 0.000001
    }

    return 1
  };

}

