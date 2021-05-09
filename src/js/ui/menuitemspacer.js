
/*jslint browser: true, node: true */
/*global $, PAPAYA_MENU_UNSELECTABLE, PAPAYA_MENU_SPACER_CSS */

"use strict"

import $ from "../../../lib/jquery"
import * as constant from "../constants"


export class MenuItemSpacer {
  /*** Constructor ***/
  constructor() { };


  /*** Prototype Methods ***/

  buildHTML(parentId) {
    var html

    html = "<div class='" + constant.PAPAYA_MENU_SPACER_CSS + " " + constant.PAPAYA_MENU_UNSELECTABLE + "'></div>"
    $("#" + parentId).append(html)
  };


}

