
/*jslint browser: true, node: true */
/*global daikon */

"use strict"


import daikon from "../../../../lib/daikon"

import { ObjectUtils, StringUtils, ArrayUtils } from "../../utilities"
import { Coordinate } from "../../core"

import { ImageDimensions, VoxelDimensions, ImageRange, Orientation, Header, ImageDescription, ImageType } from "../"


export class HeaderDICOM {
  constructor() {
    this.series = null
    this.seriesMap = []
    this.error = null
    this.onFinishedHeaderRead = null
    this.dialogHandler = null
  }

  static ORIENTATION_DEFAULT = "XYZ+--";
  static SUPPORTED_TRANSFER_SYNTAXES = [
    // uncompressed
    "1.2.840.10008.1.2",
    "1.2.840.10008.1.2.1",
    "1.2.840.10008.1.2.2",

    // deflated
    "1.2.840.10008.1.2.1.99",

    // jpeg baseline compressed
    "1.2.840.10008.1.2.4.50",  // 8-bit
    "1.2.840.10008.1.2.4.51",  // 8-bit

    // jpeg lossless compressed
    "1.2.840.10008.1.2.4.57",
    "1.2.840.10008.1.2.4.70",  // selection 1

    // jpeg-LS compressed
    "1.2.840.10008.1.2.4.80",  // lossless
    "1.2.840.10008.1.2.4.81",

    // jpeg 2000 compressed
    "1.2.840.10008.1.2.4.90",  // lossless
    "1.2.840.10008.1.2.4.91",

    // rle compressed
    "1.2.840.10008.1.2.5"
  ];

  static isThisFormat(filename, data) {
    var buf, offset, magicCookieLength, ctr, cookieCtr = 0, parser, tag

    // check extension
    if (filename.indexOf(".dcm") !== -1) {
      return true
    }

    // check for magic number
    buf = new DataView(data[0])
    offset = daikon.Parser.MAGIC_COOKIE_OFFSET
    magicCookieLength = daikon.Parser.MAGIC_COOKIE.length

    for (ctr = 0;ctr < magicCookieLength;ctr += 1) {
      if (buf.getUint8(offset + ctr) === daikon.Parser.MAGIC_COOKIE[ctr]) {
        cookieCtr += 1
      }
    }

    if (cookieCtr === 4) {
      return true
    }

    // ok, last shot -- some DICOM don't contain magic number, check for valid tags...
    parser = new daikon.Parser()
    tag = parser.testForValidTag(buf)

    return ((tag !== null) && (tag.group <= 0x0008) && !parser.hasError())
  };

  setSeries(name, value) {
    var ctr

    for (ctr = 0;ctr < Object.keys(this.seriesMap).length;ctr += 1) {
      if (Object.keys(this.seriesMap)[ctr].indexOf(value) !== -1) {
        this.series = this.seriesMap[Object.keys(this.seriesMap)[ctr]]
        break
      }
    }
  }

  getDataScaleSlope(isElscint, image) {
    if (isElscint) {
      return (image.getDataScaleElscint() || 1)
    }

    return (image.getDataScaleSlope() || 1)
  }

  getDataScaleIntercept(isElscint, image) {
    if (isElscint) {
      return 0
    }

    return (image.getDataScaleIntercept() || 0)
  }

  finishedHeaderRead() {
    var dialogData, allSeries, ctr

    if (this.error) {
      this.onFinishedHeaderRead()
    } else if (Object.keys(this.seriesMap).length > 1) {
      this.series = this.seriesMap[Object.keys(this.seriesMap)[0]]

      allSeries = []
      for (ctr = 0;ctr < Object.keys(this.seriesMap).length;ctr += 1) {
        allSeries.push(this.seriesMap[Object.keys(this.seriesMap)[ctr]])
      }

      dialogData = {
        "items": [
          { "label": "Select:", "field": "series", "options": allSeries }
        ]
      }

      this.dialogHandler.showDialog("Select DICOM Series", dialogData, this, ObjectUtils.bind(this, this.setSeries),
        ObjectUtils.bind(this, this.finishedSeriesSelection))
    } else {
      this.series = this.seriesMap[Object.keys(this.seriesMap)[0]]

      if (this.series.images.length > 0) {
        this.series.buildSeries()

        if (!this.isTransferSyntaxSupported()) {
          this.error = new Error("This transfer syntax is currently not supported!")
        }
      } else {
        this.error = new Error("No images found!")
      }

      this.onFinishedHeaderRead()
    }
  }

  isTransferSyntaxSupported() {
    var transferSyntax = this.series.images[0].getTransferSyntax()

    return (StringUtils.isStringBlank(transferSyntax) ||
      ArrayUtils.contains(HeaderDICOM.SUPPORTED_TRANSFER_SYNTAXES,
        transferSyntax))
  }

