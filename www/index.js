/**
 * TODO:
 * 		 encapsulate the code? Something needs to be done to make it less messy. Maybe just move the handlers into their own functions, possible in seperate files
 * things should be a little better now that loginUser createUser and createAddress are in a seperate file. Something still needs to be done to make things cleaner though.
 * 		 Save user account (use phonegap for local data storage)
 * 		 Save previous address (use phonegap for local data storage)
 * 		 Switch to opening dialogs with new functions
 *     Time picker so that not all orders are ASAP, also dont allow people to add items to tray if the restaurant is not delivering during their time
 */
// application globals
var delList, storage, db, currMenu, currRest, currItem, currExtra, place, tray = {
  items: [],
  count: 0,
  price: 0.00
}, time;
var currUser = {
	email: "",
	pass: ""
}
//$(document).bind("deviceready", function(){
$(window).load(function(){
  $.mobile.page.prototype.options.addBackBtn = true;
	db = new Database(function(){
		db.getDefaultAccount(function(tx, results){
			if (results.rows.length == 0){
        // first launch so create a new guest user and then get their location and create the new address
				$.mobile.pageLoading();
        db.storeAccount("guest", "", "true");
        currUser.email = "guest";
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
								var streetAddr = false; for (var i in results[1].address_components){
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
          $("#createAddressSub").html("");
					$.mobile.changePage("#createAddress");
					//$("#createAddressAddress").focus();
				});
			}else{
        if (results.rows.item(0).email != "guest")
				  Ordrin.u.setCurrAcct(results.rows.item(0).email, results.rows.item(0).pass);
        currUser.email = results.rows.item(0).email;
        currUser.pass  = results.rows.item(0).pass;
				getAddresses(true);
			}
		});
	});
	Ordrin.initialize("mlJhC8iX4BGWVtn", {
    restaurant: "https://r-test.ordr.in",
    user: "https://u-test.ordr.in",
    order: "https://o-test.ordr.in"
  }); 
  //Ordrin.initialize("key", "localhost/ordrin");
  /*$("#extrasOverview").bind("pagebeforeshow pageshow", function(){
    $("#extrasList").listview("refresh");
  });*/
  $("#menuExtras").bind("pagebeforeshow", function(){
    $("#optionsList").listview("refresh");
  });
  $("#accountInfo").bind("pagebeforeshow", function(){
    AccountInfo.init();
  });
  $("#accountInfo").bind("pagehide", function(){
    AccountInfo.cleanup();
  });

   $("#restaurantSelectorParent").removeClass("ui-btn ui-btn-corner-all ui-shadow ui-btn-up-a");
   $("#restaurantSelectorParent>.ui-btn-inner").removeClass("ui-btn-inner");
	 $("#login_btn").bind("tap", loginUser);
   $("#checkout_btn").bind("tap", checkout);
	
	$("#postAccount_btn").bind("tap", createAccount);
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
  $(".optionBox").live("tap", function(){
    var id = this.id.replace("option", "");
    $(this).children("img").toggleClass("hidden");
  });
	$("#createAddress_btn").bind("tap", createAddress);
  $("#changeDeliveryTime_btn").bind("tap", changeDeliveryTime);
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
									place = new Address(data[0].addr, data[0].addr2, data[0].city, data[0].zip, data[0].state, data[0].phone, data[0].nick);
									 time = new Date();
									 time.setASAP();
									 getRestaurantList(false);
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
         // the user has a default address so move on to restaurants
         var item = results.rows.item(0);
         place = new Address(item.street, item.street2, item.city, item.zip, item.state, item.phone, "");
         time  = new Date();
         time.setASAP();
         getRestaurantList(false);
			 }
		});
	}
/*	if (storedAddress == null){
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
	}*/
}

function addressSelected(place, time){
	getRestaurantList(false);
	storage.setItem("address", JSON.stringify(place));
}

