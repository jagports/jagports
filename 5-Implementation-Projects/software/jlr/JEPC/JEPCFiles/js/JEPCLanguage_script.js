//TO implement language
function setLanguage(langId)
{
	var firstindex = document.URL.lastIndexOf("/");
	var lastindex = document.URL.lastIndexOf("\\html"); 
	var path = document.URL.substr(firstindex+1,lastindex-firstindex)+"language_properties\\";
	var fileName = null;
	var languageId = langId;
	
	if ( languageId == 0 || languageId == -1)
	{
		type = "_En";
	}
	else if ( languageId == -2 )
	{
		type = "_Fr";
	}
	else if ( languageId == -3 )
	{
		type = "_Ge";
	}
	else if ( languageId == -4 )
	{
		type = "_It";
	}
	else if ( languageId == -5 )
	{
		type = "_Sp";
	}
	else if ( languageId == -10 )
	{
		type = "_Ja";
	}
	else if ( languageId == -11 )
	{
		type = "_Du";
	}
	else
	{
		type = "_En";
	}

	fileName = path + "JEPCLogon"+type+".properties";
	loadPropertiesFile(fileName);
	globalLangID=langId;
}

function loadPropertiesFile(url)
{
	var fso = new ActiveXObject("Scripting.FileSystemObject")
	if (fso.FileExists(url))
	{

		var f = fso.OpenTextFile(url, 1);
		var readFile;
		var lineArray = new Array();

		try
		{
    			while((readFile = f.ReadLine())!= null)
			{
				lineArray = readFile.split(",");
				if(lineArray != null && lineArray.length == 2 )
				{
					var buttonType = eval("document.getElementById('" + lineArray[0] + "')");
				
					if (buttonType != undefined && buttonType != null)
					{
						if(buttonType.type != undefined  && buttonType.type == "button"  )
						{	
							eval("buttonType.value='" + lineArray[1] + "'");
							continue;
						}
						if(buttonType.type != undefined  && buttonType.type == "reset"  )
						{	
							eval("buttonType.value='" + lineArray[1] + "'");
							continue;
						}
					}

					if(eval("document.getElementById('" + lineArray[0] + "')") != null)
					{
						eval("document.getElementById('" + lineArray[0] + "').innerHTML='" + lineArray[1] + "'");
					}
					
				}
	    		}
		}
		catch(ex)
		{
			//alert("Ex : " + ex);
		}
	}
	else
	{
		 alert("File does not Exist");
	}
}