/* global Module */

/* Magic Mirror
 * Module: MMM-Lunch
 *
 * By Brian Dorton
 * MIT Licensed.
 */

Module.register("MMM-Lunch", {
	defaults: {
		updateInterval: 60000,
		retryDelay: 5000
	},

	requiresVersion: "2.1.0", // Required version of MagicMirror

	start: function() {
		var self = this;
		var dataRequest = null;
		var dataNotification = null;

		//Flag for check if module is loaded
		this.loaded = false;

		// Schedule update timer.
		this.getData();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	/*
	 * getData
	 * function example return data and show it in the module wrapper
	 * get a URL request
	 *
	 */
	getData: function() {
		var self = this;

		var urlApi = "http://localhost:8888/lunch";
		var retry = true;

		var dataRequest = new XMLHttpRequest();
		dataRequest.open("GET", urlApi, true);
		dataRequest.onreadystatechange = function() {
			console.log("readyState: ", this.readyState);
			if (this.readyState === 4) {
				console.log("status: ", this.status);
				if (this.status === 200) {
					console.log("this.response: ", Object.entries(JSON.parse(this.response)));
					self.processData(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					Log.error(self.name, this.status);
					retry = false;
				} else {
					Log.error(self.name, "Could not load data.");
				}
				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		dataRequest.send();
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update.
	 *  If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad ;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getDom: function() {
		var self = this;

		// create element wrapper for show into the module
		var wrapper = document.createElement("div");
		// If this.dataRequest is not empty
		let table = document.createElement("table");
		if (this.dataRequest) {
			Object.entries(this.dataRequest).forEach((ent) => {
				if (moment(ent[0]).isSameOrAfter(moment(), "day")) {
					let row = document.createElement("tr");
					let dateCell = document.createElement("td");
					let meatCell = document.createElement("td");
					let meats = ent[1]["MEAT/MEAT ALTERNATIVES"].filter(obj => obj["MenuItemDescription"] !== "PB&J Lunch ").map(m=> m["MenuItemDescription"]).join(", ");
					let dateSpanWrap = document.createElement("div");
					let mealSpanWrap = document.createElement("div");

					dateSpanWrap.className = "date-wrap";
					mealSpanWrap.className = "meal-wrap";

					let dateWrapper = document.createElement("span");
					dateWrapper.className = "date light";
					let mealWrapper = document.createElement("span");
					mealWrapper.className = "meal light";
					dateWrapper.innerHTML = ent[0];
					mealWrapper.innerHTML = meats;

					dateSpanWrap.appendChild(dateWrapper);
					mealSpanWrap.appendChild(mealWrapper);

					dateCell.appendChild(dateSpanWrap);
					meatCell.appendChild(mealSpanWrap);

					row.appendChild(dateCell);
					row.appendChild(meatCell);
					table.appendChild(row);
				}
			});

			// var labelDataRequest = document.createElement("label");
			// Use translate function
			//             this id defined in translations files
			// labelDataRequest.innerHTML = this.translate("TITLE");

			// wrapper.appendChild(labelDataRequest);
			wrapper.appendChild(table);
		}

		// Data from helper
		if (this.dataNotification) {
			var wrapperDataNotification = document.createElement("div");
			// translations  + datanotification
			wrapperDataNotification.innerHTML =  this.translate("UPDATE") + ": " + this.dataNotification.date;

			// wrapper.appendChild(wrapperDataNotification);
		}
		return wrapper;
	},

	getScripts: function () {
		return ["moment.js"];
	},

	getStyles: function () {
		return [
			"MMM-Lunch.css",
		];
	},

	// Load translations files
	getTranslations: function() {
		//FIXME: This can be load a one file javascript definition
		return {
			en: "translations/en.json",
			es: "translations/es.json"
		};
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) { self.updateDom(self.config.animationSpeed) ; }
		this.loaded = true;

		// the data if load
		// send notification to helper
		this.sendSocketNotification("MMM-Lunch-NOTIFICATION_TEST", data);
	},

	// socketNotificationReceived from helper
	socketNotificationReceived: function (notification, payload) {
		if(notification === "MMM-Lunch-NOTIFICATION_TEST") {
			// set dataNotification
			this.dataNotification = payload;
			this.updateDom();
		}
	},
});