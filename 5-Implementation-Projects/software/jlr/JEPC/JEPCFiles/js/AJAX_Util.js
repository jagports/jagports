/*******************************************************************************
 * File Name			: AJAX_Util.js
 * Author				: Keane India Pvt Ltd.,
 * Date of Creation		: 14 February 2008.
 * Description			: AJAX utility functions
 * Version Number		: 1.0
 * Modification History	:
   Date			Version		Who				Description of change
   2008-02-14	1.00		Keane India		Initial - created methods for 
   											building the "Shopping Cart" screen. 
   2009-06-14	1.01		Robin Birchmore	Remedy 1924123 - pibs folder is lowercase.
   2009-10-28	1.02		Kevin Compton	Remedy 2052438 - Remove displaying of irrelevant pages on Drop Down Navigation.
   2011-11-25	1.03		Robin Birchmore	Insert the word 'and' between multiple parts in a multiple supersession to maker it clearer
   											all parts in the multi are required.
   2012-10-12	1.04		Robin Birchmore	RFC1078 - Display price with commas.
*******************************************************************************/



// It is assumed that AJAX is supported in the web browser being used
var httpRequestSupported = true;
var shoppingCartDisplay=true;
var atmNo;
var obj;
var eV;
var attSum;
var cntX;
var cntY;
var topLevelArray;
var expandPartNo;
var supersessionType;
var ssApplicationId;

///////////////////////////////////////////////////////////
// Returns true if AJAX requests are supported by the 
// clients web browser.  Else false.
// On a true result, the object returned is an 
// Active-X XMLHTTP object.
//
// In Internet Explorer, you create an http object using 
// new ActiveXObject("Msxml2.XMLHTTP") or 
// new ActiveXObject("Microsoft.XMLHTTP") 
// depending on the version of MSXML installed. 
//
// In Mozilla and Safari (Gecko engine) you use 
// new XMLHttpRequest()
//
// IceBrowser is not supported in this code
//
// @return boolean
///////////////////////////////////////////////////////////
function isHttpRequestSupported() {

   try { 
      httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
   }
   catch(e) {
      try {
         httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
      }    
      catch(e) {
         httpRequestSupported = false;
      }
   }

   return httpRequest;

} 


///////////////////////////////////////////////////////////
// Makes a HTTP request back to the server given a URL.
//
// callbackFunction is a string value containing the name
// of a method to call when the HTTP request is completed.
// The resulting output of the HTTP request is passed in
// as a variable to the callback function.  The callback
// function formats the response to be displayed in 
// a web browser.
//
// if returnData is specified, the response is retruned
// in xml
//
// @param url
// @param callbackFunction
// @param returnData
///////////////////////////////////////////////////////////
function makeHttpRequest(url, callbackFunction, returnData) {

	var httpRequest = false; 

	// Exit if this function is not supported
	if (!httpRequestSupported) {
		return;  
	}
	
	// check if supported
	httpRequest = isHttpRequestSupported();
	
	if (!httpRequest) { 
		httpRequestSupported = false;
		return false; 
	} 

	// Map the response to the callback function
	httpRequest.onreadystatechange = function() { 
		if (httpRequest.readyState == 4) {       
			if (httpRequest.status == 200) {
				if (returnData) {
					try {
						var firstChildData = httpRequest.responseXML.documentElement.firstChild.data;
					} catch (e) {
						// Ignore Exception
					}
					eval(callbackFunction + '(firstChildData)');
				} else { 
					if (callbackFunction == 'attSummaryCallBack') {
					    // replace double backslashes with a single one
						var oldResponseText = httpRequest.responseText;
						out = "\\\\u"; 
						add = "\\u"; 
						newResponseText = oldResponseText; 
						while (newResponseText.indexOf(out)>-1) {
							pos= newResponseText.indexOf(out);
							newResponseText = "" + newResponseText.substring(0, pos) + add + newResponseText.substring((pos + out.length), newResponseText.length);
						}
						eval(callbackFunction + '(newResponseText)'); 
					} else {
						eval(callbackFunction + '(httpRequest.responseText)'); 
					}
				busy=false;
				}
			} else { 
			    try {
                   if (returnData) {
                      var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                      xmlDoc.async = false;
                      xmlDoc.load(url);
                      try {
                      	var firstChildData = xmlDoc.documentElement.firstChild.data;
                      } catch (e) {
                      	// Ignore Exception
                      }
                      eval(callbackFunction + '(firstChildData)');                   
                   }
                   else {
		   		      eval(callbackFunction + '(httpRequest.responseText)'); 
			       }
			    }
			    catch (err) {
		   		   eval(callbackFunction + '("")'); 
		   		}
			} 
		} 
	} 

    try {
        httpRequest.open('POST', url, true); 
        httpRequest.send(null); 
    }
    catch (e) {
//        alert("makeHTTPRequest: " + e.description);
    }

} // end function

