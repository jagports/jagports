function buildTreeMenu(tree, menuArray, showAdvanceTree, urlLink, nodeIndex) {

   var menuCount = menuArray.length;

   for (i = 0; i < menuCount; i++) {

      var menuURL = "";

      if (menuArray[i][3] == 0) {
         menuURL = "javascript:tree.o(" + nodeIndex + ")";
      } else {
         menuURL = selectMenuOption(urlLink,menuArray[i][0],menuArray[i][1]);
      }

	  if (!(showAdvanceTree && menuArray[i][3] == 1)) {
      	tree.add(menuArray[i][0],menuArray[i][1],menuArray[i][2],menuURL);
      	nodeIndex++;
      }
   }

   return true;

}

function buildPopUpMenu(oM, menuArray, urlLink) {

   var menuCount = menuArray.length;

   for (i = 0; i < menuCount; i++) {

      var menuURL = "";

      if (menuArray[i][3] == 1) {
         menuURL = selectMenuOption(urlLink,menuArray[i][0],menuArray[i][1]);
      }

      oM.makeMenu(menuArray[i][0],menuArray[i][1],menuArray[i][2],menuURL);

   }

   return true;

}

function selectMenuOption(urlLink,childCategory,parentCategory) {
	return urlLink + "&categoryId=" + childCategory;
}
