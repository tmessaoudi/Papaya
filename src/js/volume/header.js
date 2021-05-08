
/*jslint browser: true, node: true */
/*global */

"use strict"

import { HeaderNIFTI } from "./nifti/header-nifti"
import { HeaderDICOM } from "./dicom/header-dicom"
import { Container } from "../main"
import { ObjectUtils } from "../utilities"
import { Coordinate } from "../core"

import { Orientation } from "."

export class Header {
  /*** Constructor ***/
  constructor(pad) {
    this.fileFormat = null
    this.imageDimensions = null
    this.voxelDimensions = null
    this.imageDescription = null
    this.imageType = null
    this.orientation = null
    this.imageRange = null
    this.error = null
    this.origin = null
    this.pad = pad
    this.orientationCertainty = Header.ORIENTATION_CERTAINTY_UNKNOWN
    this.onFinishedFileFormatRead = null
  };


  /*** Static Pseudo-constants ***/

  static HEADER_TYPE_UNKNOWN = 0;
  static HEADER_TYPE_NIFTI = 1;
  static HEADER_TYPE_DICOM = 2;
  static ERROR_UNRECOGNIZED_FORMAT = "This format is not recognized!";
  static INVALID_IMAGE_DIMENSIONS = "Image dimensions are not valid!";
  static INVALID_VOXEL_DIMENSIONS = "Voxel dimensions are not valid!";
  static INVALID_DATATYPE = "Datatype is not valid or not supported!";
  static INVALID_IMAGE_RANGE = "Image range is not valid!";
  static ORIENTATION_CERTAINTY_UNKNOWN = 0;
  static ORIENTATION_CERTAINTY_LOW = 1;
  static ORIENTATION_CERTAINTY_HIGH = 2;


  /*** Prototype Methods ***/

  findHeaderType(filename, data) {
    if (HeaderNIFTI.isThisFormat(filename, data)) {
      return Header.HEADER_TYPE_NIFTI
    } else if (Container.DICOM_SUPPORT && HeaderDICOM.isThisFormat(filename, data)) {
      return Header.HEADER_TYPE_DICOM
    }

    return Header.HEADER_TYPE_UNKNOWN
  };

  readHeaderData(filename, data, progressMeter, dialogHandler,
    onFinishedFileFormatRead) {
    var headerType = this.findHeaderType(filename, data)

    this.onFinishedFileFormatRead = onFinishedFileFormatRead

    if (headerType === Header.HEADER_TYPE_NIFTI) {
      this.fileFormat = new HeaderNIFTI()
      this.fileFormat.readHeaderData(data, progressMeter, dialogHandler, ObjectUtils.bind(this, this.onFinishedHeaderRead))
    } else if (headerType === Header.HEADER_TYPE_DICOM) {
      this.fileFormat = new HeaderDICOM()
      this.fileFormat.readHeaderData(data, progressMeter, dialogHandler, ObjectUtils.bind(this, this.onFinishedHeaderRead))
    } else {
      this.error = new Error(Header.ERROR_UNRECOGNIZED_FORMAT)
      this.onFinishedFileFormatRead()
    }
  };

  onFinishedHeaderRead() {
    if (this.fileFormat.hasError()) {
      this.error = this.fileFormat.error
    } else {
      this.imageType = this.fileFormat.getImageType()
      if (!this.imageType.isValid()) {
        this.error = new Error(Header.INVALID_DATATYPE)
      }

      this.imageDimensions = this.fileFormat.getImageDimensions()
      if (!this.imageDimensions.isValid()) {
        this.error = new Error(Header.INVALID_IMAGE_DIMENSIONS)
      }


      this.voxelDimensions = this.fileFormat.getVoxelDimensions()
      if (!this.voxelDimensions.isValid()) {
        this.error = new Error(Header.INVALID_VOXEL_DIMENSIONS)
      }

      if (this.pad) {
        this.imageDimensions.padIsometric(this.voxelDimensions)
      }

      this.orientation = this.fileFormat.getOrientation()
      if (!this.orientation.isValid()) {
        this.orientation = new Orientation(Orientation.DEFAULT)
        this.orientationCertainty = Header.ORIENTATION_CERTAINTY_UNKNOWN
      } else {
        this.orientationCertainty = this.fileFormat.getOrientationCertainty()
      }

      this.orientation.createInfo(this.imageDimensions, this.voxelDimensions)

      this.origin = this.orientation.convertCoordinate(this.fileFormat.getOrigin(),
        new Coordinate(0, 0, 0))

      this.imageRange = this.fileFormat.getImageRange()
      if (!this.imageRange.isValid()) {
        this.error = new Error(Header.INVALID_IMAGE_RANGE)
      }

      this.imageDescription = this.fileFormat.getImageDescription()
    }

    this.onFinishedFileFormatRead()
  };

  getName() {
    return this.fileFormat.getName()
  };

  getSeriesLabels() {
    return this.fileFormat.getSeriesLabels()
  };

  readImageData(progressMeter, onFinishedImageRead) {
    this.fileFormat.readImageData(progressMeter, onFinishedImageRead)
  };

  hasError() {
    return (this.error !== null)
  };

  getBestTransform() {
    return this.fileFormat.getBestTransform()
  };

  getBestTransformOrigin() {
    return this.fileFormat.getBestTransformOrigin()
  };

  toString() {
    return this.fileFormat.toString()
  }
}