function makeSynchronousHttpRequest(url, callbackFunction, returnData) {
	var httpRequest = false; 
	
	// Exit if this function is not supported
	if (!httpRequestSupported) {
		return;  
	}
	
	// check if supported
	httpRequest = isHttpRequestSupported();
	
	if (!httpRequest) { 
		httpRequestSupported = false;
		return false; 
	} 
  	
	// Map the response to the callback function
	httpRequest.onreadystatechange = function() { 
		if (httpRequest.readyState == 4) {       
			if (httpRequest.status == 200) { 
				if (returnData) { 
					eval(callbackFunction + '(httpRequest.responseXML.documentElement.firstChild.data)');
				} else { 
					if ((callbackFunction == 'superSessionCallBack') || (callbackFunction == 'ssPartDetailsCallBack')) {
					    // replace double backslashes with a single one
						var oldResponseText = httpRequest.responseText;
						out = "\\\\u"; 
						add = "\\u"; 
						newResponseText = oldResponseText; 
						while (newResponseText.indexOf(out)>-1) {
						pos= newResponseText.indexOf(out);
						newResponseText = "" + newResponseText.substring(0, pos) + add + newResponseText.substring((pos + out.length), newResponseText.length);
						}
						eval(callbackFunction + '(newResponseText)'); 
					} else {
						eval(callbackFunction + '(httpRequest.responseText)'); 
					}

					busy=false;
				} 
			} else { 
                if (returnData) {
                   var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                   xmlDoc.async = false;
                   xmlDoc.load(url);
                   if(callbackFunction=='scPriceCallBack') {
                   		try {
                   			eval(callbackFunction + '(xmlDoc.documentElement.firstChild.data)'); 
                   		}catch(e){}
                   	}else{
                   		eval(callbackFunction + '(xmlDoc.documentElement.firstChild.data)'); 
                   	}
				                   
                }
                else {
				   eval(callbackFunction + '(httpRequest.responseText)'); 
			    }
			} 
		} 
	} 

    try {
        httpRequest.open('POST', url, false); 
        httpRequest.send(null); 
    }
    catch (e) {
//        alert("makeHTTPRequest: " + e.description);
    }

} // end function

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
// *******************************************************
// Begin Part number specific JavaScript
// *******************************************************
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
var lastLetterCode = '';
var newLetterCode = '';
var partNumberArray = new Array();  	// Array of all category IDs on the page to store category discounts
var numInPartNumberArray = 0;
var MAX_RESULTS_TO_SHOW_AT_A_TIME = 10;
var skuTextBoxObject = null;

// After this # of characters, a search is done on the SKU.  We do this for performance reasons.
// We only do a search when this # of characters are typed in.  This becomes part of the cache key
var NUM_OF_CHARACTERS_TO_DO_SEARCH = 2; 

// Displays and hides the part number drop down menu
function toggleBox(szDivID, iState) // 1 visible, 0 hidden
{
	var obj = document.layers ? document.layers[szDivID] :
	document.getElementById ?  document.getElementById(szDivID).style :
	document.all[szDivID].style;
	obj.visibility = document.layers ? (iState ? "show" : "hide") : (iState ? "visible" : "hidden");
}

function parentToggleBox(szDivID, iState) // 1 visible, 0 hidden
{
	var obj = opener.document.layers ? opener.document.layers[szDivID] :
	opener.document.getElementById ?  opener.document.getElementById(szDivID).style :
	opener.document.all[szDivID].style;
	obj.visibility = opener.document.layers ? (iState ? "show" : "hide") : (iState ? "visible" : "hidden");
}

function shoppingCartPriceLookUp(client,modelId,categoryId,itemNo) {
	try {
		var url = "..\\prices\\pl_id_"+modelId+"\\"+parent.index_form.legacyCurrency.value+"\\Price_M"+modelId+"_C"+categoryId+"_I"+itemNo+"_"+parent.index_form.legacyCurrency.value+".xml";
		makeSynchronousHttpRequest(url, 'scPriceCallBack', true);
		if( (thisPartPrice==null) || (thisPartPrice.length==0) ) {
			//Part may be there as a result of a supersession
			var authObj = getLogonFileDetails(decryptData(unescape(logonId)).trim());
			ssPartDetailsLookUp(client+thisPartNumber,decryptData(unescape(logonId)).trim(),decryptData(unescape(authObj.logonPassword)).toLowerCase(),authObj.salesOrg,authObj.languageId,authObj.legacyCurrency,false)
		}
	}catch (vErr) {}
	
}

function scPriceCallBack(text) {
	if (text != '') {
	
		//convert text into array elements...
      var splitArray = text.split(']');
      for (i = 0; i < splitArray.length; i++) {
			var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
         elementValues = elementValues.replace('[','');
         var elementArray = elementValues.split(',');
         
         if (elementArray.length == 4) {
            elementArray[0] = removeSingleQuotes(elementArray[0]);
            elementArray[2] = removeSingleQuotes(elementArray[2]);  
            if(thisPartNumber==elementArray[0]) {
            	thisPartPrice = elementArray[1];
            	thisPartDiscountCode = elementArray[2];
            	thisPartSurcharge = elementArray[3];
            }
		 	}
		}                   
	}
	 
}


function readCSVValues(stringValue, arrayLength) {

   var splitValues = [];
   var showAlert = false;  

   var tmpValue  = stringValue.split(',');
   if (tmpValue.length == arrayLength) {
      splitValues = tmpValue;
   }
   else {

      var inString = false;
      var currentValue = "";
      var valueIndex = 0;
   
      splitValues[valueIndex] = "";
   
      for (var i = 0; i < stringValue.length; i++) {
   
         var controlChar = false;
   
         if (stringValue.substring(i,i+1) == ",") {
            if (inString == false) {
               controlChar = true;
            }
         }
      
//         if ((stringValue.substring(i,i+1) == "'") || (stringValue.substring(i,i+1) == "\"")) {
         if (stringValue.substring(i,i+1) == "'") {
            inString = (inString ? false : true);
         }
      
         if (controlChar == false) {
            splitValues[valueIndex] = splitValues[valueIndex] + stringValue.substring(i,i+1);
         }
         else {
            valueIndex++;
            splitValues[valueIndex] = "";
            controlChar = false;
            inString = false;
         }
      
      }
      
   }

   return splitValues;

}

// @param sInString	- string to strip whitespace from
function trimString(sInString) {
	sInString = sInString.replace( /^\s+/g, "" );// strip leading
	return sInString.replace( /\s+$/g, "" );// strip trailing
}

function isJSON(json) {
	firstCharcter=json.substring(0,1);
	if (firstCharcter == "{") {
		return true;
	} else {
		return false;
	}
}

