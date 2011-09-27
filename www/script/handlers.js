$("#menuExtras").bind("pagebeforeshow", function(){
  $("#optionsList").listview("refresh");
});

//Add/Decrease Quantities
$('#menuItem').click(function(){ increaseQuantity(); });
$('#quantityUp_btn').click(function(){ increaseQuantity(); });
$('#quantityDown_btn').click(function(){ decreaseQuantity(); });
$('#addToTray').click(function(){ addCurrItemToTray(); });

//general link bindings
$("#home_btn").bind("tap", getRestaurantList);
$("#login_btn").bind("tap", loginUser);
$("#checkout_btn").bind("tap", checkout);
$("#createAddress_btn").bind("tap", createAddress);
$("#changeDeliveryTime_btn").bind("tap", changeDeliveryTime);
$(".typeItem").bind("tap", setCurrItem);
$("#postAccount_btn").bind("tap", createAccount);

//Link templates and content
$('#settings').live('click', function(){
  $('#settingsTemplate').tmpl().appendTo('#settings');
});

function increaseQuantity(){
  $("#extrasQuantity").val(parseInt($("#extrasQuantity").val()) + 1);
}

function decreaseQuantity(){
  if ($("#extrasQuantity").val() > 1)
    $("#extrasQuantity").val(parseInt($("#extrasQuantity").val()) - 1);
}

//click handlers
function deactivateButtons(){
  $(".ui-btn-active").removeClass("ui-btn-active");
  $(".ui-btn-active").removeClass("ui-btn-active");
}

function createAccount(){
    currUser.email = $("#createEmail").val();
    currUser.pass  = $("#createPassword").val();
    $.mobile.pageLoading();
    Ordrin.u.makeAcct(currUser.email, currUser.pass, $("#createFirstName").val(), $("#createLastName").val(), function(data){
      data = JSON.parse(data);
      $.mobile.pageLoading(true);
      if (data._error != undefined && data._error != 0){
        error(data.msg)
      }else{
        Ordrin.u.setCurrAcct(currUser.email, currUser.pass);
        getAddresses(true);
      }
    });
}
function createAddress(){
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
    place = new Address($("#createAddressAddress").val(), $("#createAddressAddress2").val(), $("#createAddressCity").val(),
                        $("#createAddressZip").val(), $("#createAddressState").val(), $("#createAddressPhone").val(),
                        $("#createAddressName").val());
    time = "ASAP";
    $.mobile.changePage("#restaurant");
        if (currUser.email != "guest"){
          Ordrin.u.updateAddress(place, function(data){
            data = JSON.parse(data);
            if (data._error != undefined && data._error != 0){
              error(data.msg);
            }else{
              getRestaurantList(true);
            }
          });
    }else{
       getRestaurantList(true);
    }
}

function loginUser(){
    //TODO: implement facebook login here as well
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
}
