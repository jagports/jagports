/*******************************************************************************
 * File Name			: JEPC.js
 * Author				: Keane India Pvt Ltd.,
 * Date of Creation		: 18 December 2007.
 * Description			: Utility methods used across JEPC Application.
 * Version Number		: 1.0
 * Modification History	:
   Date			Version		Who				Description of change
   2007-12-18	1.0			Keane India		Initial - created with the utility 
   											methods.
   2012-02-10	1.01		Robin Birchmore	RFC672 - Add Russian Currency Symbol.
   2012-05-31	1.02		Robin Birchmore	RFC729 - Add Korean Currency Symbol.
   2012-10-11	1.03		Robin Birchmore	RFC1078 - Display price with commas.
*******************************************************************************/
var req = false;
var fileSystemObject = false;
var theList = "";
/**
 * Creates a new File System Object if it is not available
 */
function loadFSO() {
	if (fileSystemObject == undefined || fileSystemObject == null
			|| !fileSystemObject) {
		try {
			fileSystemObject = new ActiveXObject(
					"Scripting.FileSystemObject");
		} catch (exception) {
			if ("Automation server can't create object" == 
					exception.description) {
				var activeXError = new ActiveXError('-1');
				alert(activeXError.region);
				alert(activeXError.errorMessage);
				delete activeXError;
			}
		}
	}
}

/**
* Determin if price is formatted with commas based on sales orgs
*/

function priceFormattedWithCommas() {
	salesOrg = parent.index_form.salesOrg.value;
	salesOrgsWithComma="02CN,02KR";
	
	return (salesOrgsWithComma.indexOf(salesOrg)>-1?true:false);
}

/**
* Return number as string formatted with commas for specific sales orgs
*/

function formatPrice(x) {
	try {
		if(priceFormattedWithCommas()) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
		}else{
			return ""+x;
		}
	}catch(e) {
		return ""+x;
	}
}


/**
 * Search for the context root in the URL and return.
 *
 * @return the context root
 */
function getUrl() {
	var url = onlineURL;
	return url;
}

/** 
 * Creates a new AJAX Object
 */
