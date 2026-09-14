/*******************************************************************************
 * File Name			: JEPCDrillDownDisplay.js
 * Author				: Keane India Pvt Ltd.,
 * Date of Creation		: 14 February 2008.
 * Description			: methods for drilldown control
 * Version Number		: 1.0
 * Modification History	:
   Date			Version		Who				Description of change
   2008-02-14	1.00		Keane India			Initial - created methods for 
   												building the "Shopping Cart" screen. 
   2009-06-02	1.01		Kevin Compton		Remedy 1652931 - escaped Supersession Part description 
   2011-04-27	1.02		RB1					Correct problem with part description that include html special characters going into basket.
   2012-01-19	1.03		RB1					supersessionLookUp function requires currency as a parameter but this was missing.
   2012-01-24	1.04	   	KHC            		RFC570 EDIX
   2012-06-13	1.05		RB1					RFC964 - Allow user to place all multiple supersession parts into basket in one go.
   2012-10-11	1.06		RB1					RFC1078 - Display price with commas.
*******************************************************************************/

    var drillitemNo='';
    var j = 1;
    var theEvent = false;
    var theDIV = false;
    var DH = 0;
    var an = 0;
    var al = 0;
    var ai = 0;
    var indicator = 0;
	var imageName = false;
    
    // Retrieving language Id and user details.
    var CartPartNumber;
    var logonId;
	var user;
	var multiParts = [];
	var languageId;
	var languageCode;
	var ssAppId = 0;
    var	ssSelectedItemNo;
	var forceSSLookUp = 0;
		
	var edixURL = "";
	var edixUserName = "";
	var edixPassword = "";
	var edixDParameter = "";
	
	//  To set the logonId, languageId, lagugaeCode.This method is called 
	// on 'onload' event of DrillDown Page.
	function setValues() {
		logonId = top.index_form.logonId.value;
		user = decryptData(unescape(logonId));
		languageId = top.index_form.languageId.value;
		languageCode = getLanguageCode(languageId);

		// Retrieve EDIX details if present
		EDIXObject = getEDIXFileDetails(user);
		if (EDIXObject != null) {
			edixURL = EDIXObject.url;
			edixUserName = EDIXObject.userName;
			edixPassword = EDIXObject.encryptedPassword;

			//calculate D parameter for EDIX
			var today = new Date();	
			d = (today.getFullYear() * (today.getMonth()+1) * today.getDate()) + (today.getMonth()+1);
			ds = d + '';
			var total=0;
			for(i=0; i<ds.length; i++)
				total = total + (parseInt(ds.charAt(i))) * (ds.length - i + 1);
			if ((10 - (total % 10)) == 10)
				total = ds + 0;
			else
				total = ds + (10 - (total % 10));
			edixDParameter = total;
		}
	}

	function setImageValue(imageNameToDisplay)
    {
        imageName = imageNameToDisplay;
    }

    if (document.getElementById)
    {
        ai = 1;
        DH = 1;
    }
    else
    {
        if (document.all)
        {
            al = 1;
            DH = 1;
        }
        else
        {
            browserVersion = parseInt(navigator.appVersion);
            
            if ((navigator.appName.indexOf('Netscape') != -1) && (browserVersion == 4))
            {
                an = 1;
                DH = 1;
            }
        }
    }

    // Returns the style or the reference of the element.
    function fd(oi, wS)
    {
        if (ai)
        {
            return wS ? document.getElementById(oi).style:document.getElementById(oi);
        }
        
        if (al)
        {
            return wS ? document.all[oi].style: document.all[oi];
        }
        
        if (an)
        {
            return document.layers[oi];
        }
    }

    // Returns the width of the body.
    function pw()
    {
        return window.innerWidth != null? window.innerWidth: document.body.clientWidth != null? document.body.clientWidth:null;
    }

    function mouseX(evt)
    {
        if (evt.pageX)
        {
            return evt.pageX;
        }
        else if (evt.clientX)
        {
            return evt.clientX + (document.documentElement.scrollLeft ?  document.documentElement.scrollLeft : document.body.scrollLeft);
        }
        else
        {
            return null;
        }
    }
    
    function mouseY(evt)
    {
        if (evt.pageY)
        {
            return evt.pageY;
        }
        else if (evt.clientY)
        {
            return evt.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
        }
        else
        {
            return null;
        }
    }
    
    function popUp(evt,oi)
    {
        if (DH)
        {
            var wp = pw(); 
            ds = fd(oi,1); 
            dm = fd(oi,0); 
            st = ds.visibility; 
    
            if (dm.offsetWidth) 
            {
                ew = dm.offsetWidth;
            }
            else if (dm.clip.width)
            {
                ew = dm.clip.width;
            }
    
            if (st == "visible" || st == "show")
            {
                ds.visibility = "hidden";
                return 0;
            }
            else
            {
                tv = mouseY(evt) + 20;
                lv = mouseX(evt) - (ew/4);
            }
    
            if (lv < 2)
            {
                lv = 2;
            }
            else if (lv + ew > wp)
            {
                lv -= ew/2;
            }
    
            if (!an)
            {
                lv += 'px';
                tv += 'px';
            }
            ds.left = lv;
            ds.top = tv;
            ds.visibility = "visible";
        }
    }
    
	function jepcdrillDown(){
		this.items = [];
	}

	function drillDownItemEntry(){
		this.oTable;
		this.itemNo;		
		this.description;
		this.productsArr = [];
		this.children = [];
		
	}

	function drillDownEntry() {
		this.open = false;
		this.id;
		this.parentId;
		this.description;
		this.price;
		this.discountCode;
		this.surcharge;
		this.qty;
		this.type;
		this.itemNo;
		this.partNumber;
		this.level = 0;
		this.isSuperSeded = 0;
		this.catentryId;
		this.rowObjs = [];
		this.total = 1;
		this.isDFS;
		this.isDealerNotes;
		this.isPIB;
		this.isSelected;
		this.isAllMultiSupersessSelected = false;
		this.allMultSupersessParts = [];
		this.applicationId;
		this.clientCode;
		this.internalPartNo;
		this.ssSelected = false;
		this.ssPartNo;
		this.ssDescription;
		this.ssDiscount;
		this.ssPrice;
		this.ssUnformattedPart;
		this.ssQty;
		this.isClassis = false;
	}
            
    function setCurrentHotspot(itemNo){
        try {
            chkObj= document.all.item("xitemCellNo_" + itemNo);
            if (chkObj.style.backgroundColor == '') {
                highlightSelectedRow(itemNo);
                deHighlightOtherRows(itemNo);
                setNewHotSpot(itemNo);
            }
        }
        catch (e) {
        }
    }

    function checkQuantity(form)
    {
        parsedInt =form.quantity.value;
        validInt = true;  
        try
        {
            pattern = /^[0-9]*$/;
            if((pattern.test(parsedInt)==false)){
                validInt = false;
            }
            if(validInt){
                validInt =(parsedInt<1 == false)
            }
        }
        catch (e)
        {
            validInt = false;
        }

        if (validInt == false)
        {
        	alert("Please enter a valid quantity");
            return false;
        }
        else
        {
         	form.quantity.value=parsedInt;
         	return true;
        }
    }

	/*********************
	Highlight the row that contains this item No
	**********************/
	function highlightSelectedRow(itemNo) {
		chkObj = document.all.item("xitemCellNo_" + itemNo);
		if (chkObj != null) {
			chkObj.className = "productsHighlight";
		}
	}

	function deHighlightOtherRows(itemNo) {
		var objs = document.all;
		for (var i = 0; i < objs.length; i++) {
			anObj = objs.item(i);
			objId = anObj.id.toString();
			pos = objId.indexOf('xitemCellNo_');
            if ( pos != -1 ) {
				objItemNo = objId.substring(pos+12);
				if ( objItemNo != itemNo ) {
					anObj.className = "products";
				}
			}
		}
	}

	function indicateShpItem()
    {
	   for (i = 0; i < itemshpId.length; i++)
       {
            //if(parent.document.varForm.cartName.value == itemshpId[i])
            //{
                //setHotspotInBasket(itemNoShpCart[i]);
            //}
        }
	}

	function setHotspotInBasket(itemNo) {
		document.getElementById("PartImage").setVariable("selectedNo", itemNo);
	}

    //function hotspotClick(Obj) {
    function hotspotClick (obj, modelId, categoryId, languageId) {
       try {
          itemNo = obj.toString();
          highlightSelectedRow(itemNo);
          deHighlightOtherRows(itemNo);
          setNewHotSpot(itemNo);
          jepcDrillDownLookup(itemNo, modelId, categoryId, languageId, "");               
       }
       catch (hotErr) {
       }
    }

	// Handle all the FSCommand messages in a Flash movie.
	function PartImage_DoFSCommand(command, args,itemNShpCart,itemId,drlitemNo) {
        if (command == "loadcomplete")
        {
  		    indicateShpItem(itemNShpCart,itemId);
 			if(drillitemNo != "")
            {
  			   setCurrentHotspot(drillitemNo);
            }
   		}
        else if (command == "hotspotclick")
        {
            hotspotClick(args);
   		}
        else
        {
			alert("Invalid command : " + command);
		}   
	}   

    function quantityUpdate(qtyId, childId, itemNo) {
       
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          var aTopLevelEntry = thejepcDrillDown.items[i];
          if (aTopLevelEntry.itemNo == itemNo) {
             for (var j = 0; j < aTopLevelEntry.children.length; j++) {
                var thisChild = aTopLevelEntry.children[j];
                if (thisChild.id == childId) {
                   thisChild.qty = document.getElementById(qtyId).value;
                   break;
                }
             }
             break;
          }
       }

	}

    // On click of Add to Shopping Cart. 
    function addItemToShoppingCart() {
		 forceSSLookUp = 0;
       if (unselectedSupersessionsExist()) {
       	forceSupersessionSelection(1);
          return;
       }
    
    	var index = document.forms['DrillDownForm'].listShoppingCartNames.selectedIndex;
		var cartName = document.forms['DrillDownForm'].listShoppingCartNames.options[index].value;
		var selectBox = top.topFrame.document.frameTop.minicartName;
		selectBox.options[index].selected = true;
				
		// Create an Array with all the item objects created above.
		var itemArray = thejepcDrillDown.getSelectedItemsForBasket();
				
		// To update the files with the details of newly added items. 
		updateNewItems(cartName, itemArray, user);
    }
    
    // On click of Add to New Shopping Cart link.
    function addToNewShoppingCart() {
		var regexp;
        forceSSLookUp = 0;
        if (unselectedSupersessionsExist()) {
           forceSupersessionSelection(2);
           return;           
        }

		var subTotal = 0;
		
		// Create an Array with all the item objects created above.
		var itemArray = thejepcDrillDown.getSelectedItemsForBasket();
	
        var shoppingCartName = document.getElementById("newShoppingCartName").value;
		shoppingCartName = shoppingCartName.replace(/^\s+|\s+$/g, '');

		if(languageId in {'-10':'','-7':'','-6':''}) {
			regexp = /[!@#$%^&*()_+]/;
		} else {
			regexp = /[^a-zA-Z0-9\s]/;
		}

        if (shoppingCartName == null || shoppingCartName == "" || shoppingCartName == undefined) {
            alert(eval("EMPTY_NEWCART_FIELD" + languageCode));
        } else if (regexp.test(shoppingCartName)) {
                alert(HtmlDecode(eval("INVALID_CARTNAME" + languageCode)));
        } else {
        
	        // To create new cart file and to write the item details into it.
	        var shopppingObject = new ShoppingCartObject(shoppingCartName, itemArray);
	       	var duplicateCheck = createShoppingFile(shopppingObject, shoppingCartName, user);
	       	
	       	if(duplicateCheck) {
	       		 alert(eval("DUPLICATE_CARTNAME" + languageCode));
	       	} else {
	       		subTotal = eval(calculateSubTotal(itemArray));
	       		
	       		// To update the user file with the new cart details.
		       	var cartObject = new UserCartObject(shoppingCartName, itemArray.length, "A", subTotal);
		        updateUserDetails(cartObject, user);
		        updateShoppingBasket(shoppingCartName, CartPartNumber);
		        top.topFrame.document.all("TotalItems").innerText = cartObject.numberOfItems;
				top.topFrame.document.all("SubTotalValue").innerText = formatPrice(cartObject.subTotal);
           }
       }    
       document.getElementById("newShoppingCartName").focus();   
    }
    
    function setModelCatId(pModelId, pCategoryId) { 
	      retrievedModelId = pModelId;
	      retrievedCategoryId = pCategoryId;
	}
	
   var retrievedModelId;
   var retrievedCategoryId;

   function isTechEmailAccessAllowed() {

       var logonId = '';
       try {    
          logonId = decryptData(unescape(parent.index_form.logonId.value));
       
          if (typeof(TQ_SALES_ORG) != "undefined" && typeof(TQ_ACCOUNT_NO) != "undefined") {
          
            //check sales org...
            if (TQ_SALES_ORG != undefined && TQ_SALES_ORG != null) {
               for (var i = 0; i < TQ_SALES_ORG.length; i++) {
                   if (TQ_SALES_ORG[i] == parent.index_form.salesOrg.value) {
                      return true;
                   }
                }
            }

             //check account number...
             if (TQ_ACCOUNT_NO != undefined && TQ_ACCOUNT_NO != null) {
                for (var i = 0; i < TQ_ACCOUNT_NO.length; i++) {
                   if (TQ_ACCOUNT_NO[i] == logonId) {
                      return true;
                   }
                }
             }
          }
       } catch (ssErr) {
            return false;
       }

       return false;

    }
    
    function displayOptions(partNumber, applicationId, imageFile, itemNo, itemId) {
    	CartPartNumber = partNumber;
    	var dropDown;
    	var flag = false;
    	var urlStr = false;
    	thejepcDrillDown.setChildItemSelected(itemNo,itemId);
    	
        var selectedOptionCount = countSelectedOptions();
        
        var displayStr = "";
        if (selectedOptionCount > 0) {
           displayStr = "<table cellpadding=\"0\" cellspacing=\"1\" border=\"0\">";
           
           if (selectedOptionCount == 1) {

              if (isTechEmailAccessAllowed()) {
                 displayStr = displayStr + "<td nowrap=\"nowrap\"  valign=\"middle\">";
                 urlStr = "JEPCTechnicalQuery.html?imageName="+imageFile+"&applicationId="+applicationId+"&partNumber="+partNumber+"&itemNo="+itemNo+"&modelId=" + retrievedModelId + "&categoryId=" + retrievedCategoryId;
                 displayStr = displayStr + "<a id=\"TechQueryID\" href=\"javascript:checkInternet('" + urlStr + "');\" class=\"categoryLinks\">" + eval("DD_TECHNICAL_QUERY" + languageCode) + "</a>&nbsp;&nbsp;";
                 displayStr = displayStr + "</td>";
                 displayStr = displayStr + "<td nowrap=\"nowrap\" valign=\"middle\">";
                 displayStr = displayStr + "<span class=\"orText\">" + eval("DD_OR" + languageCode) + "</span>&nbsp;&nbsp;";
                 displayStr = displayStr + "</td>";
              }
              displayStr = displayStr + "<td nowrap=\"nowrap\" valign=\"middle\">";
              urlStr = "JEPCProductEmail.html?imageName="+imageFile+"&applicationId="+applicationId+"&partNumber="+partNumber+"&itemNo="+itemNo+"&modelId=" + retrievedModelId +  "&categoryId=" + retrievedCategoryId;
              displayStr = displayStr + "<a id=\"EmailLinkID\" href=\"javascript:checkInternet('" + urlStr + "');\" class=\"categoryLinks\">" + eval("DD_PRODUCT_EMAIL" + languageCode) + "</a>&nbsp;&nbsp;";
              displayStr = displayStr + "</td><td nowrap=\"nowrap\" valign=\"middle\">";
              displayStr = displayStr + "<span class=\"orText\">" + eval("DD_OR" + languageCode) + "</span>&nbsp;&nbsp;";
              urlStr = "JEPCAddDealerNotes.html?partNumber="+ partNumber+"&itemNo="+itemNo+"&modelId=" + retrievedModelId +  "&categoryId=" + retrievedCategoryId;
              displayStr = displayStr + "<a id=\"DealerNotesID\" href=\"javascript:checkInternet('" + urlStr + "');\" class=\"categoryLinks\" id=\"WC_MyDealerNotesDisplay_Link_5\">";
              displayStr = displayStr + eval("DD_ADD_DEALER_NOTES" + languageCode) + "</a></td><td nowrap=\"nowrap\" valign=\"middle\">";
              displayStr = displayStr + "<span class=\"orText\">&nbsp;&nbsp;" + eval("DD_OR" + languageCode) + "</span>&nbsp;&nbsp;";
              displayStr = displayStr + "</td>";
           }
           displayStr = displayStr + "<td><input type=\"text\" id=\"newShoppingCartName\"name=\"description\" maxlength=\"20\">&nbsp;&nbsp;</td>";    
           displayStr = displayStr + "<td><a href=\"#\" onclick=\"addToNewShoppingCart();\" class=\"categoryLinks\" id=\"WC_CachedProductOnlyDisplay_Link_5\">" + eval("DD_ADD_TO_NEW_CART" + languageCode) + "&nbsp;&nbsp;</a>";
           
           // To get the shopping cart dropdown       
           var userObject = getShoppingCartDetails(user);
        
	       if (userObject != null) {
			   var cartArray = userObject.cartArray;
		   }
		
		   if (cartArray != null) {
        	       dropDown = "<span class=\"orText\">" + eval("DD_OR" + languageCode) + " </span>&nbsp;&nbsp;</td>";
        	       dropDown = dropDown + "</td><td nowrap=\"nowrap\" valign=\"middle\"><select id=\"listOfShoppingCart\" title=\"\" name=\"listShoppingCartNames\">";
	       	       var frame = top.topFrame.document.frameTop;	
	       	       var cartName;
			
			   if(frame != null && frame.minicartName != null) {
				   index = frame.minicartName.selectedIndex;
				   cartName = frame.minicartName.options[index].value;
			   }
			
	       	       for (var i = 0; i < cartArray.length; i++) {
				   var orderName = cartArray[i].cartName;
				   var status =  cartArray[i].status;
				   var orderNameDisplay = orderName.replace(/[\s]/g, "&nbsp;");
				   
				   if (status != null && status == "A") {
					   flag = true;
					   
					   if (orderName == cartName) {
						   dropDown = dropDown + "<option value='" + orderName + "' selected>" + orderNameDisplay + "</option>";
					   } else {
						   dropDown = dropDown + "<option value='" + orderName + "'>" + orderNameDisplay + "</option>";
					   }
				   }
	    	   }
	   		
	   		   if (flag) {
				   displayStr = displayStr + dropDown;
			       displayStr = displayStr + "</td><td nowrap=\"nowrap\" id=\"WC_CachedProductOnlyDisplay_TableCell_9\" valign=\"middle\">&nbsp;&nbsp;";
			       displayStr = displayStr + "<a href=\"#\" onclick=\"addItemToShoppingCart();return false;\" class=\"categoryLinks\" id=\"WC_CachedProductOnlyDisplay_Link_5\">" + eval("DD_ADD_TO_CART" + languageCode) + "</a></td>";
	   		   }
           }
        }
        displayStr = displayStr + "</tr></tbody></table>";
        dropDownDiv1 = document.getElementById('displayOptions');
        dropDownDiv1.innerHTML = displayStr; 
    }
    
    function countSelectedOptions() {

       var totalSelected = 0;
       
       var allOptions = document.getElementsByName("radioArray");
       
       for (var i = 0; i < allOptions.length; i++) {
          if (allOptions[i].checked) {
             totalSelected++;
          }
          if (totalSelected > 1) {
             break;
          }
       }
       
       return totalSelected;

    }
        
	jepcdrillDown.prototype.addHeaders = function (heading1, heading2, heading3, heading4, heading5, heading6) {
		var oTable = document.createElement("TABLE");
		var oTBody1 = document.createElement("TBODY");
		var oRow = document.createElement("TR");
		var oCell1 = document.createElement("TD");
		var oCell2 = document.createElement("TD");
		var oCell3 = document.createElement("TD");
		var oCell4 = document.createElement("TD");
		var oCell5 = document.createElement("TD");
		var oCell6 = document.createElement("TD");
		var oCell7 = document.createElement("TD");
		var oCell8 = document.createElement("TD");
		oTable.valign="top";
		oTable.appendChild(oTBody1);
		oTBody1.appendChild(oRow);
		oRow.appendChild(oCell1);
		oRow.appendChild(oCell2);
		oRow.appendChild(oCell3);
		oRow.appendChild(oCell4);
		oRow.appendChild(oCell5);
		oRow.appendChild(oCell6);
		oRow.appendChild(oCell7);
		oRow.appendChild(oCell8);
		oCell1.className = "productsTop";
		oCell2.className = "productsTop";
		oCell3.className = "productsTop";
		oCell4.className = "productsTop";
		oCell5.className = "productsTop";
		oCell6.className = "productsTop";
		oCell8.className = "productsTop";
		oCell1.innerHTML = heading1;
		oCell2.innerHTML = heading2;
		oCell3.innerHTML = heading3;
		oCell4.innerHTML = heading4;
		oCell5.innerHTML = heading5;
		oCell6.innerHTML = "&nbsp;";
		oCell7.innerHTML = "&nbsp;";
		oCell8.innerHTML = heading6;
		oCell1.width = "25";
		oCell2.width = "20";
		oCell3.width = "260";
		oCell4.width = "60";
		oCell5.width = "45";
		oCell6.width = "20";
		oCell7.width = "340";
		oCell8.width = "20";
		oSpan = document.all.item("oSpan_point");
		oSpan.appendChild(oTable);
	}
    
	jepcdrillDown.prototype.addTopLevelEntry = function (itemNo, description) {
		var aChild = new drillDownItemEntry();
		aChild.itemNo = itemNo;
		try {
			description = eval("unescape('" + description + "')");
		} catch (e) {
   		}
		aChild.description = description;
		aChild.oTable = document.createElement("TABLE");
		this.description = description;
		var oTBody1 = document.createElement("TBODY");
		var oRow = document.createElement("TR");
		var oCell1 = document.createElement("TD");
		var oCell2 = document.createElement("TD");
		var oCell3 = document.createElement("TD");
		var oCell4 = document.createElement("TD");
		var oCell5 = document.createElement("TD");
		var id = "xitemNo_" + itemNo;
		aChild.oTable.valign = "top";
		aChild.oTable.id = "itemsTable" + itemNo;
		oRow.className = "products";
		oRow.id = id;
		oTBody1.className = "products";
		aChild.oTable.appendChild(oTBody1);
		oTBody1.appendChild(oRow);
		oRow.appendChild(oCell1);
		oRow.appendChild(oCell2);
		oRow.appendChild(oCell3);
		oRow.appendChild(oCell4);
		oRow.appendChild(oCell5);
		oCell1.className = "productsNo";
		oCell1.width = '25';
		oCell2.className = "products";
		oCell2.width = '20';
		oCell2.valign = "center";
		oCell3.className = "products";
		oCell3.id = "xitemCellNo_" + itemNo;
		oCell3.width = '260';
		oCell4.className = "products";
		oCell4.width = '60';
		oCell5.className = "products";
		oCell5.width = '45';
		oCell1.innerHTML = "<a class='products' href='JavaScript:setCurrentHotspot(" + itemNo + ");'>" + itemNo + "</a>";
        oCell2.innerHTML = "<a class='products' href='JavaScript:setCurrentHotspot(" + itemNo + ");jepcDrillDownLookup(" + itemNo + "," + modelId + "," + categoryId + "," + languageId + ",\"\");'><center><div id=oChange_" + itemNo + "'>+</div></center></a>";
        oCell3.innerHTML = "<div onclick='setCurrentHotspot(" + itemNo + ");jepcDrillDownLookup(" + itemNo + "," + modelId + "," + categoryId + "," + languageId + ",\"\");'>" + description + '</div>';
		oSpan = document.all.item("oSpan_point");
		oSpan.appendChild(aChild.oTable);
		this.items[this.items.length] = aChild;
	}
	
	
function drawChild(aChild, parentId, itemNo, grpObj,atNo) {

		var oRow = document.createElement("TR");
		var oCell1 = document.createElement("TD");
		var oCell2 = document.createElement("TD");
		var oCell3 = document.createElement("TD");
		var oCell4 = document.createElement("TD");
		var oCell5 = document.createElement("TD");
		var oCell6 = document.createElement("TD");
		var id = "Row_" + aChild.id;
		oRow.id = id;
		oRow.className = "productDetail";
		oRow.appendChild(oCell1);
		oRow.appendChild(oCell2);
		oRow.appendChild(oCell3);
		oRow.appendChild(oCell4);
		oRow.appendChild(oCell5);
		oRow.appendChild(oCell6);
		oCell1.className = "productDetail";
		oCell2.className = "productDetail";
		oCell3.className = "productDetail";
		oCell4.className = "productDetail";
		oCell5.className = "productDetail";
		oCell6.className = "productDetail";
		
		oCell4.id = "colPrice_"+aChild.id;
		oCell3.width = '260';
		oCell1.innerHTML = "";
		
		var itemDescription = '';
		
		if (aChild.catentryId == 0 && aChild.partNumber == 0 ) { // if this child is an attribute or breakpoint 

			oCell2.innerHTML = "<a class='products' href='JavaScript:setCurrentHotspot(" + aChild.itemNo + ");thejepcDrillDown.showChildren(" + aChild.itemNo + "," + aChild.id + ",\"Y\"," + atNo + ");'><center><div id='oChange_" + aChild.id + "'>+</div></center></a>";
			oCell4.innerHTML = "";
			oCell5.innerHTML = "";
			itemDescription = aChild.description;
		}
		else {

			oCell2.innerHTML = "<INPUT name='radioArray' id='tick_'" + aChild.applicationId + "" + aChild.catentryId + "' type='checkbox' onclick=\"displayOptions('"+aChild.partNumber+"',"+aChild.applicationId+",'"+imageValue+"','"+aChild.itemNo+"','"+aChild.id+"');setCurrentHotspot('" + aChild.itemNo + "')\" value='" + aChild.itemNo + "," + aChild.applicationId + "" + aChild.catentryId + "'>";
			oCell4.innerHTML = formatPrice(aChild.price);
			
			//qty
			var quantityHtml;
			if (aChild.qty == "NLA")  {
				quantityHtml = "<INPUT id='qty_" + aChild.applicationId + "" + aChild.catentryId + "' disabled='disabled' value='NLA' type='text' maxlength='3' size='3'>";
			}
			else {
				quantityHtml = "<INPUT id='qty_" + aChild.applicationId + "" + aChild.catentryId + "' onchange=\"quantityUpdate('qty_" + aChild.applicationId + "" + aChild.catentryId+"','"+aChild.id+"','"+aChild.itemNo+"');\" value='" + aChild.qty + "' type='text' maxlength='2' size='2'>";
			}
			
			oCell5.innerHTML = quantityHtml;
			oCell6.innerHTML = "<a href='#&" + aChild.applicationId + "' onClick=\"javaScript:attSummaryLookup(this,event,'" + aChild.applicationId + "')\"><img style='border-style: none;' src='../images/rightArrow.gif' id='sideArrow"+ aChild.applicationId +"'/></a>";
        
            itemDescription = aChild.partNumber + (((aChild.description == null) || (aChild.description.length == 0)) ? " " : " - ") + aChild.description;

			if (aChild.isSuperSeded > 0) {
				itemDescription = itemDescription + "&nbsp;<a href='#' onClick=\"setCurrentHotspot('" + aChild.itemNo + "');displaySupersession('"+(aChild.clientCode.length == 1 ? "0":"")+aChild.clientCode+aChild.partNumber+"',"+aChild.isSuperSeded+","+aChild.itemNo+","+aChild.applicationId+",true);\"><img style='border-style: none;' src='../images/supersession.gif' alt='" + eval("SUPERSESSION" + languageCode) + "'/></a>";
			}
			
 			//EDIX
 			if (edixUserName != "" && edixPassword != "" && edixURL != "")
 				itemDescription = itemDescription + "&nbsp;<a href='#' onClick=\"setCurrentHotspot('" + aChild.itemNo + "');openEDIX('" + aChild.partNumber + "');\"><img style='border-style: none;' src='../images/EDIX.gif' alt='" + eval("EDIX_PART_NUMBER_ENQUIRY" + languageCode) + "'/></a>";

			if (aChild.isDFS == 1) {
				itemDescription = itemDescription + "&nbsp;<img style='border-style: none;' src='../images/dfs.gif' alt='" + eval("DFS" + languageCode) + "'/>";
			}
			
			if (aChild.isClassic) {
			   itemDescription = itemDescription + "&nbsp;<img style='border-style:none'src='../images/classic.gif' alt='Jaguar Classic Part'/>";
			}
			
			//dealer notes
			itemDescription = itemDescription + "&nbsp;<a id='dlrLink"+aChild.id+"'" + ((aChild.isDealerNotes == 1) ? "" : "style=\"visibility:hidden\"") + " href='javascript:checkInternet(\"JEPCDealerNoteView.html?partNumber="+aChild.partNumber+"&itemNo="+aChild.itemNo+"&modelId=" + modelId +  "&categoryId=" + categoryId + "\");'><img id='dlrImg"+aChild.id+"' " + ((aChild.isDealerNotes == 1) ? "style='border-style:none'" : "style='border-style:none;visibility:hidden;'") + " src='../images/Attachment.gif' alt='" + eval("DEALER_NOTE" + languageCode) + "'/></a>";

			//PIB
			itemDescription = itemDescription + "&nbsp;<a id='pibLink"+aChild.id+"'" + ((aChild.isPIB == 1) ? "" : "style=\"visibility:hidden\"") + " href='javascript:checkInternet(\"JEPCPibView.html?partNumber="+aChild.partNumber+"&itemNo="+aChild.itemNo+"&modelId=" + modelId +  "&categoryId=" + categoryId + "\");'><img id='pibImg"+aChild.id+"' " + ((aChild.isPIB == 1) ? "style='border-style:none'" : "style='border-style:none;visibility:hidden;'") + " src='../images/pib.gif'/></a>";
			
		}
		if (aChild.level == 0)
		{			
			if ( parentId == 1)
			{
				aChild.level = 1;
			}
			else
			{
				aChild.level = getLevelOfSibling(parentId,grpObj);
				aChild.level = aChild.level + 1;
			}
		}
		var counter =0;
		var spaces = "";
		
		for (counter;counter<aChild.level; counter++) {
			spaces = spaces + "&nbsp;&nbsp;&nbsp;";
		}        

		oCell3.innerHTML = "<div id=\"child"+aChild.id+"\" STYLE='width:260' nowrap='nowrap' onClick='setCurrentHotspot(" + aChild.itemNo + ");thejepcDrillDown.showChildren(" + aChild.parentId + "," + aChild.id + ",\"Y\"," + atNo + ")'>" + spaces + itemDescription +"</div>";
		
		if (parentId == itemNo) {
			oParent = document.all.item("xItemNo_" + itemNo);
		}
		else {
			oParent = document.all.item("Row_" + parentId);
		}
		
		oParent.appendChild(oRow);
		aChild.rowObjs[aChild.rowObjs.length] = oRow;
		aChild.open = true;

	}	

	function setPricingForPartNumber(itemNo, partNumber, price, discountCode, surcharge) {
		var item = 0;
		var found = false;
   
    	for (item; item < thejepcDrillDown.items.length; item++) {
		
			aTopLevelEntry = thejepcDrillDown.items[item];
			
			if (aTopLevelEntry.itemNo == itemNo) {
				var node = 0;
				for (node; node < aTopLevelEntry.children.length; node++) {
					aChild = aTopLevelEntry.children[node];
					if (aChild.catentryId != 0 && aChild.partNumber != 0) {
						if (aChild.partNumber == partNumber)  {
                	    	//bp update price and discount code
                    	    aChild.price = price;
                        	aChild.discountCode = discountCode;
                        	aChild.surcharge = (((surcharge == null)  || (surcharge.length == 0)) ? 0 : surcharge);
                        	if (aChild.open) {
                        	   try {
                        	      var colObj = document.getElementById("colPrice_"+aChild.id);
                        	      colObj.innerText = formatPrice(price);
                        	   }
                        	   catch (openErr) {
                        	      setTimeout("setPricingForPartNumber('"+itemNo+"','"+partNumber+"','"+price+"','"+discountCode+"','"+surcharge+"')", 1000);
                        	   }
                        	}
							found = true;
						}
					}
				}
			}
		}

		return found;
	}
	
	function setPIBForPart(itemNo, catentryId) {
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
	      if (thejepcDrillDown.items[i].itemNo == itemNo) {
	         for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
	            if (thejepcDrillDown.items[i].children[j].catentryId == catentryId) {
	               thejepcDrillDown.items[i].children[j].isPIB = 1;
	               if (thejepcDrillDown.items[i].children[j].open) {
	                   document.getElementById("pibLink"+thejepcDrillDown.items[i].children[j].id).style.visibility = "visible";
	                   document.getElementById("pibImg"+thejepcDrillDown.items[i].children[j].id).style.visibility = "visible";	                   
	               }
                }
	         }
	         break;
	      }
	   }
	}
	
	function setPIBForProduct(pibCatgroupId) {
       if (pibCatgroupId == categoryId) {
          catObj = document.getElementById("ddPopUp");
          var pibStr = "&nbsp;<a href='JEPCPibView.html?catGroupId="+categoryId+"&modelId=" + retrievedModelId +  "&categoryId=" + retrievedCategoryId + "'>";
          pibStr = pibStr + "<img style='border-style: none;' src='../images/pib.gif'/></a>";
          catObj.innerHTML = catObj.innerHTML + pibStr;
          return true;
       }
       return false;
	}
	
	function setDealerNotesForPart(itemNo,catentryId) {
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
	      if (thejepcDrillDown.items[i].itemNo == itemNo) {
	         for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
	            if (thejepcDrillDown.items[i].children[j].catentryId == catentryId) {
	               thejepcDrillDown.items[i].children[j].isDealerNotes = 1;
	               if (thejepcDrillDown.items[i].children[j].open) {
	                   document.getElementById("dlrLink"+thejepcDrillDown.items[i].children[j].id).style.visibility = "visible";
	                   document.getElementById("dlrImg"+thejepcDrillDown.items[i].children[j].id).style.visibility = "visible";
	               }	               
	            }
	         }
	         break;
	      }
	   }	
	}
	
	function getCatentryIdsForItem(itemNo) {
	
	   var itemCatentryIds = [];
	   var index = 0;
	   
	   for (var i = 0; i < thejepcDrillDown.items.length; i++) {
	      if (thejepcDrillDown.items[i].itemNo == itemNo) {
	         for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
                itemCatentryIds[index++] = thejepcDrillDown.items[i].children[j].catentryId;
	         }
	         break;
	      }
	   }
	   
	   return itemCatentryIds;
	
	}
	

	jepcdrillDown.prototype.findPart = function(itemNo, partNumber) {
	
		var item = 0;
		var found = false;
		var displayfindItemNo = "";
		var findPart;
		
		for (item; item < this.items.length; item++) {
			aTopLevelEntry = this.items[item];
			if (aTopLevelEntry.itemNo == itemNo) {
				for (var node = 0; node < aTopLevelEntry.children.length; node++) {
					aChild = aTopLevelEntry.children[node];
					if (aChild.partNumber == partNumber) {
					   findPart = findParent(aTopLevelEntry, aChild, aChild.itemNo);
					   displayfindItemNo = displayNode(aTopLevelEntry, aChild, findPart, aChild.itemNo);
						found = true;
						break;
					}
				}
				if (found == true ) {
					break;
				}
			}
		}
		return displayfindItemNo;
	}

	findParent = function (aTopLevelEntry, aNode, atNo) {
		var partArray = new Array(10);
		partArray[0] = aNode.id;
		partArray[1] = aNode.parentId;
		prodI = 2;
		var item = 0;
		var findparentId = aNode.id;
		while (findparentId != atNo) {
            var node = 0;
			for (node; node < aTopLevelEntry.children.length; node++) {
                aChild = aTopLevelEntry.children[node];
				if(aChild.id == findparentId) {
				    findparentId = aChild.parentId;
					partArray[prodI] = findparentId;
					prodI++;
					break;
				}
			}
		}
		return partArray;
	}

	displayNode = function (aTopLevelEntry, aNode, findPart, atNo) {
		var node = 0;
		var displayItemNo = "";
		var fp=findPart.length;
		var found = false;
		for (fp < findPart.length; fp >= 0; fp--) {
            if (findPart[fp] != "" && findPart[fp] != null)  {
                thejepcDrillDown.showChildren(aNode.itemNo,findPart[fp],"N",atNo);
            }
			else if(findPart[fp] == 0) {
                thejepcDrillDown.showChildren(aNode.itemNo,findPart[fp], "N", atNo);
            }
		}
		displayItemNo = aNode.itemNo;
		return displayItemNo;
	}

	getLevelOfSibling = function(parentId, obj)
	{
		var index =0;
		var retVal = 0;
		var parent;
		for (index; index < obj.children.length; index++)
		{
			parent = obj.children[index];
			if (parent.id == parentId)
			{
				retVal = parent.level+1;
				break;
			}
		}
		return retVal;
	}

	findChildrenAndRemoveRows = function (parentId, obj, oParent)
    {
        var index = 0;
        var aChild;
        for (index; index < obj.children.length; index++)
        {
            aChild = obj.children[index];
            if ( aChild.parentId == parentId && aChild.open)
            {
                for (i; i < aChild.rowObjs.length; i++)
                {
                    oParent.removeChild( aChild.rowObjs[i]);
                }
                aChild.rowObjs = [];
                aChild.open = false;

                if ( aChild.catentryId == 0 && aChild.partNumber == 0 )
                {
                    findChildrenAndRemoveRows(aChild.id, obj, oParent);
                }
            }
        }
    }

	jepcdrillDown.prototype.showChildren = function (theItemNo, parentId,drill,atmNo) {

        var index = 0;
        var aChild;
        var ids = false;

        for (index; index < this.items.length; index++)
        {
            aChild = this.items[index];
            if (aChild.itemNo == atmNo && aChild.children.length > 0)
            {
                if (drill =="Y") {
                    if (!thejepcDrillDown.checkDrillDown(aChild, parentId, theItemNo, drill, atmNo))
                    {
                        aChild.draw(theItemNo, parentId, drill, atmNo);
                        aChild.open = true;
                        break;
                    }
                }
                else {
               
                    aChild.draw(theItemNo, parentId, drill, atmNo);
                    aChild.open = true;
                    break;
                }
            }
        }
    }

	drillDownItemEntry.prototype.draw = function (itemNo, parentId, drill, atmNo) {
        var oTable = this.oTable;
        var oTBody = oTable.tBodies[0];
        var index = 0;
        var i = 0;
        this.open = true;
        for (index; index < this.children.length; index++) {
        
            aChild = this.children[index];
            if ( aChild.parentId == parentId && drill=="Y") {

                if ( !aChild.open)  {
                    drawChild(aChild, parentId, itemNo, this, atmNo);
                    aChild.open = true;
                 }
                 else { // close sub rows
                    if ( parentId ==itemNo ) {
                        oParent = document.all.item("xItemNo_" + itemNo);
                    }
                    else {
                        oParent = document.all.item("Row_" + parentId);
                    }
                    i = 0;
                    for (i; i < aChild.rowObjs.length; i++) {
                    	try {
                            oParent.removeChild( aChild.rowObjs[i]);
                        }
                        catch (e) {
                            aChild.open = false;
                        }
                    }
                    findChildrenAndRemoveRows(aChild.id, this, oParent);
                    aChild.rowObjs = [];
                    aChild.open = false;
                }
            }
            else if ( aChild.parentId == parentId) {
                if (!aChild.open) {
                    drawChild(aChild, parentId, itemNo, this, atmNo);
                    aChild.open = true;
                }
            }
        }
    }

	jepcdrillDown.prototype.checkDrillDown =  function(aChild, parentId, theItemNo, drill, atmNo)
    {
		if (drill == "Y")
        {
            var index=0;
    		var daChild;
    		var daCount=0;
    		var thechildId;
    		for (index; index < aChild.children.length; index++)
            {
                daChild = aChild.children[index];
                if (daChild.parentId == parentId)
                {
				    daCount++;
    				if (daCount == 1)
                    { 
    					thechildId=daChild.id;
    				}
		      		if (daCount > 1)
                    {
    					break;
	       			}
    			}
            }
        
        	if (daCount == 1)
            {
                if (parentId == theItemNo)
                {
				    oParent = document.all.item("xItemNo_" + theItemNo);
                }
				else
                {
                    oParent = document.all.item("Row_" + parentId);
                }
				if (oParent != null)
                {
				    aChild.draw(theItemNo, parentId,drill,atmNo);
                }
				var contDraw = thejepcDrillDown.checkDrillDown(aChild, thechildId, theItemNo, drill, atmNo);
                if (!contDraw)
                {
                    if (thechildId == 1)
                    {
                        oParent = document.all.item("xItemNo_" + theItemNo);
                    }
					else
                    {
					    oParent = document.all.item("Row_" + thechildId);
                    }
					if(oParent != null)
                    {
                        aChild.draw(theItemNo, thechildId,drill,atmNo);
						return true;
                    }
                }
				else
				{
                    return true;
                }
                return true;	
            }
            else
            {
                return false;
            }
		}
        else
        {
            return false;
        }

	}

	jepcdrillDown.prototype.checkEntry = function (itemNo)
	{
		var index = 0;
		var aChild;
		for (index; index < this.items.length; index++)
		{
			aTopLevelEntry = this.items[index];
			if ( aTopLevelEntry.itemNo == itemNo && aTopLevelEntry.children.length > 0)
            {
				return true;
			}
		}
		return false;
	}

    function hideDIV()
    {
        popUp(theEvent, "toolTip");
    }

    function setDIVContent(pEvent, pDIV)
    {
        theDIV = document.all(pDIV);
        theEvent = pEvent;
        if (theDIV != undefined && theDIV.id == pDIV)
        {
            theDIV.innerText = "Attribute details will be there along with breakpoints and qualifiers.";
        }
        else
        {
            alert("Null DIV " + theDIV);
        }
        popUp(pEvent, pDIV);
        setTimeout(hideDIV, 5000);
        indicator = 1;
        return true;
    }
    
    function clearContent()
    {
        if (indicator == 1) {
            var divTag = document.getElementById("toolTip");
            divTag.style.visibility = "hidden";
        }
    }
        
    function displayAttributes(pEvent) {
        setDIVContent(window.event, "toolTip");
    }

	jepcdrillDown.prototype.addEntry = function (itemNo, prodArray)
    {
		var index = 0;
		var aChild;
		for (index; index < this.items.length; index++)
        {
            aTopLevelEntry = this.items[index];
			if (aTopLevelEntry.itemNo == itemNo)
            {
				aTopLevelEntry.productsArr = prodArray;
				aTopLevelEntry.type = prodArray[0];
				aTopLevelEntry.buildChildren(itemNo);
				break;
			}
		}
	}

	drillDownItemEntry.prototype.buildChildren = function (itemNo) {
	
		var index = 0;
		var aChild = new drillDownEntry();
		aChild.type = itemNo;//item no
		aChild.parentId = this.productsArr[0];//parentid
		aChild.id = this.productsArr[1]; //child id
        aChild.itemNo = this.itemNo; //item no
		aChild.catentryId = this.productsArr[3];//catentry id
		aChild.partNumber = this.productsArr[4];//partnumber
		index = this.productsArr[8].indexOf("_") + 1;
		aChild.clientCode = this.productsArr[8].substring(index, index + 2); //client code
		aChild.internalPartNo = this.productsArr[8];//internal part number
		aChild.applicationId = this.productsArr[11];//application id
		try {
			this.productsArr[10] = eval("unescape('" + this.productsArr[10] + "')");
		} catch (e) {
   		}
		aChild.qty = this.productsArr[10];//quantity
		try {
			this.productsArr[2] = eval("unescape('" + this.productsArr[2] + "')");
	    } catch (e) {
   		}
		aChild.description = this.productsArr[2];
		
		if (aChild.catentryId != 0 && aChild.partNumber != 0) { //particular to a product item
            aChild.price = 0.00;//price            
			aChild.isDFS = this.productsArr[5];//dfs flag
			aChild.isSuperSeded = this.productsArr[6];//superseeded
			aChild.isClassic = (this.productsArr[7] == 1);//classic part
			aChild.isDealerNotes = 0;
			aChild.isPIB = 0; 
			aChild.isSelected = 0;
		}

		this.children[this.children.length] = aChild;

	}
	
	jepcdrillDown.prototype.getChildrenForItemNo = function (itemNo) {
	
		var index = 0;
		var itemChildren;
		
		for (index; index < this.items.length; index++) {
            var aTopLevelEntry = this.items[index];
			if (aTopLevelEntry.itemNo == itemNo) {
				itemChildren = aTopLevelEntry.children;
				break;
			}
		}
		
		return itemChildren;
		
	}
	
	jepcdrillDown.prototype.setChildrenForItemNo = function (itemNo, itemChildren) {

		var index = 0;
		
		for (index; index < this.items.length; index++) { 
            var aTopLevelEntry = this.items[index];
			if (aTopLevelEntry.itemNo == itemNo) {
				aTopLevelEntry.children = itemChildren;
				break;
			}
		}
		
		return true;
		
	}
	
	jepcdrillDown.prototype.setChildItemSelected = function (itemNo, itemId) {

       for (var i = 0; i < this.items.length; i++) {
          var aTopLevelEntry = this.items[i];
          if (aTopLevelEntry.itemNo == itemNo) {
             for (var j = 0; j < aTopLevelEntry.children.length; j++) {
                var childItem = aTopLevelEntry.children[j];
                if (childItem.id == itemId) {
                   if (childItem.isSelected == 1) {
                      childItem.isSelected = 0;
                   }
                   else {
                      childItem.isSelected = 1;
                   }
                   break;
                }
             }
          }
       } 

     }

	jepcdrillDown.prototype.getSelectedItemsForBasket = function() {
       var selectedItems = [];
       var selectedIndex = 0;
           
       for (var i = 0; i < this.items.length; i++) {
          var aTopLevelEntry = this.items[i];
          for (var j = 0; j < aTopLevelEntry.children.length; j++) {
          	 var description = escape(aTopLevelEntry.description);
             var childItem = aTopLevelEntry.children[j];
             if (childItem.isSelected == 1) {
             
                var thisItem = null;
                
                var partQty = 1;
                try {
                   partQty = parseInt(childItem.qty);
                   if (isNaN(partQty)) {
                      partQty = 1;
                   }
                }
                catch (qtyErr) {
                   partQty = 1;
                }
                             
                //pick up the correct part for supersessions if needed
					 if( (childItem.isSuperSeded > 0) && (childItem.isAllMultiSupersessSelected == true) ) {
					 	if( (childItem.allMultSupersessParts !=null) && (childItem.allMultSupersessParts.length > 0) ) {
					 		for(var k=0;k<childItem.allMultSupersessParts.length;k++) {
					 			var ssPartQty = 1;
					 			try {
                				ssPartQty = parseInt(childItem.allMultSupersessParts[k].Quantity);
                   			if (isNaN(partQty)) {
                      			ssPartQty = 1;
                   			}
                			}
                			catch (qtyErr) {
                   			ssPartQty = 1;
                			}
					 			ssSelectedItemNo = childItem.itemNo;
					 			ssAppId = childItem.applicationId;
					 			getSSPartDetails(childItem.allMultSupersessParts[k].PartNumber);
					 			thisItem = new ItemObject(eval(partQty*ssPartQty), childItem.ssPartNo.substring(2), escape(childItem.ssDescription), childItem.ssPrice, (childItem.ssDiscount == null ? "" : childItem.ssDiscount) , (isNaN(childItem.surcharge) ? 0.00 : childItem.surcharge), modelId, categoryId, childItem.itemNo, childItem.id, childItem.ssUnformattedPart.substring(0,2),formatInternalPartNo(childItem.ssUnformattedPart,true));
					 			selectedItems[selectedIndex++] = thisItem;
					 		}
					 	}
                
                } else {
                	if ((childItem.isSuperSeded > 0) && (childItem.ssPartNo != null) && (childItem.ssPartNo.length > 0)) {
                		var ssPartQty = 1;
                		try {
                   		ssPartQty = parseInt(childItem.ssQty);
                   		if (isNaN(partQty)) {
                      		ssPartQty = 1;
                   		}
                		}
                		catch (qtyErr) {
                   		ssPartQty = 1;
                		}
                   	thisItem = new ItemObject(eval(partQty*ssPartQty), childItem.ssPartNo.substring(2), escape(childItem.ssDescription), childItem.ssPrice, (childItem.ssDiscount == null ? "" : childItem.ssDiscount) , (isNaN(childItem.surcharge) ? 0.00 : childItem.surcharge), modelId, categoryId, childItem.itemNo, childItem.id, childItem.ssUnformattedPart.substring(0,2),formatInternalPartNo(childItem.ssUnformattedPart,true));
                	}
                	else {
                   	thisItem = new ItemObject(partQty, childItem.partNumber, description, (isNaN(childItem.price) ? 0.00 : childItem.price), (childItem.discountCode == null ? "" : childItem.discountCode), (isNaN(childItem.surcharge) ? 0.00 : childItem.surcharge), modelId, categoryId, childItem.itemNo, childItem.id, childItem.clientCode,formatInternalPartNo(childItem.internalPartNo,false));
                	}
                
                	//add item to array
                	if (thisItem != null) {
                   	selectedItems[selectedIndex++] = thisItem;
                	}
                }

             }
          }
          this.deSelectedItemsForBasket(i);
          
       }
       
       return selectedItems;
    
    }
    
    jepcdrillDown.prototype.deSelectedItemsForBasket = function(item) {
       var aTopLevelEntry = this.items[item];
       for (var j = 0; j < aTopLevelEntry.children.length; j++) {
       	var childItem = aTopLevelEntry.children[j];
       	childItem.ssSelected = false;
         childItem.isAllMultiSupersessSelected = false;
         childItem.allMultSupersessParts = null;
       }
    }

    
    
    function formatInternalPartNo(internalPartNo,ssPart) {

       var partPrefix = "";
       var partBody = "";
       var partSuffix = "";
                      
       try {
                      
          //remove the pb_ from the front of the string...
          var tempString = internalPartNo.substring(internalPartNo.indexOf("_") + 3);
                   
          partPrefix = tempString.substring(0,3);
          partBody = tempString.substring(3 + (ssPart ? 1 : 0), 9 + (ssPart ? 1 : 0));
          if (tempString.length > (9 + (ssPart ? 1 : 0))) {
             partSuffix = tempString.substring(9 + (ssPart ? 1 : 0));
          }

       }
       catch (e) {
          partPrefix = "";
          partBody = "";
          partSuffix = "";
       }

       return partPrefix+partBody+partSuffix;
       
    }
    
	
	var isInternetExplorer = navigator.appName.indexOf("Microsoft") != -1;

    // Hook for Internet Explorer.
    if (navigator.appName && navigator.appName.indexOf("Microsoft") != -1 && navigator.userAgent.indexOf("Windows") != -1 && navigator.userAgent.indexOf("Windows 3.1") == -1)
    {
		document.write('<script language=\"VBScript\"\>\n');
		document.write('On Error Resume Next\n');
		document.write('Sub PartImage_FSCommand(ByVal command, ByVal args)\n');
		document.write('	Call PartImage_DoFSCommand(command, args,itemNoShpCart,itemshpId,drillitemNo)\n');
		document.write('End Sub\n');
		document.write('</script\>\n');
	}
	
	function positionAttributeSummary(targetObj,cX,cY) {
        targetObj.x=cX;
        targetObj.y=cY;
        targetObj.style.left=targetObj.x-clearbrowseredge(obj, "rightedge", targetObj)+"px";
        targetObj.style.top=targetObj.y-clearbrowseredge(obj, "bottomedge", targetObj)+obj.offsetHeight+"px";
        targetObj.x=0;
        targetObj.y=0;
        targetObj.style.visibility = "visible";
	}


