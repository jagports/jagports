function filterDrillDownItem(drillDown, drillDownAttributes, serialNo, vehicleAttributes) {

   var filteredChildren;

   if ((serialNo != null) && (serialNo.length > 0)) {
      //filter the drill down for the serial no..
      filteredChildren = filterOnBreakPoint(drillDown, drillDownAttributes, serialNo, 0);
   }
   else {
      filteredChildren = drillDown;
   }

   if ((vehicleAttributes != null) && (vehicleAttributes.length > 0)) {
      //filter the drill down on the vehicle attributes...
      filteredChildren = filterOnAttributes(filteredChildren, drillDownAttributes, vehicleAttributes, 0);
   }

   return filteredChildren;
   
}

function filterDrillDownTopLevel(topLevel, topLevelAttributes, serialNo, vehicleAttributes) {

   var filteredChildren;

   if ((serialNo != null) && (serialNo.length > 0)) {
      //filter the drill down for the serial no..
      filteredChildren = filterOnBreakPoint(topLevel, topLevelAttributes, serialNo, 1);
   }
   else {
      filteredChildren = topLevel;
   }

   if ((vehicleAttributes != null) && (vehicleAttributes.length > 0)) {
      //filter the drill down on the vehicle attributes...
      filteredChildren = filterOnAttributes(filteredChildren, topLevelAttributes, vehicleAttributes, 1);
   }

   return filteredChildren;
  
  
}


function filterCategoryMenu(categoryMenu, categoryAttributes, serialNo, vehicleAttributes) {

   var filteredChildren;

   if ((serialNo != null) && (serialNo.length > 0)) {
      //filter the drill down for the serial no..
      filteredChildren = filterOnBreakPoint(categoryMenu, categoryAttributes, serialNo, 2);
   }
   else {
      filteredChildren = categoryMenu;
   }

   if ((vehicleAttributes != null) && (vehicleAttributes.length > 0)) {
      //filter the drill down on the vehicle attributes...
      filteredChildren = filterOnAttributes(filteredChildren, categoryAttributes, vehicleAttributes, 2);
   }

   return filteredChildren;

}


function filterOnBreakPoint(drillDown, drillDownAttributes, serialNo, filterType) {

   //store the ids of the drill down to be filtered out in an array...
   var invalidIds = [];
   var validIds = [];
   var invalidIndex = 0;
   var validIndex = 0;

   //loop round all the drill down attributes to pick out the break point...
   for (var i = 0; i < drillDownAttributes.length; i++) {

      var foundBreakPoint = false;
      var inRange = true;

      for (var k = 0; k < drillDownAttributes[i][1].length; k++) {
      
         if (drillDownAttributes[i][1][k][0] == "C") {

            foundBreakPoint = true;

            var thisBreakPoint = drillDownAttributes[i][1][k];

            //see if a break point has been associated with this item...
            if ((thisBreakPoint != null) && (thisBreakPoint.length > 0)) {
         
               //compare break point against serial no.
               if ((thisBreakPoint[2] == "0") && (serialNo < thisBreakPoint[1])) {
                  inRange = false;
               }
               else if ((thisBreakPoint[2] == "1") && (serialNo > thisBreakPoint[1])) {
                  inRange = false;
               }
               
            }
            
         }
      }
      
      if (foundBreakPoint) {
         if (inRange) {
            validIds[validIndex++] = drillDownAttributes[i][0];
         }
         else {
            invalidIds[invalidIndex++] = drillDownAttributes[i][0];
         }
      }      
      else {
         validIds[validIndex++] = drillDownAttributes[i][0];
      }      
    
   }

   //create an array containing only the invalid ids...
   var justInvalid = [];
   
   if (filterType == 1) {

      invalidIndex = 0;
   
      for (var i = 0; i < invalidIds.length; i++) {
   
         var foundValid = false;
      
         for (var j = 0; j < validIds.length; j++) {
            if (validIds[j] == invalidIds[i]) {
               foundValid = true;
               break;
            }
         }
      
         if (foundValid == false) {
            justInvalid[invalidIndex++] = invalidIds[i];
         }
   
      } 
      
   }
   else {
      justInvalid = invalidIds;
   }
      

   return removeInvalidItems(justInvalid, drillDown, filterType);
   
}