  finishedSeriesSelection() {
    if (this.series.images.length > 0) {
      this.series.buildSeries()

      if (!this.isTransferSyntaxSupported()) {
        this.error = new Error("This transfer syntax is currently not supported!")
      }
    } else {
      this.error = new Error("No images found!")
    }

    this.seriesMap = null

    this.onFinishedHeaderRead()
  }

  readHeaderData(data, progressMeter, dialogHandler, onFinishedHeaderRead) {
    this.onFinishedHeaderRead = onFinishedHeaderRead
    this.dialogHandler = dialogHandler
    this.readNextHeaderData(data, 0, progressMeter, ObjectUtils.bind(this, this.finishedHeaderRead))
  }

  readNextHeaderData(data, index, progressMeter, onFinishedHeaderRead) {
    var image, series

    if (index >= data.length) {
      progressMeter.drawProgress(1, "Reading DICOM Headers")
      onFinishedHeaderRead()
    } else {
      image = daikon.Series.parseImage(new DataView(data[index]))

      if (image === null) {
        this.error = daikon.Series.parserError
      } else if (image.hasPixelData()) {
        series = this.findSeries(image.getSeriesId())

        if (!series) {
          series = new daikon.Series()
          this.seriesMap[image.getSeriesId()] = series
        }

        series.addImage(image)
      } else {
        this.error = new Error("No pixel data found!")
      }

      if (this.error) {
        onFinishedHeaderRead()
      } else {
        progressMeter.drawProgress(index / data.length, "Reading DICOM Headers")
        setTimeout(function () {
          this.readNextHeaderData(data, index + 1, progressMeter,
            onFinishedHeaderRead)
        }.bind(this), 0)
      }
    }
  }

  getName() {
    var name = this.series.getName()

    if (name) {
      return name
    } else {
      return null
    }
  }

  getSeriesLabels() {
    return null
  }

  findSeries(id) {
    if (Object.keys(this.seriesMap).length === 0) {
      return null
    } else {
      return this.seriesMap[id]
    }
  }

  readImageData(progressMeter, onFinishedImageRead) {
    this.series.concatenateImageData(progressMeter, onFinishedImageRead)
  }

  getImageDimensions() {
    var imageDimensions, numberOfSlices, ctr, size

    if (this.series.isMosaic) {
      numberOfSlices = this.series.images[0].getMosaicCols() * this.series.images[0].getMosaicRows()
      imageDimensions = new ImageDimensions(parseInt(this.series.images[0].getCols() /
        this.series.images[0].getMosaicCols()),
        parseInt(this.series.images[0].getRows() / this.series.images[0].getMosaicRows()), numberOfSlices,
        this.series.images.length)
    } else if (this.series.isMultiFrameVolume) {
      imageDimensions = new ImageDimensions(this.series.images[0].getCols(),
        this.series.images[0].getRows(), this.series.numberOfFrames, 1)
    } else if (this.series.isMultiFrameTimeseries) {
      imageDimensions = new ImageDimensions(this.series.images[0].getCols(),
        this.series.images[0].getRows(), this.series.numberOfFramesInFile, this.series.numberOfFrames)
    } else if (this.series.isImplicitTimeseries) {
      imageDimensions = new ImageDimensions(this.series.images[0].getCols(),
        this.series.images[0].getRows(), parseInt(this.series.images.length / this.series.numberOfFrames),
        this.series.numberOfFrames)
    } else {
      imageDimensions = new ImageDimensions(this.series.images[0].getCols(),
        this.series.images[0].getRows(), this.series.images.length, 1)
    }

    size = parseInt((imageDimensions.getNumVoxelsSeries() * parseInt(this.series.images[0].getBitsAllocated() / 8)) /
      this.series.images.length)

    for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
      imageDimensions.dataOffsets[ctr] = this.series.images[ctr].getPixelData().offsetValue
      imageDimensions.dataLengths[ctr] = size
    }

