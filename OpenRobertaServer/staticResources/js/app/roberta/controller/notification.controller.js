define(
	["require", "exports", "guiState.controller"],
	function (require, exports) {
		const guiStateController = require("guiState.controller");

		const fadingDuration = 400;

		const notificationElement = $("#releaseInfo");
		const notificationElementTitle = notificationElement.children('#releaseInfoTitle');
		const notificationElementDescription = notificationElement.children('#releaseInfoContent');

		function onRobotChanged(robot) {
			console.log(`Robot has changed: ${robot}`);
		}

		function onViewChanged(view) {
			console.log(`View has changed: ${view}`);
		}

		function onProgramChanged(program) {
			console.log(`Program has changed: ${program}`);
		}

		function initCallbacks() {
			guiStateController.onViewChanged(onViewChanged);
			guiStateController.onRobotChanged(onRobotChanged)
			guiStateController.onProgramChanged(onProgramChanged)
		}

		exports.init = function () {
			initCallbacks()
			console.log("Init notifications, here load config from guiState / use from guiState")
		};

		exports.showForSimulation = function () {
			console.log(`Show simulation notification for ${guiStateController.getRobot()}`);
			showNotification(`Notification for ${guiStateController.getRobot()}`, "It works")
		};

		exports.hideForSimulation = function () {
			console.log(`Hide simulation notification for ${guiStateController.getRobot()}`)
			hideNotification()
		};


		/**
		 *
		 * @param {String} title
		 * @param {String} description
		 * @param {Number} time
		 */
		function showNotificationForTime(title, description, time = 2000) {
			setContent(title, description);
			$(notificationElement)
				.fadeIn(fadingDuration)
				.delay(time)
				.fadeOut(fadingDuration);
		}

		/**
		 * @param {String} title
		 * @param {String} description
		 */
		function showNotification(title, description) {
			setContent(title, description);
			notificationElement.fadeIn(fadingDuration)
		}

		/**
		 * @param {String} title
		 * @param {String} description
		 */
		function setContent(title, description) {
			notificationElementTitle.html(title)
			notificationElementDescription.html(description)
		}

		function hideNotification() {
			notificationElement.fadeOut(fadingDuration)
		}

		exports.showNotification = showNotification;
		exports.hideNotification = hideNotification;
		exports.showNotificationForTime = showNotificationForTime;
	}
);