function initRequest() {
	try {
		req = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (ex) {
		try {
			if (req != undefined || req != null) {
				req = new ActiveXObject("Microsoft.XMLHTTP");
			}
		} catch (e) {
			alert("Exception while creating Ajax object: " + e.description);
		}
	}
}

/**
 * Parse the XML file for the node with name pElement and return its node value.
 *
 * @param XMLFileObject pXml the XML file to be parsed
 * @param String pElement the element to be parsed in pXML.
 * @param int pPosition the position in the pXML file.
 * @return Node value between the node with tag name pElement.
 */
function parse(pXml, pElement, pPosition) {
	var nodeVal = "";
	try {
		if ((pXml != undefined && pXml != null) && 
			pXml.getElementsByTagName(pElement) != null) {
			nodeVal = pXml.getElementsByTagName(pElement)[pPosition].childNodes[0].nodeValue;
		}
	} catch (e) {
		// Check why object required error is coming
		//alert("Exception occured while processing the response xml: " + e.description);
	}
	return nodeVal;
}

/**
 * Generates random number between the ASCII numbers 33 and 127.
 *
 * @return random ASCII number between 33 and 127.
 */
function getRandomNum() {
    var rndNum = Math.random()		// between 0 - 1
    rndNum = parseInt(rndNum * 1000);	// rndNum from 0 - 1000
    rndNum = (rndNum % 94) + 33;	// rndNum from 33 - 127
    return rndNum;
}

/**
 * Checks whether the random ASCII is between the values 33 and 127 and return 
 * true, else false
 *
 * @return true, if num is between 33 and 127, false, else.
 */
function checkPunc(num) {
    if ((num >= 33) && (num <= 47)) { 
    	return true; 
    }
    
    if ((num >= 58) && (num <= 64)) { 
    	return true; 
    }
    
    if ((num >= 91) && (num <= 96)) { 
    	return true; 
    }
    
    if ((num >= 123) && (num <= 126)) { 
    	return true; 
    }
    return false;
}

/**
 * Generates a Unique Id for logging in the server side using the MemberId and
 * the current time when the Ajax call in initiated.
 *
 * @param String pMemberId the member Id
 * @return Unique Id.
 */
function generateUID() {
    var length = 5;
    var uid = "";

    for (i=0; i < length; i++) {
        numI = getRandomNum();
        
        while (checkPunc(numI)) {
        	numI = getRandomNum();
        }
        uid = uid + String.fromCharCode(numI);
    }
    return uid;
}

/**
 * Converts the language Id into the String language code for ex. langId = -2 ==>
 * type = "_Fr"
 *
 * @param int pLangId the language Id
 * @return String language code.
 */
function getLanguageCode(pLangId) {
	var type = false;
	
	if (pLangId != undefined && pLangId != null) {
		if (pLangId == 0 || pLangId == -1) {
			type = "_En";
		} else if (pLangId == -2) {
			type = "_Fr";
		} else if ( pLangId == -3 ) {
			type = "_Ge";
		} else if (pLangId == -4) {
			type = "_It";
		} else if (pLangId == -5) {
			type = "_Sp";
		} else if (pLangId == -10) {
			type = "_Ja";
		} else if (pLangId == -11) {
			type = "_Du";
		} else if (pLangId == -7) {
			type = "_Ch";
		} else if (pLangId == -6) {
			type = "_Ru";
		} else {
			type = "_En";
		}
	} else {
		type = "_En";
	}
	return type;
}

/**
 * Validates E-Mail address.
 *
 * @param addr		String - E-Mail address.
 * @return true		Boolean - Indicates whether the mail Id is valid or not.
 */
function validateEmailAddress(addr) {
	if (addr == '') {
		return true;
	}
	var invalidChars = '\/\'\\ ";:?!()[]\{\}^|';

	for (var i = 0; i < invalidChars.length; i++) {
		if (addr.indexOf(invalidChars.charAt(i), 0) > -1) {
			return true;
		}
	}

	for (var i = 0; i < addr.length; i++) {
		if (addr.charCodeAt(i) > 127) {
			return true;
		}
	}
	var atPos = addr.indexOf('@', 0);

	if (atPos == -1) {
		return true;
	}
	
	if (atPos == 0) {
		return true;
	}
	
	if (addr.indexOf('@', atPos + 1) > - 1) {
		return true;
	}
	
	if (addr.indexOf('.', atPos) == -1) {
		return true;
	}
	
	if (addr.indexOf('@.', 0) != -1) {
		return true;
	}
	
	if (addr.indexOf('.@', 0) != -1) {
		return true;
	}
	
	if (addr.indexOf('..', 0) != -1) {
		return true;
	}
	var suffix = addr.substring(addr.lastIndexOf('.') + 1);
	
	if (suffix.length != 2 && suffix != 'com' && suffix != 'net'
			&& suffix != 'org' && suffix != 'edu' && suffix != 'int'
			&& suffix != 'mil' && suffix != 'gov' & suffix != 'arpa'
			&& suffix != 'biz' && suffix != 'aero' && suffix != 'name'
			&& suffix != 'coop' && suffix != 'info' && suffix != 'pro'
			&& suffix != 'museum') {
		return true;
	}
	return false;
}

/**
 * Dynamically create a the hierarchy structure of the product and also displays
 * a image dynamically.
 *
 * @return theHierarchy		string - The html string which creates the hierarchy.
 */
function loadImage(pImageName, pApplicationId, languageId) {
	theList += "<br />";
	var theHierarchy = document.getElementById("drillDownHolder");
	var url = getUrl() + "viewCompleteSummary.jepc?uid=" + generateUID() + "&langId="
			+ languageId + "&applicationId=" + pApplicationId + "&memberId=" + decryptedMemberId;
	try {
		initRequest();
		req.open("POST", url, true);
		req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		req.send(null);

		req.onreadystatechange = function() {
			if (req.readyState == 4) {
				mailarray = eval("unescape('" + req.responseText + "')");
				displayHierarchy(mailarray);
				theHierarchy.innerHTML = theList;
			}
		}
	} catch(e) {
	}

	document.getElementById("imageholder").innerHTML
			= "<img src='../flash/images/" + pImageName + ".jpg' align='right' border='0' "
			+ "alt='Product Image' />";
}

/**
 * Function to display the hierarchy.<b>
 *
 * @param pMailArray - The hierarchy of product. 
 */
function displayHierarchy(pMailArray) {
	var mail = eval('(' + pMailArray + ')');

	var returnMessage = eval('mail.Error');
	if (returnMessage != null) {
		theList +=  "<font size=\"2pt\" class=\"strongRedText1\">" + returnMessage + "</font><br />";
		flag = 1;
	} else {
		
		for (var i = 0; i < mail.length; i++) {

			for (var j = 0; j <= i; j++) {
				theList += "&nbsp;&nbsp;";
			}
			theList += "<font size=\"2pt\">" + mail[i]  + "</font><br />";
		}
	}
}

var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
/**
 * Function to Decrypt the string using Base64 Decode algorithm
 *
 * @param - pInput the string to be decrypted.
 * @return - output the decrypted string.
 */
function decryptData(pInput) {
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

	// remove all characters that are not A-Z, a-z, 0-9, +, /, or =
	pInput = pInput.replace(/[^A-Za-z0-9\+\/\=]/g, "");

	do {
		enc1 = keyStr.indexOf(pInput.charAt(i++));
		enc2 = keyStr.indexOf(pInput.charAt(i++));
		enc3 = keyStr.indexOf(pInput.charAt(i++));
		enc4 = keyStr.indexOf(pInput.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}
	} while (i < pInput.length);
   
	return output;
}

// To retrieve the logon details.
function setValues() {
	logonId = parent.index_form.logonId.value;
	user = decryptData(unescape(logonId));
	memberId = parent.index_form.memberId.value;
	languageId = parent.index_form.languageId.value;
	salesOrg = parent.index_form.salesOrg.value;
	legacyCurrency = parent.index_form.legacyCurrency.value;
	if (salesOrg == "/" || salesOrg == null || salesOrg == "") {
            salesOrg = defaultSalesOrg;
     }
}

// Sets the currency symbol based on the currency of the user. 
function setCurrencySymbol(pCurrency) {

	var currencySymbol;
		
	if ((("PTE").match(pCurrency) || ("NLG").match(pCurrency)) ||
			(("ITL").match(pCurrency) || ("FRF").match(pCurrency)) ||
			(("ESP").match(pCurrency) || ("DEM").match(pCurrency)) ||
			("BEF").match(pCurrency) || ("ATS").match(pCurrency)) {
		currencySymbol = "&euro;"; 
	} else if (("USD").match(pCurrency) || ("AUD").match(pCurrency) ||
			("007").match(pCurrency) || ("001").match(pCurrency)) {
		currencySymbol = "RUB";
	} else if (("003").match(pCurrency)) {
		currencySymbol = "Mk";
	} else if (("004").match(pCurrency)) {
		currencySymbol = "CHF";
	} else if (("005").match(pCurrency)) {
		currencySymbol = "Kr";
	} else if (("006").match(pCurrency)) {
		currencySymbol = "CNY";
	} else if (("008").match(pCurrency)) {
		currencySymbol = "z&#322;";
	} else if (("LCL").match(pCurrency)) {
		currencySymbol = "&yen;";
	} else if (("ZPF").match(pCurrency)) {
	    currencySymbol = "";
	} else if (("CNR").match(pCurrency)) {
	   currencySymbol = "\u5143";
	} else if (("RUB").match(pCurrency)) {
	   currencySymbol = "\u0440\u0443\u0431 ";
	} else if (("KRW").match(pCurrency)) {
	   currencySymbol = "\u20A9";
	} else {
		currencySymbol = "&pound;";
	}
	return currencySymbol;
}

/**
 * Function to encrypt a string using Base-64 Encryption Algorithm.   
 *
 * @param pInput - the string to be encrypted
 * @return output - the encrypted string.
 */
function encryptData(pInput){
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

	do {
		chr1 = pInput.toString().charCodeAt(i++);
		chr2 = pInput.toString().charCodeAt(i++);
		chr3 = pInput.toString().charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} 
		else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
			keyStr.charAt(enc3) + keyStr.charAt(enc4);
	} while (i < pInput.length);

	return output;
}

