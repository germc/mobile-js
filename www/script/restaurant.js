$(document).bind("mobileinit", function(){
  getList();
});
	
function getList(){
	Ordrin.initialize("shds1d6c4BGDGs8", "http://nn2.deasil.com");
	var time = new Date();
	time.setASAP();
	var place = new Address("1 Main Street", "", "Weston", "77840")
	Ordrin.r.deliveryList(time, place, function(data){
		for (var i in data) {
			$('#restList').append("<li>" + data.na + "</li>")
		}
	})
}