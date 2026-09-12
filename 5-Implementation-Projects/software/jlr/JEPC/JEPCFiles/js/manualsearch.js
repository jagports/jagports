var languageId = parent.parent.parent.index_form.languageId.value;
function setLanguage_page()
{
	setLanguage(languageId);
}

function enableSearch(){
	var selected = document.getElementById("categoryId");
	if(selected.value == 'Nothing'){
		return;
	}
	else{
		document.getElementById("Button_Search").innerHTML= "<input class='button' id='Button_Search' name='btnOK' type='button' value='Search' onclick='javascript:onOK();' />"
	}
}