/**
 * Checks whether the mentioned folder exists, if not creates a 
 * new folder in the mentioned path and recursively calls. If the 
 * folder exists then, check whether the file with the mentioned 
 * name exists, if not create a new one.
 *
 * return@ 	boolean - true; if the folder exists, else create a new folder. 
 * 			Return false if any exception happens.
 */
function isValidFolder(pFolder) {
	var status = false;
	try {
		if (pFolder != undefined && pFolder != null && pFolder.length > 0) {
			
			// Load the file system object to validate folder
			loadFSO();
			
			if (fileSystemObject != undefined && fileSystemObject != null) {
				if (fileSystemObject.FolderExists(pFolder)) {
					status = true;
				} else {
					fileSystemObject.CreateFolder(pFolder);
					status = true;
				}
			}
			delete fileSystemObject;
		}
	}
	catch (e) {
		alert(e.description); // Application exception need to be used instead
	}
	return status;
}

/**
 * Check whether the constant folder structure is present, if not 
 * re-create the folder structure.
 *
 * @param	pFolder		String - subfolder to be appended
 * @return	returnCode	boolean - true; if the folders are in place, else false.
 */
function validateRootFolder(pFolder) {
	var returnCode = false;
	pFolder = rootFolder + "\\" + pFolder;
	var folders = pFolder.split("\\");
	var tempPath = undefined;
	
	for (var i = 0; i < folders.length; i++) {
		switch (i) {
			case 0:
				returnCode = isValidDirectory(folders[0]);
				
				if (!returnCode) {
					return returnCode;
				}
				break;
			case i:
				tempPath = currentFolder(folders, i);
				returnCode = isValidFolder(tempPath);
				break;
			default:
				break;
		}
	}
	return returnCode;
}



/**
 * Checks whether drive and folder(s) name set in the constants.js
 * is present, if not creates the folder structure.
 *
 * @param 	pPathArray 	String[] - Root folder of JepcIII
 * @param 	pPtr		int - Pointer to the current folder which
 *						need to be validated.
 * @return	tempDir		String - if the current drive/folder is valid
 *						it will be appened together to create the
 *						temporary directory.
 */
function currentFolder(pPathArray, pPtr) {
	var tempDir = "";

	if (pPathArray != undefined && pPathArray != null && pPathArray
			.length > 0 && pPtr != undefined && pPtr != null 
			&& pPtr > 0) {
		tempDir = pPathArray[0];
		
		for (var i = 1; i <= pPtr; i++) {
			tempDir += "\\" + pPathArray[i];
		}
	}
	return tempDir;
}

/**
 * Check whether the directory set in the constant package is valid
 *
 * @param	pDirectory	String - the drive name
 * @return	status		boolean - true if the directory is valid, 
 *						else false
 */
function isValidDirectory(pDirectory) {
	var status = false;
	try {
		// Load the file system object to validate the drive
		loadFSO();
		
		if (pDirectory != undefined && pDirectory != null) {
			status = fileSystemObject.DriveExists(pDirectory);
		}
		delete fileSystemObject;
	} catch (e) {
		alert(e.description); // Application exception need to be used instead
	}
	return status;
}

/**
 * Function to obtain the sub-models of a particular model.
 *
 * @param pLineArray 	String[] - an array containing the model elements.
 * @param pSplitText 	String - the xml file contents split into individual
 *						lines.
 * @return children 	String[] - an array of all sub-models.
 */
function getAllChildren(pLineArray, pSplitText) {
	var line = null;
	var splitTextParams = null;
	var splitTextIds = null;
	var lineArrayIds = null;
	var splitTextLength = null;
	var children = new Array();
	var splitTextLength = pSplitText.length;
	var j = 0;

	for (var i = 0; i < splitTextLength - 1; i++) {	
		line = pSplitText[i].substring((i == 0 ? 1 : 2));
		line = line.replace('[', '');
		splitTextParams = line.split("\'");
		splitTextIds = splitTextParams[0].split(",");
		
		if (pLineArray[0] == splitTextIds[1]) {
			children[j++] = line;
		}
	}
	return children;
}

/**
 * Function to build the model menu or dropdown menu based on input.
 *
 * @param pBuildType 	String - indicates whether a dropdown is to be built or 
 						model menu.
 * @param pText 		String - contents of the xml file.
 */