function attSummaryCallBack(text) { 

	if (text != '') {

         var summaryStr = "<table id='attSummaryTbl' width=100%><tr><td>";
	
         //convert text into array elements...
         var splitArray = text.split(']');
         for (var i = 0; i < splitArray.length; i++) {
            var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
            elementValues = elementValues.replace('[','');
            var elementArray = readCSVValues(elementValues);
            for (var j = 0; j < elementArray.length; j++) {
               elementArray[j] = eval("unescape('" + removeSingleQuotes(elementArray[j]) + "')");
            }
            if ((elementArray.length > 0) && (elementArray[0].length > 0)) {
               for (var j = 0; j < elementArray.length; j++) {
                  for (var k = 0; k < j; k++) {
                     summaryStr = summaryStr + "&nbsp;&nbsp"
                  }
                  
                  for (var l = 0; l < elementArray[j].length; l++) {
                  	elementArray[j] = elementArray[j].replace('\\','');
                  }
                  summaryStr = summaryStr + elementArray[j] + "<br>";
               }
            }
         }
         
         summaryStr = summaryStr + "</td></tr></table>";

	   var targetObj = document.getElementById("attSummaryAjax");
	   targetObj.innerHTML = summaryStr;

       positionAttributeSummary(targetObj,cntX,cntY);        
	   toggleBox("attSummaryAjax",1);
    
       document.getElementById("sideArrow"+attSum).src = '..//images//leftArrow.gif';
    
       setTimeout("hideAttributeSummary("+attSum+")",5000);

	}
	else {
       alert(eval("CHECK_INTERNET" + getLanguageCode(languageId)));
	}
	
    document.body.style.cursor = '';
            
}

function hideAttributeSummary(applicationId) {
   try {
      document.getElementById("sideArrow"+applicationId).src = '..//images//rightArrow.gif';
      document.getElementById("attSummaryAjax").style.visibility = 'hidden';
   }
   catch (sumErr) {
   }
}


function removeSingleQuotes(quotedString) {
  var newString = '';
  
  try {
     if (quotedString.length > 2) {
          try {
             newString =  quotedString.substring(1,quotedString.length - 1);
          }
          catch (e) {    
             newString = quotedString;
          }
      }
  }
  catch (strErr) {
  }
  
  return newString;
}