function openDialog(parent, name, transition){
	$(parent).append("<a href = '#" + name + "' data-rel = 'dialog' id = 'removeMe' data-transition = '" + transition + "'></a>");
	$("#removeMe").click().remove();
}

function getRestaurantList(storePlace){
  $.mobile.pageLoading();
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
    $("#restList").empty();
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
    $.mobile.pageLoading(true);
	})
  if (storePlace){
    db.storeAddress(place.street, place.street2, place.city, place.zip, place.state, place.phone, place.nice,
                    "true", "guest", function(){});
  }
}


function storeUser(email, pass, defaultAccount){
	db.storeAccount(email, pass, defaultAccount);
}


function getRestDetails(index){
	currRest = delList[index];
  var id   = currRest.id
  $.mobile.pageLoading();
  if (currRest.is_del){
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
      $("#menu").empty();
      $("#menuListTemplate").tmpl(data.menu).appendTo("#menu");

      currRest = data;
      currRest.restaurant_id = id;
      $("#menu").listview('refresh');
      $(".typeMenu").unbind();
      $(".typeItem").unbind();
      $(".typeMenu").bind("tap", populateMenuItems);
      $.mobile.pageLoading(true);
    });
    $.mobile.changePage("#restDetails");
   }else{
     var days = [
      new Date()
     ];
     $("#deliveryDate").append("<option value='" + days[0].toLocaleDateString() + "'>" +
                                 days[0].toLocaleDateString() + "</option>")
     for (var i = 1; i < 5; i++){
       days.push(new Date(days[i-1].getTime() + 86400000)); 
       $("#deliveryDate").append("<option value='" + days[i].toLocaleDateString() + "'>" +
                                 days[i].toLocaleDateString() + "</option>")
     }
     $.mobile.changePage("#timePicker", {
       role: "dialog",
       transition: "slideup"
     });
   }
}

function changeDeliveryTime(){
 var date = $("#deliveryDate").val() + " " + $("#deliveryTime").val() + " " + $("#deliveryAmPm").val();
 time = new Date(date); 
 $.mobile.activePage.dialog('close');
 getRestaurantList(false);
}

function populateMenuItems() {
  var index = parseInt(this.id.replace("menu", ""));
	currMenu = index;
  $("#menuItemList").empty();
  for (var i = 0; i < currRest.menu[currMenu].children.length; i++){
    currRest.menu[currMenu].children[i].price = parseFloat(currRest.menu[currMenu].children[i].price).toFixed(2);
  }
  $("#menuItemTemplate").tmpl(currRest.menu[currMenu].children).appendTo("#menuItemList");
  $(".typeName").html(currRest.menu[currMenu].name);
  $(".typeDescrip").html(currRest.menu[currMenu].descrip);
  $.mobile.changePage("#menuItems");
  $(".typeItem").bind("tap", setCurrItem);
  $("#menuItemList").listview("refresh");
}

function error(msg, title, btnName){ //TODO come up with a better way to display errors
	$.mobile.pageLoading(true);
	/*$("body").append("<a href = '#error' data-rel = 'dialog' id = 'removeMe'></a>");
	$("#removeMe").click().remove();
	$("#errorMsg").html(msg);*/
  navigator.notification.alert(msg, null, title, btnName);
}
function deactivateButtons(){
	$(".ui-btn-active").removeClass("ui-btn-active");
  $(".ui-btn-active").removeClass("ui-btn-active");
}

function setCurrItem(){
  var index = parseInt(this.id.replace("item", ""));
    for (var i = 0; i < currRest.menu[currMenu].children.length; i++) {
      if (currRest.menu[currMenu].children[i].id == index) {
        currItem = currRest.menu[currMenu].children[i];
        currItem.menuPrice = currItem.price;
        break;
      }
    }
  populateExtras();
}

