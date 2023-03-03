/* Magic Mirror
 * Node Helper: MMM-Lunch
 *
 * By Brian Dorton
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var request = require("request");
var https = require("https");
var moment = require("moment");
var _ = require("lodash");

module.exports = NodeHelper.create({
  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "SET_CONFIG":
        this.config = payload;
        this.sendSocketNotification("CONFIG_SET");
        break;

      case "SHOULD_SHOW_CHECKER":
            this.fetchHolidayData();
          break;

      case "FETCH_DATA":
        if (payload) {
          this.fetchData(payload);
        }
        break;
    }
  },

  fetchHolidayData: function() {
    let localUrl = this.config.holidayUrl;
    request(
      {
        url: localUrl,
        method: "GET"
      },
      (error, response, body) => {
        if (error) {
          this.sendSocketNotification("NETWORK_ERROR", error);
        } else {
          let out = {}
          out.data = response.body
          out.statusCode = response.statusCode
          this.sendSocketNotification("SHOULD_SHOW", out);
        }
      }
    );
  },

  fetchData: function (school) {
    let date = this.config.monday || moment().day("Monday").format("L");
    let mealType = _.capitalize(this.config.mealType);
    let localUrl = this.config.url;
    let params = {
      date: date,
      mealType: mealType,
      schoolId: school.id
    };
    request(
      {
        url: localUrl,
        qs: params,
        method: "GET"
      },
      (error, response, body) => {
        if (error) {
          this.sendSocketNotification("NETWORK_ERROR", error);
        } else {
          let out = {}
          out.name = school.name
          out.data = response.body
          out.statusCode = response.statusCode
          this.sendSocketNotification("DATA_AVAILABLE", out);
        }
      }
    );
  }
});