function superSessionCallBack(text) { 
	var isJason = isJSON(text);
	if (isJason == false) {
		alert(HtmlDecode(eval("APPLICATION_ERROR" + getLanguageCode(languageId))));
		return;
	}

	var isMulti = false;
	var numMultiParts = 0;

	//see if a failure message has been returned.
	var jsonObj =  eval("("+text+")");
	var failure = eval('jsonObj.ReturnCode');

	if (failure == "FAILED") {
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          if (thejepcDrillDown.items[i].itemNo == atmNo) {
             for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
                if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
                   thejepcDrillDown.items[i].children[j].ssSelected = true;
                   thejepcDrillDown.items[i].children[j].ssPartNo = null;
                   thejepcDrillDown.items[i].children[j].ssDescription = '';
                }
             }
             break;
          }          
       }	
	   alert(eval("unescape('"+jsonObj.Message+"')"));
	   return false;
	}
	
	var      ssHtml = "<input type='hidden' name='selectedSSPart' value=''>\r\n";
	ssHtml = ssHtml + "<input type='hidden' name='selectedSSDesc' value=''>\r\n";
	ssHtml = ssHtml + "<input type='hidden' name='selectedSSQty' value=''>\r\n";
	
	

    var ssPartNumber = eval('jsonObj.PartNumber');
    var ssPartDesc = eval("unescape('" + jsonObj.PartDescription + "')");
       
    ssHtml = ssHtml + "<table class='popUpTable'>\r\n";
    ssHtml = ssHtml + "   <tr>\r\n";
    ssHtml = ssHtml + "      <td class='productsHighlight'>&nbsp;&nbsp;Supersession: "+ssPartNumber+" - "+ssPartDesc+"&nbsp;&nbsp;</td>\r\n";
    ssHtml = ssHtml + "   </tr>\r\n";
    
    var ssParts = eval('jsonObj.Supersessions');
    
    if (ssParts == null) {    
       ssParts = eval('jsonObj.MultipleSupersessions');
    }
    
    var ssIndent = 0;
    var hasConditional = 0;
    var maxIndent = 0;

    var ssCondition = eval('jsonObj.ConditionalSupersessions');
    var isConditional = (ssCondition != null);

    if (isConditional) {

       //conditional supersession
       var ssCondition = eval('jsonObj.ConditionalSupersessions');
       
       ssHtml = ssHtml + "<tr><td>&nbsp</td></tr><tr><td class='supersession'><font color=black>"+ssCondition+"</font></td></tr><tr><td>&nbsp</td></tr>";
       ssHtml = ssHtml + "<tr>\r\n";       
       ssHtml = ssHtml + "<td align='center'><input type='button' onclick='selectNoSupersession();' value='OK'></td>\r\n";
       ssHtml = ssHtml + "</tr></table>\r\n";    
       ssHtml = ssHtml + "</tr></table>\r\n";

       
    }  
    else {
    
       //work out lowest level of selection..
       for (var i = 0; i < ssParts.length; i++) {
          if (ssParts[i].SupersessionType == "SS1") {
             maxIndent++;
          }       
       }
    
       if (maxIndent == ssParts.length) {
          maxIndent--;
       }

       ssHtml = ssHtml + "<tr>\r\n"
       ssHtml = ssHtml + "   <td>\r\n"          
       ssHtml = ssHtml + "      <table class='popUpTable'>\r\n";
       ssHtml = ssHtml + "         <tr valign=middle>\r\n";
       ssHtml = ssHtml + "            <td>";

       for (var i = 0; i < ssParts.length; i++) {
          var allowSelection = false;
          
          var partQty = 1;
          try {
          	partQty = parseInt(ssParts[i].Quantity);
            if (isNaN(partQty)) {
            	partQty = 1;
            }
          }
          catch (qtyErr) {
          	partQty = 1;
          }
          
          //check for No Longer Available parts..
          if (ssParts[i].SupersessionType == "NA1") {
             ssParts[i].PartNumber = ssParts[i].SupersessionType;
             ssParts[i].PartDescription = eval("unescape('" + ssParts[i].SupersessionText + "')");
          }
          

          if (ssParts[i].SupersessionType == "CS1") {
             //conditional branching from single...
             ssHtml = ssHtml + "<tr>\r\n"
             ssHtml = ssHtml + "   <td>\r\n"          
             ssHtml = ssHtml + "      <table class='popUpTable'>\r\n";
             ssHtml = ssHtml + "         <tr>"
             for (j = 0; j < ssIndent; j++) {
                ssHtml = ssHtml + "<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>";
             }
             ssHtml = ssHtml + "<td class='supersession'>";          
             ssHtml = ssHtml + "<font color=black>"+ssParts[i].Condition+"</font></td></tr><tr><td>&nbsp</td></tr>";
             ssHtml = ssHtml + "<tr>\r\n";       
             for (j = 0; j < ssIndent; j++) {
                ssHtml = ssHtml + "<td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>";
             }
             ssHtml = ssHtml + "<td align='center'><input type='button' onclick='selectNoSupersession();' value='OK'></td>\r\n";
             ssHtml = ssHtml + "         </tr>\r\n";
             ssHtml = ssHtml + "      </table>\r\n";         
             hasConditional = 1;
          }
          else {
          	var cursymbol = (ssParts[i].PartPrice.trim()==""?"":setCurrencySymbol(ssParts[i].PartCurrency));
          	
             //single or multiple originating from a single...  
             ssHtml = ssHtml + "<tr>\r\n"
             ssHtml = ssHtml + "   <td>\r\n"          
             ssHtml = ssHtml + "      <table class='popUpTable'>\r\n";
             ssHtml = ssHtml + "         <tr valign=middle>\r\n";
             ssHtml = ssHtml + "            <td>";
            
             for (j = 0; j < ssIndent; j++) {
                ssHtml = ssHtml + "   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
             }
          
             if (ssParts[i].SupersessionType != "NA1") {
                allowSelection = (ssIndent == maxIndent);
             }
             if(allowSelection == true) {
             	multiParts[numMultiParts++] = eval(ssParts[i]);
             }
             ssHtml = ssHtml + "      <img src='../images/supersession.gif'></td>\r\n";
             ssHtml = ssHtml + "            <td class='supersession'><a id='ssLink"+i+"' href='javascript:clickSupersession(\""+ssParts[i].PartNumber+"\",\""+eval("unescape('" + ssParts[i].PartDescription + "')")+"\","+i+","+allowSelection+","+eval("unescape('" + partQty + "')")+");' class='popUpMenuItem'>"+partQty+" x "+ssParts[i].PartNumber+" - "+eval("unescape('" + ssParts[i].PartDescription + "')")+" "+cursymbol+formatPrice(ssParts[i].PartPrice.trim())+"</a></td>\r\n";
             ssHtml = ssHtml + "         </tr>\r\n";
             if( (ssParts[i].SupersessionType==null) && ((i+1) < ssParts.length) ) {
             	

             	ssHtml = ssHtml + "         <tr valign=middle>\r\n";
             	var andStr = eval("AND" + getLanguageCode(languageId));
             	ssHtml = ssHtml + "            <td class='orText'>"+andStr+"</td><td>&nbsp;</td>\r\n";
             	ssHtml = ssHtml + "         </tr>\r\n";
             }
             ssHtml = ssHtml + "      </table>\r\n";
             ssHtml = ssHtml + "   </td>\r\n";
             ssHtml = ssHtml + "</tr>\r\n";
          }
          
       
          if (ssParts[i].SupersessionType == "SS1") {
             ssIndent++;
          }
       
       }
       ssHtml = ssHtml + "      </table>\r\n";
       ssHtml = ssHtml + "   </td>\r\n";
       ssHtml = ssHtml + "</tr>\r\n";
       
       if (hasConditional == 0) {
       	ssHtml = ssHtml + "<td align='center'>\r\n";
       	if (numMultiParts > 1) {
       		ssHtml = ssHtml + "<input class='button' type='button' onclick='javascript:selectMultiSupersession();' value='Select All'>&nbsp;&nbsp;\r\n";
       	}
          ssHtml = ssHtml + "<input class='button' type='button' onclick='selectSupersession();' value='Select'>&nbsp;&nbsp;<input class='button' type='button' onclick='cancelSupersession();' value='Cancel'></td>\r\n";
       }
       ssHtml = ssHtml + "</tr></table>\r\n";
       
    }
   ssDisplay = document.getElementById('ssDisplayAjax');
	ssDisplay.innerHTML = ssHtml;
	ssDisplay.style.visibility = "visible";

}


function drillDownCallBack(text) { 

	if (text != '') {

               //convert text into array elements...
               var splitArray = text.split(']');
               for (i = 0; i < splitArray.length; i++) {
                  var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
                  elementValues = elementValues.replace('[','');
                  var elementArray = readCSVValues(elementValues,12);

                  if (elementArray.length == 12) {
                     elementArray[2] = removeSingleQuotes(elementArray[2]);
                     elementArray[4] = removeSingleQuotes(elementArray[4]);
                     elementArray[8] = removeSingleQuotes(elementArray[8]);
                     elementArray[10] = removeSingleQuotes(elementArray[10]);
                     thejepcDrillDown.addEntry(atmNo,elementArray);
                  }
               }

	}
	
    var url = "..\\prices\\pl_id_"+modelId+"\\"+parent.index_form.legacyCurrency.value+"\\Price_M"+modelId+"_C"+categoryId+"_I"+atmNo+"_"+parent.index_form.legacyCurrency.value+".xml";
    makeHttpRequest(url, 'ddPriceCallBack', true);

    if (isVehicleAvailable()) {
       makeSynchronousHttpRequest("..\\drilldown\\pl_id_"+modelId+"\\Itm_M"+modelId+"_C"+categoryId+"_I"+atmNo+"_attributes.xml", 'ddAttributeCallBack', false);
    }

	thejepcDrillDown.showChildren(atmNo,atmNo,'Y',atmNo);
	if ((expandPartNo != null) && (expandPartNo.length > 0)) {
	   thejepcDrillDown.findPart(atmNo,expandPartNo);
	   expandPartNo = null;
	}
	document.body.style.cursor = '';

}