function populateExtras(){
  if (!currItem.extras){
    currItem.extras     = {};
    currItem.extras_str = "";
  }
	if (currItem.children) {
    $("#itemName").html(currItem.name);
    $("#itemDescrip").html(currItem.descrip);
    $("#itemPrice").html("$" + parseFloat(currItem.price).toFixed(2));
    $("#extrasList").empty();
    for (i = 0; i < currItem.children.length; i++){
      if (!currItem.extras[currItem.children[i].id]){
        currItem.extras[currItem.children[i].id] = [];
      }
      $.tmpl("<li class='ui-btn ui-btn-icon-right' id='extra${id}' onclick='createExtrasPage(\"${index}\");'>${name}<div class='optionsList'></div><span class=\"ui-icon ui-icon-arrow-r\"></span></li>", 
             {name: currItem.children[i].name, index: i, id: currItem.children[i].id}).appendTo("#extrasList");
    }
		$.mobile.changePage("#extrasOverview");
    $("#extrasOverview>div").filter(":first").children("a").attr("href", "#menuItems").children().children(".ui-btn-text").html("Items");
		$("#extrasList").listview("refresh");
	}else{
    addCurrItemToTray();
    $.mobile.changePage("#restDetails", {reverse: true});
  }
}

function createExtrasPage(index){
    currExtra = currItem.children[index];
    var list = $("#optionsList"), checked = {};
    list.empty();
    $("#extrasHeader").html(currItem.name);
    for (var i = 0; i < currItem.extras[currExtra.id].length; i++){
      checked[currItem.extras[currExtra.id][i].id] = true;
    }  
    for (i = 0; i < currItem.children[index].children.length; i++){
      var node = currItem.children[index].children[i];
      if (node.price == 0)
         node.displayPrice  = "";
      else
          node.displayPrice = "+$" + node.price;
      if (checked[node.id])
         node.checked = "";
      else
         node.checked = "hidden";
    }
    $(".optionsTitle").html(currItem.children[index].name);
		$("#extrasTemplate").tmpl(currItem.children[index].children).appendTo(list);
    $.mobile.changePage("#menuExtras");
}

function validateForm() {
  var min         = currExtra.min_child_select,
      max         = currExtra.max_child_select,
      totalExtras = 0
      extras_str  = "";
  if(!min && !max) return;
  currItem.extras[currExtra.id]            = [];
  $("#extra" + currExtra.id + " .optionsList").html("");
  for (var i = 0; i < currExtra.children.length; i++){
    if (!$($("#optionsList").children()[i]).children("img").hasClass("hidden")){
      currItem.extras[currExtra.id].push(currExtra.children[i]);
      $("#extra" + currExtra.id + " .optionsList").append(currExtra.children[i].name + ", ");
      extras_str += ", " + currExtra.children[i].name;
      totalExtras++;
    }
  }
  $("#extra" + currExtra.id + " .optionsList").html($("#extra" + currExtra.id + " .optionsList").html().replace(/,(?!.*,)/, ""));
  if(min && totalExtras < min) {
    error('You must select at least ' + min + ' extras');
    currItem.extras[currExtra.id] = [];
    return;
  }
  if (max && totalExtras > max) {
    error('You can not select more than ' + max + ' extras');
    currItem.extras[currExtra.id] = [];
    return;
  }
  currItem.extras_str += extras_str.substr(2);
  history.back();
}

function addCurrItemToTray(){
  calculateItemPrice(currItem);
  currItem.quantity = $("#extrasQuantity").val();
  if (!currItem.inTray){
    tray.items.push(currItem);
    tray.price     += parseFloat(currItem.price * currItem.quantity);
    tray.count     += parseInt(currItem.quantity);
    currItem.inTray = true;
    $(".innerCount").html(tray.count);
    $('.trayCount').show();
    $.mobile.changePage("#restDetails", {reverse: "true"}); 
    currItem = null;
  }else{
    tray.price     += parseFloat(currItem.price * currItem.quantity - currItem.originalPrice * currItem.originalQuantity);
    tray.count     += parseInt(currItem.quantity - currItem.originalQuantity); 
    $(".innerCount").html(tray.count);
    updateTrayPrice($("#tip").val());
    createExtrasString();
    $("#trayList").empty();
    $("#trayItemTemplate").tmpl(tray.items).appendTo("#trayList");
    $("#trayList").listview("refresh");
    history.back();
  }
}

