
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_HOVERING_CSS */

"use strict"

import $ from "../../../lib/jquery"

import * as constant from "../constants"
import { ObjectUtils, PlatformUtils, StringUtils } from "../utilities"

export class MenuItem {
  /*** Constructor ***/
  constructor(viewer, label, action, callback, dataSource, method, modifier) {
    this.viewer = viewer

    this.modifier = ""
    if (!StringUtils.isStringBlank(modifier)) {
      this.modifier = "-" + modifier
    }

    this.dataSource = dataSource
    this.method = method

    if (this.dataSource && this.method) {
      this.label = this.dataSource[this.method]()
    } else {
      this.label = label
    }

    this.action = action + this.modifier
    this.id = this.action.replace(/ /g, "_") + this.viewer.container.containerIndex
    this.callback = callback
    this.menu = null
    this.isContext = false
  };


  /*** Prototype Methods ***/

  buildHTML(parentId) {
    var html, thisHtml, label

    if (this.dataSource && this.method) {
      label = this.dataSource[this.method]()
    } else {
      label = this.label
    }

    html = "<li id='" + this.id + "'><span class='" + constant.PAPAYA_MENU_UNSELECTABLE + "'>" + label + "</span>" + (this.menu ? "<span style='float:right'>&nbsp;&#x25B6;</span>" : "") + "</li>"
    $("#" + parentId).append(html)

    thisHtml = $("#" + this.id)

    if (this.viewer.container.contextManager && PlatformUtils.smallScreen) {
      thisHtml[0].style.width = (this.viewer.viewerDim - 10) + 'px'
      thisHtml[0].style.fontSize = 18 + 'px'
    }

    thisHtml.click(ObjectUtils.bind(this,
      function (e) {
        this.doAction(this.isContext && e.shiftKey)
      }))

    thisHtml.hover(function () { $(this).toggleClass(constant.PAPAYA_MENU_HOVERING_CSS) })
  };



  doAction(keepOpen) {
    if (!keepOpen && !this.menu) {
      this.viewer.showingContextMenu = false
    }

    this.callback(this.action, null, keepOpen)
  };
}
