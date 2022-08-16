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
		schoolIds: null, // REQUIRED
		mealType: "Lunch",
		moday: moment()
			.day("Monday")
			.format("L")
	},

	start: function () {
		Log.log("Starting module: " + this.name);
		var self = this;
		this.loaded = false;

		this.setHelperConfig();
		setInterval(function () {
			self.updateDom();
		}, this.config.updateInterval);
	},

	setHelperConfig: function () {
		this.sendSocketNotification("SET_CONFIG", this.config);
	},

	getData() {
		if (this.config.schoolIds.length) {
			this.dataRequest = []
			this.config.schoolIds.forEach(school => {
				this.sendSocketNotification("FETCH_DATA", school);
			})
		}
	},

	scheduleUpdate: function (delay) {
		var nextLoad = this.data.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}
		nextLoad = nextLoad;
		var self = this;
		setTimeout(function () {
			self.getData();
		}, nextLoad);
	},

	getHeader: function () {
		return this.data.header.split(" ").join(` ${this.config.mealType} `);
	},

	getFoodItems(ent) {
		let main =
			this.config.mealType.toLowerCase() === "breakfast"
				? "GRAINS"
				: "MEAT/MEAT ALTERNATIVES";
		let out = ent[main]
			? ent[main]
				.filter(obj => obj["MenuItemDescription"] !== "PB&J Lunch ")
				.map(m => m["MenuItemDescription"])
				.join("</br>")
			: "Menu not published";
		
		return out
	},

	// getDom: function() {
	// 	let wrapper = document.createElement("div");
	// 	let table = document.createElement("table");
	// 	console.log("getting dom: ");
	// 	if (this.dataRequest) {
	// 		let showableData = Object.entries(this.dataRequest).filter(ent =>
	// 			moment(ent[0])
	// 				.hour(12)
	// 				.isAfter(moment(), "hour")
	// 		);
	// 		let showableWDays = showableData.filter(
	// 			ent => this.getFoodItems(ent) !== "Menu not published"
	// 		);
	// 		if (!showableWDays.length) {
	// 			this.hide();
	// 		}
	// 		showableData.forEach(ent => {
	// 			let row = document.createElement("tr");
	// 			let dateCell = document.createElement("td");
	// 			dateCell.className = "date-cell";
	// 			let meatCell = document.createElement("td");
	// 			let meats = this.getFoodItems(ent);
	// 			let dateSpanWrap = document.createElement("div");
	// 			let mealSpanWrap = document.createElement("div");

	// 			dateSpanWrap.className = "date-wrap";
	// 			mealSpanWrap.className = "meal-wrap";

	// 			let dateWrapper = document.createElement("span");
	// 			dateWrapper.className = "date light";
	// 			let mealWrapper = document.createElement("span");
	// 			mealWrapper.className = "meal light";
	// 			dateWrapper.innerHTML = moment(ent[0]).format("ddd");
	// 			mealWrapper.innerHTML = meats;

	// 			dateSpanWrap.appendChild(dateWrapper);
	// 			mealSpanWrap.appendChild(mealWrapper);

	// 			dateCell.appendChild(dateSpanWrap);
	// 			meatCell.appendChild(mealSpanWrap);

	// 			row.appendChild(dateCell);
	// 			row.appendChild(meatCell);
	// 			table.appendChild(row);
	// 		});

	// 		wrapper.appendChild(table);
	// 	}

	// 	return wrapper;
	// },

	createDateRows(table) {
		if (this.dataRequest && this.dataRequest.length) {
			Object.keys(this.dataRequest[0].data).filter(d => moment(d).hour(12).isAfter(moment(), "hour")).forEach(date => {
				let dateRow = document.createElement('tr')
				let dateData = document.createElement('td')
				let dateSpanWrap = document.createElement("div");
				dateSpanWrap.className = "date-cell";
				let dateWrapper = document.createElement("span");
				dateWrapper.className = "date light";
				dateWrapper.innerHTML = moment(date).format("ddd");
				dateSpanWrap.appendChild(dateWrapper)
				dateData.appendChild(dateSpanWrap)
				dateRow.appendChild(dateData)


				this.dataRequest.forEach(() => {
					let mealCell = document.createElement('td')
					let mealSpanWrap = document.createElement("div");
					mealSpanWrap.className = "meal-wrap";
					mealCell.innerText = ''
					let mealWrapper = document.createElement("span");
					mealWrapper.className = "meal light";
					mealSpanWrap.appendChild(mealWrapper);
					mealCell.appendChild(mealSpanWrap)
					dateRow.appendChild(mealCell)
				})
				table.appendChild(dateRow)
			})
			return table
		}
	},

	getDom() {
		const app = document.createElement("div");
		app.setAttribute("id", "progress-wrapper");
		let table = document.createElement("table");
		let header_row = document.createElement("tr");
		let blank_header_cell = document.createElement('th')
		
		header_row.appendChild(blank_header_cell)
		table.appendChild(header_row)
		table = this.createDateRows(table)
		if (this.dataRequest && this.dataRequest.length) {
			this.dataRequest.forEach((school, school_index) => {
				let header_data = document.createElement('th')
				header_data.className = 'header-text'
				header_data.innerText = school.name
				header_row.appendChild(header_data)
				Object.entries(school.data).filter(d => moment(d[0]).hour(12).isAfter(moment(), "hour")).forEach((meal, meal_index) => {
					table.rows[meal_index + 1].cells[school_index + 1].lastChild.lastChild.innerHTML = this.getFoodItems(meal[1])
				})
			})
			app.appendChild(table);
		}
		return app
	},

	getScripts: function () {
		return ["moment.js"];
	},

	getStyles: function () {
		return ["MMM-Lunch.css"];
	},

	processData() {
		this.updateDom();
	},

	socketNotificationReceived: function (notification, payload) {
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
					payload.data = JSON.parse(payload.data)
					this.dataRequest.push(payload);
					this.processData();
				} else {
					Log.error("Error: ", payload);
				}
				break;
		}
	}
});