function buildUtility(pBuildType, pText) {
	var line = null;
	var lineArray = new Array();
	var	lineIdentifiers = null;
	var splitTextLength = null;
	var splitText = pText.split("]");
	splitTextLength = splitText.length;

	for (var j = 0; j < splitTextLength - 1; j++) { //splitTextLength - 1
		line = splitText[j].substring(j == 0 ? 1 : 2);
		line = line.replace('[', '');
		
		// lineArray contains the text split into individual lines
		lastIndexOfModelId = line.indexOf(",");
		lastIndexOfParentId = line.indexOf(",", lastIndexOfModelId + 1);
		firstIndexOfModelName = line.indexOf("'");
		
		modelId = line.substring(0, lastIndexOfModelId);
		parentIdForModel = line.substring(lastIndexOfModelId + 1, lastIndexOfParentId);
		modelName = line.substring(lastIndexOfParentId + 2,
					line.length - 1);
		lineArray[0] = modelId;
		lineArray[1] = parentIdForModel;
		try {
			lineArray[2] = eval("unescape('" + modelName + "')");
		} catch (e) {
			lineArray[2] = modelName;
		}

		// Check for a model, get all children(sub-models) of the model
		if ((parentId).match(parentIdForModel)) {
			var children = getAllChildren(lineArray, splitText);

			// If the model is same as sub-model, Build the menu with sub-model
			if (children.length == 1) {
				eval("(" + pBuildType + ")")(children, lineArray, 1);
			} else {
			// Else, build the menu with children indented from parent
				eval("(" + pBuildType + ")")(children, lineArray, 0);
			}
		}
	}
}

/**
 * Replace all the occurance of a particular character by some other character
 * in the string.
 *
 * @param message	The message in which particular characters are to eb replaced.
 * @param from		The string to be replaced.
 * @param to		The string to be replaced with.
 * @return message	The final message after repplacment.
 */
function replaceAllOccurances(message, from, to) {
    var index = message.indexOf(from);
    while (index > -1) {
        message = message.replace(from, to);
        index = message.indexOf(from);
    }
    return message;
}
/**
*Function to check Internet connection.
*/
function checkInternet(pHtmlLink) {
	initRequest();
	url = onlineURL;
	req.onreadystatechange = stateChange;
	req.open("POST", url, true);
	req.send(null);
	function stateChange() {
		if (req.readyState == 4) {
				
	        try {	          
	            if (req.status == 200) { 
	            	top.mainFrame.document.location.href = pHtmlLink;
	        	} else {
	            	alert(eval("CHECK_INTERNET" + languageCode));	           
	            	//top.mainFrame.document.location.href = offlineUrl + pHtmlLink;
	           	}
	    	} catch(err) {
	    		alert(eval("CHECK_INTERNET" + languageCode));	    		
	    		//top.mainFrame.document.location.href = offlineUrl + pHtmlLink;
	    	} 
	  	}
	}
}

/**
 * Function to Go to the Specified URL.
 */
function redirectToURL(url) {
	if (url == modelMenuPage || url == vinDecodePage) {
		resetVinDecode();
		
		if(url == vinDecodePage) {
			// vin decode needs internet connection
			checkInternet(url);
		} else {
			top.mainFrame.document.location.href = url;
		}
	} else {
		document.location = url;
	}
}

