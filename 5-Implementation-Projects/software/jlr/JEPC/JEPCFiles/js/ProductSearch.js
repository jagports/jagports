
var urlContext;
var queryString;
var url;
var languageId;
var languageCode;
var searchMode;
var modelArray;
var modelDescArray;
var resultsFound = false;
var currModel = 0;
var currResults = 0;
var limitExceeded = false;
var attributesExceeded = false;

function initialise() {
	// build URL for search web service
	urlContext = getUrl();
	var request = location.href;
	
	var queryIndex = request.indexOf("?");
	if(queryIndex < 0) {
		completeSearch();
		return;
	}
	
	queryString = request.substring(queryIndex + 1); 
	url = urlContext + "doSearchProducts.jepc?" + queryString;
	url += "&SearchLimit=" + searchResultsLimit;
			
	// set language for screen
	setScreenLanguage();

	// set search string in heading
	setSearchHeading();
	
	// determine search mode
	setSearchMode();

	// add div section for each model
	addModelResultSections();

	// start search
	initRequest();
	doSearch();
}

function addModelResultSections() {
	var numModels = 1;
	
	if(searchMode == "STANDARD") {
		// get models from xml file
		getModels();
		numModels = modelArray.length;
	} 
	
	// add div sections for each model
	var resultsHTML = "";
	for(i = 0; i < numModels; i++) {
		resultsHTML += "<div id = 'results" + (i + 1) + "'></div>";
	}

	document.getElementById("searchResults").innerHTML = resultsHTML;
}

function setSearchHeading() {
	var searchString = getSearchString();
	document.getElementById("SEARCHRESULTS_HEADING_ID").innerHTML += "&nbsp;<font color='black'>" + searchString + "</font>";
}

function setScreenLanguage() {
	// get language id
	var languageIndex = queryString.indexOf("LanguageId") + 11; 
	var nextIndex = queryString.indexOf("&", languageIndex); 
	if(nextIndex == -1) {
		languageId = queryString.substring(languageIndex);
	} else {
		languageId = queryString.substring(languageIndex, nextIndex);
	} 
	languageCode = getLanguageCode(languageId);
	
	// set translations for labels
	setLanguage();
}

function setSearchMode() {
	if(queryString.indexOf("CategoryId") >= 0) {
		searchMode = "ADVANCED";
	} else if(queryString.indexOf("ModelId") >= 0) {
		searchMode = "VIN";
	} else {
		searchMode = "STANDARD";
	}
}

function getModels() {
	var xmlStr = new String(unescape(parent.index_form.xmlData.value));
	var lines = xmlStr.split("\n");

	var numModels = 0;
	var catalogId = -1;
	modelArray = new Array();
	modelDescArray = new Array();
	var lineArray = new Array();
	
	for(i = 0; i < lines.length; i++) {
		// line is a model if the 2nd element is the catalog id
		if(lines[i].charAt(0) == "[") {
			lines[i] = lines[i].substring(1, lines[i].length - 1);
			lastIndexOfModelId = lines[i].indexOf(",");
			lastIndexOfParentId =lines[i].indexOf(",", lastIndexOfModelId + 1);
			firstIndexOfModelName =lines[i].indexOf("'");
			                                                
			modelId = lines[i].substring(0, lastIndexOfModelId);
			parentId = lines[i].substring(lastIndexOfModelId + 1, lastIndexOfParentId);
			modelName = lines[i].substring(firstIndexOfModelName + 1, lines[i].length - 1);
			
			lineArray[0] = modelId;
			lineArray[1] = parentId;
			lineArray[2] = modelName;

			if(modelArray.length == 0) {
				catalogId = lineArray[1];
			}

			if(lineArray[1] == catalogId) {
				modelArray[numModels] = lineArray[0];
				modelDescArray[numModels] = lineArray[2];
				numModels++;
			}
		}
	}
}

function getSearchString() {
	var searchStringIndex = queryString.indexOf("SearchString") + 13; 
	var nextParam = queryString.indexOf("&", searchStringIndex); 
	var searchString;
	if(nextParam == -1) {
		searchString = queryString.substring(searchStringIndex);
	} else {
		searchString = queryString.substring(searchStringIndex, nextParam);
	} 

	return langSpecificUnEscape(searchString.toUpperCase());
}

function doSearch() {
	var searchCompleted = false;

	if(searchMode == "ADVANCED" || searchMode == "VIN") {
		// search category or model in query string
		if(currModel == 0) {
			searchModel(-1);
		} else {
			searchCompleted = true;
		}
	} else  {
		// standard search so search each model
		if(currModel < modelArray.length) {
			var modelId = modelArray[currModel]; 
			var modelDesc = modelDescArray[currModel];
			
			// show search model message
			showSearchMessage(modelDesc);
			
			searchModel(modelId);
		} else {
			searchCompleted = true;
		}
	}
	
	if(searchCompleted) {
		completeSearch();
	}
}

