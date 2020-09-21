define(
	["require", "exports", "guiState.controller", "guiState.model"],
	function (require, exports) {
		const guiStateController = require("guiState.controller");
		const guiStateModel = require("guiState.model");

		const notifications = [
			{
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
				.forEach(({triggers, conditions, handle, once}) => {
					const unregisterEventListeners = () => {
						triggers.forEach(({htmlId, event, htmlSelector}) => {
							if (htmlId && event) {
								$(`#${htmlId}`).off(event, onEvent)
							} else if (htmlSelector && event) {
								$(htmlSelector).off(event, onEvent)
							}
						})
					}

					const onEvent = (e, specificConditions) => {
						console.log("in onEvent")

						let specificConditionsAreTrue = !specificConditions || specificConditions.every(isTrue => isTrue(guiStateModel));
						let genericConditionsAreTrue = !conditions || conditions.every(isTrue => isTrue(guiStateModel));

						if (genericConditionsAreTrue && specificConditionsAreTrue) {
							handle(e)
							if (once) unregisterEventListeners();
						}
					}

					triggers.forEach((trigger) => {

						/**
						 * Note: Event handlers attached using the on() method will work for both current and FUTURE elements (like a new element created by a script).
						 * https://www.w3schools.com/jquery/event_on.asp
						 */

						if (trigger.htmlId && trigger.event) {
							console.log({htmlId: trigger.htmlId, event: trigger.event})

							$(`#${(trigger.htmlId)}`).on(trigger.event, e => onEvent(e, trigger.conditions))
						} else if (trigger.htmlSelector && trigger.event) {
							console.log({htmlSelector: trigger.htmlSelector, event: trigger.event})

							$(`${(trigger.htmlSelector)}`).on(trigger.event, e => onEvent(e, trigger.conditions))
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