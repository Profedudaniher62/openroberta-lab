define(
	["require", "exports", "guiState.model", "guiState.controller"],
	function (require, exports) {
		const guiStateModel = require("guiState.model");
		const guiStateController = require("guiState.controller");

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
							{
								guiModel: "robot",
								equals: "calliope2017NoBlue",
							},
						]
					},
					{
						htmlId: "menu-calliope2017NoBlue",
						event: "click",
						conditions: [
							{
								guiModel: "view",
								equals: "tabProgram"
							}
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
				handlers: [
					{
						popupNotification: {
							time: 5000, // ms
							title: {
								de: "Konfiguration",
								en: "Configuration",

							},
							description: {
								de: "Hey, Calliope benutzt nun eine Konfiguration",
								en: "Hey, Calliope now uses a configuration",
							}
						}
					},
					{
						elementMarker: {
							htmlId: "tabConfiguration",
							content: {
								de: "Neu"
							}
						}
					}
				]
			},
			{
				once: false,
				triggers: [
					{
						htmlId: "simButton",
						addClass: "rightActive",
					},
				],
				conditions: [
					{
						guiModel: "robot",
						equals: "ev3lejosv1",
					},
				],
				handlers: [
					{
						popupNotification: {
							time: 5000, // ms
							title: {
								de: "Simulationsanpassung",
								en: "Simulation changes",
							},
							description: {
								de: "Hey, wir haben die Simulation angepasst.",
								en: "Hey, we changed the simulation ...",
							}
						},
					},
				]
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

		function evaluateCondition({callback, element, equals, notEquals, guiModel, hasClass}) {
			if (callback) {
				return callback(guiStateModel);
			}
			if (guiModel) {
				if (equals) {
					return guiStateModel.gui[guiModel] === equals;
				}
				if (notEquals) {
					return guiStateModel.gui[guiModel] !== notEquals;
				}
			}
			if (element) {
				if (hasClass) {
					return $(element).hasClass(hasClass);
				}
			}
			return true
		}


		function parseSelector(element) {
			return element.htmlId ? `#${(element.htmlId)}` : element.htmlSelector;
		}

		function parseLocalized(object) {
			let localizedDescription = object[guiStateController.getLanguage()];
			return localizedDescription || object;
		}

		function handleNotification(handlers) {
			handlers.forEach(({elementMarker, popupNotification}) => {
				if (popupNotification) {
					const title = parseLocalized(popupNotification.title);
					const description = parseLocalized(popupNotification.description);
					const time = popupNotification.time || 5000
					showNotificationForTime(title, description, time);
				}
				if (elementMarker) {
					const $element = $(parseSelector(elementMarker));
					if ($element.length) {
						const content = parseLocalized(elementMarker.content)
						let $badge = $(`<span class='badge badge-primary' style="display:none;">${content}</span>`);
						$badge.appendTo($element);
						$badge.fadeIn();
					}
				}
			})
		}

		function initEvents() {
			notifications.forEach(notification => {
				let unregisterFunctions = []

				function registerEventListener(selector, event, eventHandler) {
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

				const unregisterEventListeners = () => {
					unregisterFunctions.forEach(f => f())
				}

				const checkForConditionsAndHandle = (e, specificConditions) => {
					let specificConditionsAreTrue = !specificConditions || specificConditions.every(cond => evaluateCondition(cond));
					let genericConditionsAreTrue = !notification.conditions || notification.conditions.every(cond => evaluateCondition(cond));

					if (genericConditionsAreTrue && specificConditionsAreTrue) {
						handleNotification(notification.handlers)
						if (notification.once) unregisterEventListeners();
					}
				}

				notification.triggers.forEach((trigger) => {
					const event = trigger.event;
					const htmlId = trigger.htmlId;
					const htmlSelector = trigger.htmlSelector;
					const addClass = trigger.addClass;
					const removeClass = trigger.removeClass;

					/**
					 * Rewriting the .live() method in terms of its successors is straightforward; these are templates for equivalent calls for all three event attachment methods:
					 * $( selector ).live( events, data, handler );                // jQuery 1.3+
					 * $( document ).on( events, selector, data, handler );        // jQuery 1.7+
					 * https://api.jquery.com/live/
					 */

					let eventHandler = e => checkForConditionsAndHandle(e, trigger.conditions);

					let selector = parseSelector(trigger);

					if (selector && event) {
						registerEventListener(selector, event, eventHandler);
					} else if (selector && addClass) {
						registerEventListener(selector, "classChange", (e) => {
							if ($(selector).hasClass(addClass)) {
								eventHandler(e);
							}
						})
					} else if (selector && removeClass) {
						registerEventListener(selector, "classChange", (e) => {
							if (!$(selector).hasClass(removeClass)) {
								eventHandler(e);
							}
						})
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