function showSearchMessage(modelDesc) {
	// show search model message
	var message = "<br/><div class='searchResults'>&nbsp;&nbsp;";
	message += eval("SEARCHRESULTS_SEARCHING" + languageCode);
	message += " " + eval("unescape('" + modelDesc + "')");
	
	message += "</div>";
	
	var div = document.getElementById("results" + (currResults + 1));
	div.innerHTML = message;
}

function completeSearch() {
	document.getElementById("searchImage").innerHTML = "";
	if(!resultsFound) {
		var tableHeading = document.getElementById("searchResults_Table_Heading");
		tableHeading.style.visibility = "hidden";
		tableHeading.style.display = "none";

		var noResult = document.getElementById("SEARCHRESULTS_NO_RESULT_ID");
		noResult.style.visibility = "visible";
		noResult.style.display = "block";
	} else {
		if(limitExceeded) {
			if(searchMode == "STANDARD") {
			    if (attributesExceeded) {
 				   alert(eval("SEARCHRESULTS_ATTR_USE_ADVANCED_SEARCH" + languageCode));
 				}
 				else {
 				   alert(eval("SEARCHRESULTS_USE_ADVANCED_SEARCH" + languageCode));
 				}
			} else {
			   alert(eval("SEARCHRESULTS_REFINE_SEARCH" + languageCode));
			}
		}
	}
}

function searchModel(modelId) {
	var serviceURL = url; 
	if(modelId != -1) serviceURL += "&ModelId=" + modelId

	//Open connection to web service
	req.open("GET", serviceURL, true);

	//Set routine to handle response
	req.onreadystatechange = showSearchResults; 
	
	//Send request to web service
	req.send(null);
}

