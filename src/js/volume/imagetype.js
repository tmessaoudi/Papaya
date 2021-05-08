
/*jslint browser: true, node: true */
/*global */

"use strict"

export class ImageType {
  /*** Constructor ***/
  constructor(datatype, numBytes, littleEndian, compressed) {
    this.datatype = datatype
    this.numBytes = numBytes
    this.littleEndian = littleEndian
    this.swapped = false
    this.compressed = compressed
    this.rgbBySample = false
  };


  /*** Static Pseudo-constants ***/

  static DATATYPE_UNKNOWN = 0;
  static DATATYPE_INTEGER_SIGNED = 1;
  static DATATYPE_INTEGER_UNSIGNED = 2;
  static DATATYPE_FLOAT = 3;
  static DATATYPE_RGB = 4;
  static MAX_SUPPORTED_BYTES_FLOAT = 8;
  static MAX_SUPPORTED_BYTES_INTEGER = 4;


  /*** Prototype Methods ***/

  isValid() {
    return (
      (this.datatype <= ImageType.DATATYPE_RGB) &&
      (this.datatype > ImageType.DATATYPE_UNKNOWN) &&
      (this.numBytes > 0) &&
      (((this.datatype === ImageType.DATATYPE_FLOAT) && (this.numBytes <= ImageType.MAX_SUPPORTED_BYTES_FLOAT)) ||
        ((this.datatype !== ImageType.DATATYPE_FLOAT) && (this.numBytes <= ImageType.MAX_SUPPORTED_BYTES_INTEGER)))
    )
  };



  getTypeDescription() {
    if (this.datatype === ImageType.DATATYPE_INTEGER_SIGNED) {
      return "Signed Integer"
    }

    if (this.datatype === ImageType.DATATYPE_INTEGER_UNSIGNED) {
      return "Unsigned Integer"
    }

    if (this.datatype === ImageType.DATATYPE_FLOAT) {
      return "Float"
    }

    if (this.datatype === ImageType.DATATYPE_RGB) {
      return "RGB"
    }

    return "Unknown"
  };



  getOrderDescription() {
    if (this.numBytes > 1) {
      if (this.littleEndian) {
        return "Little Endian"
      }

      return "Big Endian"
    }

    return null
  };

}
