/**
 * TODO:
 * 		 encapsulate the code? Something needs to be done to make it less messy. Maybe just move the handlers into their own functions, possible in seperate files
 * 		 Save user account (use phonegap for local data storage)
 * 		 Save previous address (use phonegap for local data storage)
 * 		 Switch to opening dialogs with new functions
 			 GPS
 */
// application globals
var delList, storage, db, currMenu, currRest, currItem, place;
var currUser = {
	email: "",
	pass: ""
}
//$(document).bind("deviceready", function(){
$(window).load(function(){
    console.log("ready");
	//storage = window.localStorage; // currently all saved user preferences are saved here. We may switch to a full blown database if this gets too unwieldy
	db = new Database(function(){
		db.getDefaultAccount(function(tx, results){
			if (results.rows.length == 0){
				//openDialog("body", "createAddress", "pop");
				$.mobile.pageLoading();
				navigator.geolocation.getCurrentPosition(function(position){
					// got the users position so perform a reverse geolocation request to get their address
					// use google maps api for now
					var geocoder = new google.maps.Geocoder;
					var latLng = new google.maps.LatLng(position.latitude, position.longitude);
					geocoder.geocode({ "latLng": latLng}, function(results, status){
						if (status == google.maps.GeocoderStatus.OK){
							if(results[1]){
								$("#createAddressHeader").html("Is this Where You Are?");
								$("#createAddressSub").html("Please fill in the blanks");
								$.mobile.changePage("#createAddress");
								var streetAddr = false;
								for (var i in results[1].address_components){
									for (var j = 0; j < results[1].address_components[i].types.length; j++){
										switch(results[1].address_components[i].types[j]){
											case "street_number":
												if (results[1].address_components[i].long_name.indexOf("-") == -1){
													streetAddr = true;
													$("#createAddressAddress").val(results[1].address_components[i].long_name);
												}
												break;
											case "route":
												if (streetAddr)
													$("#createAddressAddress").val($("#createAddressAddress") + " " + results[1].address_components[i].long_name);
												break;
											case "administrative_area_level_3":
												$("#createAddressCity").val(results[1].address_components[i].long_name);
												break;
											case "administrative_area_level_2":
												$("#createAddressState").val(results[1].address_components[i].long_name);
												break;
											case "postal_code":
												$("#createAddressZip").val(results[1].address_components[i].long_name);
										}
									}
								}
							}
						}else{
							console.log("unable to geocode " + status);
						}
					});
				}, function(positionError){
					$("#createAddressHeader").html("Where Would You Like Your Food Delivered To?");
					$.mobile.changePage("#createAddress");
					//$("#createAddressAddress").focus();
				});
			}else{
				Ordrin.u.setCurrAcct(results.rows.item(0).email, results.rows.item(0).pass);
				getAddresses(true);
			}
		});
	});
	Ordrin.initialize("shds1d6c4BGDGs8", "http://nn2.deasil.com"); // for now this will be deasil
	
     $("#restaurantSelectorParent").removeClass("ui-btn ui-btn-corner-all ui-shadow ui-btn-up-a");
     $("#restaurantSelectorParent>.ui-btn-inner").removeClass("ui-btn-inner");
	 $("#login_btn").click(function(){
		currUser.email = $("#loginEmail").val();
		currUser.pass  = $("#loginPassword").val();
		$.mobile.pageLoading();
		Ordrin.u.setCurrAcct(currUser.email, currUser.pass);
		try{
			Ordrin.u.getAcct(function(data){
				data = JSON.parse(data);
				if (data._error != undefined && data._error != 0){
					error(data.msg);
				}else{
					$("#createAccount").append("<a href = '#restaurant' data-rel = 'back' id = 'removeMe'></a>");
					$("#removeMe").click().remove();
					getAddresses(true);
					storeUser(currUser.email, currUser.pass, true);
				}
					
			}, function(status){
				console.log("error");
				if (status == 401){
					error("Username and/or password are incorrect")
				}
			});
		}catch(e){
			error(e);
		}
	});
	
	$("#postAccount_btn").click(function(){
		currUser.email = $("#createEmail").val();
		currUser.pass  = $("#createPassword").val();
		$.mobile.pageLoading();
		Ordrin.u.makeAcct(currUser.email, currUser.pass, $("#createFirstName").val(), $("#createLastName").val(), function(data){
			data = JSON.parse(data);
			$.mobile.pageLoading(true);
			if (data._error != undefined && data._error != 0){
				error(data.msg)
			}else{
				$("#createAccount").append("<a href = '#restaurant' id = 'removeMe'></a>");
				$("#removeMe").click().remove();
				Ordrin.u.setCurrAcct(currUser.email, currUser.pass);
				getAddresses(true);
			}
		});
	});
	// handle the user switching the type of restaurant
	$("#restaurantTypes_selector").change(function(){
		var currentSelector = $("#restaurantTypes_selector").val();
		if (currentSelector == "all"){
			$(".restaurantListItem").show();
			return;
		}
		for (var i = 0; i < delList.length; i++){
			delList[i].valid = false;
			for (var j = 0; j < delList[i].cu.length; j++){
				if (delList[i].cu[j] == currentSelector){
					$("#restaurant" + i).show();
					delList[i].valid = true;
				}else if (delList[i].cu[j] != currentSelector && !delList[i].valid)
					$("#restaurant" + i).hide();
			}
		}
	});
	$("#createAddress_btn").click(function(){
		/*var place = new Address($("#createAddressAddress").val(), $("#createAddressAddress2").val(), $("#createAddressCity").val(), $("#createAddressZip").val(), $("#createAddressState").val(), $("#createAddressPhone").val(), $("#createAddressName").val());
		Ordrin.u.updateAddress(place, function(data){
			data = JSON.parse(data);
			if (data._error != undefined && data._error != 0){
				error(data.msg);
			}else{
				$("#createAddress").append("<a href = '#restaurant' id = 'removeMe'></a>");
				$("#removeMe").click().remove();
				getRestaurantList(place, "ASAP");
			}
		}, function (status){
			error("Unable to get addresses.")
		});*/
		place = new Address($("#createAddressAddress").val(), $("#createAddressAddress2").val(), $("#createAddressCity").val(), $("#createAddressZip").val(), $("#createAddressState").val(), $("#createAddressPhone").val(), $("#createAddressName").val());
		$.mobile.changePage("#restaurant", "slideup");
		getRestaurantList(place, "ASAP");
	});
	// hack to make sure that previously clicked user buttons get unclicked
	$("#restaurant").bind("pagebeforeshow", function(){
		$(".ui-btn-active").removeClass("ui-btn-active");
	});
	$("#restDetails").bind("pagebeforeshow",function(){
		$(".ui-btn-active").removeClass("ui-btn-active");
	});
	// populate settings screen
	$("#settings").bind("pageshow", function(){
	});
});

