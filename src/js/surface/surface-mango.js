
/*jslint browser: true, node: true */
/*global  */

"use strict";

export class SurfaceMango {
  constructor() {
    this.error = null;
    this.onFinishedRead = null;
    this.origin = [];
    this.imageDims = [];
    this.voxelDims = [];
    this.center = [];
    this.diffs = [];
    this.dv = null;
    this.index = 0;
    this.surfaceIndex = 0;
    this.dataLength = 0;
    this.numSurfaces = 0;
    this.littleEndian = false;
    this.surfaces = [];
    this.v14 = false;
    this.v15 = false;
  }

  static MAGIC_NUMBER_LITTLE_1_5 = ["m", "a", "n", "g", "o", "l", "1", "5"];
  static MAGIC_NUMBER_BIG_1_5 = ["m", "a", "n", "g", "o", "b", "1", "5"];
  static MAGIC_NUMBER_LITTLE_1_4 = ["m", "a", "n", "g", "o", "l", "1", "4"];
  static MAGIC_NUMBER_BIG_1_4 = ["m", "a", "n", "g", "o", "b", "1", "4"];
  static SURFACE_OVERLAY_MAGIC_NUMBER = [0, 0, 0, 0, "s", "c", "a", "l"];
  static NAME_SIZE = 64;

  static isThisFormat(filename) {
    return filename.endsWith(".surf");
  }

  isSurfaceDataBinary() {
    return true;
  }

  isLittleEndian15(data) {
    var data2 = new Uint8Array(data),
      ctr;

    for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_LITTLE_1_5.length; ctr += 1) {
      if (
        data2[ctr] !== SurfaceMango.MAGIC_NUMBER_LITTLE_1_5[ctr].charCodeAt(0)
      ) {
        return false;
      }
    }

