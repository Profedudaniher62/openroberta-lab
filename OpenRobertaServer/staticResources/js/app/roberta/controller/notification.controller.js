define(
	["require", "exports", "guiState.model"],
	function (require, exports) {
		const guiStateModel = require("guiState.model");

		const notifications = [
			{
				once: true,
				triggers: [
					{
						generic: {
							robot: "calliope2017NoBlue"
						}
					},
					{
						htmlId: "tabProgram",
						event: "click",
						conditions: [
							model => model.gui.robot === "calliope2017NoBlue",
						]
					},
					{
						htmlId: "menu-calliope2017NoBlue",
						event: "click",
						conditions: [
							model => model.gui.view === "tabProgram",
						]
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
			},
			{
				once: true,
				triggers: [
					{
						htmlId: "simButton",
						event: "click",
					},
				],
				conditions: [
					model => model.gui.robot === "ev3lejosv1",
				],
				handle: () => {
					console.log("Show notification")
					showNotificationForTime("Hey, EV3", "Wow ES6");
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
			notifications.forEach(notification => {
				let unregisterFunctions = []

				const unregisterEventListeners = () => {
					unregisterFunctions.forEach(f => f())
				}

				const checkForConditionsAndHandle = (e, specificConditions) => {
					console.log("in onEvent")

					let specificConditionsAreTrue = !specificConditions || specificConditions.every(isTrue => isTrue(guiStateModel));
					let genericConditionsAreTrue = !notification.conditions || notification.conditions.every(isTrue => isTrue(guiStateModel));

					if (genericConditionsAreTrue && specificConditionsAreTrue) {
						notification.handle(e)
						if (notification.once) unregisterEventListeners();
					}
				}

				notification.triggers.forEach(({conditions: specificConditions, event, htmlId, htmlSelector}) => {

					/**
					 * Rewriting the .live() method in terms of its successors is straightforward; these are templates for equivalent calls for all three event attachment methods:
					 * $( selector ).live( events, data, handler );                // jQuery 1.3+
					 * $( document ).on( events, selector, data, handler );        // jQuery 1.7+
					 * https://api.jquery.com/live/
					 */

					let eventHandler = e => checkForConditionsAndHandle(e, specificConditions);

					let selector = htmlId ? `#${htmlId}` : htmlSelector;
					if (selector && event) {
						let $element = $(selector);
						let elementIsPresent = $element.length;

						if (elementIsPresent) {
							// Use direct event handler if element is present
							$element.on(event, eventHandler);
							unregisterFunctions.push(() => $element.off(event, eventHandler));
						} else {
							// Use delegate event handler if element is not yet present
							$(document).on(event, selector, eventHandler);
							unregisterFunctions.push(() => $element.off(event, selector, eventHandler));
						}

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
		function showNotificationForTime(title, description, time = 5000) {
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