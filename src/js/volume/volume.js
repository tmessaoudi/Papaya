
/*jslint browser: true, node: true */
/*global GUNZIP_MAGIC_COOKIE1, GUNZIP_MAGIC_COOKIE2, Base64Binary, pako, numeric */

"use strict"

import $ from "../../../lib/jquery"

import { Header, ImageData, Transform } from "."
import { Coordinate } from "../core"
import { ArrayUtils, ObjectUtils, PlatformUtils } from "../utilities"
import { HeaderNIFTI } from "./nifti/header-nifti"

export class Volume {

  /*** Constructor ***/
  constructor(progressMeter, dialogHandler, params) {
    this.progressMeter = progressMeter
    this.dialogHandler = dialogHandler
    this.files = []
    this.rawData = []
    this.fileLength = 0
    this.urls = null
    this.fileName = null
    this.compressed = false
    this.transform = null
    this.numTimepoints = 0
    this.onFinishedRead = null
    this.error = null
    this.transform = null
    this.isLoaded = false
    this.numTimepoints = 1
    this.loaded = false
    this.params = params

    this.header = new Header((this.params !== undefined) && this.params.padAllImages)
    this.imageData = new ImageData((this.params !== undefined) && this.params.padAllImages)
  };


  /*** Static Pseudo-constants ***/

  static PROGRESS_LABEL_LOADING = "Loading";


  /*** Prototype Methods ***/

  fileIsCompressed(filename, data) {
    var buf, magicCookie1, magicCookie2

    if (filename && filename.indexOf(".gz") !== -1) {
      return true
    }

    if (data) {
      buf = new DataView(data)

      magicCookie1 = buf.getUint8(0)
      magicCookie2 = buf.getUint8(1)

      if (magicCookie1 === GUNZIP_MAGIC_COOKIE1) {
        return true
      }

      if (magicCookie2 === GUNZIP_MAGIC_COOKIE2) {
        return true
      }
    }

    return false
  };



  readFiles(files, callback) {
    this.files = files
    this.fileName = files[0].name
    this.onFinishedRead = callback
    this.compressed = this.fileIsCompressed(this.fileName)
    this.fileLength = this.files[0].size
    this.readNextFile(this, 0)
  };



  readNextFile(vol, index) {
    var blob

    if (index < this.files.length) {
      blob = PlatformUtils.makeSlice(this.files[index], 0, this.files[index].size)

      try {
        var reader = new FileReader()

        reader.onloadend = ObjectUtils.bind(vol, function (evt) {
          if (evt.target.readyState === FileReader.DONE) {
            vol.rawData[index] = evt.target.result
            setTimeout(function () { vol.readNextFile(vol, index + 1) }, 0)
          }
        })

        reader.onerror = ObjectUtils.bind(vol, function (evt) {
          vol.error = new Error("There was a problem reading that file:\n\n" + evt.getMessage())
          vol.finishedLoad()
        })

        reader.readAsArrayBuffer(blob)
      } catch (err) {
        vol.error = new Error("There was a problem reading that file:\n\n" + err.message)
        vol.finishedLoad()
      }
    } else {
      setTimeout(function () { vol.decompress(vol) }, 0)
    }
  };



  readURLs(urls, callback) {
    var self = this
    this.urls = urls
    this.fileName = urls[0].substr(urls[0].lastIndexOf("/") + 1, urls[0].length)
    this.onFinishedRead = callback
    this.compressed = this.fileIsCompressed(this.fileName)

    if (this.fileName.indexOf("?") !== -1) {
      this.fileName = this.fileName.substr(0, this.fileName.indexOf("?"))
    }

    this.rawData = []
    this.loadedFileCount = 0
    this.readEachURL(this)
      .done(function () {
        // recieves `arguments` which are results off xhr requests
        setTimeout(function () { self.decompress(self) }, 0)
      })
      .fail(function (vol, err, xhr) {

        var message = err.message || ''
        // if error came from ajax request
        if (typeof xhr !== "undefined") {
          message = "Response status = " + xhr.status
        }

        vol.error = new Error("There was a problem reading that file (" +
          vol.fileName + "):\n\n" + message)
        vol.finishedLoad()
      })
  };