function isVehicleAvailable() {
    var vehicleAvailable = false;
    try {
       vehicleAvailable = (((parent.index_form.vinDecodeTokens != null) && (parent.index_form.vinDecodeTokens != '')) || ((parent.index_form.vinDecodeSerial != null) && (parent.index_form.vinDecodeSerial != '')) );;
    }
    catch (vErr) {
       vehicleAvailable = false;
    }
    return vehicleAvailable;
}


function ddPriceCallBack(text) {

	if (text != '') {
	
		//convert text into array elements...
      	var splitArray = text.split(']');
      
      	for (i = 0; i < splitArray.length; i++) {
			var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
         	elementValues = elementValues.replace('[','');
         	var elementArray = elementValues.split(',');
         
         	if (elementArray.length == 4) {
            	elementArray[0] = removeSingleQuotes(elementArray[0]);
            	elementArray[2] = removeSingleQuotes(elementArray[2]);                
            	setPricingForPartNumber(atmNo,elementArray[0],elementArray[1],elementArray[2],elementArray[3]);
		 	}
		}                   
	}       

    try {
       if ((parent.index_form.salesOrg.value != null) && (parent.index_form.salesOrg.value.length > 0)) {
          var url = "..\\pibs\\"+parent.index_form.salesOrg.value+"\\pibs_"+parent.index_form.salesOrg.value+".xml";
          makeHttpRequest(url, 'ddPIBCallBack', true);
       }
    }
    catch (pibErr) {
    }
    
    try {
       checkCatEntryIdDealerNote();
    }
    catch (dlrErr) {
    }
    
}

function ddDealerNoteCallBack(text) {
   if (text != null) {
   
      if (isJSON(text) == false) {
         return;
      }

	  //see if a failure message has been returned.
	  var jsonObj =  eval("("+text+")");

      try {         
         var dnCatentryIds = jsonObj.flagMessage.split(",");
         for (var i = 0; i < dnCatentryIds.length; i++) {
            setDealerNotesForPart(atmNo,dnCatentryIds[i]);
         }
      }
      catch (dnErr) {
      }
   }
}

function ddPIBCallBack(text) {
   if ((text != null) && (text.length > 0)) {
      var pibLines = text.split("\n");
      var productSet = false;
      for (var i = 0; i < pibLines.length; i++) {
        if (pibLines[i] != null && pibLines[i] != undefined && pibLines[i] != "") { 
		 if (pibLines[i].length > 0) {
		    var pibTmp = pibLines[i].substring(1,pibLines[i].length-1).split(",");
		    if (pibTmp[0] == 0) {
		       setPIBForPart(atmNo,pibTmp[1]);
		    }
		    else if ((pibTmp[0] == 1) && (productSet == false)) {
		       productSet = setPIBForProduct(pibTmp[1]);
		    }
		 }
	}
      }
   }
}

