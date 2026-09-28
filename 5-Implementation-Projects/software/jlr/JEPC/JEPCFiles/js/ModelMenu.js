/*******************************************************************************
 * File Name            : ModelMenu.js
 * Author               : Keane India Pvt Ltd.,
 * Date of Creation     : 13 February 2008.
 * Description          : Created for building the Model Menu page
 * Version Number       : 1.0
 * Modification History :
 Date        Version  Who            Description of change
 2008-02-13  1.0      Keane India    Initial - Functions to build the Model Menu
									 page.
*******************************************************************************/

var lastModel = 100;
var id = 0;
var languageId = parent.index_form.languageId.value;
var languageCode = getLanguageCode(languageId);
var pText = null;
 
 /**
 * Function to retrieve the model xml file based on the language selected. 
 */
function setModelMenu() {
	pText = parent.index_form.xmlData.value;
	
	if (pText != null || pText != undefined || pText != "") {
		buildUtility("buildMenu", unescape(pText));
	}
}

/**
 * Function to build the menu.
 *
 * @param pChildren		String[] - the array of sub-models.
 * @param pParent 		String - the model.
 * @param pFlag			int - used to differentiate between building the menu
 *						where the model name is same as the sub-model name
 *						(pFlag=1) and building the menu where model contains
 *						dissimilar sub-models(pFlag=0).
 */
function buildMenu(pChildren, pParent, pFlag) {
	var tmpRow = null;
	var div = null;
	var modelId = null;
	var table = null;
	var tmpCell = null;
	var tmpCell1 = null;
	var tmpCell2 = null;
	var splitTextParams = null;
	var	formattedChildren = null;
	var splitChildren = null;
	var identifiers = new Array();
	var childrenCount = null;
	childrenCount = pChildren.length;
	modelId = pParent[0];

	if (pFlag == 1) {
		splitTextParams = pChildren[0].split("\'");
		splitTextIdentifiers = splitTextParams[0].split(",");
		tmpRow = modelSlot.insertRow();
		tmpCell = tmpRow.insertCell();
		tmpCell.name = "Parent" + id;
		tmpCell.id = "Parent" + id;
		tmpCell.style.backgroundColor = "white";
		tmpCell.innerHTML = "<a class='buttonStyleMenuPage' id=\"Link" + id
				+ "\" href=\"JEPCCategoryMenu.html?modelId="
				+ splitTextIdentifiers[0] + "&modelName=" + escape(pParent[2])
				+ "&waterMarkModelId=" + modelId
				+ "\" onmouseover=\"changeModelImage('" + escape(modelId)
				+ "','" + escape(pParent[2]) + "','" + tmpCell.id + "','"
				+ "Link" + id + "')\">" + pParent[2] + "</a>";
	} else {
		tmpRow = modelSlot.insertRow();
		tmpCell = tmpRow.insertCell();
		tmpCell.name = "Parent" + id;
		tmpCell.id = "Parent" + id;
		tmpCell.style.backgroundColor = "white";
		tmpCell.innerHTML = "<a class='buttonStyleMenuPage' id=\"Link" + id
				+ "\" href=\"javascript:showModelMenu(" + id + ")\""
				+ "onmouseover=\"changeModelImage('"
				+ escape(modelId) + "', '" + escape(pParent[2]) + "', '"
				+ tmpCell.id + "', '" + "Link" + id + "')\">" + pParent[2]
				+ "</a>";
		div = document.createElement("div");
		div.id = "DIV" + id;
		div.style.visibility = "hidden";
		div.style.display = "none";
		table = document.createElement("table");
		table.width = "100%";
		table.cellPadding = "3";
		table.cellSpacing = "3";
		table.summary = "Contains the sub models of the model";
		document.getElementById("Parent" + id).appendChild(div);
		div.appendChild(table);

		for (var i = 0; i < childrenCount; i++) {
			lastIndexOfModelId = pChildren[i].indexOf(",");
			lastIndexOfParentId = pChildren[i].indexOf(",", lastIndexOfModelId + 1);
			firstIndexOfModelName = pChildren[i].indexOf("'");
			
			identifiers[0] = pChildren[i].substring(0, lastIndexOfModelId);
			identifiers[1] = pChildren[i].substring(lastIndexOfModelId + 1,
					lastIndexOfParentId);
			modelName = pChildren[i].substring(firstIndexOfModelName + 1,
					pChildren[i].length - 1);
			try {
				modelName = eval("unescape('" + modelName + "')");
			} catch (e) {
			}
			
			tmpRow = table.insertRow();
			tmpCell1 = "tmpCell1" + i;
			tmpCell2 = "tmpCell2" + i;
			tmpCell1 = tmpRow.insertCell();
			tmpCell1.width = "7%";
			tmpCell2 = tmpRow.insertCell();
			tmpCell2.width = "93%";
			tmpCell2.id = "tmpCell2" + id + i;
			tmpCell2.style.backgroundColor = "white";
			tmpCell2.innerHTML = "<a class=\" buttonStyleMenuPage \" id=\"childLink"
					+ id + i  + "\" href=\"JEPCCategoryMenu.html?modelId="
					+ identifiers[0] + "&modelName=" + escape(modelName)
					+ "&waterMarkModelId=" + modelId
					+ "\" onmouseover=\"changeModelImage('" + modelId + "', '"
					+ escape(modelName) + "', '" + tmpCell2.id + "', '"
					+ "childLink" + id + i + "')\">" + modelName + "</a>";
		}
	}
	id++;
}


/**
 * Function to change the model image.
 *
 * @param pImageName 	String - the name of the image to be displayed.
 * @param pModelName 	String - the alt text for the image is the name.
 */
 var lastHoveredModel = null;
 var lastHoveredLink = null;
function changeModelImage(pImageName, pModelName, pCell, pId) {
	var obj = document.getElementById(pCell);
	var link = document.getElementById(pId);
	var lastObj = null;
	var modelImage = document.getElementById("modelImg");
	
	obj.className = "modelHoverStyle";
	link.className = "buttonStyleMenuPage1";
	
	modelImage.alt = HtmlDecode(unescape(pModelName)) + "_Image"
	modelImage.src = "../images/" + unescape(pImageName) + ".jpg";
	
	if (lastHoveredModel != null && lastHoveredLink != null) {
		lastObj = document.getElementById(lastHoveredModel);
		lastObj.className = "modelNonHoverStyle";
		lastLink = document.getElementById(lastHoveredLink);
		lastLink.className = "buttonStyleMenuPage";
	}
	lastHoveredModel = pCell;
	lastHoveredLink = pId;
}

/**
 * Function to toggle the visibility of the sub-models of a given model.
 *
 * @param pMenuId 	String - the id of the model whose sub-models' visibility
 * 							 needs to be toggled.
 */
function showModelMenu(pMenuId) {
	var menuId = pMenuId;
	var modelMenu = document.getElementById("DIV" + menuId);
	var lastModelToggle = null;

	if (modelMenu.style.visibility == "visible") {
		modelMenu.style.visibility = "hidden";
		modelMenu.style.display = "none";
	} else {
		modelMenu.style.visibility = "visible";
		modelMenu.style.display = "block";
	}

	if ((lastModel != null && lastModel != undefined && lastModel != 100)
		&& (lastModel != menuId)) {
		lastModelToggle = document.getElementById("DIV" + lastModel);

		if (lastModelToggle.style.visibility == "visible") {
			lastModelToggle.style.visibility = "hidden";
			lastModelToggle.style.display = "none";
		} 
	}
	lastModel = menuId;
}