function createExtrasString(){
  currItem.extras_str = "";
  for (var i in currItem.extras){
    for (var j = 0; j < currItem.extras[i].length; j++){
      currItem.extras_str += ", " + currItem.extras[i][j].name;
    }
  }
  currItem.extras_str = currItem.extras_str.substr(2);
}

function calculateItemPrice(item){
  item.price = parseFloat(item.menuPrice); // make sure the price is a number and not a string and is the original menu price before any addons.
  for (var i in item.extras){
    for (var j = 0; j < item.extras[i].length; j++){
      item.price += parseFloat(item.extras[i][j].price);
    }
  }
}

function loadTray(){
  var tip = 0;
  $("#trayList").empty();
  for (var i = 0; i < tray.items.length; i++){
    tray.items[i].index = i;
  }
  $("#trayItemTemplate").tmpl(tray.items).appendTo("#trayList");
  $.mobile.changePage("#tray", {
    transition: "flip"
  });
  tip = (tray.price * .2).toFixed(2); //set the initial tip to 20% of the price.
  $("#tip").val(tip);
  updateTrayPrice(tip);
  $("#trayList").listview("refresh");
}

function updateTrayPrice(tip){
  Ordrin.r.deliveryFee(currRest.restaurant_id, new Money(tray.price), new Money(tip), time, place, function(data){
    data = JSON.parse(data);
    $("#traySubtotal").html("$" + tray.price.toFixed(2));
    $("#trayFee").html("$" + data.fee);
    $("#trayTax").html("$" + data.tax);
    $("#trayTotal").html("$" + (parseFloat(tray.price) + parseFloat(data.fee) + parseFloat($("#tip").val()) + parseFloat(data.tax)).toFixed(2));
  });

}

function editTrayItem(i){
  currItem                  = tray.items[i];
  currItem.originalQuantity = currItem.quantity;
  currItem.originalPrice    = currItem.price;
  populateExtras();
  for (var j in currItem.extras){
    for (var h = 0; h < currItem.extras[j].length; h++){
     $("#extra" + j + " .optionsList").append(currItem.extras[j][h].name + ", "); 
    }
  }
  $("#extrasOverview>div").filter(":first").children("a").attr("href", "#tray").children().children(".ui-btn-text").html("Tray");
}

function prepareOrder(){
  if (currUser.email == "guest"){
    $.mobile.changePage("#checkout", {
      transition: "slidedown"
    });
  }
}

function checkout(){
  var tray_str = orderTray();
  var tip  = new Money($("#tip").val());
  var creditPlace = new Address($("#creditCardBilling").val(), "", $("#creditCardCity").val(), $("#creditCardZip").val(),
                                $("#creditCardState").val(), $("#orderPhone").val(), "home");
  place.phone     = $("#orderPhone").val();
  Ordrin.o.submit(currRest.restaurant_id, tray_str, tip, time, $("#orderEmail").val(), $("#orderPassword").val(),
                  $("#orderFirstName").val(), $("#orderLastName").val(), place, 
                  $("#creditCardName").val(), $("#creditCardNumber").val(), $("#creditCardCvc").val(), 
                  $("#creditCardExpirationMonth").val() + "/" + $("#creditCardExpirationYear").val(),
                  creditPlace, "", "", function(data){
                    console.log("order placed", data);
                  });
}

function orderTray(){
  var options = "", tray_str = "";
  for (var i = 0; i < tray.items.length; i++){
    options = "";
    for (var j in tray.items[i].extras){
      for (var h = 0; h < tray.items[i].extras[j].length; h++){
        options += "," + tray.items[i].extras[j][h].id;
      }
    }
    tray_str += tray.items[i].id + "/" + tray.items[i].quantity + options; 
  }
  return tray_str;
}