function iecompattest(){
return (document.compatMode && document.compatMode!="BackCompat")? document.documentElement : document.body
}

function clearbrowseredge(obj, whichedge, targetObj) {
   var horizontaloffset=0; //horizontal offset of menu from default location. (0-5 is a good value)
   var spaceoffset=4;
   var ie5=document.all;
   var ns6=document.getElementById&&!document.all;
   var edgeoffset=0;
   
   if (whichedge=="rightedge") {
      var windowedge=ie5 && !window.opera? iecompattest().scrollLeft+iecompattest().clientWidth-15 : window.pageXOffset+window.innerWidth-15
      targetObj.contentmeasure=targetObj.offsetWidth
      if (windowedge-targetObj.x-obj.offsetWidth < targetObj.contentmeasure) {
         edgeoffset=targetObj.contentmeasure+obj.offsetWidth+(horizontaloffset*2) //no space to the right of page? Move menu over to the left
      }
   }
   else{
      var topedge=ie5 && !window.opera? iecompattest().scrollTop : window.pageYOffset
      var windowedge=ie5 && !window.opera? iecompattest().scrollTop+iecompattest().clientHeight-15 : window.pageYOffset+window.innerHeight-18
      targetObj.contentmeasure=targetObj.offsetHeight
      if (windowedge-targetObj.y < targetObj.contentmeasure) { //move menu up?
         edgeoffset=targetObj.contentmeasure-obj.offsetHeight
         if ((targetObj.y-topedge)<targetObj.contentmeasure) //up no good either? (position at top of viewable window then)
         edgeoffset=targetObj.y
      }
   }
   return edgeoffset
}


    function displaySupersession(partNumber,ssType,ssItemNo,ssApplicationId,aSynch) {

       //need userid, password, sales org, part number, language code
       loadFSO();
       var logonId = '';
       try {    
          logonId = decryptData(unescape(parent.index_form.logonId.value));
//          logonId = logonId.toLowerCase();
       }
       catch (ssErr) {
          return false;
       }

       ssSelectedItemNo = ssItemNo;
       ssAppId = ssApplicationId;

       var authObj = getLogonFileDetails(logonId.trim());
       supersessionLookUp(partNumber,ssType,logonId,decryptData(unescape(authObj.logonPassword)).toLowerCase(),authObj.salesOrg,languageId,authObj.legacyCurrency,aSynch);
	   
    }
    
    
    function getSSPartDetails(partNumber) {

       //need userid, password, sales org, part number, language code & currency
       loadFSO();
       var logonId = '';
       try {    
          logonId = decryptData(unescape(parent.index_form.logonId.value));
       }
       catch (ssErr) {
          return false;
       }
       var authObj = getLogonFileDetails(logonId.trim());
       ssPartDetailsLookUp(partNumber,logonId,decryptData(unescape(authObj.logonPassword)).toLowerCase(),authObj.salesOrg,authObj.languageId,authObj.legacyCurrency,false);

    }
    
    function clickSupersession(partNumber,partDescription,partIndex,allowSelection,partQty) {
       if (allowSelection) {
          document.getElementById("selectedSSPart").value = partNumber;
          document.getElementById("selectedSSDesc").value = partDescription;
          document.getElementById("selectedSSQty").value = partQty;
          document.getElementById("ssLink"+partIndex).className = "popUpMenuItemSelected";
       }
    }
    
	function selectMultiSupersession() {
		for (var i = 0; i < thejepcDrillDown.items.length; i++) {          
      	if (thejepcDrillDown.items[i].itemNo == ssSelectedItemNo) {
         	for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
            	if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
            		thejepcDrillDown.items[i].children[j].ssSelected = true;
               	thejepcDrillDown.items[i].children[j].isAllMultiSupersessSelected = true;
               	thejepcDrillDown.items[i].children[j].allMultSupersessParts = eval(multiParts);
               }
            }
          	break;
         }          
      }
      multiParts = [];
      ssDisplay.style.visibility = "hidden";
      if (forceSSLookUp == 1) {
      	addItemToShoppingCart()
     	} else if (forceSSLookUp == 2) {
      	addToNewShoppingCart()
     	}
		
	}	
		
	        
    function selectSupersession() {
       if ((document.getElementById("selectedSSPart").value != '') && (document.getElementById("selectedSSPart").value.length > 0)) {       
          for (var i = 0; i < thejepcDrillDown.items.length; i++) {          
             if (thejepcDrillDown.items[i].itemNo == ssSelectedItemNo) {
                for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
                   if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
                   	thejepcDrillDown.items[i].children[j].isAllMultiSupersessSelected = false;
                   	thejepcDrillDown.items[i].children[j].ssQty = document.getElementById("selectedSSQty").value;
                      getSSPartDetails(document.getElementById("selectedSSPart").value);
                   }
                }
                break;
             }          
          }
          ssDisplay.style.visibility = "hidden";
          if (forceSSLookUp == 1) {
          	addItemToShoppingCart()
          }
          else if (forceSSLookUp == 2) {
             addToNewShoppingCart()
          }
       }
       else {
          alert("Please select a supersession");
       }
    }

    		

    
    function selectNoPartDetails() {
    	detailsDisplay.style.visibility = "hidden";
    }
    
    function selectNoSupersession() {
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          if (thejepcDrillDown.items[i].itemNo == ssSelectedItemNo) {
             for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
                if (thejepcDrillDown.items[i].children[j].applicationId == ssAppId) {
                   thejepcDrillDown.items[i].children[j].ssSelected = true;
                   thejepcDrillDown.items[i].children[j].ssPartNo = "";
                   thejepcDrillDown.items[i].children[j].ssDescription = "";
                }
             }
             break;
          }          
       }    
       ssDisplay.style.visibility = "hidden";    
       if (forceSSLookUp == 1) {
          addItemToShoppingCart()
       }
       else if (forceSSLookUp == 2) {
          addToNewShoppingCart()
       }
       
    }
    
    function unselectedSupersessionsExist() {
       var ssExists = false;
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
             if ((thejepcDrillDown.items[i].children[j].isSelected) && (thejepcDrillDown.items[i].children[j].isSuperSeded > 0) && (thejepcDrillDown.items[i].children[j].ssSelected == false)) {
                ssExists = true;
                break;
             }
          }
          if (ssExists) {
             break;
          }
       }
       return ssExists;
    }
    
    function cancelSupersession() {
       if (forceSSLookUp > 0) {
          alert("Add To Shopping Cart Cancelled");
       }
       ssDisplay.style.visibility = "hidden";    
    }
    
    function forceSupersessionSelection(forceType) {
       forceSSLookUp = forceType;
       var ssFound = false;
       for (var i = 0; i < thejepcDrillDown.items.length; i++) {
          for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
             if ((thejepcDrillDown.items[i].children[j].isSelected) && (thejepcDrillDown.items[i].children[j].isSuperSeded > 0) && (thejepcDrillDown.items[i].children[j].ssSelected == false)) {
                var aChild = thejepcDrillDown.items[i].children[j]
                displaySupersession((aChild.clientCode.length == 1 ? "0":"")+aChild.clientCode+aChild.partNumber,aChild.isSuperSeded,aChild.itemNo,aChild.applicationId,false);
                ssFound = true;
                break;
             }
          }
          if (ssFound == true) {
             break;
          }
       }    
    }
    
    

