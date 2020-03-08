/* global Module */

/* Magic Mirror
 * Module: MMM-Lunch
 *
 * By Brian Dorton
 * MIT Licensed.
 */

Module.register("MMM-Lunch", {
	defaults: {
		updateInterval: 1800 * 1000,
		retryDelay: 5000,
		schoolId: null, // REQUIRED
		mealType: "Lunch",
		moday: moment()
			.day("Monday")
			.format("L")
	},

	start: function() {
		Log.log("Starting module: " + this.name);
		var self = this;
		this.loaded = false;

		this.setHelperConfig();
		setInterval(function() {
			self.updateDom();
		}, this.config.updateInterval);
	},

	setHelperConfig: function() {
		this.sendSocketNotification("SET_CONFIG", this.config);
	},
	getData: function() {
		if (this.config.schoolId) {
			this.sendSocketNotification("FETCH_DATA");
		}
	},

	scheduleUpdate: function(delay) {
		var nextLoad = this.data.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad;
		var self = this;
		setTimeout(function() {
			self.getData();
		}, nextLoad);
	},

	getHeader: function() {
		return this.data.header.split(" ").join(` ${this.config.mealType} `);
	},

	getFoodItems(ent) {
		let main =
      this.config.mealType.toLowerCase() === "breakfast"
      	? "GRAINS"
      	: "MEAT/MEAT ALTERNATIVES";
		return ent[1][main]
			? ent[1][main]
				.filter(obj => obj["MenuItemDescription"] !== "PB&J Lunch ")
				.map(m => m["MenuItemDescription"])
				.join(", ")
			: "Menu not published";
	},

	getDom: function() {
		let wrapper = document.createElement("div");
		let table = document.createElement("table");
		console.log("getting dom: ");
		if (this.dataRequest) {
			let showableData = Object.entries(this.dataRequest).filter(ent =>
				moment(ent[0])
					.hour(12)
					.isAfter(moment(), "hour")
			);
			let showableWDays = showableData.filter(
				ent => this.getFoodItems(ent) !== "Menu not published"
			);
			if (!showableWDays.length) {
				this.hide();
			}
			showableData.forEach(ent => {
				let row = document.createElement("tr");
				let dateCell = document.createElement("td");
				dateCell.className = "date-cell";
				let meatCell = document.createElement("td");
				let meats = this.getFoodItems(ent);
				let dateSpanWrap = document.createElement("div");
				let mealSpanWrap = document.createElement("div");

				dateSpanWrap.className = "date-wrap";
				mealSpanWrap.className = "meal-wrap";

				let dateWrapper = document.createElement("span");
				dateWrapper.className = "date light";
				let mealWrapper = document.createElement("span");
				mealWrapper.className = "meal light";
				dateWrapper.innerHTML = moment(ent[0]).format("ddd");
				mealWrapper.innerHTML = meats;

				dateSpanWrap.appendChild(dateWrapper);
				mealSpanWrap.appendChild(mealWrapper);

				dateCell.appendChild(dateSpanWrap);
				meatCell.appendChild(mealSpanWrap);

				row.appendChild(dateCell);
				row.appendChild(meatCell);
				table.appendChild(row);
			});

			wrapper.appendChild(table);
		}

		return wrapper;
	},

	getScripts: function() {
		return ["moment.js"];
	},

	getStyles: function() {
		return ["MMM-Lunch.css"];
	},

	processData: function(data) {
		var self = this;
		this.dataRequest = data;
		if (this.loaded === false) {
			self.updateDom();
		}
		this.loaded = true;
	},

	socketNotificationReceived: function(notification, payload) {
		switch (notification) {
		case "CONFIG_SET":
			this.getData();
			break;
		case "NETWORK_ERROR":
			Log.error("Error reaching Lunch: ", payload);
			this.scheduleUpdate();
			break;

		case "DATA_AVAILABLE":
			if (payload.statusCode == 200) {
				this.processData(JSON.parse(payload.body));
			} else {
				Log.error("Error: ", payload);
			}
			break;
		}
	}
});
