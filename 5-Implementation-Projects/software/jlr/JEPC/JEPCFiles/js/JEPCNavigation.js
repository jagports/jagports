var historyItems = [];
var historyLimit = 15;
var historyIndex = 0;
var loadFromHistory = false;
var historyBackIndex = -1;

function updateHistory(url,description) {
   if (loadFromHistory == false) {
      var historyObj = [];
      historyObj[0] = url;
      historyObj[1] = description;

      if (historyBackIndex >= 0) {
         historyItems = shrinkHistoryList(historyBackIndex);
         historyBackIndex = -1;
      }

      var newIndex = 0;

      if (historyItems.length == historyLimit) {
         newIndex = pushHistory();
      }
      else {
         newIndex = (historyItems.length == 0 ? 0 : historyItems.length);
      }

      historyItems[newIndex] = historyObj;

      historyIndex = newIndex;
   }
   else {
      loadFromHistory = false;
   }
   updateButtonAvailability();
}

function pushHistory() {
   for (var i = 0; i < (historyItems.length - 1); i++) {
      historyItems[i] = historyItems[i+1]; 
   }
   return (historyItems.length - 1);
}

function historyBack() {
   if (historyIndex > 0) {
      historyIndex--;
      historyBackIndex = historyIndex;
      openHistoryUrl(historyItems[historyIndex][0],historyIndex);
   }
}

function historyForward() {
   if (historyIndex < (historyItems.length - 1)) {
      historyIndex++;
      openHistoryUrl(historyItems[historyIndex][0],historyIndex);
   }
}

function openHistoryUrl(newUrl,newIndex) {
   loadFromHistory = true;
   historyIndex = newIndex;
   updateButtonAvailability();
   top.frames[1].location=newUrl;
}

function updateButtonAvailability() {

   var allowFwd = ((historyItems.length > 0) && (historyIndex < (historyItems.length - 1)));
   var allowBck = ((historyItems.length > 0) && (historyIndex > 0));

   document.getElementById("histFwdBtn").src = "../images/" + (allowFwd ? "navforward.gif" : "navforward_grey.gif");
   document.getElementById("HistBckBtn").src = "../images/" + (allowBck ? "navback.gif" : "navback_grey.gif");
   document.getElementById('histDspBtn').src = '../images/downArrow.gif';
   document.getElementById('vinArrow').src = '../images/downArrow.gif';

}

function displayHistoryList() {

   var isHidden = false;
   
   try {
      isHidden = (top.frames[1].document.getElementById("histDiv").style.visibility == "hidden");
   }
   catch (hstErr) {
      isHidden = true;
   }

   if (isHidden) {   
      showHistoryList();
   }
   else {
      hideHistoryList();
   }
   
}

function showHistoryList() {

   if (historyItems.length > 0) {


      document.getElementById('histDspBtn').src = '../images/upArrow.gif';
   
      //try and pick up div if it exists...
      var histDiv = null;
      try {
         histDiv = top.frames[1].document.getElementById("histDiv");
      }
      catch (divErr) {
      }

     if (histDiv == null) {
         histDiv = top.frames[1].document.createElement('div');
         histDiv.setAttribute('id','histDiv');
         histDiv.style.visibility = "hidden";
         histDiv.style.position = "absolute";
         histDiv.style.zIndex = 99999;
         histDiv.style.border = "solid thin";
         histDiv.style.opacity = "100";
         histDiv.style.width = "auto";
         histDiv.style.left = 10;
         histDiv.style.top = 0;
         top.frames[1].document.body.appendChild(histDiv);
      }

      var listHTML = "<table class='popUpTable'>";
      for (var i = (historyItems.length-1); i >= 0; i--) {
         listHTML = listHTML + "<tr><td>"+(i == historyIndex ? "<img src='../images/tick.gif'>" : "&nbsp" ) + "</td><td><a class='popUpMenuItem' href='javascript:top.frames[0].openHistoryUrl(\""+historyItems[i][0]+"\","+i+")'>"+historyItems[i][1]+"</a></td></tr>";
      }
      listHTML = listHTML + "</table>";
      histDiv.innerHTML = listHTML;
      histDiv.style.visibility = "visible";
      
      try {
         top.frames[1].document.getElementById("ddSiblings").style.visibility = "hidden";
      }
      catch (histErr) {
      }

   }
}


function hideHistoryList() {
   try {
      document.getElementById('histDspBtn').src = '../images/downArrow.gif';
      top.frames[1].document.getElementById("histDiv").style.visibility = "hidden";
      top.frames[1].document.getElementById("ddSiblings").style.visibility = "visible";
   }
   catch (histErr) {
   }
}

function refreshPage() {
   loadFromHistory = true;
   updateButtonAvailability();
   top.frames[1].location.reload(true);
}

function printPage() {

   if (top.frames[1].document.location.href.indexOf("JEPCProductDrillDown") > 0) {

      var drillDown = top.frames[1].document.getElementById("oSpan_point");
      var flashImage = top.frames[1].document.getElementById("flashimage");
      var flashPrnt = top.frames[1].document.getElementById("imagePrnt");
      
      var ddHeight = drillDown.style.height;
      
      var allItemsHeight = 0;

      //see if we have a item 0...
      /*var thisItem = top.frames[1].document.getElementById("itemsTable0");
      if ((thisItem != null) && (thisItem != undefined)) {
         allItemsHeight = thisItem.style.height;
      }
      
      thisItem = top.frames[1].document.getElementById("itemsTable1");
      var itemIndex = 1;
      while ((thisItem != null) && (thisItem != undefined)) {
         allItemsHeight = allItemsHeight + thisItem.clientHeight;
         itemIndex++;
         thisItem = top.frames[1].document.getElementById("itemsTable"+itemIndex);
      }*/
      
      
      
      thisItem = top.frames[1].document.getElementById("itemsTable0");
      var itemIndex = 0;
      while (itemIndex < 100) {
         thisItem = top.frames[1].document.getElementById("itemsTable"+itemIndex);
         if ((thisItem != null) && (thisItem != undefined)) {
            allItemsHeight = allItemsHeight + thisItem.clientHeight;
         }
         itemIndex++;
      }
      
      
      
      
      
      
      
      
      
      //set the drill down to that which has been calculate plus the height of the product image
      drillDown.style.height = (allItemsHeight + 500) + "px";


      var imgPrint = top.frames[1].document.createElement("img");
      imgPrint.setAttribute('src', "../flash/images/" + top.frames[1].document.getElementById("prodImage").value + ".jpg");
      imgPrint.setAttribute('height', 500);
      imgPrint.setAttribute('width',400);

      drillDown.appendChild(imgPrint);
	  flashImage.style.visibility = "hidden";
      
      top.frames[1].focus();
      top.frames[1].print();

      drillDown.style.height = ddHeight;
      drillDown.removeChild(imgPrint);
	  flashImage.style.visibility = "visible";

   }
   else {
      top.frames[1].focus();
      top.frames[1].print();
   }
}

function shrinkHistoryList(savePosition) {

   historyShrink = [];
   
   for (var i = 0; i < (savePosition + 1); i++) {
      historyShrink[i] = historyItems[i];
   }
   
   return historyShrink;

}