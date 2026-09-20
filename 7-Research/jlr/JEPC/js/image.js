/*******************************************************************************
 * File Name            : image.js
 * Author               : UALIT DEV
 * Date of Creation     : 27 July 2012.
 * Description          : Script for full size image popup.
 * Version Number       : 1.0
 * Modification History :
 Date        Version  Who             Description of change
2012-07-30   1.0      UALIT DEV	      Initial.
*******************************************************************************/


function showImage() {
	var image = window.location.search.substring(1);
	
	var strHtml = "<table><tr><td>\r\n";
	strHtml = strHtml + "<div style=\"float:left\" onmouseover=\"zoom_on(event,800,740,'../illustrations/png/"+image+".png');\"\r\n";
	strHtml = strHtml + "onmousemove=\"zoom_move(event);\" onmouseout=\"zoom_off();\">\r\n";
	strHtml = strHtml + "<img src=\"../illustrations/png/"+image+".png\" width=\"800\" height=\"740\" alt=\"zoom picture title\" style=\"padding:0;margin:0;border:0\" />\r\n";
	strHtml = strHtml + "</div>\r\n";
	strHtml = strHtml + "<div style=\"clear:both;\"></div>\r\n";
	strHtml = strHtml + "</td></tr></table>\r\n";
	document.getElementById("imageSlot").innerHTML = strHtml;
}




