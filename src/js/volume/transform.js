
/*jslint browser: true, node: true */
/*global */

"use strict"

import { VoxelValue } from "."

export class Transform {

  /*** Constructor ***/
  constructor(mat, volume) {
    this.voxelValue = new VoxelValue(volume.imageData, volume.header.imageType,
      volume.header.imageDimensions, volume.header.imageRange, volume.header.orientation)
    this.voxelDimensions = volume.header.voxelDimensions
    this.imageDimensions = volume.header.imageDimensions
    this.volume = volume
    this.mat = Transform.IDENTITY.clone()
    this.indexMat = Transform.IDENTITY.clone()
    this.sizeMat = Transform.IDENTITY.clone()
    this.sizeMatInverse = Transform.IDENTITY.clone()
    this.mmMat = Transform.IDENTITY.clone()
    this.worldMat = Transform.IDENTITY.clone()
    this.worldMatNifti = null
    this.originMat = Transform.IDENTITY.clone()
    this.tempMat = Transform.IDENTITY.clone()
    this.tempMat2 = Transform.IDENTITY.clone()
    this.orientMat = Transform.IDENTITY.clone()
    this.centerMat = Transform.IDENTITY.clone()
    this.centerMatInverse = Transform.IDENTITY.clone()
    this.rotMatX = Transform.IDENTITY.clone()
    this.rotMatY = Transform.IDENTITY.clone()
    this.rotMatZ = Transform.IDENTITY.clone()
    this.rotMat = Transform.IDENTITY.clone()

    this.updateTransforms(mat)
  };


  /*** Static Pseudo-constants ***/

  static IDENTITY = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  static EPSILON = 0.00001;


  /*** Static Methods ***/

  static printTransform(mat) {
    console.log(mat[0][0] + " " + mat[0][1] + " " + mat[0][2] + " " + mat[0][3])
    console.log(mat[1][0] + " " + mat[1][1] + " " + mat[1][2] + " " + mat[1][3])
    console.log(mat[2][0] + " " + mat[2][1] + " " + mat[2][2] + " " + mat[2][3])
    console.log(mat[3][0] + " " + mat[3][1] + " " + mat[3][2] + " " + mat[3][3])
  };