function showSearchResults() {
	if(req.readyState == 4) {
		if(req.status == 200) {
			var response =  eval('(' + req.responseText + ')');		

			if(response.ReturnCode == 'SUCCESS') {
				var searchItems = response.SearchItems;

				var resultsHTML = "<br/>";
				var resultsDiv;
				if(searchItems.length > 0) {
					currResults++;
					resultsDiv = document.getElementById("results" + currResults);
					resultsFound = true; 
					if(response.LimitExceeded == "true") {
						limitExceeded = true;
						if (response.AttributesExceeded == "true") {
						   attributesExceeded = true;
						}
					}
				} else {
					// clear search message
					resultsDiv = document.getElementById("results" + (currResults + 1));
					resultsHTML = "";
				}


				for(i = 0; i < searchItems.length; i++) {
					var searchItem = searchItems[i];
					if(i > 0) resultsHTML += "<br/>";

					resultsHTML += '<table border="0" cellspacing="0" cellpadding="5" width="99%">';
					resultsHTML += '<tr valign="top">';

					resultsHTML += '<td width="20%">';
					resultsHTML += '<table border="0" cellspacing="0" cellpadding="0" width="100%">';
					if(i == 0) {
						resultsHTML += '<tr valign="top" class="searchResults">';
          				resultsHTML += '<td class="searchResults">' + eval("unescape('" + response.ModelDescription + "')") + '</td>';
       					resultsHTML += '</tr>';
					}
					if((i == 0) || (i > 0 && (searchItem.Categories[1].CategoryId != searchItems[i - 1].Categories[1].CategoryId))) {
						resultsHTML += '<tr valign="top" class="searchResults">';
          				resultsHTML += '<td class="searchResults">&nbsp;&nbsp;&nbsp;' + eval("unescape('" + searchItem.Categories[1].CategoryDescription + "')") + '</td>';
       					resultsHTML += '</tr>';
					}
					resultsHTML += '</table>';
					resultsHTML += '</td>';

					resultsHTML += '<td width="30%">';
					resultsHTML += '<table border="0" cellspacing="0" cellpadding="0" width="100%">';
					if((i == 0) || (i > 0 && (searchItem.Categories[2].CategoryId != searchItems[i - 1].Categories[2].CategoryId))) {
						resultsHTML += '<tr valign="top" class="searchResults">';
          				resultsHTML += '<td class="searchResults">' + eval("unescape('" + searchItem.Categories[2].CategoryDescription + "')") + '</td>';
       					resultsHTML += '</tr>';
					}
					if((i == 0) || (i > 0 && (searchItem.Categories[3].CategoryId != searchItems[i - 1].Categories[3].CategoryId))) {
						resultsHTML += '<tr valign="top" class="searchResults">';
          				resultsHTML += '<td class="searchResults">&nbsp;&nbsp;&nbsp;' + eval("unescape('" + searchItem.Categories[3].CategoryDescription + "')") + '</td>';
       					resultsHTML += '</tr>';
					}
					resultsHTML += '<tr valign="top" class="searchResults">';
          			resultsHTML += '<td class="searchResults">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + eval("unescape('" + searchItem.Categories[4].CategoryDescription + "')") + '</td>';
       				resultsHTML += '</tr>';
					resultsHTML += '</table>';
					resultsHTML += '</td>';
					resultsHTML += '<td width="50%" class="searchResults">';
					resultsHTML += '<table border="0" cellspacing="0" cellpadding="0" width="100%">';
					for(j = 0; j < searchItem.ProductDetails.length; j++) {
						var productDetails = searchItem.ProductDetails[j];

						var title = "";
						for(k = 0; k < productDetails.Qualifiers.length; k++) {
							if(title.length > 0) title += " - ";
							title += eval("unescape('" + productDetails.Qualifiers[k].QualifierDescription + "')");
						}
						if(productDetails.FitmentDescription != null) {
							if(title.length > 0) title += " - ";
							title += eval("unescape('" + productDetails.FitmentDescription + "')");
						}
						
						resultsHTML += '<tr class="searchResults"  valign="top">';
						resultsHTML += '<td class="searchResultsLink">';
						resultsHTML += '<a class="searchResultsLink" href="JEPCProductDrillDown.html?itemNo=' + productDetails.ItemNumber + '&partNumber=' + productDetails.PartNumber + '&modelId=' + searchItem.Categories[1].CategoryId + '&categoryId=' + searchItem.Categories[4].CategoryId + '&languageId=' + languageId + '&currencyCode=' + parent.index_form.currency.value + '" title="' + title + '">';

						resultsHTML += "<b>" + productDetails.PartNumber + "</b>";
						resultsHTML += " ";
						resultsHTML += eval("unescape('" + productDetails.PartDescription + "')");
						
						for(k = 0; k < productDetails.Attributes.length; k++) {
							resultsHTML += " - ";
							if(productDetails.Attributes[k].Exclude == "true") resultsHTML += "Except ";
							resultsHTML += eval("unescape('" + productDetails.Attributes[k].AttributeValueDescription + "')");
						}
									
						for(k = 0; k < productDetails.BreakPoints.length; k++) {
							if(productDetails.BreakPoints[k].BreakPointId == "0") continue;
							resultsHTML += " - ";
							resultsHTML += (k == 0) ? "From " : "To ";
							resultsHTML += eval("unescape('" + productDetails.BreakPoints[k].BreakPointDescription + "')");
							resultsHTML += " (";
							resultsHTML += eval("unescape('" + productDetails.BreakPoints[k].BreakPointValueDescription + "')");
							resultsHTML += ")";
						}
						resultsHTML += '</a>';

						if(productDetails.DFS == "true") resultsHTML += "<img src='../images/dfs.gif' alt='" + eval("DFS" + languageCode) + "'/>";
						if(productDetails.ClassicPart == "true") resultsHTML += "<img src='../images/classic.gif' alt='Jaguar Classic Part'/>";
						if(productDetails.Supersession == "true") resultsHTML += "<img src='../images/supersession.gif' alt='" + eval("SUPERSESSION" + languageCode) + "'/>"; 

						resultsHTML += '</td>';
   						resultsHTML += '</tr>';
					}
					resultsHTML += '</table>';
					resultsHTML += '</td>';

					resultsHTML += '</tr>';
					resultsHTML += '</table>';
				}

				if(resultsDiv) resultsDiv.innerHTML = resultsHTML;

				currModel += 1; 
				doSearch();

			} else {
				alert(response.Message); 
				completeSearch();
			}
		}
	}
}

function setLanguage() {
	// set translated text for labels
	heading = document.getElementById("SEARCHRESULTS_HEADING_ID");
	heading.innerHTML = eval("SEARCHRESULTS_HEADING_ID" + languageCode);
	
	model = document.getElementById("SEARCHRESULTS_MODEL_ID");
	model.innerHTML = eval("SEARCHRESULTS_MODEL_ID" + languageCode);
	
	category = document.getElementById("SEARCHRESULTS_CATEGORY_ID");
	category.innerHTML = eval("SEARCHRESULTS_CATEGORY_ID" + languageCode);
	
	product = document.getElementById("SEARCHRESULTS_PRODUCT_ID");
	product.innerHTML = eval("SEARCHRESULTS_PRODUCT_ID" + languageCode);
	
	noResult = document.getElementById("SEARCHRESULTS_NO_RESULT_ID");
	noResult.innerHTML = eval("SEARCHRESULTS_NO_RESULT_ID" + languageCode);
}