
/*jslint browser: true, node: true */
/*global $, PAPAYA_DIALOG_CSS, PAPAYA_DIALOG_CONTENT_CSS, PAPAYA_DIALOG_CONTENT_LABEL_CSS, PAPAYA_DIALOG_BACKGROUND,
 PAPAYA_DIALOG_CONTENT_CONTROL_CSS, PAPAYA_DIALOG_TITLE_CSS, PAPAYA_DIALOG_STOPSCROLL, PAPAYA_DIALOG_BUTTON_CSS,
 PAPAYA_DIALOG_CONTENT_NOWRAP_CSS, PAPAYA_DIALOG_CONTENT_HELP */

"use strict"

import $ from "../../../lib/jquery"

import * as constant from "../constants"
import { ObjectUtils, StringUtils } from "../utilities"

export class Dialog {


  /*** Constructor ***/
  constructor(container, title, content, dataSource, callback, callbackOk, modifier,
    wrap) {
    this.container = container
    this.viewer = container.viewer
    this.title = title
    this.modifier = ""
    if (!StringUtils.isStringBlank(modifier)) {
      this.modifier = modifier
    }
    this.id = this.title.replace(/ /g, "_")
    this.content = content
    this.dataSource = dataSource
    this.callback = callback
    this.callbackOk = callbackOk
    this.doWrap = wrap
    this.scrollBehavior1 = null
    this.scrollBehavior2 = null
  };


  /*** Static Methods ***/

  static showModalDialog(dialog, viewer, dialogHtml) {
    var viewerWidth, viewerHeight, dialogWidth, dialogHeight, left, top

    var docElem = document.documentElement
    var scrollTop = window.pageYOffset || docElem.scrollTop

    viewerWidth = $(window).outerWidth()
    viewerHeight = $(window).outerHeight()

    dialogWidth = $(dialogHtml).outerWidth()
    dialogHeight = $(dialogHtml).outerHeight()

    left = (viewerWidth / 2) - (dialogWidth / 2) + "px"
    top = scrollTop + (viewerHeight / 2) - (dialogHeight / 2) + "px"

    $(dialogHtml).css({
      position: 'absolute',
      zIndex: 100,
      left: left,
      top: top
    })

    viewer.removeScroll()

    $(dialogHtml).hide().fadeIn(200)
  };


  /*** Prototype Methods ***/

  showDialog() {
    var ctr, ctrOpt, html, val, itemsHtml, thisHtml, thisHtmlId, disabled, bodyHtml

    thisHtmlId = "#" + this.id
    thisHtml = $(thisHtmlId)
    thisHtml.remove()

    bodyHtml = $("body")

    html = "<div id='" + this.id + "' class='" + constant.PAPAYA_DIALOG_CSS + "'><span class='" +
      constant.PAPAYA_DIALOG_TITLE_CSS + "'>" + this.title + "</span>"

    if (this.content) {
      html += "<div class='" + constant.PAPAYA_DIALOG_CONTENT_CSS + "'><table>"

      for (ctr = 0;ctr < this.content.items.length;ctr += 1) {
        if (this.content.items[ctr].spacer) {
          html += "<tr><td class='" + constant.PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>&nbsp;</td><td class='" +
            constant.PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "'>&nbsp;</td></tr>"
        } else if (this.content.items[ctr].readonly) {
          html += "<tr><td class='" + constant.PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>" + this.content.items[ctr].label +
            "</td><td class='" + constant.PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "' id='" + this.content.items[ctr].field +
            "'></td></tr>"
        } else {
          if (this.content.items[ctr].disabled && (ObjectUtils.bind(this.container,
            ObjectUtils.dereferenceIn(this, this.content.items[ctr].disabled)))() === true) {
            disabled = "disabled='disabled'"
          } else {
            disabled = ""
          }

          html += "<tr><td class='" + constant.PAPAYA_DIALOG_CONTENT_LABEL_CSS + "'>" + this.content.items[ctr].label +
            "</td><td class='" + constant.PAPAYA_DIALOG_CONTENT_CONTROL_CSS + "'><select " + disabled +
            " id='" + this.content.items[ctr].field + "'>"
          for (ctrOpt = 0;ctrOpt < this.content.items[ctr].options.length;ctrOpt += 1) {
            html += "<option value='" + this.content.items[ctr].options[ctrOpt] + "'>" +
              StringUtils.truncateMiddleString(this.content.items[ctr].options[ctrOpt].toString(), 40) + "</option>"
          }

          html += "</select></td></tr>"

          if (this.content.items[ctr].help) {
            html += "<tr><td colspan='2' class='" + constant.PAPAYA_DIALOG_CONTENT_HELP + "'>" + this.content.items[ctr].help + "</td></tr>"
          }
        }
      }

      html += "</table></div>"
    }

    html += "<div class='" + constant.PAPAYA_DIALOG_BUTTON_CSS + "'><button type='button' id='" + this.id + "-Ok" +
      "'>Ok</button></div></div>"

    bodyHtml.append('<div class="' + constant.PAPAYA_DIALOG_BACKGROUND + '"></div>')
    bodyHtml.append(html)

    for (ctr = 0;ctr < this.content.items.length;ctr += 1) {
      if (this.content.items[ctr].readonly) {
        val = this.dataSource[this.content.items[ctr].field](this.modifier)
        if (val !== null) {
          $("#" + this.content.items[ctr].field).html(val)
        } else {
          $("#" + this.content.items[ctr].field).parent().remove()
        }
      } else if (!this.content.items[ctr].spacer) {
        itemsHtml = $("#" + this.content.items[ctr].field)
        itemsHtml.val(this.dataSource[this.content.items[ctr].field])
        itemsHtml.change(ObjectUtils.bind(this, this.doAction, [this.content.items[ctr].field]))
      }
    }

    if (!this.doWrap) {
      $("." + constant.PAPAYA_DIALOG_CONTENT_CSS).addClass(constant.PAPAYA_DIALOG_CONTENT_NOWRAP_CSS)
    }

    $("#" + this.id + "-Ok").click(ObjectUtils.bind(this, this.doOk))

    thisHtml = $(thisHtmlId)
    bodyHtml.addClass(constant.PAPAYA_DIALOG_STOPSCROLL)
    Dialog.showModalDialog(this, this.viewer, thisHtml[0])
  };



  doOk() {
    var modalDialogHtml, modelDialogBackgroundHtml

    modalDialogHtml = $("." + constant.PAPAYA_DIALOG_CSS)
    modelDialogBackgroundHtml = $("." + constant.PAPAYA_DIALOG_BACKGROUND)

    modalDialogHtml.hide(100)
    modelDialogBackgroundHtml.hide(100)

    modalDialogHtml.remove()
    modelDialogBackgroundHtml.remove()

    window.onmousewheel = this.scrollBehavior1
    document.onmousewheel = this.scrollBehavior2

    if (this.callbackOk) {
      this.callbackOk()
    }

    $("body").removeClass(constant.PAPAYA_DIALOG_STOPSCROLL)
    this.container.viewer.addScroll()
  };



  doAction(action) {
    this.callback(action, $("#" + action).val())
  };

}