function ddAttributeCallBack(text) {

   if (text != null) {

     var drillDownAttributes = [];          
     var ddIndex = 0;

     var appLines = text.split("\n");

     for (var i = 0; i < appLines.length; i++) {
        
        if (appLines[i].length > 0) {
             
           var appId = appLines[i].substring(0,appLines[i].indexOf(","));
           var tempAtt = appLines[i].substring(appLines[i].indexOf(",")+1).split("]");

           var attributesArray = [];
           for (j = 0; j < tempAtt.length; j++) {
              attributesArray[j] = tempAtt[j].substring(1).split(",");
           }
                
           var drillDownAttribute = [];
           drillDownAttribute[0] = appId;
           drillDownAttribute[1] = attributesArray;
           drillDownAttributes[ddIndex++] = drillDownAttribute;
                                
        }
     }

     var itemChildren = thejepcDrillDown.getChildrenForItemNo(atmNo);
     var filteredChildren  = [];
     var vehicleAttributes = [];
     var vehicleSerial = '';

     try {

        try {
           vehicleSerial = parent.index_form.vinDecodeSerial.toUpperCase();
        }
        catch (vsErr) {
        }

        var tempAtt = parent.index_form.vinDecodeTokens.split("]");
        var attributeIndex = 0;
        for (var i = 0; i < tempAtt.length; i++) {
           if (tempAtt[i].length > 1) {
              vehicleAttributes[attributeIndex++] = tempAtt[i].substring(1).split(',');
              vehicleAttributes[(attributeIndex-1)][0] = "A" + vehicleAttributes[(attributeIndex-1)][0];
           }
        }
     }
     catch (vErr) {
     }
          
     if ((vehicleSerial.length > 0) || (vehicleAttributes.length > 0)) {
        filteredChildren = filterDrillDownItem(itemChildren, drillDownAttributes, vehicleSerial, vehicleAttributes);             
     }
     else {
        filteredChildren = itemChildren;
     }
          
     thejepcDrillDown.setChildrenForItemNo(atmNo,filteredChildren);

   }
}


    function topLevelCallBack(text) { 

        if (text != '') {
        
           var topLevelItems = [];
           var topLevelIndex = 0;
        
           //convert text into array elements...
           var splitArray = text.split(']');
           for (i = 0; i < splitArray.length; i++) {
               if (splitArray.length >= 2) {
                   var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
                   elementValues = elementValues.replace('[','');
                   var elementArray = readCSVValues(elementValues,2);
                   if (elementArray.length == 2) {
                       var topLevelItem = []
                       topLevelItem[0] = elementArray[0];
                       topLevelItem[1] = elementArray[1].substring(1,elementArray[1].length-1);
                       topLevelItems[topLevelIndex++] = topLevelItem;
                   }
               }
            }

            if (isVehicleAvailable()) {
               topLevelArray = topLevelItems;
               makeHttpRequest("..\\drilldown\\pl_id_"+modelId+"\\tl_M"+modelId+"_C"+categoryId+"_attributes.xml", 'tlAttributeCallBack', true);
            }
            else {
               for (var i = 0; i < topLevelItems.length; i++) {
                  thejepcDrillDown.addTopLevelEntry(topLevelItems[i][0],topLevelItems[i][1]);
               }
            }
           
            
        }
        document.body.style.cursor = '';
    }
    
    function tlAttributeCallBack(text) {

       if (text != '') {

          var drillDownAttributes = [];          
          var ddIndex = 0;

          var appLines = text.split("\n");

          for (var i = 0; i < appLines.length; i++) {
        
             if (appLines[i].length > 0) {
             
                var itemNo = appLines[i].substring(0,appLines[i].indexOf(","));
                var tempAtt = appLines[i].substring(appLines[i].indexOf(",")+1).split("]");

                var attributesArray = [];
                for (j = 0; j < tempAtt.length; j++) {
                   attributesArray[j] = tempAtt[j].substring(1).split(",");
                
                }
                
                var drillDownAttribute = [];
                drillDownAttribute[0] = itemNo;
                drillDownAttribute[1] = attributesArray;
                drillDownAttributes[ddIndex++] = drillDownAttribute;
                                
             }
          }

          var vehicleAttributes = [];
          
          try {
             var tempAtt = parent.index_form.vinDecodeTokens.split("]");
             var attributeIndex = 0;
             for (var i = 0; i < tempAtt.length; i++) {
                if (tempAtt[i].length > 1) {
                   vehicleAttributes[attributeIndex++] = tempAtt[i].substring(1).split(',');
                   vehicleAttributes[(attributeIndex-1)][0] = "A" + vehicleAttributes[(attributeIndex-1)][0];
                }
             }
          }
          catch (vaErr) {
          }

          var vSerialNo = '';
          try {
             vSerialNo = parent.index_form.vinDecodeSerial.toUpperCase();
          }
          catch (vsErr) {
          }

          var topLevelItems = [];
          if ((vSerialNo.length > 0) || (vehicleAttributes.length > 0)) {
             topLevelItems = filterDrillDownTopLevel(topLevelArray,drillDownAttributes, vSerialNo, vehicleAttributes);
          }
          else {
             topLevelItems = topLevelArray;
          }

          for (var i = 0; i < topLevelItems.length; i++) {
             thejepcDrillDown.addTopLevelEntry(topLevelItems[i][0],topLevelItems[i][1]);
          }

       }
       else {
          for (var i = 0; i < topLevelArray.length; i++) {
             thejepcDrillDown.addTopLevelEntry(topLevelArray[i][0],topLevelArray[i][1]);
          }       
       }
    
    }


function categoryMenuCallBack(text) {
   //convert text into array elements...
   var splitArray = text.split(']');

   for (i = 0; i < splitArray.length; i++) {
      var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
      elementValues = elementValues.replace('[','');
      var elementArray = readCSVValues(elementValues,4); 

      menuArray[i] = elementArray;
   }

   if (isVehicleAvailable()) {
      makeSynchronousHttpRequest("../menus/pl_id_"+parent.index_form.vinDecodeSubModelId+"_attributes.xml", 'catAttributeCallBack', false);
   }
   else {
      loadCategory(selectedCats[0],"0");
   }
}

function catAttributeCallBack(text) {

   	if (text != '') {

       var catAttributes = [];          
       var catIndex = 0;

       var appLines = text.split("\n");
          
       for (var i = 0; i < appLines.length; i++) {
        
          if (appLines[i].length > 0) {
             
             var itemNo = appLines[i].substring(0,appLines[i].indexOf(","));
             var tempAtt = appLines[i].substring(appLines[i].indexOf(",")+1).split("]");

             var attributesArray = [];
             for (j = 0; j < tempAtt.length; j++) {
                attributesArray[j] = tempAtt[j].substring(1).split(",");
             }
                
             var catAttribute = [];
             catAttribute[0] = itemNo;
             catAttribute[1] = attributesArray;
             catAttributes[catIndex++] = catAttribute;
                                
          }
       }
       
       var vehicleAttributes = [];   
       try {
          var tempAtt = parent.index_form.vinDecodeTokens.split("]");
          var attributeIndex = 0;
          for (var i = 0; i < tempAtt.length; i++) {
             if (tempAtt[i].length > 1) {
                vehicleAttributes[attributeIndex++] = tempAtt[i].substring(1).split(',');
                vehicleAttributes[(attributeIndex-1)][0] = "A" + vehicleAttributes[(attributeIndex-1)][0];
             }
          }
       }
       catch (vaErr) {
       }

       var vSerialNo = '';
       try {
          vSerialNo = parent.index_form.vinDecodeSerial.toUpperCase();
       }
       catch (vsErr) {
       }

       var filteredCategories = [];
       if ((vSerialNo.length > 0) || (vehicleAttributes.length > 0)) {
          filteredCategories = filterCategoryMenu(menuArray, catAttributes, vSerialNo, vehicleAttributes);
       }
       else {
          filteredCategories = menuArray;
       }

       menuArray = filteredCategories;
       loadCategory(selectedCats[0],"0");
       
    }
}

function categoryPopUpCallBack(text) {

   var splitArray = text.split(']');

   for (i = 0; i < splitArray.length; i++) {
      var elementValues = splitArray[i].substring((i == 0 ? 1 : 2));
      elementValues = elementValues.replace('[','');
      var elementArray = readCSVValues(elementValues,4);
      menuArray[i] = elementArray;
      if (menuArray[i].length > 4) {
         var indicator = menuArray[i][(menuArray[i].length -1)];         
         var concatStr = "";
         for (var j = 2; j < (menuArray[i].length - 1); j++) {
            concatStr = concatStr + ((j > 2) ? "," : "") + menuArray[i][j];
         }
         menuArray[i][2] = concatStr;
      }
      menuArray[i][2] = removeSingleQuotes(menuArray[i][2]);
      
   }
   
   
   if (isVehicleAvailable()) {
      makeSynchronousHttpRequest("../menus/pl_id_"+parent.index_form.vinDecodeSubModelId+"_attributes.xml", 'catAttributeCallBack', false);
   }
   
   categoryNavigationLookUp(modelId,languageId,categoryId);
           
}

