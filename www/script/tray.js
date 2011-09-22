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

function calculateItemPrice(item){
  item.price = parseFloat(item.menuPrice); //make sure the price is a number and not a string and is the original menu price before any addons
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

  //navigate to the tray
  $.mobile.changePage("#tray");
  tip = (tray.price * .2).toFixed(2); //set the initial tip to 20% of the price.
  $("#tip").val(tip);
  updateTrayPrice(tip);
  $("#trayList").listview("refresh");
}

//should be called every time items are added or tips are done
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

function checkout(){
  var tray_str = orderTray();
  var tip  = new Money($("#tip").val());
  var creditPlace = new Address($("#creditCardBilling").val(), "", $("#creditCardCity").val(), $("#creditCardZip").val(),
                                $("#creditCardState").val(), $("#orderPhone").val(), "home");
  place.phone     = $("#orderPhone").val();
  Ordrin.o.submit(currRest.restaurant_id, tray_str, tip, time, $("#orderEmail").val(),
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