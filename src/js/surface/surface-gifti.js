
/*jslint browser: true, node: true */
/*global  */

import gifti from "gifti-reader-js";

export class SurfaceGIFTI {
  constructor() {
    this.gii = null;
    this.error = null;
    this.pointData = null;
    this.triangleData = null;
    this.normalsData = null;
    this.colorsData = null;
    this.onFinishedRead = null;
  }

  isSurfaceDataBinary() {
    return false;
  }

  readData(data, progress, onFinishedRead) {
    const surf = this;

    progress(0);
    this.onFinishedRead = onFinishedRead;
    this.gii = gifti.parse(data);

    setTimeout(function () {
      surf.readDataPoints(surf, progress);
    }, 0);
  }

  readDataPoints(surf, progress) {
    progress(0.2);

    if (surf.gii.getPointsDataArray() != null) {
      surf.pointData = surf.gii.getPointsDataArray().getData();
    } else {
      surf.error = new Error("Surface is missing point information!");
    }

    setTimeout(function () {
      surf.readDataNormals(surf, progress);
    }, 0);
  }

  readDataNormals = function (surf, progress) {
    progress(0.4);

    if (surf.gii.getNormalsDataArray() != null) {
      surf.normalsData = surf.gii.getNormalsDataArray().getData();
    }

    setTimeout(function () {
      surf.readDataTriangles(surf, progress);
    }, 0);
  };

  readDataTriangles(surf, progress) {
    progress(0.6);

    if (surf.gii.getTrianglesDataArray() != null) {
      surf.triangleData = surf.gii.getTrianglesDataArray().getData();
    } else {
      surf.error = Error("Surface is missing triangle information!");
    }

    setTimeout(function () {
      surf.readDataColors(surf, progress);
    }, 0);
  }

  readDataColors(surf, progress) {
    progress(0.8);

    if (surf.gii.getColorsDataArray() != null) {
      surf.colorsData = surf.gii.getColorsDataArray().getData();
    }

    setTimeout(function () {
      surf.onFinishedRead();
    }, 0);
  };

  getNumSurfaces() {
    return 1;
  };

  getNumPoints() {
      return this.gii.getNumPoints();
  };

  getNumTriangles() {
      return this.gii.getNumTriangles();
  };

  getPointData() {
      return this.pointData;
  };

  getNormalsData() {
      return this.normalsData;
  };

  getTriangleData() {
      return this.triangleData;
  };

  getColorsData() {
      return this.colorsData;
  };

  getSolidColor() {
      return this.solidColor;
  };
}

