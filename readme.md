# Ordr.In Mobile Sample Application

## NOTE: This project is still in active development and is not yet ready for production use.

### Getting Started
The  app is built on top of the Ordrin Javascript API and jQuery Mobile, and uses PhoneGap for cross-platform compatibility. See the PhoneGap documentation for details.
It uses jQuery mobile's default theme, which you can extend as you see fit. A custom Ordr.In theme is also included.

### Status
The app has issues running on Chrome; use Safari for testing and debugging.
The app's geocode lookup is not currently supported.
Various iPhone bug fixes are being worked on in different branches.
It has not yet been tested on a physical iPhone.

### Important Functions
You'll need to keep track of a few important function calls to customize your application.

#### tray.js
setCurrItem: takes a clicked menu item and adds it to the current user's order tray. By default, it also prepends a delete link to the item's div.
populateExtras: if an item has options or extras to select (think sauces, extra cheese, etc...), this will load those extras, and navigate to a new screen letting the user modify the selected extras.
addCurrItemToTray: call this to add a clicked item to the tray. By default, this is called by setCurrItem.
removeCurrItemFromTray: call this to remove an item from the tray.
orderTray: a string representation of the current tray, suitable for a summary screen or email confirmations.
checkout: call this to create an Order object with the current tray, tip, and user details.

#### restaurant.js
getRestaurantList: returns a list of restaurants that deliver to the current user and satisfy the current search conditions
getRestaurantDetails: returns a specific restaurant's info, including its menu as a nested array
populateMenuItems: alternative function to load menu items for a specific restaurant, whose id is passed in as the sole parameter