function getItemCatEntryId(itemNo) {

   var catEntryList = "";

   for (var i = 0; i < thejepcDrillDown.items.length; i++) {
      if (thejepcDrillDown.items[i].itemNo == itemNo) {
         for (var j = 0; j < thejepcDrillDown.items[i].children.length; j++) {
            catEntryList = catEntryList + (catEntryList.length > 0 ? "," : "") + thejepcDrillDown.items[i].children[j].catentryId;
         }
         break;
      }
   }

   return catEntryList;

}


/**
 * Function to retrieve the contents of the edix file created.
 *
 * @param pLogonId - name of the file
 * @return Obj - contains details stored in the file.
 */
function getEDIXFileDetails(pLogonId) {
	var Obj = null;
	var userFolder = validateRootFolder(edix);
	var userFile = "EDIX" + pLogonId + ".xml";
	var folderName = rootFolder + "\\" + edix;
	var fileName = folderName + "\\"+ userFile;
	var serializer = new JSSerializer();
	var status = false;

	if (userFolder) {
		if (fileSystemObject.FileExists(fileName)) {
			var FileObj = readEDIXFileContents(fileName);
			Obj = serializer.deserialize(FileObj);
		} 
	}
	return Obj;
}

/**
 * Function to read the file contents.
 *
 * @param pFileName - name of the file to be read
 * @return fileContents - the contents of the file 
 */
function readEDIXFileContents(pFileName) {
	var file = fileSystemObject.OpenTextFile(pFileName, forReading, false);
	var fileContents = file.ReadAll();
	file.Close();
	return fileContents;
}

/**
 * Function to create an object of edix login details to be stored in file.
 *
 * @param pURL - The EDIX url entered by the user
 * @param pUserName - The EDIX User name entered by the user
 * @param pEncryptedPassword - The encrypted password entered by the user
 * @param pDate - The date when user has updated the EDIX authentication.
 */
function EDIXObject(pURL, pUserName, pEncryptedPassword, pDate) {
	this.url = pURL;
	this.userName = pUserName;
	this.encryptedPassword = pEncryptedPassword;
	this.date = pDate;
}


function openEDIX(pModelId) {
    var aHref = edixURL + "?N=" + edixUserName + "&P=" + edixPassword + "&A=search&S=" + pModelId + "_1&R=unipart&D="+edixDParameter;
    var openedWindow = "";
        openedWindow = window.open(aHref, "EDIX", "height=640, width=850, resizable=1");	    
		openedWindow.focus();
}