    return imageDimensions
  }

  getVoxelDimensions() {
    var voxelDimensions, sliceSpacing, sliceDis, pixelSpacing

    pixelSpacing = (this.series.images[0].getPixelSpacing() || [0, 0])

    sliceSpacing = Math.max(this.series.images[0].getSliceGap(), this.series.images[0].getSliceThickness())

    if (daikon.Series.useExplicitSpacing) {
      sliceSpacing = daikon.Series.useExplicitSpacing
    }

    if (this.series.isMosaic || this.series.isMultiFrame) {
      voxelDimensions = new VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceSpacing,
        this.series.images[0].getTR() / 1000.0)
    } else {
      if ((this.series.images.length === 1) || daikon.Series.useExplicitOrdering) {
        voxelDimensions = new VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceSpacing,
          this.series.images[0].getTR() / 1000.0)
      } else {
        sliceDis = Math.abs(this.series.images[0].getSliceLocation() - this.series.images[1].getSliceLocation())

        if (sliceDis === 0) {
          sliceDis = Math.max(this.series.images[0].getSliceGap(), this.series.images[0].getSliceThickness())
        }

        voxelDimensions = new VoxelDimensions(pixelSpacing[1], pixelSpacing[0], sliceDis,
          this.series.images[0].getTR() / 1000.0)
      }
    }

    if (!voxelDimensions.isValid()) { // some DICOM images don't include voxel size?
      if (voxelDimensions.rowSize === 0) {
        voxelDimensions.rowSize = 1
      }

      if (voxelDimensions.colSize === 0) {
        voxelDimensions.colSize = 1
      }

      if (voxelDimensions.sliceSize === 0) {
        voxelDimensions.sliceSize = 1
      }
    }

    voxelDimensions.spatialUnit = VoxelDimensions.UNITS_MM
    voxelDimensions.temporalUnit = VoxelDimensions.UNITS_SEC

    return voxelDimensions
  }

  getImageType() {
    var dataTypeDICOM, dataTypeCode, it
    dataTypeDICOM = this.series.images[0].getDataType()

    if (dataTypeDICOM === daikon.Image.BYTE_TYPE_INTEGER) {
      dataTypeCode = ImageType.DATATYPE_INTEGER_SIGNED
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_INTEGER_UNSIGNED) {
      dataTypeCode = ImageType.DATATYPE_INTEGER_UNSIGNED
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_FLOAT) {
      dataTypeCode = ImageType.DATATYPE_FLOAT
    } else if (dataTypeDICOM === daikon.Image.BYTE_TYPE_RGB) {
      dataTypeCode = ImageType.DATATYPE_RGB
    } else {
      dataTypeCode = ImageType.DATATYPE_UNKNOWN
    }

    it = new ImageType(dataTypeCode, parseInt(this.series.images[0].getBitsAllocated() / 8),
      this.series.images[0].littleEndian, false)

    it.rgbBySample = (this.series.images[0].getPlanarConfig() === 1)

    return it
  }

  getImageRange() {
    var imageRange, gMax, gMin, min, max, ctr, image, windowWidth, windowCenter, center, width, imageDimensions,
      ctrInner, numMosaicSlicesVolume, numMosaicSlicesTotal, mosaicSlopes = [], mosaicIntercepts = [], numSlices,
      seriesSlopes, seriesIntercepts, ratio, numSlicesTotal, slopes = [], intercepts = []

    gMax = 0
    gMin = 0

    for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
      image = this.series.images[ctr]
      max = (image.getImageMax() * this.getDataScaleSlope(this.series.isElscint, image)) +
        (image.getDataScaleIntercept() || 0)
      min = (image.getImageMin() * this.getDataScaleSlope(this.series.isElscint, image)) +
        (image.getDataScaleIntercept() || 0)

      if (ctr === 0) {
        gMax = max
        gMin = min
      } else {
        if (max > gMax) {
          gMax = max
        }

        if (min < gMin) {
          gMin = min
        }
      }
    }

    windowWidth = 0
    windowCenter = 0

    if (this.series.isElscint) { // Elscint calculates data scales differently
      for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
        image = this.series.images[ctr]
        width = image.getWindowWidth() * image.getDataScaleElscint()
        center = image.getWindowCenter() * image.getDataScaleElscint()

        if (ctr === 0) {
          windowWidth = width
          windowCenter = center
        } else {
          if (windowCenter < center) {
            windowWidth = width
            windowCenter = center
          }
        }
      }
    } else {
      for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
        image = this.series.images[ctr]
        width = image.getWindowWidth()
        center = image.getWindowCenter()

        if (ctr === 0) {
          windowWidth = width
          windowCenter = center
        } else {
          if (windowCenter < center) {
            windowWidth = width
            windowCenter = center
          }
        }
      }
    }

    imageRange = new ImageRange(gMin, gMax)
    imageRange.displayMin = (windowCenter - (windowWidth / 2))
    imageRange.displayMax = (windowCenter + (windowWidth / 2))

    imageDimensions = this.getImageDimensions()

    if (this.series.isMosaic) {
      numMosaicSlicesVolume = imageDimensions.slices
      numMosaicSlicesTotal = numMosaicSlicesVolume * this.series.images.length

      for (ctr = 0;ctr < numMosaicSlicesTotal;ctr += 1) {
        image = this.series.images[parseInt(ctr / numMosaicSlicesVolume)]
        mosaicSlopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image)
        mosaicIntercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image)
      }

      imageRange.dataScaleSlopes = mosaicSlopes
      imageRange.dataScaleIntercepts = mosaicIntercepts
    } else if (this.series.isMultiFrame) {
      numSlices = imageDimensions.slices * imageDimensions.timepoints
      seriesSlopes = []
      seriesIntercepts = []
      ratio = parseInt(numSlices / this.series.images.length)

      for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
        for (ctrInner = 0;ctrInner < ratio;ctrInner += 1) {
          image = this.series.images[ctr]
          seriesSlopes[(ctr * ratio) + ctrInner] = this.getDataScaleSlope(this.series.isElscint, image)
          seriesIntercepts[(ctr * ratio) + ctrInner] = this.getDataScaleIntercept(this.series.isElscint, image)
        }
      }

      imageRange.dataScaleSlopes = seriesSlopes
      imageRange.dataScaleIntercepts = seriesIntercepts
    } else if (this.series.isImplicitTimeseries) {
      numSlicesTotal = imageDimensions.slices * imageDimensions.timepoints
      if (this.series.images.length !== numSlicesTotal) {
        imageRange.setGlobalDataScale(this.getDataScaleSlope(this.series.isElscint, this.series.images[0]),
          this.getDataScaleIntercept(this.series.isElscint, this.series.images[0]),
          this.series.numberOfFrames)
      } else {
        for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
          image = this.series.images[ctr]
          slopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image)
          intercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image)
        }

        imageRange.dataScaleSlopes = slopes
        imageRange.dataScaleIntercepts = intercepts
      }
    } else {
      for (ctr = 0;ctr < this.series.images.length;ctr += 1) {
        image = this.series.images[ctr]
        slopes[ctr] = this.getDataScaleSlope(this.series.isElscint, image)
        intercepts[ctr] = this.getDataScaleIntercept(this.series.isElscint, image)
      }

      imageRange.dataScaleSlopes = slopes
      imageRange.dataScaleIntercepts = intercepts
    }

    imageRange.validateDataScale()

    return imageRange
  }

  getOrientation() {
    var orientation = this.series.images[0].getOrientation()

    if (orientation === null) {
      orientation = HeaderDICOM.ORIENTATION_DEFAULT
    }

    // this fixes the cross-slice orientation sense (usually)
    orientation = orientation.substring(0, 5) + (this.series.sliceSense ? '+' : '-')

    return new Orientation(orientation)
  }

  getOrientationCertainty() {
    var orientation = this.series.images[0].getOrientation()

    if (orientation === null) {
      return Header.ORIENTATION_CERTAINTY_UNKNOWN // orientation could be found
    } else {
      if (this.series.isMosaic || this.series.isMultiFrameVolume) {
        return Header.ORIENTATION_CERTAINTY_LOW
      } else {
        return Header.ORIENTATION_CERTAINTY_HIGH
      }
    }
  }

  getOrigin() {
    var m = this.getBestTransform()

    if (m) {
      var invm = numeric.inv(m)
      return new Coordinate(invm[0][3], invm[1][3], invm[2][3])
    } else {
      return new Coordinate(0, 0, 0)
    }
  }

  hasError() {
    return (this.error !== null)
  }

  getImageDescription() {
    var patientName, patientID, studyTime, studyDate, imageDes, notes = ''

    patientName = this.series.images[0].getPatientName()
    patientID = this.series.images[0].getPatientID()
    studyTime = this.series.images[0].getStudyTime()
    studyDate = this.series.images[0].getStudyDate()
    imageDes = this.series.images[0].getImageDescription()

    if (patientName) {
      notes += (" " + patientName)
    }

    if (patientID) {
      notes += (" " + patientID)
    }

    if (studyTime) {
      notes += (" " + studyTime)
    }

    if (studyDate) {
      notes += (" " + studyDate)
    }

    if (imageDes) {
      notes += (" " + imageDes)
    }

    return new ImageDescription(notes.trim())
  }

  getBestTransform() {
    var cosines = this.series.images[0].getImageDirections(),
      m = null

    if (cosines) {
      var vs = this.getVoxelDimensions()
      var coord = this.series.images[0].getImagePosition()
      var cosx = [cosines[0], cosines[1], cosines[2]]
      var cosy = [cosines[3], cosines[4], cosines[5]]
      var cosz = [cosx[1] * cosy[2] - cosx[2] * cosy[1],
      cosx[2] * cosy[0] - cosx[0] * cosy[2],
      cosx[0] * cosy[1] - cosx[1] * cosy[0]]
      m = [[cosx[0] * vs.colSize * -1, cosy[0] * vs.rowSize, cosz[0] * vs.sliceSize, -1 * coord[0]],
      [cosx[1] * vs.colSize, cosy[1] * vs.rowSize * -1, cosz[1] * vs.sliceSize, -1 * coord[1]],
      [cosx[2] * vs.colSize, cosy[2] * vs.rowSize, cosz[2] * vs.sliceSize, coord[2]],
      [0, 0, 0, 1]]
    }

    return m
  }

  getBestTransformOrigin() {
    return this.getOrigin()
  }

  toString() {
    return this.series.images[0].toString()
  }

}
