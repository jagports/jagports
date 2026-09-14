/*
    Copyright 2007 Matt Fellows 
    
    Email: Matt.Fellows@onegeek.com.au
    Web: http://www.onegeek.com.au
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
*/

/**
 * Serialize/Deserializer any JavaScript object to a valid XML String (NOT JSON)
 */
function JSSerializer() {
  
  /* Private members */
  var isIE = navigator.userAgent.toLowerCase().indexOf("msie") > -1;
  var isMoz = document.implementation && document.implementation.createDocument;
  
  // Unused parameters
  var use_encryption = false;
  var use_compression = false;
  
  /* Public attributes */
  
  /* Public methods */
  this.serialize = serialize;
  this.deserialize = deserialize;
  
  /**
   * Serialize a JS object into an XML String for storage / transmission
   * (i.e. cookie, download etc.)
   * 
   * @param {Object} objectToSerialize - The object to be serialized
   * @param {Object} objectName - (Optional) Name of the object being passed in
   * @param {Object} indentSpace - (Optional) Use this as an indentSpace
   * @return An String (XML document compressed and/or encrypted) specifying the object
   */
  function serialize(objectToSerialize, objectName, indentSpace) {
     indentSpace = indentSpace?indentSpace:'';
     
     var type = GetTypeName(objectToSerialize);
      
     var s = indentSpace  + '<' + objectName +  ' type="' + type + '">';
  
     switch(type){
      case "number":
      case "string":
      case "boolean": {
        s += objectToSerialize; 
      } 
     
      break;
       
       case "date":{
        s += objectToSerialize.toLocaleString(); 
       }
       break;
       
        case "Function": {
          s += "\n";        
          s += "<![CDATA["+objectToSerialize+"]]>";
          s += indentSpace;
        }
      break;     
       
      case "array": {
        s += "\n";
          
          for(var name in objectToSerialize){
            s += serialize(objectToSerialize[name], ('index' + name ), indentSpace + "   ");
          };
          
          s += indentSpace;
      }
      break;
          
      default: {
        s += "\n";
        
        for(var name in objectToSerialize){
          s += serialize(objectToSerialize[name], name, indentSpace + "   ");
        };
        
        s += indentSpace;
      }
      break;
  
     }
     
    s += "</" + objectName + ">\n"; 
       
      return s;
  };
  
  /**
   * Deserialize a serialized XML object into a javascript object
   * Uses deserial recursively to rebuild the javascript 
   * @see deserial
   * @param {Object} XmlText
   */
  function deserialize(XmlText) {
    var _doc = getDom(XmlText); 
    return deserial(_doc.childNodes[0]);
  }
  
  /**
   * Get the DOM object from an XML doc
   * NB: Works for IE and Mozilla
   * @param {Object} strXml
   */
  function getDom(strXml) {
    var _doc = null;
  
    if (isIE) {
      _doc = new ActiveXObject("Msxml2.DOMDocument.3.0");
      _doc.loadXML(strXml); 
    }
    else {
      var parser = new DOMParser();
      _doc = parser.parseFromString(strXml, "text/xml");
    }
  
    return _doc;
  }
  
  /**
   * Deserialize an XML DOM object into a javascript object
   * 
   * NB: This function uses recursion
   * @param {Object} domObject - The DOM object to deserialize into a JS Object
   */
  function deserial(domObject) {
    var retObj; 
    var nodeType = getNodeType(domObject);
     
    if (isSimpleVar(nodeType)) {
      if (isIE) {
        return StringToObject(domObject.text, nodeType);
      }
      else {
        return StringToObject(domObject.textContent, nodeType);
      }
    }
    
    switch(nodeType) {
      case "array": {
        return deserializeArray(domObject);
      }
      
      case "Function": {        
        return deserializeFunction(domObject);
      }   
      
      case "object":
      default: {
        try {
          retObj = eval("new "+ nodeType + "()");
        }
        catch(e) {
          // create generic class
          retObj = new Object();
        }
      }
      break;
    }
    
    for(var i = 0; i < domObject.childNodes.length; i++) {
      var Node = domObject.childNodes[i];
      retObj[Node.nodeName] = deserial(Node);
    }
  
    return retObj;
  }
  
  /**
   * Check if the current element is one of the primitive data types
   * @param {String} type - The "type" attribute of the current node
   */
  function isSimpleVar(type)
  {
    switch(type) {
      case "int":
      case "string":
      case "String":
      case "Number":
      case "number":
      case "Boolean":
      case "boolean":
      case "bool":
      case "dateTime":
      case "Date":
      case "date":
      case "float":
        return true;
    }
    
    return false;
  }
  
  /**
   * Convert a string to an object
   * @param {String} text - The text to parse into the new object
   * @param {String} type - The type of object that you wish to parse TO
   */
  function StringToObject(text, type) {
    var retObj = null;
  
    switch(type)
    {
      case "int":
        return parseInt(text);   
         
      case "number": {
        var outNum;
        
        if (text.indexOf(".") > 0) {
          return parseFloat(text);    
        }
        else {
          return parseInt(text);    
        }
      } 
           
      case "string":
      case "String":
        return text;      retObj = [];
         
      case "dateTime":
      case "date":
      case "Date":
        return new Date(text);
          
      case "float":
        return parseFloat(text, 10);
        
      case "bool": {
          if (text == "true" || text == "True") {
            return true;
          }
          else {
            return false;
          }
        }
        return parseBool(text); 
    }
  
    return retObj;  
  }
  
  /**
   * Get the name of an object by extracting it from it's constructor attribute
   * @param {Object} obj - The object for which the name is to be found
   */
  function getClassName(obj) {   
    try {
      var ClassName = obj.constructor.toString();
      ClassName = ClassName.substring(ClassName.indexOf("function") + 8, ClassName.indexOf('(')).replace(/ /g,'');
      return ClassName;
    }
    catch(e) {
      return "NULL";
    }
  }
  
  /**
   * Get the type of Object by checking against the Built-in objects.
   * If no built in object is found, call getClassName
   * @see getClassName
   * @param {Object} obj - The object for which the type is to be found
   */ 
  function GetTypeName(obj) {
    if (obj instanceof Array)
      return "array";
      
    if (obj instanceof Date)
      return "date";  
      
    var type = typeof(obj);
  
    if (isSimpleVar(type)) {
      return type;
    }
    
    type = getClassName(obj); 
    
    return type;
  }
  
  /**
   * Deserialize an Array
   * @param {XML String} node - The node to deserialize into an Array
   * @return The deserialized Array 
   */
  function deserializeArray(node) {
    retObj = [];
          
    // Cycle through the array's TOP LEVEL children
    while(child = node.firstChild) {
      //alert('First Child: |' + child.textContent+"|")
      // delete child so it's children aren't recursed
      node.removeChild(node.firstChild);
                
      var nodeType = getNodeType(child);
      //alert(nodeType)
      
      if(isSimpleVar(nodeType)) {
        //alert('simple')
        retObj[retObj.length] = child.textContent;
      } else {
        //alert('complex var of type: '+nodeType +", name: "+child.nodeName +", content: "+child.textContent+", value: "+child.nodeValue)
        //var tmp = child.textContent;
       // if(child.textContent.trim() != '') {
          retObj[retObj.length] = deserial(child) 
       // }           
      }                   
    }     
    return retObj;      
  }
  
  /**
   * Deserialize a Function
   * @param {XML String} node - The node to deserialize into a Function
   * @return The deserialized Function
   */ 
  function deserializeFunction(func) {
    if(func && func.textContent) {
      return eval(func.textContent);
    }
  }
  
  /**
   * Get the type attribute of an element if there is one,
   * otherwise return generic 'object'
   * 
   * NB: This function is used on the resulting serialized XML and not on
   *     any actual javascript object
   * @param {XML} node - The node for which the type is to be found
   */   
  function getNodeType(node) {
    var nodeType = "object";
    
    if (node.attributes != null && node.attributes.length != 0) {
      var tmp = node.attributes.getNamedItem("type");
      if (tmp != null) {
        nodeType = node.attributes.getNamedItem("type").nodeValue;
      }
    }
    
    return nodeType;  
  } 
}

/**
 * Trim spaces from a string
 * @usage stringObject.trim();
 */
if(!String.prototype.trim) {
  String.prototype.trim = function() {
  a = this.replace(/^\s+/, '');
  return a.replace(/\s+$/, '');
  };
}