  static decompose(mat) {
    var xTrans, yTrans, zTrans, xRot, yRot, zRot, xScale, yScale, zScale, tempK1, tempK2, tempK3, tempK4, tempK5,
      tempK6, tempM1, tempM2, tempM3, tempM4, tempM5, tempM6, tempM7, tempM8, tempM9, tempN1, tempN2, tempN3, tempN4,
      tempN5, tempN6, xSkew, ySkew, zSkew, decomposedParams

    decomposedParams = []

    xTrans = Transform.validateNum(mat[0][3]) // xTrans
    yTrans = Transform.validateNum(mat[1][3]) // yTrans
    zTrans = Transform.validateNum(mat[2][3]) // zTrans

    xRot = Transform.validateNum(Math.atan(mat[2][1] / mat[2][2])) // xRot

    yRot = 0

    if (xRot === 0) {
      yRot = Transform.validateNum(Math.atan(-1 * Math.cos(xRot) * (mat[2][0] / mat[2][2])))
    } else {
      yRot = Transform.validateNum(Math.atan(-1 * Math.sin(xRot) * (mat[2][0] / mat[2][1])))
    }

    if (yRot === 0) {
      yRot = Transform.EPSILON
    }

    zScale = Transform.validateScale(mat[2][2] / (Math.cos(yRot) * Math.cos(xRot))) // zScale

    tempK1 = Math.cos(xRot)
    tempK2 = (Math.sin(xRot) * Math.sin(yRot)) + (Math.sin(xRot) * (Math.cos(yRot) / Math.tan(yRot)))
    tempK3 = (mat[1][0] * (Math.sin(xRot) / Math.tan(yRot))) + mat[1][1]
    tempK4 = -1 * Math.sin(xRot)
    tempK5 = (Math.cos(xRot) * Math.sin(yRot)) + (Math.cos(xRot) * (Math.cos(yRot) / Math.tan(yRot)))
    tempK6 = (mat[1][0] * (Math.cos(xRot) / Math.tan(yRot))) + mat[1][2]

    zRot = Transform.validateNum(Math.atan((((tempK1 * tempK6) - (tempK3 * tempK4)) / ((tempK3 * tempK5) -
      (tempK2 * tempK6))))) // zRot

    yScale = Transform.validateScale((tempK3 / ((Math.cos(zRot) * tempK1) +
      (Math.sin(zRot) * tempK2)))) // yScale
    xSkew = Transform.validateNum((((yScale * Math.sin(zRot) * Math.cos(yRot)) - mat[1][0]) /
      (zScale * Math.sin(yRot)))) // xSkew

    tempM1 = Math.cos(yRot) * Math.cos(zRot)
    tempM2 = yScale * Math.cos(yRot) * Math.sin(zRot)
    tempM3 = -1 * zScale * Math.sin(yRot)
    tempM4 = (Math.sin(xRot) * Math.sin(yRot) * Math.cos(zRot)) - (Math.cos(xRot) * Math.sin(zRot))
    tempM5 = (Math.sin(xRot) * Math.sin(yRot) * Math.sin(zRot)) + (Math.cos(xRot) * Math.cos(zRot))
    tempM6 = zScale * Math.sin(xRot) * Math.cos(yRot)
    tempM7 = (Math.cos(xRot) * Math.sin(yRot) * Math.cos(zRot)) + (Math.sin(xRot) * Math.sin(zRot))
    tempM8 = (Math.cos(xRot) * Math.sin(yRot) * Math.sin(zRot)) - (Math.sin(xRot) * Math.cos(zRot))
    tempM9 = zScale * Math.cos(xRot) * Math.cos(yRot)
    tempN1 = (tempM2 * tempM4) - (tempM1 * tempM5)
    tempN2 = (tempM3 * tempM4) - (tempM1 * tempM6)
    tempN3 = (tempM4 * mat[0][0]) - (tempM1 * mat[0][1])
    tempN4 = (tempM2 * tempM7) - (tempM1 * tempM8)
    tempN5 = (tempM3 * tempM7) - (tempM1 * tempM9)
    tempN6 = (tempM7 * mat[0][0]) - (tempM1 * mat[0][2])

    ySkew = Transform.validateNum((((tempN4 * tempN3) - (tempN6 * tempN1)) / ((tempN2 * tempN4) -
      (tempN1 * tempN5)))) // ySkew
    zSkew = Transform.validateNum((((tempN3 * tempN5) - (tempN2 * tempN6)) / ((tempN1 * tempN5) -
      (tempN2 * tempN4)))) // zSkew
    xScale = Transform.validateScale(((mat[0][0] - (zSkew * tempM2) - (ySkew * tempM3)) /
      tempM1)) // xScale

    if (yRot === Transform.EPSILON) {
      yRot = 0
    }

    xRot *= (180 / Math.PI)
    yRot *= (180 / Math.PI)
    zRot *= (180 / Math.PI)

    decomposedParams[0] = Transform.validateZero(xTrans)
    decomposedParams[1] = Transform.validateZero(yTrans)
    decomposedParams[2] = Transform.validateZero(zTrans)

    decomposedParams[3] = Transform.validateZero(xRot)
    decomposedParams[4] = Transform.validateZero(yRot)
    decomposedParams[5] = Transform.validateZero(zRot)

    decomposedParams[6] = xScale
    decomposedParams[7] = yScale
    decomposedParams[8] = zScale

    decomposedParams[9] = Transform.validateZero(xSkew)
    decomposedParams[10] = Transform.validateZero(ySkew)
    decomposedParams[11] = Transform.validateZero(zSkew)

    return decomposedParams
  };

  static hasRotations(mat) {
    var decomp, epsilon, rotX, rotY, rotZ

    if (mat !== null) {
      decomp = Transform.decompose(mat)
      epsilon = 0.01

      rotX = (Math.abs(1 - (Math.abs(decomp[3]) / 90.0)) % 1)
      rotY = (Math.abs(1 - (Math.abs(decomp[4]) / 90.0)) % 1)
      rotZ = (Math.abs(1 - (Math.abs(decomp[5]) / 90.0)) % 1)

      return ((rotX > epsilon) || (rotY > epsilon) || (rotZ > epsilon))
    }

    return false
  };

  static validateNum(num) {
    if ((num === Number.POSITIVE_INFINITY) || (num === Number.NEGATIVE_INFINITY)) {
      return 0
    }

    if (isNaN(num)) {
      return 0
    }

    if (num === 0) {  // catch negative zeros
      return 0
    }

    return num
  };

