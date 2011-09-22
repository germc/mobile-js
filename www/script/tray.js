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
  calculateItemPrice(currItem);
  currItem.quantity = $("#extrasQuantity").val();

  if (!currItem.inTray){
    tray.items.push(currItem);
    tray.price     += parseFloat(currItem.price * currItem.quantity);
    tray.count     += parseInt(currItem.quantity);
    currItem.inTray = true;
    $.mobile.changePage("#restDetails");
  }
  else
  {
    tray.price     += parseFloat(currItem.price * currItem.quantity - currItem.originalPrice * currItem.originalQuantity);
    tray.count     += parseInt(currItem.quantity - currItem.originalQuantity);
    updateTrayPrice($("#tip").val());
    createExtrasString();
    $("#trayItemTemplate").tmpl(tray.items).appendTo("#trayList");
    $("#trayList").listview("refresh");
    history.back();
  }
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
  Ordrin.r.deliveryFee(currRest.restaurant_id, new Money(tray.price), new Money(tip), time, place, function(data){
    data = JSON.parse(data);
    $('#trayTemplate').tmpl(data).appendTo('#tray');
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