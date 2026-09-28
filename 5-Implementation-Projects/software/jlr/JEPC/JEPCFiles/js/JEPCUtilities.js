// LanguageId
var languageId = parent.index_form.languageId.value;

//Get the Language code for given languageId
var languageCode = getLanguageCode(languageId);

// Declaring valid date character, minimum year and maximum year
var dtCh= "/";
var minYear = 0000;
var maxYear = 9999;

// Function to validate the integer.
function isInteger(s){
	var i;
    for (i = 0; i < s.length; i++){   
        // Check that current character is number.
        var c = s.charAt(i);
        if (((c < "0") || (c > "9"))) return false;
    }
    // All characters are numbers.
    return true;
}

// Function to validate the space in date.
function stripCharsInBag(s, bag){
	var i;
    var returnString = "";
    // Search through string's characters one by one.
    // If character is not in bag, append to returnString.
    for (i = 0; i < s.length; i++){   
        var c = s.charAt(i);
        if (bag.indexOf(c) == -1) returnString += c;
    }
    return returnString;
}

// Function to check the no of days in february.
function daysInFebruary (year){
	// February has 29 days in any year evenly divisible by four,
    // EXCEPT for centurial years which are not also divisible by 400.
    return (((year % 4 == 0) && ( (!(year % 100 == 0)) || (year % 400 == 0))) ? 29 : 28 );
}

// Function to validate no of days in a month.
function DaysArray(n) {
	for (var i = 1; i <= n; i++) {
		this[i] = 31
		if (i==4 || i==6 || i==9 || i==11) {this[i] = 30}
		if (i==2) {this[i] = 29}
   } 
   return this
}

//Function to validate the user entered date.
function isDate(dtStr){
	var daysInMonth = DaysArray(12);
	var pos1=dtStr.indexOf(dtCh);
	var pos2=dtStr.indexOf(dtCh,pos1+1);
	var strDay=dtStr.substring(0,pos1);
	var strMonth=dtStr.substring(pos1+1,pos2);
	var strYear=dtStr.substring(pos2+1);
	
	if (strDay.length < 2) {
			alert(eval("DATE_FORMAT" + languageCode));
			return false;
	}
	
	if (strMonth.length < 2) {
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}
	
	strYr=strYear;

	if (strDay.charAt(0)=="0" && strDay.length>1) 
		strDay=strDay.substring(1);

	if (strMonth.charAt(0)=="0" && strMonth.length>1) 
		strMonth=strMonth.substring(1);
	for (var i = 1; i <= 3; i++) {

		if (strYr.charAt(0)=="0" && strYr.length>1) 
			strYr=strYr.substring(1);
	}
	month=parseInt(strMonth);
	day=parseInt(strDay);
	year=parseInt(strYr);

	if (pos1==-1 || pos2==-1){
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}

	if (day<1 || day>31 || (month==2 && day>daysInFebruary(year)) || day > daysInMonth[month]) {
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}

	if (month<1 || month>12) {
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}

	if (strYear.length != 4 || year==0 || year<minYear || year>maxYear){
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}

	if (dtStr.indexOf(dtCh,pos2+1)!=-1 || isInteger(stripCharsInBag(dtStr, dtCh))==false){
		alert(eval("DATE_FORMAT" + languageCode));
		return false;
	}
	return true
}

// Function to check the start date with current date.
function checkStartDate(pStartDate) {

	try {
		var serverDateArray = serverDate.split("/");
		var startDateArray = (pStartDate.value).split("/");
		var dateToday = serverDateArray[0];
		var monthToday = serverDateArray[1];
		var yearToday = serverDateArray[2];
		var date = startDateArray[0];
		var month = startDateArray[1];
		var year = startDateArray[2];
		var currentDate = new Date(year, month - 1, date);
		var todaysDate =new Date(yearToday, monthToday - 1, dateToday);	
		var difference = todaysDate - (currentDate);
		var difference = difference / (24 * 60 * 60 * 1000);
		
		if (parseInt(difference) > 0) {
			alert(eval("INCORRECT_START_DATE" + languageCode));
			return true;
		}
	} catch (exception) {
		alert(HtmlDecode(eval("APPLICATION_ERROR" + languageCode)));
	}
}

// Function to check the end date with current date.
function checkEndDate(pStartDate, pEndDate) {
	var startDateArray = (pStartDate.value).split("/");
	var endDateArray = (pEndDate.value).split("/");
	var startDate = startDateArray[0];
	var endDate = endDateArray[0];
	var startMonth = startDateArray[1];
	var endMonth = endDateArray[1];
	var startYear = startDateArray[2];
	var endYear = endDateArray[2];
	var completeStartDate = new Date(startYear, startMonth - 1, startDate);
	var completeEndDate = new Date(endYear, endMonth - 1, endDate);
	var difference = completeStartDate - completeEndDate;
	var difference = difference / (24 * 60 * 60 * 1000);
	
	if (parseInt(difference) > 0) {
		alert(eval("INCORRECT_END_DATE" + languageCode));
		return true;
	}
}