function filterOnAttributes(drillDown, drillDownAttributes, vehicleAttributes, filterType) {

   var invalidIds = [];
   var validIds = [];
   var invalidIndex = 0;
   var validIndex = 0;

   var vehicleGroups = getAttributeGroups(vehicleAttributes);
   
   for (var i = 0; i < drillDownAttributes.length; i++) {
   
      var attributeGroups = getAttributeGroups(drillDownAttributes[i][1]);

      for (var j = 0; j < attributeGroups.length; j++) {
      
         //see if this attribute group exists for the vehicle...
         var groupExists = false;
         for (var k = 0; k < vehicleGroups.length; k++) {
            if (vehicleGroups[k] == attributeGroups[j]) {
               groupExists = true;
               break;
            }
         }
         
         if (groupExists) {
        
            var groupAttributes = getAttributesForGroup(drillDownAttributes[i][1],attributeGroups[j]);
            var groupAttributesVehicle = getAttributesForGroup(vehicleAttributes,attributeGroups[j]);
            
            var groupMatch = false;
         
            for (var k = 0; k < groupAttributes.length; k++) {
            
               var thisAttribute = groupAttributes[k];
               var attributeFound = false;
               var exceptFound = false;
            
               for (var l = 0; l < groupAttributesVehicle.length; l++) {
               
                  var vehicleAttribute = groupAttributesVehicle[l];
                  var includeAttribute = false;

                  if ((thisAttribute[1] == vehicleAttribute[1]) && (thisAttribute[2] == 0)) {
                     //attributes match and except flag is not set
                     includeAttribute = true;                     
                  }
                  else if ((thisAttribute[1] == vehicleAttribute[1]) && (thisAttribute[2] == 1)) {
                     //atttributes match and except flag is set
                     includeAttribute = false;
                     groupMatch = false;
                     if ((filterType == 1) == false) {
                        exceptFound = true;
                        break;
                     }
                  }
                  else if ((thisAttribute[1] != vehicleAttribute[1]) && (thisAttribute[2] == 0)) {
                     //attribute dont match and except flag is not set
                     includeAttribute = false;
                  }
                  else if ((thisAttribute[1] != vehicleAttribute[1]) && (thisAttribute[2] == 1)) {
                     //attributes dont match and except flag is set
                     includeAttribute = true;
                  }
                  
                  if (includeAttribute) {
                     groupMatch = true;
                  }
                  
               }
               
               //if we've picked up an except attribute thats been rejected then we'll look no further
               if (exceptFound) {
                  break;
               }
     
            }
            
            if (groupMatch == false) {
               invalidIds[invalidIndex++] = drillDownAttributes[i][0];
            }
            else {
               validIds[validIndex++] = drillDownAttributes[i][0];
            }

         }
      }
   }

   //include ids where no attributes are set also...
   validIds = includeIDsWithoutAttributes(validIds,drillDownAttributes);

   //create an array containing only the invalid ids...
   var justInvalid = [];
   invalidIndex = 0;

   if ((filterType == 1) || (filterType == 2)) {
   
      for (var i = 0; i < invalidIds.length; i++) {
   
         var foundValid = false;
      
         for (var j = 0; j < validIds.length; j++) {
            if (validIds[j] == invalidIds[i]) {
               foundValid = true;
               break;
            }
         }
      
         if (foundValid == false) {
            justInvalid[invalidIndex++] = invalidIds[i];
         }
 
      } 
   }
   else {
      justInvalid = invalidIds;
   }

   return removeInvalidItems(justInvalid, drillDown, filterType);

}

function getAttributeGroups(attributes) {

   var attributeGroups = [];
   var groupIndex = 0;
   
   for (var i = 0; i < attributes.length; i++) {
   
      attributeGroup = attributes[i][0];

      var groupAdded = false;

      if (attributeGroup == "C") {
         groupAdded = true;
      }
      else {

         //make sure we've not already added it...
         for (var j = 0; j < attributeGroups.length; j++) {
            if (attributeGroups[j] == attributeGroup) {
               groupAdded = true;
               break;
            }
         }
      }
     
      if (groupAdded == false) {
         attributeGroups[groupIndex++] = attributeGroup;
      }
   
   }
   
   return attributeGroups;
   
}

