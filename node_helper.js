/* Magic Mirror
 * Node Helper: MMM-Lunch
 *
 * By Brian Dorton
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var request = require("request");
var moment = require("moment");
var _ = require("lodash");

module.exports = NodeHelper.create({
	socketNotificationReceived: function(notification, payload) {
		switch (notification) {
		case "SET_CONFIG":
			this.config = payload;
			this.sendSocketNotification("CONFIG_SET");
			break;

		case "FETCH_DATA":
			if (this.config.schoolId) {
				this.fetchData();
			}
			break;
		}
	},

	fetchData: function() {
		let date = this.config.monday || moment()
			.day("Monday")
			.format("L");
		let mealType = _.capitalize(this.config.mealType);
		let url = `https://webapis.schoolcafe.com/api/CalendarView/GetWeeklyMenuitems?SchoolId=${this.config.schoolId}&ServingDate=${date}&ServingLine=Line%201&MealType=${mealType}`;

		request(
			{
				url: url,
				method: "GET"
			},
			(error, response, body) => {
				if (error) {
					this.sendSocketNotification("NETWORK_ERROR", error);
				} else {
					this.sendSocketNotification("DATA_AVAILABLE", response);
				}
			}
		);
	}
});
