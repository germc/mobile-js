//needs to be accessible in a few places
var currItemDiv;

function setCurrItem(item_id){
  var index = parseInt(item_id);

  //display removeItem button

  //loop over restaurant.menu
  //currRest came from getRestaurantDetails
  for (var i = 0; i < currRest.menu.length; i++) {
    for (var j = 0; j < currRest.menu[i].children.length; j++) {
      if (currRest.menu[i].children[j].id == index) {
        currItem = currRest.menu[i].children[j];
        currItem.menuPrice = currItem.price;
        if (!currItem.quantity) { currItem.quantity = 1; } //NaN issue
        break;
      }
    }
  }

  $('#removeItemButton').tmpl(currItem).prependTo(currItemDiv);

  populateExtras();
}

function populateExtras(){

  //if the item actually has extras, present those
  if (currItem.children) {
    var data = JSON.parse(currItem.children);
    $('#trayItemTemplate').tmpl(data).appendTo('#extrasList');
    $("#extrasList").listview("refresh");
    $.mobile.changePage("#extrasOverview");
  }
  //the item has no extras to select, so just add it to tray
  else {
    addCurrItemToTray();
    $.mobile.changePage("#restDetails");
  }
}

function createExtrasPage(index){
    var data = JSON.parse(currItem)
    var children = JSON.parse(currItem.children[index].children);

    $('#menuExtrasTemplate').tmpl(data).appendTo('#menuExtras');
    $("#extrasTemplate").tmpl(children).appendTo('#optionsList');
    $.mobile.changePage("#menuExtras");
}

function addCurrItemToTray(){
  tray.count    += 1;
  calculateItemPrice(currItem);
  tray.price     += parseFloat(currItem.price);

  currItemDiv = $('#item_' + currItem.id + '_quantity');
  currItemDiv.html(currItem.quantity);
  $('#removeItemButton').tmpl(currItem).prependTo(currItemDiv);

  if (!currItem.inTray){
    tray.items.push(currItem);
    currItem.inTray = true;
  }
  else
  {
    for (var i = 0; i < tray.items.length; i++) {
      if (tray.items[i].id == currItem.id) {
        tray.items[i].quantity += 1;
      }
    }
    createExtrasString();
    currItemDiv.html(currItem.quantity);
    $("#trayItemTemplate").tmpl(tray.items).appendTo("#trayList");
  }
}

function removeCurrItemFromTray() {
  tray.count -= 1;
  calculateItemPrice(currItem);
  tray.price -= parseFloat(currItem.price);

  currItemDiv.html(currItem.quantity);
}

function calculateItemPrice(item){
  item.price = parseFloat(item.menuPrice); //make sure the price is a number and not a string and is the original menu price before any addons
  for (var i in item.extras){
    for (var j = 0; j < item.extras[i].length; j++){
      item.price += parseFloat(item.extras[i][j].price);
    }
  }
}

function loadTray(){
  var tip = (tray.price * .2).toFixed(2);
  var tray_items = JSON.parse(tray.items);
  updateTrayPrice(tip);

  $("#trayItemTemplate").tmpl(tray_items).appendTo("#trayList");
  $.mobile.changePage("#tray");
  $("#trayList").listview("refresh");
}

//should be called every time items are added or tips are done
function updateTrayPrice(tip){
  if (!place) { var place = '1 Main Street, Weston, 77840'; }
  Ordrin.r.deliveryFee(currRest.restaurant_id, new Money(tray.price), new Money(tip), time, place, function(data){
    data = JSON.parse(data);
    total = parseFloat(tray.price) + parseFloat(data.fee) + parseFloat($("#tip").val()) + parseFloat(data.tax.toFixed(2));

    $('#trayTemplate').tmpl(data).appendTo('#tray');
    $("#trayTotal").html("$" + total);
    $('#tray').listview('refresh');
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

//outputs string representing all the items in the tray
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

function checkout(){
  var tray_str = orderTray();
  var tip = new Money($("#tip").val());
  var creditPlace = new Address($("#creditCardBilling").val(), "", $("#creditCardCity").val(), $("#creditCardZip").val(), $("#creditCardState").val(), $("#orderPhone").val(), "home");
  place.phone = $("#orderPhone").val();

  Ordrin.o.submit(currRest.restaurant_id, tray_str, tip, time, $("#orderEmail").val(),
                  $("#orderFirstName").val(), $("#orderLastName").val(), place,
                  $("#creditCardName").val(), $("#creditCardNumber").val(), $("#creditCardCvc").val(),
                  $("#creditCardExpirationMonth").val() + "/" + $("#creditCardExpirationYear").val(),
                  creditPlace, "", "", function(data){
                    console.log("order placed", data);
                  });
}