function getAttributesForGroup(attributes, attributeGroup) {

   var groupAttributes = [];
   var attributesIndex = 0;
   
   for (var i = 0; i < attributes.length; i++) {
      thisAttribute = attributes[i];
      if (attributes[i][0] == attributeGroup) {
         groupAttributes[attributesIndex++] = attributes[i];
      }
   }
   
   return groupAttributes;
   
}

function removeInvalidItems(invalidIds, drillDownChildren, filterType) {

    if (invalidIds.length == 0) {
       return drillDownChildren;
    }

    //we'll create a new array containing only those elements which are valid..   
    var validChildren = [];
    var validChildIndex = 0;

    for (var i = 0; i < drillDownChildren.length; i++) {
        
       var thisItemInvalid = false;
       var thisItem = drillDownChildren[i];

       for (var j = 0; j < invalidIds.length; j++) {

          if (filterType == 0) {
             if (thisItem.applicationId == invalidIds[j]) {
                thisItemInvalid = true;
                break;            
            }
          }
          else if ((filterType == 1) || (filterType == 2)) {
             if (thisItem[0] == invalidIds[j]) {
                thisItemInvalid = true;
                break;
             }
          }
       }
       
       if (thisItemInvalid == false) {
          validChildren[validChildIndex++] = thisItem;
       }
       
    }

    var newChildren = [];
    
    //we'll remove any parents which no longer have any children...
    if (filterType == 0) {

       var newChildIndex = 0;
    
       for (var i = 0; i < validChildren.length; i++) {
    
          var thisItem = validChildren[i];

          if (thisItem.applicationId == "0") {
             if (parentHasChildrenDD(validChildren,thisItem.id) > 0) {
                newChildren[newChildIndex++] = thisItem;
             }         
          }
          else {
             newChildren[newChildIndex++] = thisItem;
          }
       }
       
    }
    else {
    
       var newChildIndex = 0;
       
       for (var i = 0; i < validChildren.length; i++) {
       
          var thisItem = validChildren[i];
          
          if (thisItem[3] == "0") {                 
             if (parentHasChildCat(validChildren,thisItem[0]) > 0) {
                newChildren[newChildIndex++] = thisItem;
             }
          }
          else {
             newChildren[newChildIndex++] = thisItem;
          }
       }
       
    }
    
    return newChildren;
    
}


function parentHasChildrenDD(drillDownChildren,parentId) {

   var totalChildren = 0;
   
   for (var i = 0; i < drillDownChildren.length; i++) {
      if (drillDownChildren[i].parentId == parentId) {
         if (drillDownChildren[i].applicationId == "0") {
            totalChildren = totalChildren + parentHasChildrenDD(drillDownChildren,drillDownChildren[i].id);
         }
         else {
            totalChildren++;
            break;
         }
      }
      if (totalChildren > 0) {
         break;
      }
   }
   
   return totalChildren;

}

function parentHasChildCat(childCategories, parentId) {

   var totalChildren = 0;
   
   for (var i = 0; i < childCategories.length; i++) {
      if (childCategories[i][1] == parentId) {
         if (childCategories[i][3] == "0") {
            totalChildren = totalChildren + parentHasChildCat(childCategories,childCategories[i][0]);
         }
         else {
            totalChildren++;
         }
      }
   }
   
   return totalChildren;
   
}


function includeIDsWithoutAttributes(validIds,drillDownAttributes) {

   for (var i = 0; i < drillDownAttributes.length; i++) {

      var noAttributes = true;

      for (var j = 0; j < drillDownAttributes[i][1].length; j++) {
         if (drillDownAttributes[i][1][j][0].substring(0,1) == "A") {
            noAttributes = false;
            break;
         }
      }

      if (noAttributes) {
         var idExists = false;
         for (var j = 0; j < validIds.length; j++) {
            if (validIds[j] == drillDownAttributes[i][0]) {
               idExists = true;
               break;
            }
         }

         if (idExists == false) {
            validIds[validIds.length] = drillDownAttributes[i][0];
         }
      }

   }

   return validIds;

}
