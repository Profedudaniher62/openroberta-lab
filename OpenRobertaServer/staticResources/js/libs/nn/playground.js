/**
 * This is an addition to the Open Roberta Lab. It supports self programmed Neural Networks.
 * Our work is heavily based on the tensorflow playground, see https://github.com/tensorflow/playground.
 * The Open Roberta Lab is open source and uses the Apache 2.0 License, see https://www.apache.org/licenses/LICENSE-2.0
 */
define(["require", "exports", "./nn", "./state", "d3"], function (require, exports, nn, state_1, d3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.runPlayground = void 0;
    function runPlayground() {
        var mainWidth;
        var RECT_SIZE = 30;
        var BIAS_SIZE = 5;
        var NUM_SAMPLES_CLASSIFY = 500;
        var DENSITY = 100;
        var HoverType;
        (function (HoverType) {
            HoverType[HoverType["BIAS"] = 0] = "BIAS";
            HoverType[HoverType["WEIGHT"] = 1] = "WEIGHT";
        })(HoverType || (HoverType = {}));
        var INPUTS = {
            "i1": { f: function (label) { return 0.0; }, label: "I_1" },
            "i2": { f: function (label) { return 4.0; }, label: "I_2" },
            "i3": { f: function (label) { return 6.0; }, label: "I_3" },
        };
        var HIDABLE_CONTROLS = [
            ["Show test data", "showTestData"],
            ["Discretize output", "discretize"],
            ["Play button", "playButton"],
            ["Step button", "stepButton"],
            ["Reset button", "resetButton"],
            ["Learning rate", "learningRate"],
            ["Activation", "activation"],
            ["Regularization", "regularization"],
            ["Regularization rate", "regularizationRate"],
            ["Problem type", "problem"],
            ["Which dataset", "dataset"],
            ["Ratio train data", "percTrainData"],
            ["Noise level", "noise"],
            ["Batch size", "batchSize"],
            ["# of hidden layers", "numHiddenLayers"],
        ];
        var state = new state_1.State();
        var iter = 0;
        var linkWidthScale = d3.scale.linear()
            .domain([0, 5])
            .range([1, 10])
            .clamp(true);
        var colorScale = d3.scale.linear()
            .domain([-1, 0, 1])
            .range(["#f59322", "#e8eaeb", "#0877bd"])
            .clamp(true);
        var boundary = {};
        var selectedNodeId = null;
        var network = null;
        function makeGUI() {
            d3.select("#next-step-button").on("click", function () {
                if (iter === 0) {
                    simulationStarted();
                }
                oneStep();
            });
            d3.select("#add-layers").on("click", function () {
                if (state.numHiddenLayers >= 6) {
                    return;
                }
                state.networkShape[state.numHiddenLayers] = 2;
                state.numHiddenLayers++;
                parametersChanged = true;
                reset();
            });
            d3.select("#remove-layers").on("click", function () {
                if (state.numHiddenLayers <= 0) {
                    return;
                }
                state.numHiddenLayers--;
                state.networkShape.splice(state.numHiddenLayers);
                parametersChanged = true;
                reset();
            });
            var activationDropdown = d3.select("#activations").on("change", function () {
                state.activation = state_1.activations[this.value];
                parametersChanged = true;
                reset();
            });
            activationDropdown.property("value", state_1.getKeyFromValue(state_1.activations, state.activation));
            // Listen for css-responsive changes and redraw the svg network.
            window.addEventListener("resize", function () {
                var newWidth = document.querySelector("#main-part")
                    .getBoundingClientRect().width;
                if (newWidth !== mainWidth) {
                    mainWidth = newWidth;
                    drawNetwork(network);
                    updateUI(true);
                }
            });
        }
        function updateBiasesUI(network) {
            nn.forEachNode(network, true, function (node) {
                d3.select("rect#bias-" + node.id).style("fill", colorScale(node.bias));
            });
        }
        function updateWeightsUI(network, container) {
            for (var layerIdx = 1; layerIdx < network.length; layerIdx++) {
                var currentLayer = network[layerIdx];
                // Update all the nodes in this layer.
                for (var i = 0; i < currentLayer.length; i++) {
                    var node = currentLayer[i];
                    for (var j = 0; j < node.inputLinks.length; j++) {
                        var link = node.inputLinks[j];
                        container.select("#link" + link.source.id + "-" + link.dest.id)
                            .style({
                            "stroke-dashoffset": -iter / 3,
                            "stroke-width": linkWidthScale(Math.abs(link.weight)),
                            "stroke": colorScale(link.weight)
                        })
                            .datum(link);
                    }
                }
            }
        }
        function drawNode(cx, cy, nodeId, isInput, container, node) {
            var x = cx - RECT_SIZE / 2;
            var y = cy - RECT_SIZE / 2;
            var nodeGroup = container.append("g")
                .attr({
                "class": "node",
                "id": "node" + nodeId,
                "transform": "translate(" + x + "," + y + ")"
            });
            // Draw the main rectangle.
            nodeGroup.append("rect")
                .attr({
                x: 0,
                y: 0,
                width: RECT_SIZE,
                height: RECT_SIZE,
            });
            var activeOrNotClass = state[nodeId] ? "active" : "inactive";
            if (isInput) {
                var label = INPUTS[nodeId].label != null ?
                    INPUTS[nodeId].label : nodeId;
                // Draw the input label.
                var text = nodeGroup.append("text").attr({
                    class: "main-label",
                    x: -10,
                    y: RECT_SIZE / 2, "text-anchor": "end"
                });
                if (/[_^]/.test(label)) {
                    var myRe = /(.*?)([_^])(.)/g;
                    var myArray = void 0;
                    var lastIndex = void 0;
                    while ((myArray = myRe.exec(label)) != null) {
                        lastIndex = myRe.lastIndex;
                        var prefix = myArray[1];
                        var sep = myArray[2];
                        var suffix = myArray[3];
                        if (prefix) {
                            text.append("tspan").text(prefix);
                        }
                        text.append("tspan")
                            .attr("baseline-shift", sep === "_" ? "sub" : "super")
                            .style("font-size", "9px")
                            .text(suffix);
                    }
                    if (label.substring(lastIndex)) {
                        text.append("tspan").text(label.substring(lastIndex));
                    }
                }
                else {
                    text.append("tspan").text(label);
                }
                nodeGroup.classed(activeOrNotClass, true);
            }
            if (!isInput) {
                // Draw the node's bias.
                nodeGroup.append("rect")
                    .attr({
                    id: "bias-" + nodeId,
                    x: -BIAS_SIZE - 2,
                    y: RECT_SIZE - BIAS_SIZE + 3,
                    width: BIAS_SIZE,
                    height: BIAS_SIZE,
                }).on("mouseenter", function () {
                    updateHoverCard(HoverType.BIAS, node, d3.mouse(container.node()));
                }).on("mouseleave", function () {
                    updateHoverCard(null);
                });
            }
            // Draw the node's canvas.
            var div = d3.select("#network").insert("div", ":first-child")
                .attr({
                "id": "canvas-" + nodeId,
                "class": "canvas"
            })
                .style({
                position: "absolute",
                left: x + 3 + "px",
                top: y + 3 + "px"
            })
                .on("mouseenter", function () {
                selectedNodeId = nodeId;
                div.classed("hovered", true);
                nodeGroup.classed("hovered", true);
            })
                .on("mouseleave", function () {
                selectedNodeId = null;
                div.classed("hovered", false);
                nodeGroup.classed("hovered", false);
            });
            if (isInput) {
                div.on("click", function () {
                    state[nodeId] = !state[nodeId];
                    parametersChanged = true;
                    reset();
                });
                div.style("cursor", "pointer");
            }
            if (isInput) {
                div.classed(activeOrNotClass, true);
            }
        }
        // Draw network
        function drawNetwork(network) {
            var svg = d3.select("#svg");
            // Remove all svg elements.
            svg.select("g.core").remove();
            // Remove all div elements.
            d3.select("#network").selectAll("div.canvas").remove();
            d3.select("#network").selectAll("div.plus-minus-neurons").remove();
            // Get the width of the svg container.
            var padding = 3;
            var co = d3.select(".column.output").node();
            var cf = d3.select(".column.features").node();
            var width = co.offsetLeft - cf.offsetLeft;
            svg.attr("width", width);
            // Map of all node coordinates.
            var node2coord = {};
            var container = svg.append("g")
                .classed("core", true)
                .attr("transform", "translate(" + padding + "," + padding + ")");
            // Draw the network layer by layer.
            var numLayers = network.length;
            var featureWidth = 118;
            var layerScale = d3.scale.ordinal()
                .domain(d3.range(1, numLayers - 1))
                .rangePoints([featureWidth, width - RECT_SIZE], 0.7);
            var nodeIndexScale = function (nodeIndex) { return nodeIndex * (RECT_SIZE + 25); };
            var calloutThumb = d3.select(".callout.thumbnail").style("display", "none");
            var calloutWeights = d3.select(".callout.weights").style("display", "none");
            var idWithCallout = null;
            var targetIdWithCallout = null;
            // Draw the input layer separately.
            var cx = RECT_SIZE / 2 + 50;
            var nodeIds = Object.keys(INPUTS);
            var maxY = nodeIndexScale(nodeIds.length);
            nodeIds.forEach(function (nodeId, i) {
                var cy = nodeIndexScale(i) + RECT_SIZE / 2;
                node2coord[nodeId] = { cx: cx, cy: cy };
                drawNode(cx, cy, nodeId, true, container);
            });
            // Draw the intermediate layers.
            for (var layerIdx = 1; layerIdx < numLayers - 1; layerIdx++) {
                var numNodes = network[layerIdx].length;
                var cx_1 = layerScale(layerIdx) + RECT_SIZE / 2;
                maxY = Math.max(maxY, nodeIndexScale(numNodes));
                addPlusMinusControl(layerScale(layerIdx), layerIdx);
                for (var i = 0; i < numNodes; i++) {
                    var node = network[layerIdx][i];
                    var cy = nodeIndexScale(i) + RECT_SIZE / 2;
                    node2coord[node.id] = { cx: cx_1, cy: cy };
                    drawNode(cx_1, cy, node.id, false, container, node);
                    // Show callout to thumbnails.
                    var numNodes_1 = network[layerIdx].length;
                    var nextNumNodes = network[layerIdx + 1].length;
                    if (idWithCallout == null &&
                        i === numNodes_1 - 1 &&
                        nextNumNodes <= numNodes_1) {
                        calloutThumb.style({
                            display: null,
                            top: 20 + 3 + cy + "px",
                            left: cx_1 + "px"
                        });
                        idWithCallout = node.id;
                    }
                    // Draw links.
                    for (var j = 0; j < node.inputLinks.length; j++) {
                        var link = node.inputLinks[j];
                        var path = drawLink(link, node2coord, network, container, j === 0, j, node.inputLinks.length).node();
                        // Show callout to weights.
                        var prevLayer = network[layerIdx - 1];
                        var lastNodePrevLayer = prevLayer[prevLayer.length - 1];
                        if (targetIdWithCallout == null &&
                            i === numNodes_1 - 1 &&
                            link.source.id === lastNodePrevLayer.id &&
                            (link.source.id !== idWithCallout || numLayers <= 5) &&
                            link.dest.id !== idWithCallout &&
                            prevLayer.length >= numNodes_1) {
                            var midPoint = path.getPointAtLength(path.getTotalLength() * 0.7);
                            calloutWeights.style({
                                display: null,
                                top: midPoint.y + 5 + "px",
                                left: midPoint.x + 3 + "px"
                            });
                            targetIdWithCallout = link.dest.id;
                        }
                    }
                }
            }
            // Draw the output nodes separately.
            {
                var outputLayer = network[numLayers - 1];
                var numOutputs = outputLayer.length;
                var cx_2 = 900; // layerScale(numLayers - 1) + RECT_SIZE / 2;
                maxY = Math.max(maxY, nodeIndexScale(numOutputs));
                for (var j = 0; j < outputLayer.length; j++) {
                    var node = outputLayer[j];
                    var cy = nodeIndexScale(j) + RECT_SIZE / 2;
                    node2coord[node.id] = { cx: cx_2, cy: cy };
                    drawNode(cx_2, cy, node.id, false, container, node);
                    // Draw links.
                    for (var i = 0; i < node.inputLinks.length; i++) {
                        var link = node.inputLinks[i];
                        drawLink(link, node2coord, network, container, i === 0, i, node.inputLinks.length);
                    }
                }
            }
            // Adjust the height of the svg.
            svg.attr("height", maxY);
            // Adjust the height of the features column.
            var height = Math.max(getRelativeHeight(calloutThumb), getRelativeHeight(calloutWeights), getRelativeHeight(d3.select("#network")));
            d3.select(".column.features").style("height", height + "px");
        }
        function getRelativeHeight(selection) {
            var node = selection.node();
            return node.offsetHeight + node.offsetTop;
        }
        function addPlusMinusControl(x, layerIdx) {
            var div = d3.select("#network").append("div")
                .classed("plus-minus-neurons", true)
                .style("left", x - 10 + "px");
            var i = layerIdx - 1;
            var firstRow = div.append("div").attr("class", "ui-numNodes" + layerIdx);
            firstRow.append("button")
                .attr("class", "mdl-button mdl-js-button mdl-button--icon")
                .on("click", function () {
                var numNeurons = state.networkShape[i];
                if (numNeurons >= 8) {
                    return;
                }
                state.networkShape[i]++;
                parametersChanged = true;
                reset();
            })
                .append("i")
                .attr("class", "material-icons")
                .text("add");
            firstRow.append("button")
                .attr("class", "mdl-button mdl-js-button mdl-button--icon")
                .on("click", function () {
                var numNeurons = state.networkShape[i];
                if (numNeurons <= 1) {
                    return;
                }
                state.networkShape[i]--;
                parametersChanged = true;
                reset();
            })
                .append("i")
                .attr("class", "material-icons")
                .text("remove");
            var suffix = state.networkShape[i] > 1 ? "s" : "";
            div.append("div").text(state.networkShape[i] + " neuron" + suffix);
        }
        function updateHoverCard(type, nodeOrLink, coordinates) {
            var hovercard = d3.select("#hovercard");
            if (type == null) {
                hovercard.style("display", "none");
                d3.select("#svg").on("click", null);
                return;
            }
            d3.select("#svg").on("click", function () {
                hovercard.select(".value").style("display", "none");
                var input = hovercard.select("input");
                input.style("display", null);
                input.on("input", function () {
                    if (this.value != null && this.value !== "") {
                        if (type === HoverType.WEIGHT) {
                            nodeOrLink.weight = +this.value;
                        }
                        else {
                            nodeOrLink.bias = +this.value;
                        }
                        updateUI();
                    }
                });
                input.on("keypress", function () {
                    if (d3.event.keyCode === 13) {
                        updateHoverCard(type, nodeOrLink, coordinates);
                    }
                });
                input.node().focus();
            });
            var value = (type === HoverType.WEIGHT) ?
                nodeOrLink.weight :
                nodeOrLink.bias;
            var name = (type === HoverType.WEIGHT) ? "Weight" : "Bias";
            hovercard.style({
                "left": coordinates[0] + 20 + "px",
                "top": coordinates[1] + "px",
                "display": "block"
            });
            hovercard.select(".type").text(name);
            hovercard.select(".value")
                .style("display", null)
                .text(value.toPrecision(2));
            hovercard.select("input")
                .property("value", value.toPrecision(2))
                .style("display", "none");
        }
        function drawLink(input, node2coord, network, container, isFirst, index, length) {
            var line = container.insert("path", ":first-child");
            var source = node2coord[input.source.id];
            var dest = node2coord[input.dest.id];
            var datum = {
                source: {
                    y: source.cx + RECT_SIZE / 2 + 2,
                    x: source.cy
                },
                target: {
                    y: dest.cx - RECT_SIZE / 2,
                    x: dest.cy + ((index - (length - 1) / 2) / length) * 12
                }
            };
            var diagonal = d3.svg.diagonal().projection(function (d) { return [d.y, d.x]; });
            line.attr({
                "marker-start": "url(#markerArrow)",
                class: "link",
                id: "link" + input.source.id + "-" + input.dest.id,
                d: diagonal(datum, 0)
            });
            // Add an invisible thick link that will be used for
            // showing the weight value on hover.
            container.append("path")
                .attr("d", diagonal(datum, 0))
                .attr("class", "link-hover")
                .on("mouseenter", function () {
                updateHoverCard(HoverType.WEIGHT, input, d3.mouse(this));
            }).on("mouseleave", function () {
                updateHoverCard(null);
            });
            return line;
        }
        function updateUI(firstStep) {
            if (firstStep === void 0) { firstStep = false; }
            // Update the links visually.
            updateWeightsUI(network, d3.select("g.core"));
            // Update the bias values visually.
            updateBiasesUI(network);
            function zeroPad(n) {
                var pad = "000000";
                return (pad + n).slice(-pad.length);
            }
            function addCommas(s) {
                return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            function humanReadable(n) {
                return n.toFixed(3);
            }
        }
        function constructInputIds() {
            var result = [];
            for (var inputName in INPUTS) {
                result.push(inputName);
            }
            return result;
        }
        function oneStep() {
            iter++;
            nn.forwardProp(network, [0.0, iter + 0.0, iter + 5.0]);
            var outputs = network[network.length - 1];
            for (var j = 0; j < outputs.length; j++) {
                var node = outputs[j];
                console.log(node.output);
            }
            updateUI();
        }
        function reset(onStartup) {
            if (onStartup === void 0) { onStartup = false; }
            var suffix = state.numHiddenLayers !== 1 ? "s" : "";
            d3.select("#layers-label").text("Hidden layer" + suffix);
            d3.select("#num-layers").text(state.numHiddenLayers);
            // Make a simple network.
            iter = 0;
            var numInputs = 3;
            var shape = [numInputs].concat(state.networkShape).concat([3]);
            var outputActivation = nn.Activations.LINEAR; // was: TANH;
            network = nn.buildNetwork(shape, state.activation, outputActivation, state.regularization, constructInputIds(), state.initZero);
            drawNetwork(network);
            updateUI(true);
        }
        ;
        function hideControls() {
            // Set display:none to all the UI elements that are hidden.
            var hiddenProps = []; // TODO: state.getHiddenProps();
            hiddenProps.forEach(function (prop) {
                var controls = d3.selectAll(".ui-" + prop);
                if (controls.size() === 0) {
                    console.warn("0 html elements found with class .ui-" + prop);
                }
                controls.style("display", "none");
            });
            // Also add checkbox for each hidable control in the "use it in classrom"
            // section.
            var hideControls = d3.select(".hide-controls");
            HIDABLE_CONTROLS.forEach(function (_a) {
                var text = _a[0], id = _a[1];
                var label = hideControls.append("label")
                    .attr("class", "mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect");
                var input = label.append("input")
                    .attr({
                    type: "checkbox",
                    class: "mdl-checkbox__input",
                });
                if (hiddenProps.indexOf(id) === -1) {
                    input.attr("checked", "true");
                }
                input.on("change", function () {
                    state.setHideProperty(id, !this.checked);
                    d3.select(".hide-controls-link")
                        .attr("href", window.location.href);
                });
                label.append("span")
                    .attr("class", "mdl-checkbox__label label")
                    .text(text);
            });
            d3.select(".hide-controls-link")
                .attr("href", window.location.href);
        }
        var parametersChanged = false;
        function simulationStarted() {
            parametersChanged = false;
        }
        makeGUI();
        reset(true);
        hideControls();
    }
    exports.runPlayground = runPlayground;
});