function getAddresses(default_bool){
	//var storedAddress = JSON.parse(storage.getItem("address"));
	if (default_bool){
		db.getDefaultAddress(currUser.email, function(tx, results){
			if (results.rows.length == 0){
				// the user has no stored addresses
					 Ordrin.u.getAddress("", function(data){
							 if (data == "[]"){ // the user has no addresses so push the create address dialog
									 console.log("data");
									 openDialog("body", "createAddress", "slideup");
									 return;
							 }
							 data = JSON.parse(data);
							 if (data.length == 1){ // the user only has one address so convert the object and send it straight to the resturant list
									var place = new Address(data[0].addr, data[0].addr2, data[0].city, data[0].zip, data[0].state, data[0].phone, data[0].nick);
									 var time = new Date();
									 time.setASAP();
									 storage.setItem("address", JSON.stringify(place));
									 getRestaurantList(place, time);
							 }else{ // the user has more than 1 address so open a dialog to let them choose which address to use and the get the restaurant list. Possibly save their choice?
									 openDialog("body", "selectAddress", "slidedown");
									 $("#selectAddress").bind("pageshow", {"data": data}, function(event){
												var markup = "<li class = 'addressSelector'><a href = '#restaurant' onclick = 'addressSelected(new Address(\"${addr}\", \"${addr2}\", \"${city}\", \"${zip}\", \"${state}\", \"${phone}\", \"${nick}\"), \"ASAP\")'>${nick}</a></li>";
												$.template("addrListTemp", markup);
												$("#addressList").empty();
												$.tmpl("addrListTemp", data).appendTo("#addressList");
												$("#addressList").listview("refresh");
											});
							 }
					});

			 }else{
					
			 }
		});
	}
	if (storedAddress == null){
		Ordrin.u.getAddress("", function(data){
			if (data == "[]"){ // the user has no addresses so push the create address dialog
				console.log("data");
				openDialog("body", "createAddress", "slidedown");
				return;
			}
			data = JSON.parse(data);
			if (data.length == 1){ // the user only has one address so convert the object and send it straight to the resturant list
				var place = new Address(data[0].addr, data[0].addr2, data[0].city, data[0].zip, data[0].state, data[0].phone, data[0].nick);
				var time = new Date();
				time.setASAP();
				storage.setItem("address", JSON.stringify(place));
				getRestaurantList(place, time);
			}else{ // the user has more than 1 address so open a dialog to let them choose which address to use and the get the restaurant list. Possibly save their choice?
				openDialog("body", "selectAddress", "slidedown");
				$("#selectAddress").bind("pageshow", {"data": data}, function(event){
					var markup = "<li class = 'addressSelector'><a href = '#restaurant' onclick = 'addressSelected(new Address(\"${addr}\", \"${addr2}\", \"${city}\", \"${zip}\", \"${state}\", \"${phone}\", \"${nick}\"), \"ASAP\")'>${nick}</a></li>";
					$.template("addrListTemp", markup);
					$("#addressList").empty();
					$.tmpl("addrListTemp", data).appendTo("#addressList");
					$("#addressList").listview("refresh");
				});
			}
		});
	}else{
		var time = new Date();
		time.setASAP();
		var place = new Address(storedAddress.street, storedAddress.street2, storedAddress.city, storedAddress.zip, storedAddress.state, storedAddress.phone, storedAddress.nick);
		getRestaurantList(place, time);
	}
}