    return true;
  }

  isLittleEndian14(data) {
    var data2 = new Uint8Array(data),
      ctr;

    for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_LITTLE_1_4.length; ctr += 1) {
      if (
        data2[ctr] !== SurfaceMango.MAGIC_NUMBER_LITTLE_1_4[ctr].charCodeAt(0)
      ) {
        return false;
      }
    }

    return true;
  }

  isVersion15(data) {
    var data2 = new Uint8Array(data),
      ctr,
      match = true;

    for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_LITTLE_1_5.length; ctr += 1) {
      if (
        data2[ctr] !== SurfaceMango.MAGIC_NUMBER_LITTLE_1_5[ctr].charCodeAt(0)
      ) {
        match = false;
        break;
      }
    }

    if (!match) {
      match = true;

      for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_BIG_1_5.length; ctr += 1) {
        if (
          data2[ctr] !== SurfaceMango.MAGIC_NUMBER_BIG_1_5[ctr].charCodeAt(0)
        ) {
          match = false;
          break;
        }
      }
    }

    return match;
  }

  isVersion14(data) {
    var data2 = new Uint8Array(data),
      ctr,
      match = true;

    for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_LITTLE_1_4.length; ctr += 1) {
      if (
        data2[ctr] !== SurfaceMango.MAGIC_NUMBER_LITTLE_1_4[ctr].charCodeAt(0)
      ) {
        match = false;
        break;
      }
    }

    if (!match) {
      match = true;

      for (ctr = 0; ctr < SurfaceMango.MAGIC_NUMBER_BIG_1_4.length; ctr += 1) {
        if (
          data2[ctr] !== SurfaceMango.MAGIC_NUMBER_BIG_1_4[ctr].charCodeAt(0)
        ) {
          match = false;
          break;
        }
      }
    }

    return match;
  }

  isLittleEndian(data) {
    return this.isLittleEndian15(data) || this.isLittleEndian14(data);
  }

  hasOverlay() {
    var ctr, val;

    for (
      ctr = 0;
      ctr < SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER.length;
      ctr += 1
    ) {
      val = SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER[ctr];

      if (val) {
        val = SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER[ctr].charCodeAt(0);
      }

      if (this.dv.getUint8(this.index + ctr) !== val) {
        return false;
      }
    }

    return true;
  }

  getString(length) {
    var ctr,
      array = [];

    for (ctr = 0; ctr < length; ctr += 1) {
      array[ctr] = this.dv.getUint8(this.index + ctr);
    }

    return String.fromCharCode.apply(null, array);
  }

  readData(data, progress, onFinishedRead) {
    var previewLength;

    progress(0.2);

    this.littleEndian = this.isLittleEndian(data);
    this.dataLength = data.byteLength;
    this.v14 = this.isVersion14(data);
    this.v15 = this.isVersion15(data);
    this.index = SurfaceMango.MAGIC_NUMBER_LITTLE_1_5.length;
    this.dv = new DataView(data);

    if (!(this.v14 || this.v15)) {
      throw new Error(
        "Only Mango surface format version 1.4 and 1.5 are supported!"
      );
    }

    this.onFinishedRead = onFinishedRead;

    previewLength = this.dv.getUint32(this.index, this.littleEndian);
    this.index += 4;
    this.numSurfaces = this.dv.getUint32(this.index, this.littleEndian);
    this.index += 4;
    this.index += 16 * 8; // angle state

    this.imageDims[0] = this.dv.getUint32(this.index, this.littleEndian);
    this.index += 4;
    this.imageDims[1] = this.dv.getUint32(this.index, this.littleEndian);
    this.index += 4;
    this.imageDims[2] = this.dv.getUint32(this.index, this.littleEndian);
    this.index += 4;

    this.voxelDims[0] = this.dv.getFloat32(this.index, this.littleEndian);
    this.index += 4;
    this.voxelDims[1] = this.dv.getFloat32(this.index, this.littleEndian);
    this.index += 4;
    this.voxelDims[2] = this.dv.getFloat32(this.index, this.littleEndian);
    this.index += 4;

    this.origin[0] =
      this.dv.getFloat32(this.index, this.littleEndian) * this.voxelDims[0];
    this.index += 4;
    this.origin[1] =
      this.dv.getFloat32(this.index, this.littleEndian) * this.voxelDims[1];
    this.index += 4;
    this.origin[2] =
      this.dv.getFloat32(this.index, this.littleEndian) * this.voxelDims[2];
    this.index += 4;

    this.center[0] = (this.imageDims[0] * this.voxelDims[0]) / 2.0;
    this.center[1] = (this.imageDims[1] * this.voxelDims[1]) / 2.0;
    this.center[2] = (this.imageDims[2] * this.voxelDims[2]) / 2.0;

    if (this.v14) {
      this.diffs[0] = this.center[0] - this.origin[0];
      this.diffs[1] = this.center[1] - this.origin[1];
      this.diffs[2] = this.origin[2] - this.center[2];
    } else {
      this.diffs[0] = this.center[0] - this.origin[0];
      this.diffs[1] = this.center[1] - this.origin[1];
      this.diffs[2] = this.center[2] - this.origin[2];
    }

    this.index += 4; // threshold
    this.index += previewLength;

    this.readNextSurface(this, progress);
  }

  readNextSurface(surf, progress) {
    var surfData = new SurfaceMangoData();

    surf.index += SurfaceMango.NAME_SIZE;
    surf.surfaces[surf.surfaceIndex] = surfData;

    surf.surfaces[surf.surfaceIndex].solidColor[0] = surf.dv.getFloat32(surf.index, surf.littleEndian);  surf.index += 4;
    surf.surfaces[surf.surfaceIndex].solidColor[1] = surf.dv.getFloat32(surf.index, surf.littleEndian);  surf.index += 4;
    surf.surfaces[surf.surfaceIndex].solidColor[2] = surf.dv.getFloat32(surf.index, surf.littleEndian);  surf.index += 4;

    setTimeout(function() { surf.readDataPoints(surf, progress); }, 0);
  };

  readDataPoints(surf, progress) {
    var numPointVals, ctr;

    progress(0.4);

    surf.index += 4; // num parts (should always be 1)
    numPointVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].pointData = new Float32Array(numPointVals);

    if (surf.v14) {
        for (ctr = 0; ctr < numPointVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].pointData[ctr] = (((ctr % 3) !== 2) ? -1 : 1) *
                (surf.dv.getFloat32(surf.index, surf.littleEndian) +
                (surf.diffs[ctr % 3]));
        }
    } else {
        for (ctr = 0; ctr < numPointVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].pointData[ctr] = (((ctr % 3) !== 0) ? -1 : 1) *
                (surf.dv.getFloat32(surf.index, surf.littleEndian) +
                (surf.diffs[ctr % 3]));
        }
    }

    setTimeout(function() { surf.readDataNormals(surf, progress); }, 0);
};

  readDataNormals(surf, progress) {
    var numNormalVals, ctr;

    progress(0.6);

    surf.index += 4; // num parts (should always be 1)
    numNormalVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].normalsData = new Float32Array(numNormalVals);

    if (surf.v14) {
        for (ctr = 0; ctr < numNormalVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].normalsData[ctr] = (((ctr % 3) !== 2) ? -1 : 1) *
                surf.dv.getFloat32(surf.index, surf.littleEndian);
        }
    } else {
        for (ctr = 0; ctr < numNormalVals; ctr += 1, surf.index += 4) {
            surf.surfaces[surf.surfaceIndex].normalsData[ctr] = (((ctr % 3) !== 0) ? -1 : 1) *
                surf.dv.getFloat32(surf.index, surf.littleEndian);
        }
    }

    setTimeout(function() { surf.readDataTriangles(surf, progress); }, 0);
  };

  readDataTriangles(surf, progress) {
    var numIndexVals, ctr;

    progress(0.8);

    surf.index += 4; // num parts (should always be 1)
    numIndexVals = surf.dv.getInt32(surf.index, surf.littleEndian); surf.index += 4;
    surf.surfaces[surf.surfaceIndex].triangleData = new Uint32Array(numIndexVals);
    for (ctr = 0; ctr < numIndexVals; ctr += 1, surf.index += 4) {
        surf.surfaces[surf.surfaceIndex].triangleData[ctr] = surf.dv.getUint32(surf.index, surf.littleEndian);
    }

    setTimeout(function() { surf.readDataColors(surf, progress); }, 0);
  };

  readDataColors(surf, progress) {
    var min, max, ratio, numScalars, length, scalars, val, scalar, colorTableName, ctr, colorTable, hasOverlay = false;

    while (surf.index < surf.dataLength) {
        if (surf.hasOverlay()) {
            hasOverlay = true;
            surf.index += SurfaceMango.SURFACE_OVERLAY_MAGIC_NUMBER.length;
            surf.index += SurfaceMango.NAME_SIZE;
            colorTableName = surf.getString(SurfaceMango.NAME_SIZE); surf.index += SurfaceMango.NAME_SIZE;
            colorTableName = colorTableName.replace(/\0/g, '');

            surf.index += 4; // alpha (ignore)
            min = surf.dv.getFloat32(this.index, this.littleEndian); surf.index += 4;
            max = surf.dv.getFloat32(this.index, this.littleEndian); surf.index += 4;
            ratio = 255.0 / (max - min);
            surf.index += 4; // brightness (ignore)
            surf.index += 4; // num parts (should always be 1)
            numScalars = surf.dv.getUint32(this.index, this.littleEndian); surf.index += 4;
            scalars = new Float32Array(numScalars);

            for (ctr = 0; ctr < numScalars; ctr += 1, surf.index += 4) {
                scalars[ctr] = surf.dv.getFloat32(surf.index, surf.littleEndian);
            }

            // !! Viewer ColorTable !!
            if (papaya.viewer.ColorTable.findLUT(colorTableName) !== papaya.viewer.ColorTable.TABLE_GRAYSCALE) { 
                colorTable = new papaya.viewer.ColorTable(colorTableName, false);
            } else {
                colorTable = new papaya.viewer.ColorTable("Spectrum", false);
            }

            colorTable.updateLUT(0, 255);
            length = surf.surfaces[surf.surfaceIndex].pointData.length / 3;

            if (surf.surfaces[surf.surfaceIndex].colorsData === null) {
                surf.surfaces[surf.surfaceIndex].colorsData = new Float32Array(length * 4);
            }

            for (ctr = 0; ctr < length; ctr += 1) {
                scalar = scalars[ctr];

                if (scalar <= min) {
                    if (surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] === 0) {
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = surf.surfaces[surf.surfaceIndex].solidColor[0];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = surf.surfaces[surf.surfaceIndex].solidColor[1];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = surf.surfaces[surf.surfaceIndex].solidColor[2];
                        surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                    }
                } else if (scalar > max) {
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = colorTable.lookupRed(255) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = colorTable.lookupGreen(255)/ 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = colorTable.lookupBlue(255) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                } else {
                    val = Math.floor(((scalar - min) * ratio) + .5);
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4)] = colorTable.lookupRed(val) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 1] = colorTable.lookupGreen(val)/ 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 2] = colorTable.lookupBlue(val) / 255.0;
                    surf.surfaces[surf.surfaceIndex].colorsData[(ctr * 4) + 3] = 1;
                }
            }
        } else {
            break;
        }
    }

    surf.surfaceIndex++;

    if (surf.surfaceIndex === surf.numSurfaces) {
        setTimeout(function() { surf.onFinishedRead(); }, 0);
    } else {
        setTimeout(function() { surf.readNextSurface(surf, progress); }, 0);
    }
  };

  getNumSurfaces() {
    return this.numSurfaces;
  };

  getNumPoints(index) {
    return this.surfaces[index].pointData.length / 3;
  };

  getNumTriangles(index) {
    return this.surfaces[index].triangleData.length / 3;
  };

  getSolidColor(index) {
    return this.surfaces[index].solidColor;
  };

  getPointData(index) {
    return this.surfaces[index].pointData;
  };

  getNormalsData(index) {
    return this.surfaces[index].normalsData;
  };

  getTriangleData(index) {
    return this.surfaces[index].triangleData;
  };

  getColorsData(index) {
    return this.surfaces[index].colorsData;
  };
}

export class SurfaceMangoData {
  constructor() {
    this.pointData = null;
    this.triangleData = null;
    this.normalsData = null;
    this.colorsData = null;
    this.solidColor = [];
  }
}
