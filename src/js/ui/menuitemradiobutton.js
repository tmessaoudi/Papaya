
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_HOVERING_CSS, PAPAYA_MENU_COLORTABLE_CSS, PAPAYA_MENU_UNSELECTABLE */

"use strict";


import $ from "../../../lib/jquery"

import * as constant from "../constants"
import { ObjectUtils } from "../utilities"


export class MenuItemRadioButton {
  /*** Constructor ***/
  constructor(viewer, label, action, callback, dataSource,
    method, modifier) {
    this.viewer = viewer
    this.label = label

    this.modifier = ""
    if ((modifier !== undefined) && (modifier !== null)) {
      this.modifier = "-" + modifier
    }

    this.methodParam =
      this.action = action + this.modifier
    this.method = method
    this.id = this.action.replace(/ /g, "_").replace(/\(/g, "").replace(/\)/g, "") +
      this.viewer.container.containerIndex
    this.callback = callback
    this.dataSource = dataSource
  };


  /*** Prototype Methods ***/

  buildHTML(parentId) {
    var selected, checked, html, thisHtml

    selected = this.dataSource[this.method](this.label)
    checked = ""

    if (selected) {
      checked = "checked='checked'"
    }

    html = "<li id='" + this.id + "'><input type='radio' class='" + constant.PAPAYA_MENU_COLORTABLE_CSS + "' name='" +
      constant.PAPAYA_MENU_COLORTABLE_CSS + "' id='" + this.id + "' value='" + this.id + "' " + checked + "><span class='" +
      constant.PAPAYA_MENU_UNSELECTABLE + "'>&nbsp;" + this.label + "</span></li>"
    $("#" + parentId).append(html)
    thisHtml = $("#" + this.id)
    thisHtml.click(ObjectUtils.bind(this, this.doAction))
    thisHtml.hover(function () { $(this).toggleClass(constant.PAPAYA_MENU_HOVERING_CSS) })
  };



  doAction() {
    $("." + constant.PAPAYA_MENU_COLORTABLE_CSS).removeAttr('checked')
    $("#" + this.id + " > input")[0].checked = true
    this.callback(this.action, null, true)
  };
}