function addressSelected(place, time){
	getRestaurantList(place, time);
	storage.setItem("address", JSON.stringify(place));
}

function openDialog(parent, name, transition){
	$(parent).append("<a href = '#" + name + "' data-rel = 'dialog' id = 'removeMe' data-transition = '" + transition + "'></a>");
	$("#removeMe").click().remove();
}

function getRestaurantList(place, time){
	if (time == "ASAP"){
		time = new Date();
		time.setASAP();
	}
	Ordrin.r.deliveryList(time, place, function(data) {
		data = JSON.parse(data);
		for(var i = 0; i< data.length; i++) {
			data[i].index = i;
			data[i].cuisines = "";
			for (var j = 0; j < data[i].cu.length; j++)
				data[i].cuisines += ", " + data[i].cu[j];
			data[i].cuisines = data[i].cuisines.substr("2");
		}
		delList = data;
		$("#restListTemplate").tmpl(data).appendTo("#restList");
		$("#restList").listview('refresh');
		var restTypes = {};
		for (var i = 0; i < data.length; i++){
			for (var j = 0; j < data[i].cu.length; j++){
				if (restTypes[data[i].cu[j]])
					restTypes[data[i].cu[j]]++;
				else
					restTypes[data[i].cu[j]] = 1;
			}
		}
		for (i in restTypes){
			console.log("<option value = '" + i + "'>" + restTypes[i] + "></option>");
			$("#restaurantTypes_selector").append("<option value = '" + i + "'>" + i + " (" + restTypes[i] + ")" + "</option>");
		}
		$("#restaurantTypes_selector").selectmenu('refresh', true);
	})
}


function storeUser(email, pass, defaultAccount){
	//storage.setItem("user", JSON.stringify({email: email, pass: pass}));
	db.storeAccount(email, pass, defaultAccount);
}


function getRestDetails(index){
    console.log("called");
	$.mobile.pageLoading();
	var currRest = delList[index];
	currRest = delList[index];
	Ordrin.r.details(currRest.id, function(data){
		data = JSON.parse(data);
		for(var i = 0; i < data.menu.length; i++) {
			data.menu[i].index = i;
		}
		$(".restName").html(data.name);
		$("#cuisineList").html(data.cuisines);
		$("#rAddress").html(data.addr + " " + data.city + ", " + data.state + " " + data.postal_code);
		$("#minimumDelivery").html("$" + currRest.mino);
		$("#estimatedDelivery").html(currRest.del ? currRest.del : "0" + " minutes");
		$("#menu").html('');
		$("#menuListTemplate").tmpl(data.menu).appendTo("#menu");
		$.mobile.changePage("#restDetails");
		curRest = data;
		$("#menu").listview('refresh');
	});
}

function setCurrMenu(index) {
	currMenu = index;
}


function error(msg){
	$.mobile.pageLoading(true);
	$("body").append("<a href = '#error' data-rel = 'dialog' id = 'removeMe'></a>");
	$("#removeMe").click().remove();
	$("#errorMsg").html(msg);
}
function deactivateButtons(){
	$(".ui-btn-active").removeClass("ui-btn-active");
}

function populateExtras(index){
	for (var i = 0; i < currRest.menu[currMenu].children.length; i++) {
		if (currRest.menu[currMenu].children[i].id == index) {
			currItem = currRest.menu[currMenu].children[i];
			break;
		}
	}
	console.log(currItem);
	if (currItem.children) {
		$("#extrasForm").html('');
		var list = $('<ul>', {
			"data-role": "listview",
			"id": "extrasList"
		});
		$("#extrasHeader").html(currItem.name);
		$("#extrasTemplate").tmpl(currItem.children).appendTo(list);
		$("#extrasForm").append(list);
		$(list).page();
		$.mobile.changePage("#menuExtras");
		//$("#extrasList").listview("refresh");
	}	
}

function validateForm() {
	var object = serializeObject($("#extrasForm"));
	var errors = []
	console.log(object);
	$.each(currItem.children, function() {
		console.log(this);
		var min = this.min_child_select,
			max = this.max_child_select,
			min_id = this.children[0].id,
			max_id = this.children[this.children.length-1].id,
			totalExtras =0;
		if(!min && !max) return;
		for(var i = min_id; i<=max_id; i++) {
			if(object[i]) {totalExtras++;}
		}
		if(min && totalExtras < min) {
			errors.push('You must select at least ' + min + ' extras');
		}
		if (max && totalExtras > max) {
			errors.push('You can not select more than ' + max + ' extras');
		}
		//totalExtras....
	});
	console.log(errors);
}

function serializeObject(form) {
    var o = {};
    var a = form.serializeArray();
    $.each(a, function() {
        if (o[this.name.replace("extra_", "")] !== undefined) {
            if (!o[this.name.replace("extra_", "")].push) {
                o[this.name.replace("extra_", "")] = [o[this.name.replace("extra_", "")]];
            }
            o[this.name.replace("extra_", "")].push(this.value || '');
        } else {
            o[this.name.replace("extra_", "")] = this.value || '';
        }
    });
    return o;
}
