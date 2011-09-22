
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
/*  if (storedAddress == null){
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