//   client side version of the useful Server.HtmlDecode method 
//   takes one string (encoded) and returns another (decoded) 
function HtmlDecode(s) { 

      var out = ""; 
      if (s == null) {
      	return;
      }
      var l = s.length; 

      for (var i=0; i<l; i++) { 

            var ch = s.charAt(i);
            if (ch == '&') { 
                  var semicolonIndex = s.indexOf(';', i+1);
            if (semicolonIndex > 0) {
            	var entity = s.substring(i + 1, semicolonIndex); 

                        if (entity.length > 1 && entity.charAt(0) == '#') { 

                              if (entity.charAt(1) == 'x' || entity.charAt(1) == 'X')
                                    ch = String.fromCharCode(eval('0'+entity.substring(1)));
                              else 
                               ch = String.fromCharCode(eval(entity.substring(1))); 
                        }  else { 

                              switch (entity) { 

                                    case 'quot': ch = String.fromCharCode(0x0022); break; 

                                    case 'amp': ch = String.fromCharCode(0x0026); break; 

                                    case 'lt': ch = String.fromCharCode(0x003c); break; 

                                    case 'gt': ch = String.fromCharCode(0x003e); break; 

                                    case 'nbsp': ch = String.fromCharCode(0x00a0); break; 

                                    case 'iexcl': ch = String.fromCharCode(0x00a1); break; 

                                    case 'cent': ch = String.fromCharCode(0x00a2); break; 

                                    case 'pound': ch = String.fromCharCode(0x00a3); break; 

                                    case 'curren': ch = String.fromCharCode(0x00a4); break; 

                                    case 'yen': ch = String.fromCharCode(0x00a5); break; 

                                    case 'brvbar': ch = String.fromCharCode(0x00a6); break; 

                                    case 'sect': ch = String.fromCharCode(0x00a7); break; 

                                    case 'uml': ch = String.fromCharCode(0x00a8); break; 

                                    case 'copy': ch = String.fromCharCode(0x00a9); break; 

                                    case 'ordf': ch = String.fromCharCode(0x00aa); break; 

                                    case 'laquo': ch = String.fromCharCode(0x00ab); break; 

                                    case 'not': ch = String.fromCharCode(0x00ac); break; 

                                    case 'shy': ch = String.fromCharCode(0x00ad); break; 

                                    case 'reg': ch = String.fromCharCode(0x00ae); break; 

                                    case 'macr': ch = String.fromCharCode(0x00af); break; 

                                    case 'deg': ch = String.fromCharCode(0x00b0); break; 

                                    case 'plusmn': ch = String.fromCharCode(0x00b1); break; 

                                    case 'sup2': ch = String.fromCharCode(0x00b2); break; 

                                    case 'sup3': ch = String.fromCharCode(0x00b3); break; 

                                    case 'acute': ch = String.fromCharCode(0x00b4); break; 

                                    case 'micro': ch = String.fromCharCode(0x00b5); break; 

                                    case 'para': ch = String.fromCharCode(0x00b6); break; 

                                    case 'middot': ch = String.fromCharCode(0x00b7); break; 

                                    case 'cedil': ch = String.fromCharCode(0x00b8); break; 

                                    case 'sup1': ch = String.fromCharCode(0x00b9); break; 

                                    case 'ordm': ch = String.fromCharCode(0x00ba); break; 

                                    case 'raquo': ch = String.fromCharCode(0x00bb); break; 

                                    case 'frac14': ch = String.fromCharCode(0x00bc); break; 

                                    case 'frac12': ch = String.fromCharCode(0x00bd); break; 

                                    case 'frac34': ch = String.fromCharCode(0x00be); break; 

                                    case 'iquest': ch = String.fromCharCode(0x00bf); break; 

                                    case 'Agrave': ch = String.fromCharCode(0x00c0); break; 

                                    case 'Aacute': ch = String.fromCharCode(0x00c1); break; 

                                    case 'Acirc': ch = String.fromCharCode(0x00c2); break; 

                                    case 'Atilde': ch = String.fromCharCode(0x00c3); break; 

                                    case 'Auml': ch = String.fromCharCode(0x00c4); break; 

                                    case 'Aring': ch = String.fromCharCode(0x00c5); break; 

                                    case 'AElig': ch = String.fromCharCode(0x00c6); break; 

                                    case 'Ccedil': ch = String.fromCharCode(0x00c7); break; 

                                    case 'Egrave': ch = String.fromCharCode(0x00c8); break; 

                                    case 'Eacute': ch = String.fromCharCode(0x00c9); break; 

                                    case 'Ecirc': ch = String.fromCharCode(0x00ca); break; 

                                    case 'Euml': ch = String.fromCharCode(0x00cb); break; 

                                    case 'Igrave': ch = String.fromCharCode(0x00cc); break; 

                                    case 'Iacute': ch = String.fromCharCode(0x00cd); break; 

                                    case 'Icirc': ch = String.fromCharCode(0x00ce ); break; 

                                    case 'Iuml': ch = String.fromCharCode(0x00cf); break; 

                                    case 'ETH': ch = String.fromCharCode(0x00d0); break; 

                                    case 'Ntilde': ch = String.fromCharCode(0x00d1); break; 

                                    case 'Ograve': ch = String.fromCharCode(0x00d2); break; 

                                    case 'Oacute': ch = String.fromCharCode(0x00d3); break; 

                                    case 'Ocirc': ch = String.fromCharCode(0x00d4); break; 

                                    case 'Otilde': ch = String.fromCharCode(0x00d5); break; 

                                    case 'Ouml': ch = String.fromCharCode(0x00d6); break; 

                                    case 'times': ch = String.fromCharCode(0x00d7); break; 

                                    case 'Oslash': ch = String.fromCharCode(0x00d8); break; 

                                    case 'Ugrave': ch = String.fromCharCode(0x00d9); break; 

                                    case 'Uacute': ch = String.fromCharCode(0x00da); break; 

                                    case 'Ucirc': ch = String.fromCharCode(0x00db); break; 

                                    case 'Uuml': ch = String.fromCharCode(0x00dc); break; 

                                    case 'Yacute': ch = String.fromCharCode(0x00dd); break; 

                                    case 'THORN': ch = String.fromCharCode(0x00de); break; 

                                    case 'szlig': ch = String.fromCharCode(0x00df); break; 

                                    case 'agrave': ch = String.fromCharCode(0x00e0); break; 

                                    case 'aacute': ch = String.fromCharCode(0x00e1); break; 

                                    case 'acirc': ch = String.fromCharCode(0x00e2); break; 

                                    case 'atilde': ch = String.fromCharCode(0x00e3); break; 

                                    case 'auml': ch = String.fromCharCode(0x00e4); break; 

                                    case 'aring': ch = String.fromCharCode(0x00e5); break; 

                                    case 'aelig': ch = String.fromCharCode(0x00e6); break; 

                                    case 'ccedil': ch = String.fromCharCode(0x00e7); break; 

                                    case 'egrave': ch = String.fromCharCode(0x00e8); break; 

                                    case 'eacute': ch = String.fromCharCode(0x00e9); break; 

                                    case 'ecirc': ch = String.fromCharCode(0x00ea); break; 

                                    case 'euml': ch = String.fromCharCode(0x00eb); break; 

                                    case 'igrave': ch = String.fromCharCode(0x00ec); break; 

                                    case 'iacute': ch = String.fromCharCode(0x00ed); break; 

                                    case 'icirc': ch = String.fromCharCode(0x00ee); break; 

                                    case 'iuml': ch = String.fromCharCode(0x00ef); break; 

                                    case 'eth': ch = String.fromCharCode(0x00f0); break; 

                                    case 'ntilde': ch = String.fromCharCode(0x00f1); break; 

                                    case 'ograve': ch = String.fromCharCode(0x00f2); break; 

                                    case 'oacute': ch = String.fromCharCode(0x00f3); break; 

                                    case 'ocirc': ch = String.fromCharCode(0x00f4); break; 

                                    case 'otilde': ch = String.fromCharCode(0x00f5); break; 

                                    case 'ouml': ch = String.fromCharCode(0x00f6); break; 

                                    case 'divide': ch = String.fromCharCode(0x00f7); break; 

                                    case 'oslash': ch = String.fromCharCode(0x00f8); break; 

                                    case 'ugrave': ch = String.fromCharCode(0x00f9); break; 

                                    case 'uacute': ch = String.fromCharCode(0x00fa); break; 

                                    case 'ucirc': ch = String.fromCharCode(0x00fb); break; 

                                    case 'uuml': ch = String.fromCharCode(0x00fc); break; 

                                    case 'yacute': ch = String.fromCharCode(0x00fd); break; 

                                    case 'thorn': ch = String.fromCharCode(0x00fe); break; 

                                    case 'yuml': ch = String.fromCharCode(0x00ff); break; 

                                    case 'OElig': ch = String.fromCharCode(0x0152); break; 

                                    case 'oelig': ch = String.fromCharCode(0x0153); break; 

                                    case 'Scaron': ch = String.fromCharCode(0x0160); break; 

                                    case 'scaron': ch = String.fromCharCode(0x0161); break; 

                                    case 'Yuml': ch = String.fromCharCode(0x0178); break; 

                                    case 'fnof': ch = String.fromCharCode(0x0192); break; 

                                    case 'circ': ch = String.fromCharCode(0x02c6); break; 

                                    case 'tilde': ch = String.fromCharCode(0x02dc); break; 

                                    case 'Alpha': ch = String.fromCharCode(0x0391); break; 

                                    case 'Beta': ch = String.fromCharCode(0x0392); break; 

                                    case 'Gamma': ch = String.fromCharCode(0x0393); break; 

                                    case 'Delta': ch = String.fromCharCode(0x0394); break; 

                                    case 'Epsilon': ch = String.fromCharCode(0x0395); break; 

                                    case 'Zeta': ch = String.fromCharCode(0x0396); break; 

                                    case 'Eta': ch = String.fromCharCode(0x0397); break; 

                                    case 'Theta': ch = String.fromCharCode(0x0398); break; 

                                    case 'Iota': ch = String.fromCharCode(0x0399); break; 

                                    case 'Kappa': ch = String.fromCharCode(0x039a); break; 

                                    case 'Lambda': ch = String.fromCharCode(0x039b); break; 

                                    case 'Mu': ch = String.fromCharCode(0x039c); break; 

                                    case 'Nu': ch = String.fromCharCode(0x039d); break; 

                                    case 'Xi': ch = String.fromCharCode(0x039e); break; 

                                    case 'Omicron': ch = String.fromCharCode(0x039f); break; 

                                    case 'Pi': ch = String.fromCharCode(0x03a0); break; 

                                    case ' Rho ': ch = String.fromCharCode(0x03a1); break; 

                                    case 'Sigma': ch = String.fromCharCode(0x03a3); break; 

                                    case 'Tau': ch = String.fromCharCode(0x03a4); break; 

                                    case 'Upsilon': ch = String.fromCharCode(0x03a5); break; 

                                    case 'Phi': ch = String.fromCharCode(0x03a6); break; 

                                    case 'Chi': ch = String.fromCharCode(0x03a7); break; 

                                    case 'Psi': ch = String.fromCharCode(0x03a8); break; 

                                    case 'Omega': ch = String.fromCharCode(0x03a9); break; 

                                    case 'alpha': ch = String.fromCharCode(0x03b1); break; 

                                    case 'beta': ch = String.fromCharCode(0x03b2); break; 

                                    case 'gamma': ch = String.fromCharCode(0x03b3); break; 

                                    case 'delta': ch = String.fromCharCode(0x03b4); break; 

                                    case 'epsilon': ch = String.fromCharCode(0x03b5); break; 

                                    case 'zeta': ch = String.fromCharCode(0x03b6); break; 

                                    case 'eta': ch = String.fromCharCode(0x03b7); break; 

                                    case 'theta': ch = String.fromCharCode(0x03b8); break; 

                                    case 'iota': ch = String.fromCharCode(0x03b9); break; 

                                    case 'kappa': ch = String.fromCharCode(0x03ba); break; 

                                    case 'lambda': ch = String.fromCharCode(0x03bb); break; 

                                    case 'mu': ch = String.fromCharCode(0x03bc); break; 

                                    case 'nu': ch = String.fromCharCode(0x03bd); break; 

                                    case 'xi': ch = String.fromCharCode(0x03be); break; 

                                    case 'omicron': ch = String.fromCharCode(0x03bf); break; 

                                    case 'pi': ch = String.fromCharCode(0x03c0); break; 

                                    case 'rho': ch = String.fromCharCode(0x03c1); break; 

                                    case 'sigmaf': ch = String.fromCharCode(0x03c2); break; 

                                    case 'sigma': ch = String.fromCharCode(0x03c3); break; 

                                    case 'tau': ch = String.fromCharCode(0x03c4); break; 

                                    case 'upsilon': ch = String.fromCharCode(0x03c5); break; 

                                    case 'phi': ch = String.fromCharCode(0x03c6); break; 

                                    case 'chi': ch = String.fromCharCode(0x03c7); break; 

                                    case 'psi': ch = String.fromCharCode(0x03c8); break; 

                                    case 'omega': ch = String.fromCharCode(0x03c9); break; 

                                    case 'thetasym': ch = String.fromCharCode(0x03d1); break; 

                                    case 'upsih': ch = String.fromCharCode(0x03d2); break; 

                                    case 'piv': ch = String.fromCharCode(0x03d6); break; 

                                    case 'ensp': ch = String.fromCharCode(0x2002); break; 

                                    case 'emsp': ch = String.fromCharCode(0x2003); break; 

                                    case 'thinsp': ch = String.fromCharCode(0x2009); break; 

                                    case 'zwnj': ch = String.fromCharCode(0x200c); break; 

                                    case 'zwj': ch = String.fromCharCode(0x200d); break; 

                                    case 'lrm': ch = String.fromCharCode(0x200e); break; 

                                    case 'rlm': ch = String.fromCharCode(0x200f); break; 

                                    case 'ndash': ch = String.fromCharCode(0x2013); break; 

                                    case 'mdash': ch = String.fromCharCode(0x2014); break; 

                                    case 'lsquo': ch = String.fromCharCode(0x2018); break; 

                                    case 'rsquo': ch = String.fromCharCode(0x2019); break; 

                                    case 'sbquo': ch = String.fromCharCode(0x201a); break; 

                                    case 'ldquo': ch = String.fromCharCode(0x201c); break; 

                                    case 'rdquo': ch = String.fromCharCode(0x201d); break; 

                                    case 'bdquo': ch = String.fromCharCode(0x201e); break; 

                                    case 'dagger': ch = String.fromCharCode(0x2020); break; 

                                    case 'Dagger': ch = String.fromCharCode(0x2021); break; 

                                    case 'bull': ch = String.fromCharCode(0x2022); break; 

                                    case 'hellip': ch = String.fromCharCode(0x2026); break; 

                                    case 'permil': ch = String.fromCharCode(0x2030); break; 

                                    case 'prime': ch = String.fromCharCode(0x2032); break; 

                                    case 'Prime': ch = String.fromCharCode(0x2033); break; 

                                    case 'lsaquo': ch = String.fromCharCode(0x2039); break; 

                                    case 'rsaquo': ch = String.fromCharCode(0x203a); break; 

                                    case 'oline': ch = String.fromCharCode(0x203e); break; 

                                    case 'frasl': ch = String.fromCharCode(0x2044); break; 

                                    case 'euro': ch = String.fromCharCode(0x20ac); break; 

                                    case 'image': ch = String.fromCharCode(0x2111); break; 

                                    case 'weierp': ch = String.fromCharCode(0x2118); break; 

                                    case 'real': ch = String.fromCharCode(0x211c); break; 

                                    case 'trade': ch = String.fromCharCode(0x2122); break; 

                                    case 'alefsym': ch = String.fromCharCode(0x2135); break; 

                                    case 'larr': ch = String.fromCharCode(0x2190); break; 

                                    case 'uarr': ch = String.fromCharCode(0x2191); break; 

                                    case 'rarr': ch = String.fromCharCode(0x2192); break; 

                                    case 'darr': ch = String.fromCharCode(0x2193); break; 

                                    case 'harr': ch = String.fromCharCode(0x2194); break; 

                                    case 'crarr': ch = String.fromCharCode(0x21b5); break; 

                                    case 'lArr': ch = String.fromCharCode(0x21d0); break; 

                                    case 'uArr': ch = String.fromCharCode(0x21d1); break; 

                                    case 'rArr': ch = String.fromCharCode(0x21d2); break; 

                                    case 'dArr': ch = String.fromCharCode(0x21d3); break; 

                                    case 'hArr': ch = String.fromCharCode(0x21d4); break; 

                                    case 'forall': ch = String.fromCharCode(0x2200); break; 

                                    case 'part': ch = String.fromCharCode(0x2202); break; 

                                    case 'exist': ch = String.fromCharCode(0x2203); break; 

                                    case 'empty': ch = String.fromCharCode(0x2205); break; 

                                    case 'nabla': ch = String.fromCharCode(0x2207); break; 

                                    case 'isin': ch = String.fromCharCode(0x2208); break; 

                                    case 'notin': ch = String.fromCharCode(0x2209); break; 

                                    case 'ni': ch = String.fromCharCode(0x220b); break; 

                                    case 'prod': ch = String.fromCharCode(0x220f); break; 

                                    case 'sum': ch = String.fromCharCode(0x2211); break; 

                                    case 'minus': ch = String.fromCharCode(0x2212); break; 

                                    case 'lowast': ch = String.fromCharCode(0x2217); break; 

                                    case 'radic': ch = String.fromCharCode(0x221a); break; 

                                    case 'prop': ch = String.fromCharCode(0x221d); break; 

                                    case 'infin': ch = String.fromCharCode(0x221e); break; 

                                    case 'ang': ch = String.fromCharCode(0x2220); break; 

                                    case 'and': ch = String.fromCharCode(0x2227); break; 

                                    case 'or': ch = String.fromCharCode(0x2228); break; 

                                    case 'cap': ch = String.fromCharCode(0x2229); break; 

                                    case 'cup': ch = String.fromCharCode(0x222a); break; 

                                    case 'int': ch = String.fromCharCode(0x222b); break; 

                                    case 'there4': ch = String.fromCharCode(0x2234); break; 

                                    case 'sim': ch = String.fromCharCode(0x223c); break; 

                                    case 'cong': ch = String.fromCharCode(0x2245); break; 

                                    case 'asymp': ch = String.fromCharCode(0x2248); break; 

                                    case 'ne': ch = String.fromCharCode(0x2260); break; 

                                    case 'equiv': ch = String.fromCharCode(0x2261); break; 

                                    case 'le': ch = String.fromCharCode(0x2264); break; 

                                    case 'ge': ch = String.fromCharCode(0x2265); break; 

                                    case 'sub': ch = String.fromCharCode(0x2282); break; 

                                    case 'sup': ch = String.fromCharCode(0x2283); break; 

                                    case 'nsub': ch = String.fromCharCode(0x2284); break; 

                                    case 'sube': ch = String.fromCharCode(0x2286); break; 

                                    case 'supe': ch = String.fromCharCode(0x2287); break; 

                                    case 'oplus': ch = String.fromCharCode(0x2295); break; 

                                    case 'otimes': ch = String.fromCharCode(0x2297); break; 

                                    case 'perp': ch = String.fromCharCode(0x22a5); break; 

                                    case 'sdot': ch = String.fromCharCode(0x22c5); break; 

                                    case 'lceil': ch = String.fromCharCode(0x2308); break; 

                                    case 'rceil': ch = String.fromCharCode(0x2309); break; 

                                    case 'lfloor': ch = String.fromCharCode(0x230a); break; 

                                    case 'rfloor': ch = String.fromCharCode(0x230b); break; 

                                    case 'lang': ch = String.fromCharCode(0x2329); break; 

                                    case 'rang': ch = String.fromCharCode(0x232a); break; 

                                    case 'loz': ch = String.fromCharCode(0x25ca); break; 

                                    case 'spades': ch = String.fromCharCode(0x2660); break; 

                                    case 'clubs': ch = String.fromCharCode(0x2663); break; 

                                    case 'hearts': ch = String.fromCharCode(0x2665); break; 

                                    case 'diams': ch = String.fromCharCode(0x2666); break; 

                                    default: ch = ''; break; 
                              } 
                        } 
                        i = semicolonIndex; 
                  }
            } 
            out += ch; 
      }
      return out;
}

