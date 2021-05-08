
/*jslint browser: true, node: true */
/*global */

"use strict"

import { StringUtils } from "../utilities"

export class ImageDescription {
  /*** Constructor ***/
  constructor(notes) {
    this.notes = "(none)"

    if (!StringUtils.isStringBlank(notes)) {
      this.notes = notes
    }
  };

}
