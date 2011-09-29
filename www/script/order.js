//fetch recent orders for a specific user
function recentOrders() {
  //this will be defined in Ordrin.js
  Ordrin.u.recentOrders(currUser.id, function(data) {
   console.log(data);
  });
}