// Function to disable the search button in the navigation bar.
function disableSearchButton() {
	var vinSearch = parent.topFrame.document.getElementById("VIN_SearchID");
	
	if (vinSearch != null || vinSearch != undefined) {
		vinSearch.disabled = true;
	}
}

// Function to disable the search button in the Vin Decode screen.
function disableVinDecodeSearchButton() {
	var searchButton = document.getElementById("SEARCH_ID");
	
	if (searchButton != null || searchButton != undefined) {
		searchButton.disabled = true;
	}
}

// Function to clear the values present in the parent frame.
function clearParentValues() {
	parent.index_form.vinDecodeTokens = "";
	parent.index_form.vinDecodeModelId = "";
	parent.index_form.vinDecodeSubModelId = ""; 
	parent.index_form.vinDecodeSerial = "";
	
	try {
		top.topFrame.document.getElementById("ddVinBottom").value = 550;
	} catch (vinBottomError) {
	}
	
	disableSearchButton();
	disableVinDecodeSearchButton();
}

// Function to hide the Vin Dropdown.
function resetVinDecode() {
      var url = document.location.href;
      var expForCategory = /JEPCCategoryMenu.html/;
      var expForContactUs = /JEPCContact.html/;
      var expForChangePassword = /JEPCChangePassword.html/;
      var expForOrigin = /flag=1/;
      var expForFlag = /flag/;
      var expForChangePwdOrigin = /flag=Login/;
      var searchForCategory = url.search(expForCategory);
      var searchForFlag = url.search(expForFlag);
      var searchForContactUs = url.search(expForContactUs);
      var searchForOrigin = url.search(expForOrigin);
      var searchForChangePassword = url.search(expForChangePassword);
      var searchForChangePwdOrigin = url.search(expForChangePwdOrigin);
      	
      if ((searchForContactUs != -1 && searchForOrigin != -1)
              || (searchForChangePassword != -1 && searchForChangePwdOrigin != -1)) { 
          return;
      }
	
      var dropDown = parent.topFrame.document.getElementById("imageHolder");
      
      if (searchForCategory != -1 && searchForFlag == -1) {
            return;
      }
      
      if (dropDown != null || dropDown != undefined) { 
            dropDown.className = "hiddenVisibility";
      }
      parent.index_form.vinDecodeJSONString.value = null;
      clearParentValues();
}