  static validateScale(num) {
    if ((num === Number.POSITIVE_INFINITY) || (num === Number.NEGATIVE_INFINITY)) {
      return 1
    }

    if (isNaN(num)) {
      return 1
    }

    return num
  };

  static validateZero(num) {
    if (Math.abs(num) < Transform.EPSILON) {
      return 0
    }

    return num
  };


  /*** Prototype Methods ***/

  updateSizeMat() {
    this.sizeMat[0][0] = this.voxelDimensions.xSize
    this.sizeMat[1][1] = this.voxelDimensions.ySize
    this.sizeMat[2][2] = this.voxelDimensions.zSize
    this.sizeMat[3][3] = 1

    this.sizeMatInverse[0][0] = 1 / this.voxelDimensions.xSize
    this.sizeMatInverse[1][1] = 1 / this.voxelDimensions.ySize
    this.sizeMatInverse[2][2] = 1 / this.voxelDimensions.zSize
    this.sizeMatInverse[3][3] = 1
  };

  updateOrientMat() {
    this.orientMat = this.volume.header.orientation.orientMat
  };

  updateIndexTransform() {
    var ctrOut, ctrIn
    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.indexMat[ctrOut][ctrIn] = (this.orientMat[ctrOut][0] * this.mat[0][ctrIn]) +
          (this.orientMat[ctrOut][1] * this.mat[1][ctrIn]) +
          (this.orientMat[ctrOut][2] * this.mat[2][ctrIn]) +
          (this.orientMat[ctrOut][3] * this.mat[3][ctrIn])
      }
    }
  };

  updateMmTransform() {
    var ctrOut, ctrIn
    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.mmMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
          (this.indexMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
          (this.indexMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
          (this.indexMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn])
      }
    }
  };

  updateOriginMat() {
    this.originMat[0][0] = 1
    this.originMat[1][1] = -1
    this.originMat[2][2] = -1
    this.originMat[3][3] = 1
    this.originMat[0][3] = this.volume.header.origin.x
    this.originMat[1][3] = this.volume.header.origin.y
    this.originMat[2][3] = this.volume.header.origin.z
  };

  updateImageMat(centerX, centerY, centerZ, rotX, rotY, rotZ) {
    var theta, cosTheta, sinTheta, ctrOut, ctrIn
    this.updateCenterMat(centerX, centerY, centerZ)


    theta = (rotX * Math.PI) / 180.0
    cosTheta = Math.cos(theta)
    sinTheta = Math.sin(theta)
    this.rotMatX[1][1] = cosTheta
    this.rotMatX[1][2] = sinTheta
    this.rotMatX[2][1] = -1 * sinTheta
    this.rotMatX[2][2] = cosTheta

    theta = (rotY * Math.PI) / 180.0
    cosTheta = Math.cos(theta)
    sinTheta = Math.sin(theta)
    this.rotMatY[0][0] = cosTheta
    this.rotMatY[0][2] = -1 * sinTheta
    this.rotMatY[2][0] = sinTheta
    this.rotMatY[2][2] = cosTheta

    theta = (rotZ * Math.PI) / 180.0
    cosTheta = Math.cos(theta)
    sinTheta = Math.sin(theta)
    this.rotMatZ[0][0] = cosTheta
    this.rotMatZ[0][1] = sinTheta
    this.rotMatZ[1][0] = -1 * sinTheta
    this.rotMatZ[1][1] = cosTheta

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.tempMat[ctrOut][ctrIn] =
          (this.rotMatX[ctrOut][0] * this.rotMatY[0][ctrIn]) +
          (this.rotMatX[ctrOut][1] * this.rotMatY[1][ctrIn]) +
          (this.rotMatX[ctrOut][2] * this.rotMatY[2][ctrIn]) +
          (this.rotMatX[ctrOut][3] * this.rotMatY[3][ctrIn])
      }
    }

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.rotMat[ctrOut][ctrIn] =
          (this.tempMat[ctrOut][0] * this.rotMatZ[0][ctrIn]) +
          (this.tempMat[ctrOut][1] * this.rotMatZ[1][ctrIn]) +
          (this.tempMat[ctrOut][2] * this.rotMatZ[2][ctrIn]) +
          (this.tempMat[ctrOut][3] * this.rotMatZ[3][ctrIn])
      }
    }

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.tempMat[ctrOut][ctrIn] =
          (this.sizeMatInverse[ctrOut][0] * this.centerMatInverse[0][ctrIn]) +
          (this.sizeMatInverse[ctrOut][1] * this.centerMatInverse[1][ctrIn]) +
          (this.sizeMatInverse[ctrOut][2] * this.centerMatInverse[2][ctrIn]) +
          (this.sizeMatInverse[ctrOut][3] * this.centerMatInverse[3][ctrIn])
      }
    }

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.tempMat2[ctrOut][ctrIn] =
          (this.tempMat[ctrOut][0] * this.rotMat[0][ctrIn]) +
          (this.tempMat[ctrOut][1] * this.rotMat[1][ctrIn]) +
          (this.tempMat[ctrOut][2] * this.rotMat[2][ctrIn]) +
          (this.tempMat[ctrOut][3] * this.rotMat[3][ctrIn])
      }
    }

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.tempMat[ctrOut][ctrIn] =
          (this.tempMat2[ctrOut][0] * this.centerMat[0][ctrIn]) +
          (this.tempMat2[ctrOut][1] * this.centerMat[1][ctrIn]) +
          (this.tempMat2[ctrOut][2] * this.centerMat[2][ctrIn]) +
          (this.tempMat2[ctrOut][3] * this.centerMat[3][ctrIn])
      }
    }

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.tempMat2[ctrOut][ctrIn] =
          (this.tempMat[ctrOut][0] * this.sizeMat[0][ctrIn]) +
          (this.tempMat[ctrOut][1] * this.sizeMat[1][ctrIn]) +
          (this.tempMat[ctrOut][2] * this.sizeMat[2][ctrIn]) +
          (this.tempMat[ctrOut][3] * this.sizeMat[3][ctrIn])
      }
    }

    this.volume.transform.updateTransforms(this.tempMat2)
  };

  updateCenterMat(x, y, z) {
    this.centerMat[0][0] = 1
    this.centerMat[1][1] = 1
    this.centerMat[2][2] = 1
    this.centerMat[3][3] = 1
    this.centerMat[0][3] = -1 * x
    this.centerMat[1][3] = -1 * y
    this.centerMat[2][3] = -1 * z

    this.centerMatInverse[0][0] = 1
    this.centerMatInverse[1][1] = 1
    this.centerMatInverse[2][2] = 1
    this.centerMatInverse[3][3] = 1
    this.centerMatInverse[0][3] = x
    this.centerMatInverse[1][3] = y
    this.centerMatInverse[2][3] = z
  };

  updateWorldMat() {
    var ctrOut, ctrIn, flipMat, originNiftiMat

    if (this.worldMatNifti) {
      flipMat = [[-1, 0, 0, this.imageDimensions.xDim - 1], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]

      originNiftiMat = Transform.IDENTITY.clone()
      originNiftiMat[0][0] = -1
      originNiftiMat[1][1] = -1
      originNiftiMat[2][2] = -1
      originNiftiMat[3][3] = 1
      originNiftiMat[0][3] = this.volume.header.origin.x
      originNiftiMat[1][3] = this.volume.header.origin.y
      originNiftiMat[2][3] = this.volume.header.origin.z

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat[ctrOut][ctrIn] = (this.sizeMat[ctrOut][0] * originNiftiMat[0][ctrIn]) +
            (this.sizeMat[ctrOut][1] * originNiftiMat[1][ctrIn]) +
            (this.sizeMat[ctrOut][2] * originNiftiMat[2][ctrIn]) +
            (this.sizeMat[ctrOut][3] * originNiftiMat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * flipMat[0][ctrIn]) +
            (this.tempMat[ctrOut][1] * flipMat[1][ctrIn]) +
            (this.tempMat[ctrOut][2] * flipMat[2][ctrIn]) +
            (this.tempMat[ctrOut][3] * flipMat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat[ctrOut][ctrIn] = (this.tempMat2[ctrOut][0] * this.mat[0][ctrIn]) +
            (this.tempMat2[ctrOut][1] * this.mat[1][ctrIn]) +
            (this.tempMat2[ctrOut][2] * this.mat[2][ctrIn]) +
            (this.tempMat2[ctrOut][3] * this.mat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * flipMat[0][ctrIn]) +
            (this.tempMat[ctrOut][1] * flipMat[1][ctrIn]) +
            (this.tempMat[ctrOut][2] * flipMat[2][ctrIn]) +
            (this.tempMat[ctrOut][3] * flipMat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat[ctrOut][ctrIn] = (this.tempMat2[ctrOut][0] * originNiftiMat[0][ctrIn]) +
            (this.tempMat2[ctrOut][1] * originNiftiMat[1][ctrIn]) +
            (this.tempMat2[ctrOut][2] * originNiftiMat[2][ctrIn]) +
            (this.tempMat2[ctrOut][3] * originNiftiMat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat2[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
            (this.tempMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
            (this.tempMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
            (this.tempMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.worldMat[ctrOut][ctrIn] = (this.worldMatNifti[ctrOut][0] * this.tempMat2[0][ctrIn]) +
            (this.worldMatNifti[ctrOut][1] * this.tempMat2[1][ctrIn]) +
            (this.worldMatNifti[ctrOut][2] * this.tempMat2[2][ctrIn]) +
            (this.worldMatNifti[ctrOut][3] * this.tempMat2[3][ctrIn])
        }
      }
    } else {
      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.tempMat[ctrOut][ctrIn] = (this.indexMat[ctrOut][0] * this.originMat[0][ctrIn]) +
            (this.indexMat[ctrOut][1] * this.originMat[1][ctrIn]) +
            (this.indexMat[ctrOut][2] * this.originMat[2][ctrIn]) +
            (this.indexMat[ctrOut][3] * this.originMat[3][ctrIn])
        }
      }

      for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
        for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
          this.worldMat[ctrOut][ctrIn] = (this.tempMat[ctrOut][0] * this.sizeMatInverse[0][ctrIn]) +
            (this.tempMat[ctrOut][1] * this.sizeMatInverse[1][ctrIn]) +
            (this.tempMat[ctrOut][2] * this.sizeMatInverse[2][ctrIn]) +
            (this.tempMat[ctrOut][3] * this.sizeMatInverse[3][ctrIn])
        }
      }
    }
  };

  updateMat(mat) {
    var ctrIn, ctrOut

    for (ctrOut = 0;ctrOut < 4;ctrOut += 1) {
      for (ctrIn = 0;ctrIn < 4;ctrIn += 1) {
        this.mat[ctrOut][ctrIn] = mat[ctrOut][ctrIn]
      }
    }
  };

  updateTransforms(mat) {
    this.updateMat(mat)
    this.updateSizeMat()
    this.updateOrientMat()
    this.updateOriginMat()
    this.updateIndexTransform()
    this.updateMmTransform()
    this.updateWorldMat()
  };

  getVoxelAtIndexNative(ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.voxelValue.getVoxelAtIndexNative(ctrX, ctrY, ctrZ, timepoint, useNN)
  };

  getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.voxelValue.getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN)
  };

  getVoxelAtCoordinate(xLoc, yLoc, zLoc, timepoint, useNN) {
    var xTrans, yTrans, zTrans
    xTrans = ((xLoc * this.worldMat[0][0]) + (yLoc * this.worldMat[0][1]) + (zLoc * this.worldMat[0][2]) +
      (this.worldMat[0][3]))
    yTrans = ((xLoc * this.worldMat[1][0]) + (yLoc * this.worldMat[1][1]) + (zLoc * this.worldMat[1][2]) +
      (this.worldMat[1][3]))
    zTrans = ((xLoc * this.worldMat[2][0]) + (yLoc * this.worldMat[2][1]) + (zLoc * this.worldMat[2][2]) +
      (this.worldMat[2][3]))

    return this.voxelValue.getVoxelAtIndexNative(xTrans, yTrans, zTrans, timepoint, useNN)
  };

  getVoxelAtMM(xLoc, yLoc, zLoc, timepoint, useNN) {
    var xTrans, yTrans, zTrans
    xTrans = ((xLoc * this.mmMat[0][0]) + (yLoc * this.mmMat[0][1]) + (zLoc * this.mmMat[0][2]) + (this.mmMat[0][3]))
    yTrans = ((xLoc * this.mmMat[1][0]) + (yLoc * this.mmMat[1][1]) + (zLoc * this.mmMat[1][2]) + (this.mmMat[1][3]))
    zTrans = ((xLoc * this.mmMat[2][0]) + (yLoc * this.mmMat[2][1]) + (zLoc * this.mmMat[2][2]) + (this.mmMat[2][3]))

    return this.voxelValue.getVoxelAtIndexNative(xTrans, yTrans, zTrans, timepoint, useNN)
  };

}