function categoryNavigationCallBack(text) {

	if (text != '') {

		//convert text into array elements...
       	var splitArray = text.split(']');

       	//pick up pop up description;
       	popUpDescription = splitArray[0].substring(2);
       	imageFile = splitArray[1].substring(2);

       	var siblings = new Array();

        // if vehicle selected we need to get the categories from the menuArray instead of the xml file 
        if (isVehicleAvailable()) {
			var sibIndex = 0;
			for (var i = 0; i < menuArray.length; i++) {
			  if (menuArray[i][0] == categoryId ) { 
			  	var parCatID = menuArray[i][1]; 
		        for (var j = 0; j < menuArray.length; j++) {
			  		if (menuArray[j][1] == parCatID ) { 
	 		            var tempArray = new Array();
	               		tempArray[0] = menuArray[j][0];
	               		tempArray[1] = menuArray[j][2];
	           	   		siblings[sibIndex] = tempArray;
						++sibIndex;
			  		}
				}
				// exit i loop 
				break;
			  }	
		    }
        } else {
        	// get the categories from the xml file
			for (i = 2; i < splitArray.length - 1; i++) {
	        	var elementValues = splitArray[i].substring(2);
	          	elementValues = elementValues.replace('[','');
	          	
	          	var elementArray = readCSVValues(elementValues,3);
	            if (elementArray.length > 3) {
	               var tempArray = new Array();
	               tempArray[0] = elementArray[0];
	               var tempStr = "";
	               for (var j = 1; j < elementArray.length - 1; j++) {
	                  tempStr = tempStr + (j > 1 ? "," : "") + elementArray[j];
	               }
	               tempArray[1] = tempStr;
	               tempArray[2] = elementArray[elementArray.length - 1];
	           	   siblings[(i-2)] = tempArray;
	            }
	            else {
	          	   siblings[(i-2)] = elementArray;
	          	}
	       	}
       	}
       
       	createCategoryMenu("ddPopUp",popUpDescription);
       	createFlashImage(imageFile);

        /* Builds the drop down which holds the possible other categories for that particular product. */
		// popUpStr = "<br />&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;";
		popUpStr = "";
       	popUpStr = popUpStr + "<select class=text style=\"z-index:0\" id='pgList' onchange=\"javaScript:categoryNavigate();\">";
       	
       	for (j = 0; j < siblings.length; j++) {
			var thisCategory = siblings[j];
          	var selectedCategory = "";
          	try {
          		thisCategory[1] = eval("unescape('" + thisCategory[1] + "')");
		   	} catch (e) {
   			}
          	if (thisCategory[0] == categoryId) {
          		selectedCategory = "selected";
            }
          	popUpStr = popUpStr + "   <option value='"+thisCategory[0]+"' " + selectedCategory + " >"+thisCategory[1]+"</option>";
       	}
		popUpStr = popUpStr + "</select>";
       	popUpStr = popUpStr + "&nbsp;<a id='navLeft'  href=\"javascript:categoryNavigateLeft();\"><img id='navLeftImg'  style='border-style: none;visibility:visible ' align='bottom' src='../images/Arrow_Left.png'/></a>";
       	popUpStr = popUpStr + "&nbsp;<a id='navHome'  href=\"javascript:categoryNavigateHome();\"><img id='navHomeImg'  style='border-style: none;visibility:visible ' align='bottom' src='../images/Home.png'/></a>";
       	popUpStr = popUpStr + "&nbsp;<a id='navRight' href=\"javascript:categoryNavigateRight();\"><img id='navRightImg' style='border-style: none;visibility:visible ' align='bottom' src='../images/Arrow_Right.png'/></a>";
       	dropDownDiv = document.getElementById('ddSiblings');
       	dropDownDiv.innerHTML = popUpStr;
       	setNavigationControls();
   	}
}

function categoryMenuLookUp(modelId,languageId) {
   var url = "../menus/L" + languageId + "/pl_id_"+modelId+"_l_id_"+languageId+".xml";
   makeHttpRequest(url, 'categoryMenuCallBack',true);
}

function categoryPopUpLookUp(modelId, languageId, categoryId) {
   var url = "../menus/L"+languageId+"/pl_id_"+modelId+"_l_id_"+languageId+".xml";
   makeHttpRequest(url, 'categoryPopUpCallBack',true);
}

function categoryNavigationLookUp(modelId, languageId, categoryId) {
   var url = "../drilldown/pl_id_"+modelId+"/L"+languageId+"/cat_M" + modelId + "_C" + categoryId + "_L" + languageId + ".xml";
   makeHttpRequest(url, 'categoryNavigationCallBack',true);
}
    

function supersessionLookUp(partNumber,ssType,logonId,logonPassword,salesOrg,languageId,currencyCode,aSynch) {
	var languageCode = getSAPLanguageCode(languageId);
	var url = "getSupersessions.jepc?userId="+logonId+"&pwd="+logonPassword+"&salesOrg="+salesOrg+"&partNo="+partNumber+"&langCode="+languageCode+"&currencyCode="+currencyCode;
	supersessionType = ssType;
	
	if (ssType == 2) { //multiple supersession
		url += "&ssType=MS";
	} else if (ssType == 3) { //conditional supersession
		url += "&ssType=CS";
	} else { //simple supersession
    	url += "&ssType=SS";
	}	
	url = getUrl() + url;
    
    if (aSynch == true) {
    	makeHttpRequest(url, 'superSessionCallBack', false);
	} else {
		makeSynchronousHttpRequest(url, 'superSessionCallBack', false);
	}
}