// Function to hide the dropdown if visible
function hideVinDropdown() {
	var dropdown = top.mainFrame.document.getElementById("vinMenuLevel0");
	var listBoxes = null;
	var listBoxesLength = null;
	var vinArrow = top.topFrame.document.getElementById("vinArrow");
	
	if (dropdown == undefined || dropdown == null) {
		return;
	}
	
	
	else {

		if (dropdown.style.visibility = "visible") {

	   		dropdown.style.visibility = "hidden";
    		listBoxes = top.mainFrame.document.getElementsByTagName("select");
    		listBoxesLength = listBoxes.length;
    		
			if (listBoxes != null && listBoxes != undefined) {
			
				for (var i = 0; i < listBoxesLength; i++) {
					if (listBoxes[i].id == "pgList" || listBoxes[i].id == "listOfShoppingCart") {
						var catLevel0 = top.mainFrame.document.getElementById("catMenuLevel0");
													
						if (listBoxes[i].id == "listOfShoppingCart" && dropdown.style.visibility == "hidden" && catLevel0.style.visibility == "hidden" ) {
							listBoxes[i].style.visibility = "visible";
						} else {
							continue;
						}
					} else {
						listBoxes[i].style.visibility = "visible";
					}
				}
			}
		} 
	vinArrow.src = "../images/downArrow.gif";
	}
}

