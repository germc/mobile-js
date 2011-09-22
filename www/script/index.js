/**
 * TODO:
 *      encapsulate the code? Something needs to be done to make it less messy. Maybe just move the handlers into their own functions, possible in seperate files
 * things should be a little better now that loginUser createUser and createAddress are in a seperate file. Something still needs to be done to make things cleaner though.
 *      Save user account (use phonegap for local data storage)
 *      Save previous address (use phonegap for local data storage)
 *      Switch to opening dialogs with new functions
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

$(window).ready(function(){
  $.mobile.page.prototype.options.addBackBtn = true;

  //production initialization
  Ordrin.initialize("mlJhC8iX4BGWVtn", {
    restaurant: "https://r-test.ordr.in",
    user: "https://u-test.ordr.in",
    order: "https://o-test.ordr.in"
  });

  db = new Database(function(){
    db.getDefaultAccount(function(tx, results){
      if (results.rows.length == 0){
        // first launch so create a new guest user and then get their location and create the new address
        db.storeAccount("guest", "", "true");
        currUser.email = "guest";

        navigator.geolocation.getCurrentPosition(function(position){
          // set up Google Maps Geocoder
          if (position.latitude && position.longitude) {
            $.mobile.pageLoading(true);
            $.mobile.changePage("#createAddress");
            var geocoder = new google.maps.Geocoder;
            var latLng = new google.maps.LatLng(position.latitude, position.longitude);
            geocoder.geocode({"latLng": latLng}, function(results, status){
              if (status == google.maps.GeocoderStatus.OK && results[1]){
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
            }else{
              console.log("unable to geocode " + status);
            }
          });
          }
        }, function(){
          handleNoGeolocation();
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

$("#menuExtras").bind("pagebeforeshow", function(){
  $("#optionsList").listview("refresh");
});

//Add/Decrease Quantities
$('#quantityUp_btn').click(function(){ increaseQuantity(); });
$('#quantityDown_btn').click(function(){ decreaseQuantity(); });
$('#addToTray').click(function(){ addCurrItemToTray(); });

//This should be happening elsewhere
$("#login_btn").bind("tap", loginUser);
$("#checkout_btn").bind("tap", checkout);

$("#postAccount_btn").bind("tap", createAccount);

function handleNoGeolocation() {
  alert("Geolocation service failed.");
  $("#createAddressHeader").html("Where Would You Like Your Food Delivered To?");
  $("#createAddressSub").html("");
  $.mobile.changePage("#createAddress");
  $("#createAddressAddress").focus();
}

function openDialog(parent, name, transition){
  $(parent).append("<a href = '#" + name + "' data-rel = 'dialog' id = 'removeMe' data-transition = '" + transition + "'></a>");
  $("#removeMe").click().remove();
}

function storeUser(email, pass, defaultAccount){
  db.storeAccount(email, pass, defaultAccount);
}

function error(msg, title, btnName){
  $.mobile.pageLoading(true);
  navigator.notification.alert(msg, null, title, btnName);
}
function deactivateButtons(){
  $(".ui-btn-active").removeClass("ui-btn-active");
  $(".ui-btn-active").removeClass("ui-btn-active");
}

//General purpose form validation?
function validateForm() {
  var min         = currExtra.min_child_select,
      max         = currExtra.max_child_select,
      totalExtras = 0
      extras_str  = "";
  if(!min && !max) return;
  currItem.extras[currExtra.id] = [];
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

function createExtrasString(){
  currItem.extras_str = "";
  for (var i in currItem.extras){
    for (var j = 0; j < currItem.extras[i].length; j++){
      currItem.extras_str += ", " + currItem.extras[i][j].name;
    }
  }
  currItem.extras_str = currItem.extras_str.substr(2);
}