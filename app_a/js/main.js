// Jose A. Carrillo
// Full Sail University | Mobile Web Development | Visual Frameworks
// Web App 3
// February 16th, 2012

// Wait until DOM is ready.
window.addEventListener("DOMContentLoaded", function() {  
	
	//getElementById Function
	function dataGet(x) {
		var theElement = document.getElementById(x);
		return theElement;
	}
	
	//Create select field element and populate with options
	function makeCats() {
		var formTag = document.getElementsByTagName("form"),  //formTag is an array of all the form tags.
			selectLi = dataGet('select'),
			makeSelect = document.createElement('select');
			makeSelect.setAttribute("id", "genres");
		for (var i=0, j=mediaGenres.length; i<j; i++) {
			var makeOption = document.createElement('option');
			var optText = mediaGenres[i];
			makeOption.setAttribute("value", optText);
			makeOption.innerHTML = optText;
			makeSelect.appendChild(makeOption);
		}
		selectLi.appendChild(makeSelect);
	}
		
	//Find value of selected radio button
	function getSelectedRadio() {
		var radios = document.forms[0].filmRating;
		for (var i=0; i<radios.length; i++) {
			if (radios[i].checked) {
				conditionValue = radios[i].value;
			}
		}
	}
	
	function getCheckboxValue() {
		if (dataGet('favorite').checked) {
			favoriteValue = dataGet('favorite').value;
		} else {
			favoriteValue = "No";
		}
	}
	
	function toggleControls(n){
		switch(n){
			case "on":
				dataGet('addItemForm').style.display = "none";
				dataGet('clear').style.display = "inline";
				dataGet('displayLink').style.display = "none";
				dataGet('addNew').style.display = "inline";
				dataGet('footer').style.display = "none";
				break;
			case "off":
				dataGet('addItemForm').style.display = "block";
				dataGet('clear').style.display = "inline";
				dataGet('displayLink').style.display = "inline";
				dataGet('addNew').style.display = "none";
				dataGet('items').style.display = "none";
				break;
			default:
				return false;				
		}
	}	
	
	function storeData(key) {
		//If there is no key, this means this is a brand new item and we need a new key.
		if (!key){
			var id = Math.floor(Math.random()*100000001);
		} else {
		//Set the id to the existing key being edited so that it will save over the data.
		//The key is the same key that's been passed along from the editSubmit event handler
		//to the validate finction, and then passed here, into the storeData function.
			id = key;
		}
		//Gather up all our form field values and store in an object
		//Object properties cotain array with the form label and input value
		getSelectedRadio();
		getCheckboxValue();
		var item					= {};
			item.genre			= ["Genre: ", dataGet('genres').value];
			item.itemTitle		= ["Title: ", dataGet('itemTitle').value];
			item.filmRating		= ["Rated: ", conditionValue];
			item.description		= ["Description: ", dataGet('description').value];
			item.irating			= ["iRating: ", dataGet('irating').value];
			item.favorite			= ["Favorite: ", favoriteValue];
			item.dateAdded		= ["Date: ", dataGet('dateAdded').value];
			item.itemImage		= ["Image: ", dataGet('itemImage').value];
		//Save data into Local Storage: Use Stringify to convert our object to a string*/
		localStorage.setItem(id, JSON.stringify(item));
		alert("Flick Saved");
	}
	
	function getData(){
		toggleControls("on");
		if(localStorage.length === 0){
			alert("There are no Flicks in Local Storage so default data was added.");
			autoFillData();
		}		
		//Write Data from Local Storage to the Browser
		var makeDiv = document.createElement('div');
		makeDiv.setAttribute("id", "items");
		makeDiv.setAttribute("class", "content-primary");
		var makeList = document.createElement('ul'); // main unorder list
		makeList.setAttribute("data-role", "listview");
		makeDiv.appendChild(makeList);
		document.body.appendChild(makeDiv);
		dataGet('items'); //Safety to make sure it displays
		
		document.getElementById('myjSonList').appendChild(makeDiv);
		dataGet('items'); 
		
		
		for (var i=0, len=localStorage.length; i<len;i++){
			var makeli = document.createElement('li');
			var linksLi = document.createElement('li');
			makeList.appendChild(makeli);
			var key = localStorage.key(i);
			var value = localStorage.getItem(key);
			//Convert the string from Local Storage value back to an object by using JSON.parse
			var obj = JSON.parse(value);
			var makeSubList = document.createElement('ul');
			makeli.appendChild(makeSubList);
			getImage(obj.genre[1], makeSubList);
			for(var n in obj){
				var makeSubli = document.createElement('li');
				makeSubList.appendChild(makeSubli);
				var optSubText = obj[n][0]+" "+obj[n][1];
				makeSubli.innerHTML = optSubText;
				makeSubList.appendChild(linksLi);
			}
			makeItemLinks(localStorage.key(i), linksLi); // Create our edit and delete buttons or links for each item in local storage.
		}
	}
	
	//Get image for the right category
	function getImage(catTitle, makeSubList) {
		var imageLi = document.createElement('li');
		makeSubList.appendChild(imageLi);
		var newImg = document.createElement('img');
		var setSrc = newImg.setAttribute("src", "images/"+ catTitle + ".png");
		imageLi.appendChild(newImg);
	}
	
	//Auto Populate Local Storage
	function autoFillData() {
		//The actual JSON OBJECT data required for this to work is coming from our json.js
		//Store the JSON OBJECT into Local Storage
		for (var n in json) {
			var id = Math.floor(Math.random()*100000001);
			localStorage.setItem(id, JSON.stringify(json[n]));
		}
	}
	
	//Make FlickLinks 
	//Create the edit and delete links for each stored item when displayed.
	function makeItemLinks(key, linksLi){
		//add edit single item link
		var editLink = document.createElement('a');
		editLink.href = "#";
		editLink.key = key;
		var editText = "Edit Flick";
		editLink.addEventListener("click", editItem);
		editLink.innerHTML = editText;
		linksLi.appendChild(editLink);
		
		//add a line break
		var breakTag = document.createElement('br');
		linksLi.appendChild(breakTag);
		
		// Add a Delete single item link
		var deleteLink = document.createElement('a');
		deleteLink.href = "#";
		deleteLink.key = key;
		var deleteText = "Delete Flick";
		deleteLink.addEventListener("click", deleteItem);
		deleteLink.innerHTML = deleteText;
		linksLi.appendChild(deleteLink);
	}
	
	function editItem() {
		//Grab the data from local storage
		var value = localStorage.getItem(this.key);
		var item = JSON.parse(value);
		
		//Show the form
		toggleControls("off");
		
		//Populate the form fields with the current localStorage values
		dataGet('genres').value			=	item.genre[1];
		dataGet('itemTitle').value		=	item.itemTitle[1]; 
		dataGet('description').value		=	item.description[1]; 
		dataGet('irating').value				=	item.irating[1]; 
		dataGet('dateAdded').value		=	item.dateAdded[1]; 
		dataGet('itemImage').value		=	item.itemImage[1]; 
		
		var radios = document.forms[0].filmRating;
		for (var i=0; i<radios.length; i++) {
			if (radios[i].value == "NC-17" && item.filmRating[1] == "NC-17") {
				radios[i].setAttribute("checked", "checked");
			} else if (radios[i].value == "R" && item.filmRating[1] == "R") {
				radios[i].setAttribute("checked", "checked");
			} else if (radios[i].value == "PG-13" && item.filmRating[1] == "PG-13") {
				radios[i].setAttribute("checked", "checked");
			}else if (radios[i].value == "PG" && item.filmRating[1] == "PG") {
				radios[i].setAttribute("checked", "checked");
			}			
		}
		if(item.favorite[1] == "Save as Favorite") {
			dataGet('favorite').setAttribute("checked", "checked");
		}
		dataGet('irating').value = item.irating[1];
		dataGet('dateAdded').value = item.dateAdded[1];
		dataGet('description').value = item.description[1];
		
		//Remove the initial listener from the input 'save contact' button.
		save.removeEventListener("click", storeData);
		//Change Submit Button Value to Edit Button
		dataGet('submit').value = "Edit Flick";
		var editSubmit = dataGet('submit');
		//Save the key value established in this function as a property of the editSubmit event
		//so we can use that value when we save the data we edited.
		editSubmit.addEventListener("click", validate);
		editSubmit.key = this.key;		
	}
	
	function deleteItem(){
		var ask = confirm("Are you sure you want to delete this item?");
		if (ask){
			localStorage.removeItem(this.key);
			alert("Flick has been deleted.");
			window.location.reload();
		} else {
			alert("Flick was not deleted.");			
		}
	}
	
	function clearLocal(){
		if(localStorage.length === 0){
			alert("There is no data to clear.");
		} else {
			localStorage.clear();
			alert("All Flicks have been Deleted"); 
			window.location.reload();
			return false;
		}
	}

	function validate(e) {
		//Define the elements we want to check
			var getGenre				= dataGet('genres');
			var getTitle				= dataGet('itemTitle');
			//var getDescription		= dataGet('description');
			var getiRating			= dataGet('irating');
			var getDate				= dataGet('dateAdded');
			var getImage				= dataGet('itemImage');
			
			//Reset Error Messages
			errMsg.innerHTML = "";
			getTitle.style.border = "1px solid black";			
			getGenre.style.border = "1px solid black";
			getDate.style.border = "1px solid black";
			
			
			//Get Error Messages
			var messageArray = [];
			//Flick Title Validation
			if(getTitle.value === "") {
				var nameError = "Please enter an Flick Title";
				getTitle.style.border = "1px solid red";
				messageArray.push(nameError);
			}
			
			//Media Type Validation
			if(getGenre.value === "--Choose Media Type--") {
				var genreError = "Please choose Media Type";
				getGenre.style.border = "1px solid red";
				messageArray.push(genreError);
			}
			
			//Date Validation
			if(getDate.value === "") {
				var dateError = "Please choose a date.";
				getDate.style.border = "1px solid red";
				messageArray.push(dateError);
			}
			
			/* Rating Validation
			if(getiRating.value === "") {
				var iratingError = "Please choose a date.";
				getiRating.style.border = "1px solid red";
				messageArray.push(iratingError);
			}*/
			
			/* bof Email Validation Function - Not needed - Used for future reference
			function validateForm() {
				var getEmail = document.forms[0]["email"].value;
				var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+dataGet/;
					if(!(re.exec(getEmail))) {
						error = "Please enter a valid email address.\n";
				}
				if (error) alert(error);
			}*/ 
			
			//If there were errors, display them on the screen
			if(messageArray.length >= 1) {
				for(var i=0, j=messageArray.length; i < j; i++){
				var txt = document.createElement('li');
				txt.innerHTML = messageArray[i];
				errMsg.appendChild(txt);				
				}	
			e.preventDefault();
			return false;			
			} else {
				//If all is ok, save our data! Send the key value (which came from the editData function).
				//Remember this key value was passed through the editSubmit event listener as a property.
				storeData(this.key);
			}
	}
	
	//Variable defaults
	var mediaGenres = ["--Choose Media Type--", 
			"Action & Adventure", 
			"Anime", 
			"Children & Family", 
			"Classics", 
			"Comedies",
			"Documentaries",
			"Dramas",
			"Faith & Spirituality",
			"Foreign",
			"Gay & Lesbian",
			"Horror",
			"Independent",
			"Music",
			"Musicals",
			"Romance",
			"Sci-Fi & Fantasy",
			"Special Interest",
			"Sport & Fitness",
			"TV Shows",
			"Thrilers"],
		conditionValue,
		favoriteValue = "No";
		errMsg = dataGet('errors');
			
	makeCats();	
	
	//Set Link & Submit Click Events
	var displayLink = dataGet('displayLink');
	displayLink.addEventListener("click", getData);
	var clearLink = dataGet('clear');
	clearLink.addEventListener("click", clearLocal);
	var save = dataGet('submit');
	save.addEventListener("click", validate);



}); // end of addEventListener