function ssPartDetailsLookUp(partNumber,logonId,logonPassword,salesOrg,languageId,currencyCode,aSynch) {
	var languageCode = getSAPLanguageCode(languageId);
	languageCode = languageCode.substring(1);
	var url = getUrl() + "getPartDetailsSupersessions.jepc?userId="+logonId+"&pwd="+logonPassword+"&salesOrg="+salesOrg+"&partNo="+partNumber+"&langCode="+languageCode+"&currencyCode="+currencyCode;
	makeSynchronousHttpRequest(url, 'ssPartDetailsCallBack', aSynch);    
}

function ssPartDetailsCallBack(text) {

	var isJason = isJSON(text);
	if (isJason == false) {
		alert(HtmlDecode(eval("APPLICATION_ERROR" + getLanguageCode(languageId))));
		return;
	}

	//see if a failure message has been returned.
	var jsonObj =  eval("("+text+")");
	var failure = eval('jsonObj.ReturnCode');
	try {
		if (failure == "FAILED") {
       	for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          	if (thejepcDrillDown.items[i].itemNo == ssSelectedItemNo) {
             	for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
               	 if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
                   	thejepcDrillDown.items[i].children[j].ssSelected = false;
                   	thejepcDrillDown.items[i].children[j].ssPartNo = null;
                   	thejepcDrillDown.items[i].children[j].ssDescription = '';
                	}
             	}
             	break;
          	}          
       	}	
	   		alert(eval('jsonObj.Message'));
	   	return false;
		}    
    	for (var i = 0; i < thejepcDrillDown.items.length; i++) {
       	if (thejepcDrillDown.items[i].itemNo == ssSelectedItemNo) {
       	
          	for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
             	if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
                	thejepcDrillDown.items[i].children[j].ssSelected = true;
                	thejepcDrillDown.items[i].children[j].ssPartNo = jsonObj.PartNumber;
                	thejepcDrillDown.items[i].children[j].ssDescription = jsonObj.PartDescription;
                	thejepcDrillDown.items[i].children[j].ssDiscount = jsonObj.PartDiscountCode;
                	thejepcDrillDown.items[i].children[j].ssPrice = jsonObj.PartPrice;
                	thejepcDrillDown.items[i].children[j].ssUnformattedPart = jsonObj.UnformattedPart;
             	}
          	}
          	break;
       	}          
    	}
    }catch(sError){}
   try {
   	thisPartDiscount = jsonObj.PartDiscountCode.trim();
   	thisPartPrice = jsonObj.PartPrice.trim();
   }catch(pError){}
}




function jepcDrillDownLookup(itemNo, modelId, categoryId,languageId, partNo) {

    atmNo=itemNo;
    
    if (partNo.length > 0) {
       expandPartNo = partNo;
    }
    
    if (!thejepcDrillDown.checkEntry(atmNo) && (document.body.style.cursor == "" || document.body.style.cursor=="default")) {
        toggleBox('jepcDrillDownAjax',0);
        document.body.style.cursor = 'wait'                  
        var url = "..\\drilldown\\pl_id_"+modelId+"\\L"+languageId+"\\Itm_M"+modelId+"_C"+categoryId+"_I"+atmNo+"_L"+languageId+".xml";
        makeHttpRequest(url, 'drillDownCallBack',true);
    } else {
        thejepcDrillDown.showChildren(atmNo,atmNo,'Y',atmNo);
    } 		
    
    
}

function jepcTopLevelLookup(modelId, languageId, categoryId) {
    document.body.style.cursor = 'wait'         
    var url = "..\\drilldown\\pl_id_"+modelId+"\\L"+languageId+"\\tl_M"+modelId+"_C"+categoryId+"_L"+languageId+".xml";
    makeHttpRequest(url, 'topLevelCallBack',true);
}

function attSummaryLookup(ob,ex,atSum) {

    try {
       if (document.getElementById('attSummaryAjax').style.visibility == 'visible') {
           document.getElementById('attSummaryAjax').style.visibility = 'hidden';
           document.getElementById("sideArrow"+atSum).src = '..//images//rightArrow.gif';
           return false;
       }
    }
    catch (attErr) {
    }

    var url = getUrl() + "viewAttributeSummary.jepc?applicationId="+ atSum +"&langId="+languageId;
    

	document.body.style.cursor = 'wait';
	obj=ob;
	eV=ex;
	cntX=ex.clientX;
	cntY=ex.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	attSum=atSum;
	makeHttpRequest(url, 'attSummaryCallBack', false);
}


/**
* Function to check CatentryId to display DealerNoteFlag.
*/
function checkCatEntryIdDealerNote() {

	var catEntryId = getItemCatEntryId(atmNo);

	var url = getUrl() + "checkCatEntryDealerNote.jepc?uid=" + generateUID()
					+ "&langId=" + languageId + "&catEntryId="
					+ escape(catEntryId) + "&memberId=" + decryptData(unescape(parent.index_form.memberId.value));

    makeHttpRequest(url, 'ddDealerNoteCallBack',false);
	
}  

function getSAPLanguageCode(pLangId) {

	var type = false;
	
	if (pLangId != undefined && pLangId != null)
	{
		if (pLangId == 0 || pLangId == -1)
		{
			type = "EN";
		}
		else if (pLangId == -2)
		{
			type = "FR";
		}
		else if ( pLangId == -3 )
		{
			type = "DE";
		}
		else if (pLangId == -4)
		{
			type = "IT";
		}
		else if (pLangId == -5)
		{
			type = "ES";
		}
		else if (pLangId == -10)
		{
			type = "JA";
		}
		else if (pLangId == -11)
		{
			type = "NL";
		}
		else if (pLangId == -7)
		{
			type = "ZH";
		}
		else
		{
			type = "EN";
		}
	}
	else
	{
		type = "_En";
	}
	//alert(type);
	return type;

}