  loadURL(url, vol, index) {
    var supported, deferredLoading, xhr, progPerc, progressText

    deferredLoading = jQuery.Deferred()

    supported = typeof new XMLHttpRequest().responseType === 'string'
    if (supported) {
      xhr = new XMLHttpRequest()
      xhr.open('GET', url, true)
      xhr.responseType = 'arraybuffer'

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            vol.fileLength = vol.rawData.byteLength
            deferredLoading.resolve(xhr.response)
          } else {
            deferredLoading.reject(vol, false, xhr)
          }
        }
      }

      xhr.onprogress = function (evt) {
        if (evt.lengthComputable) {
          deferredLoading.notify(evt.loaded, evt.total)
        }
      }

      xhr.send(null)
    } else {
      vol.error = new Error("There was a problem reading that file (" + vol.fileName +
        "):\n\nResponse type is not supported.")
      vol.finishedLoad()
    }

    var promise = deferredLoading
      .promise()
      .done(function (file) {
        vol.loadedFileCount++
        vol.rawData[index] = file
      })
      .fail(function (vol, err, xhr) {
        console.error(vol, err, xhr)
      })
      .progress(function (loaded, total) {
        progPerc = parseInt(100 * (vol.loadedFileCount) / vol.urls.length, 10)
        progressText = Volume.PROGRESS_LABEL_LOADING +
          ' image ' + (vol.loadedFileCount + 1) + ' of ' + vol.urls.length + ' (' + progPerc + '%)'
        vol.progressMeter.drawProgress(loaded / total, progressText)
      })

    return promise
  };


  readEachURL(vol) {
    var deferredLoads = []

    for (var i = 0;i < vol.urls.length;i++) {
      var getFileDeferred = vol.loadURL(vol.urls[i], vol, i)
      deferredLoads.push(getFileDeferred)
    }

    return $.when.apply($, deferredLoads)
  };


  readBinaryData(dataRefs, callback) {
    var vol = null

    try {

      if (dataRefs[0] instanceof ArrayBuffer) {
        this.fileName = "unknown"
      } else {
        this.fileName = dataRefs[0]
      }

      this.onFinishedRead = callback
      vol = this
      this.fileLength = 0
      vol.readNextBinaryData(vol, 0, dataRefs)
    } catch (err) {
      if (vol) {
        vol.error = new Error("There was a problem reading that file:\n\n" + err.message)
        vol.finishedLoad()
      }
    }
  };

  readNextBinaryData(vol, index, dataRefs) {
    if (index < dataRefs.length) {
      try {
        if (dataRefs[index] instanceof ArrayBuffer) {
          vol.rawData[index] = dataRefs[index]
        } else {
          vol.rawData[index] = ObjectUtils.dereference(dataRefs[index])
        }

        vol.compressed = this.fileIsCompressed(this.fileName, vol.rawData[index])
        setTimeout(function () { vol.readNextBinaryData(vol, index + 1, dataRefs) }, 0)
      } catch (err) {
        if (vol) {
          vol.error = new Error("There was a problem reading that file:\n\n" + err.message)
          vol.finishedLoad()
        }
      }
    } else {
      vol.decompress(vol)
    }
  };

  readEncodedData(dataRefs, callback) {
    var vol = null

    try {
      this.fileName = dataRefs[0]
      this.onFinishedRead = callback
      vol = this
      this.fileLength = 0
      vol.readNextEncodedData(vol, 0, dataRefs)
    } catch (err) {
      if (vol) {
        vol.error = new Error("There was a problem reading that file:\n\n" + err.message)
        vol.finishedLoad()
      }
    }
  };



  readNextEncodedData(vol, index, dataRefs) {
    if (index < dataRefs.length) {
      try {
        var deref = ObjectUtils.dereference(dataRefs[index])

        if (deref) {
          vol.rawData[index] = Base64Binary.decodeArrayBuffer(deref)
        } else {
          this.fileName = "unknown"
          vol.rawData[index] = Base64Binary.decodeArrayBuffer(dataRefs[index])
        }

        vol.compressed = this.fileIsCompressed(this.fileName, vol.rawData[index])
        setTimeout(function () { vol.readNextEncodedData(vol, index + 1, dataRefs) }, 0)
      } catch (err) {
        if (vol) {
          vol.error = new Error("There was a problem reading that file:\n\n" + err.message)
          vol.finishedLoad()
        }
      }
    } else {
      vol.decompress(vol)
    }
  };



  getVoxelAtIndexNative(ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.transform.getVoxelAtIndexNative(ctrX, ctrY, ctrZ, 0, useNN)
  };



  getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN) {
    return this.transform.getVoxelAtIndex(ctrX, ctrY, ctrZ, timepoint, useNN)
  };



  getVoxelAtCoordinate(xLoc, yLoc, zLoc, timepoint, useNN) {
    return this.transform.getVoxelAtCoordinate(xLoc, yLoc, zLoc, timepoint, useNN)
  };



  getVoxelAtMM(xLoc, yLoc, zLoc, timepoint, useNN) {
    return this.transform.getVoxelAtMM(xLoc, yLoc, zLoc, timepoint, useNN)
  };



  hasError() {
    return (this.error !== null)
  };



  getXDim() {
    return this.header.imageDimensions.xDim
  };



  getYDim() {
    return this.header.imageDimensions.yDim
  };



  getZDim() {
    return this.header.imageDimensions.zDim
  };



  getXSize() {
    return this.header.voxelDimensions.xSize
  };



  getYSize() {
    return this.header.voxelDimensions.ySize
  };



  getZSize() {
    return this.header.voxelDimensions.zSize
  };



  decompress(vol) {
    vol.compressed = vol.compressed || vol.fileIsCompressed(vol.fileName, vol.rawData[0])

    if (vol.compressed) {
      try {
        pako.inflate(new Uint8Array(vol.rawData[0]), null, this.progressMeter,
          function (data) { vol.finishedDecompress(vol, data.buffer) })
      } catch (err) {
        console.log(err)
      }
    } else {
      setTimeout(function () { vol.finishedReadData(vol) }, 0)
    }
  };



  finishedDecompress(vol, data) {
    vol.rawData[0] = data
    setTimeout(function () { vol.finishedReadData(vol) }, 0)
  };



  finishedReadData(vol) {
    vol.rawData = ArrayUtils.cleanArray(vol.rawData)

    vol.header.readHeaderData(vol.fileName, vol.rawData, this.progressMeter, this.dialogHandler,
      ObjectUtils.bind(this, this.finishedReadHeaderData))
  };



  finishedReadHeaderData() {
    this.rawData = null

    if (this.header.hasError()) {
      this.error = this.header.error
      console.error(this.error.stack)
      this.onFinishedRead(this)
      return
    }

    this.header.imageType.swapped = (this.header.imageType.littleEndian !== PlatformUtils.isPlatformLittleEndian())

    var name = this.header.getName()

    if (name) {
      this.fileName = this.header.getName()
    }

    this.header.readImageData(this.progressMeter, ObjectUtils.bind(this, this.finishedReadImageData))
  };



  finishedReadImageData(imageData) {
    this.imageData.readFileData(this.header, imageData, ObjectUtils.bind(this, this.finishedLoad))
  };



  finishedLoad() {
    if (!this.loaded) {
      this.loaded = true
      if (this.onFinishedRead) {
        if (!this.hasError()) {
          this.transform = new Transform(Transform.IDENTITY.clone(), this)
          this.numTimepoints = this.header.imageDimensions.timepoints || 1
          this.applyBestTransform()
        } else {
          console.log(this.error)
        }

        this.isLoaded = true
        this.rawData = null
        this.onFinishedRead(this)
      }
    }
  };



  setOrigin(coord) {
    var coordNew = this.header.orientation.convertCoordinate(coord, new Coordinate(0, 0, 0))
    this.header.origin.setCoordinate(coordNew.x, coordNew.y, coordNew.z)
  };



  getOrigin() {
    return this.header.orientation.convertCoordinate(this.header.origin, new Coordinate(0, 0, 0))
  };



  applyBestTransform() {
    var bestXform = this.header.getBestTransform()

    if (bestXform !== null) {
      this.transform.worldMatNifti = numeric.inv(bestXform)
      this.setOrigin(this.header.getBestTransformOrigin())
      this.transform.updateWorldMat()
    }
  };



  isWorldSpaceOnly() {
    /*jslint bitwise: true */

    var nifti, foundDataOrderTransform = false

    if (this.header.fileFormat instanceof HeaderNIFTI) {
      nifti = this.header.fileFormat

      if (nifti.nifti.qform_code > 0) {
        foundDataOrderTransform |= !nifti.qFormHasRotations()
      }

      if (nifti.nifti.sform_code > 0) {
        foundDataOrderTransform |= !nifti.sFormHasRotations()
      }

      return !foundDataOrderTransform
    }

    return false
  };



  getSeriesLabels() {
    return this.header.getSeriesLabels()
  };

}

