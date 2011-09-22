function getRestaurantList(){
  Ordrin.initialize("shds1d6c4BGDGs8", "http://nn2.deasil.com");
  var time = new Date();
  time.setASAP();
  var place = new Address("1 Main Street", "", "Weston", "77840");
  Ordrin.r.deliveryList(time, place, function(data){
    data = JSON.parse(data);
    $('#restListTemplate').tmpl(data).appendTo('#restaurantList');
  });

  $.mobile.changePage('#restList');
}

function getRestaurantDetails(rid){
  Ordrin.r.details(rid, function(data){
    var data = JSON.parse(data);
    $('#restDetails').html(null);
    $('#restDetailsTemplate').tmpl(data).appendTo('#restDetails');
  });

  $.mobile.changePage("#restDetails");
}

function changeDeliveryTime(){
 var date = $("#deliveryDate").val() + " " + $("#deliveryTime").val() + " " + $("#deliveryAmPm").val();
 var time = new Date(date);
 $.mobile.activePage.dialog('close');
 getRestaurantList(false);
}

function populateMenuItems() {
  var index = parseInt(this.id.replace("menu", ""));
  currMenu = index;
  $("#menuItemList").empty();
  $("#menuItemTemplate").tmpl(currRest.menu[currMenu].children).appendTo("#menuItemList");
  $(".typeName").html(currRest.menu[currMenu].name);
  $(".typeDescrip").html(currRest.menu[currMenu].descrip);
  $.mobile.changePage("#menuItems");
  $("#menuItemList").listview("refresh");
}

// handle the user switching the type of restaurant
//rewrite to use templates and refresh automatically
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
});