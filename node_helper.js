/* Magic Mirror
 * Node Helper: MMM-Lunch
 *
 * By Brian Dorton
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var request = require("request");
var moment = require("moment");

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		switch(notification) {
		  case "SET_CONFIG":
		  this.config = payload;
		  console.log("this.config: ", this.config);
		  this.sendSocketNotification("CONFIG_SET");
		  break;

		  case "FETCH_DATA":
		  this.fetchData();
		  break;
		}
	},

	fetchData: function() {

		let schoolId = this.config.schoolId || "4e1c1aa8-8fbe-49b7-af51-61a61f0bc651";
		let monday = this.config.monday || "02/03/2020";
		let mealType = this.config.mealType || "Lunch";
		let url =
        `https://webapis.schoolcafe.com/api/CalendarView/GetWeeklyMenuitems?SchoolId=${schoolId}&ServingDate=${monday}&ServingLine=Line%201&MealType=${mealType}`;

		request({
			url: url,
			method: "GET"
		}, (error, response, body) => {
		  if (error) {
				this.sendSocketNotification("NETWORK_ERROR", error);
		  } else {
				this.sendSocketNotification("DATA_AVAILABLE", response);
		  }
		});
	}
});
