
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_FILECHOOSER, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_HOVERING_CSS */

"use strict"

import $ from "../../../lib/jquery"

import * as constant from "../constants"
import { ObjectUtils } from "../utilities"


export class MenuItemFileChooser {

  /*** Constructor ***/
  constructor(viewer, label, action, callback, folder, modifier) {
    this.viewer = viewer
    this.label = label

    this.modifier = ""
    if ((modifier !== undefined) && (modifier !== null)) {
      this.modifier = "-" + modifier
    }

    this.action = action + this.modifier
    this.id = this.action.replace(/ /g, "_") + this.viewer.container.containerIndex
    this.fileChooserId = "fileChooser" + this.label.replace(/ /g, "_").replace(/\./g, "") + this.viewer.container.containerIndex + (folder ? "folder" : "")
    this.callback = callback
    this.folder = folder
  };


  /*** Prototype Methods ***/

  buildHTML(parentId) {
    var filechooser, html

    filechooser = this

    html = "<li id='" + this.id + "'><span class='" + constant.PAPAYA_MENU_UNSELECTABLE + "'><label class='" +
      constant.PAPAYA_MENU_FILECHOOSER + "' for='" + this.fileChooserId + "'>" + this.label

    if (this.folder) {
      html += "</label><input type='file' id='" + this.fileChooserId +
        "' multiple='multiple' webkitdirectory directory name='files' /></span></li>"
    } else {
      html += "</label><input type='file' id='" + this.fileChooserId +
        "' multiple='multiple' name='files' /></span></li>"
    }

    $("#" + parentId).append(html)

    $("#" + this.fileChooserId)[0].onchange = ObjectUtils.bind(filechooser, function () {
      filechooser.callback(filechooser.action, document.getElementById(filechooser.fileChooserId).files)
    })

    $("#" + this.id).hover(function () { $(this).toggleClass(constant.PAPAYA_MENU_HOVERING_CSS) })
  };

}