var titleObj = document.getElementsByTagName("title");
try {
   var titleStr = titleObj[0].innerHTML;
 
   if (titleStr != null) {
      if (titleStr.indexOf("- ") > 0) {
         titleStr = titleStr.substring(titleStr.lastIndexOf("- ") + 1);
      }
   }
   top.frames[0].updateHistory(location.href,titleStr);
} catch (hstErr) {
}

function validateClearVin() {
	var vinModelId = parent.index_form.vinDecodeModelId;
	var vinSerial = parent.index_form.vinDecodeSerial;
	var vinTokens = parent.index_form.vinDecodeTokens;
	
	if (!(vinModelId != undefined && vinModelId != null && vinModelId.length > 0) || 
	    !(vinSerial != undefined && vinSerial != null && vinSerial.length > 0) ||
	    !(vinTokens != undefined && vinTokens != null && vinTokens.length > 0)) {
	   resetVinDecode();
	}
}

function getLangSpecificLength(maxLength, langId){
	var langId = langId;
	var maxLength = maxLength;
 	
 	if(langId in {'-10':'','-7':'','-6':''}) {
 		maxLength = Math.floor(maxLength/4);
 		return (maxLength);
 	} else {
	 	return maxLength;
	}
}

function getLangSpecificRegex(langIdx){
	var langIdx = langIdx;
	var regex = "";
	if(langIdx in {'-10':'','-7':'','-6':''}){
		regex = /[!@#$%^&*()_+]/;
 		return regex;
 	} else {
 		regex = /[^a-zA-ZZ???????????????????????????0-9\s-.]/;
	 	return regex;
	}
}

function getLangIDSpecificRegex(langId){
	var langId = langId;
	var validRegEx = "";
	if(langId in {'-10':'','-7':'','-6':''}){
		validRegEx = /[A-Za-z]/;
		return validRegEx;
 	} else {
 		validRegEx = /[!@#$%^&*()_+]/;
 		return validRegEx;
	}
}

// Function to populate language specific escape.
function langSpecificEscape(pData) {
	return encodeURIComponent(pData);
}

// Function to populate language specific unescape.
function langSpecificUnEscape(pData) {
	return decodeURIComponent(pData);
}
