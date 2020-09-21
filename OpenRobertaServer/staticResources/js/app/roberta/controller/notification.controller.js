define(
	["require", "exports", "guiState.controller", "guiState.model"],
	function (require, exports) {
		const guiStateController = require("guiState.controller");
		const guiStateModel = require("guiState.model");

		const notifications = [
			{
				once: true,
				triggers: [
					{
						htmlId: "tabProgram",
						event: "click",
						conditions: [
							model => model.gui.robot === "calliope2017NoBlue",
						]
					},
					{
						htmlId: "menu-calliope2017NoBlue",
						event: "click"
					},
					{
						htmlSelector: ".popup-robot[data-type='calliope2017NoBlue']:not(.slick-cloned)",
						event: "click"
					}
				],
				/*conditions: [
					Here it is also possible to define conditions
				],*/
				handle: () => {
					console.log("Show notification")
					showNotificationForTime("Hey, Calliope", "Wow ES6");
				}
			}
		]

		const fadingDuration = 400;

		const notificationElement = $("#releaseInfo");
		const notificationElementTitle = notificationElement.children('#releaseInfoTitle');
		const notificationElementDescription = notificationElement.children('#releaseInfoContent');

		exports.init = function () {
			console.log("Init notifications, here load config from guiState / use from guiState")
			initEvents();
		}

		function initEvents() {
			notifications
				.forEach(({triggers, conditions: genericConditions, handle, once}) => {
					let unregisterFunctions = []

					const unregisterEventListeners = () => {
						unregisterFunctions.forEach(f => f())
					}

					const checkForConditionsAndHandle = (e, specificConditions) => {
						console.log("in onEvent")

						let specificConditionsAreTrue = !specificConditions || specificConditions.every(isTrue => isTrue(guiStateModel));
						let genericConditionsAreTrue = !genericConditions || genericConditions.every(isTrue => isTrue(guiStateModel));

						if (genericConditionsAreTrue && specificConditionsAreTrue) {
							handle(e)
							if (once) unregisterEventListeners();
						}
					}

					unregisterFunctions = triggers.map(({conditions: specificConditions, event, htmlId, htmlSelector}) => {

						/**
						 * Rewriting the .live() method in terms of its successors is straightforward; these are templates for equivalent calls for all three event attachment methods:
						 * $( selector ).live( events, data, handler );                // jQuery 1.3+
						 * $( document ).on( events, selector, data, handler );        // jQuery 1.7+
						 * https://api.jquery.com/live/
						 */

						let eventHandler = e => checkForConditionsAndHandle(e, specificConditions);

						if (htmlId && event) {
							$(document).on(event, `#${(htmlId)}`, eventHandler);
							return () => $(document).off(event, `#${(htmlId)}`, eventHandler);
						} else if (htmlSelector && event) {
							$(document).on(event, htmlSelector, eventHandler);
							return () => $(document).off(event, htmlSelector, eventHandler);
						}

					})
				})
		}

		/**
		 *
		 * @param {String} title
		 * @param {String} description
		 * @param {Number} time
		 */
		function showNotificationForTime(title, description, time = 8000) {
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