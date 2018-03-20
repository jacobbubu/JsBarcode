import merge from "../help/merge.js";
import {
	calculateEncodingAttributes,
	getTotalWidthOfEncodings,
	getMaximumHeightOfEncodings
} from "./shared.js";

var svgns = "http://www.w3.org/2000/svg";

class SVGRenderer {
	constructor(svg, encodings, options) {
		this.svg = svg;
		this.encodings = encodings;
		this.options = options;
		this.document = options.xmlDocument || document;
	}

	render() {
		var currentX = this.options.marginLeft;

		this.prepareSVG();
		for (let i = 0; i < this.encodings.length; i++) {
			var encoding = this.encodings[i];
			var encodingOptions = merge(this.options, encoding.options);

			var group = this.createGroup(
				currentX,
				encodingOptions.marginTop,
				this.svg
			);

			this.setGroupOptions(group, encodingOptions);

			this.drawSvgBarcode(group, encodingOptions, encoding);
			this.drawSVGText(group, encodingOptions, encoding);

			currentX += encoding.width;
		}
	}

	prepareSVG() {
		// Clear the SVG
		while (this.svg.firstChild) {
			this.svg.removeChild(this.svg.firstChild);
		}

		calculateEncodingAttributes(this.encodings, this.options);
		var totalWidth = getTotalWidthOfEncodings(this.encodings);
		var maxHeight = getMaximumHeightOfEncodings(this.encodings);

		var width =
			totalWidth + this.options.marginLeft + this.options.marginRight;
		this.setSvgAttributes(width, maxHeight);

		if (this.options.background) {
			this.drawRect(0, 0, width, maxHeight, this.svg).setAttribute(
				"style",
				"fill:" + this.options.background + ";"
			);
		}
	}

	drawSvgBarcode(parent, options, encoding) {
		var binary = encoding.data;

		// Creates the barcode out of the encoded binary
		var yFrom;
		if (options.textPosition == "top") {
			yFrom = options.fontSize + options.textMargin;
		} else {
			yFrom = 0;
		}

		var { newY, height } = this.drawCornerText(
			parent,
			options,
			encoding,
			yFrom
		);

		var barWidth = 0;
		var x = 0;
		for (var b = 0; b < binary.length; b++) {
			x = b * options.width + encoding.barcodePadding;

			if (binary[b] === "1") {
				barWidth++;
			} else if (barWidth > 0) {
				this.drawRect(
					x - options.width * barWidth,
					newY,
					options.width * barWidth,
					options.height - height,
					parent
				);
				barWidth = 0;
			}
		}

		// Last draw is needed since the barcode ends with 1
		if (barWidth > 0) {
			this.drawRect(
				x - options.width * (barWidth - 1),
				newY,
				options.width * barWidth,
				options.height - height,
				parent
			);
		}
	}

	drawCornerText(parent, options, encoding, yFrom) {
		if (options.cornerText) {
			var textElem = this.document.createElementNS(svgns, "text");
			var x,
				y = yFrom + options.cornerTextFontSize;

			var styleStr = "";
			styleStr = "font-size: " + options.cornerTextFontSize + "px" + "; ";
			styleStr += "font-family: " + options.font + "; ";
			if (options.cornerTextFontOptions.indexOf("bold") >= 0) {
				styleStr += "font-weight: bold; ";
			}
			if (options.cornerTextFontOptions.indexOf("italic") >= 0) {
				styleStr += "font-style: italic; ";
			}
			if (options.cornerTextFontOptions.indexOf("normal") >= 0) {
				styleStr += "font-style: normal; ";
			}
			if (options.cornerTextFontOptions.indexOf("oblique") >= 0) {
				styleStr += "font-style: oblique; ";
			}
			textElem.setAttribute("style", styleStr);

			// Draw the text in the correct X depending on the conerTextAlign option
			if (
				options.cornerTextAlign == "left" ||
				encoding.barcodePadding > 0
			) {
				x = 0;
				textElem.setAttribute("text-anchor", "start");
			} else if (options.cornerTextAlign == "right") {
				x = encoding.width - 1;
				textElem.setAttribute("text-anchor", "end");
			} else {
				// In all other cases, center the text
				x = encoding.width / 2;
				textElem.setAttribute("text-anchor", "middle");
			}

			textElem.setAttribute("x", x);
			textElem.setAttribute("y", y);

			textElem.appendChild(
				this.document.createTextNode(options.cornerText)
			);

			parent.appendChild(textElem);
			var newY = y + options.cornerTextMargin;
			return {
				newY,
				height: options.cornerTextFontSize + options.cornerTextMargin
			};
		}
		return { newY: yFrom, height: 0 };
	}

	drawSVGText(parent, options, encoding) {
		var textElem = this.document.createElementNS(svgns, "text");

		// Draw the text if displayValue is setfontName: "ocr-a"
		if (options.displayValue) {
			var x, y;

			var styleStr = "";
			styleStr = "font-size: " + options.fontSize + "px" + "; ";
			styleStr += "font-family: " + options.font + "; ";
			if (options.fontOptions.indexOf("bold") >= 0) {
				styleStr += "font-weight: bold; ";
			}
			if (options.fontOptions.indexOf("italic") >= 0) {
				styleStr += "font-style: italic; ";
			}
			if (options.fontOptions.indexOf("normal") >= 0) {
				styleStr += "font-style: normal; ";
			}
			if (options.fontOptions.indexOf("oblique") >= 0) {
				styleStr += "font-style: oblique; ";
			}
			textElem.setAttribute("style", styleStr);

			if (options.textPosition == "top") {
				y = options.fontSize;
			} else {
				y = options.height + options.textMargin + options.fontSize;
			}

			// Draw the text in the correct X depending on the textAlign option
			if (options.textAlign == "left" || encoding.barcodePadding > 0) {
				x = 0;
				textElem.setAttribute("text-anchor", "start");
			} else if (options.textAlign == "right") {
				x = encoding.width - 1;
				textElem.setAttribute("text-anchor", "end");
			} else {
				// In all other cases, center the text
				x = encoding.width / 2;
				textElem.setAttribute("text-anchor", "middle");
			}

			textElem.setAttribute("x", x);
			textElem.setAttribute("y", y);

			textElem.appendChild(this.document.createTextNode(encoding.text));

			parent.appendChild(textElem);
		}
	}

	setSvgAttributes(width, height) {
		var svg = this.svg;
		svg.setAttribute("width", width + "px");
		svg.setAttribute("height", height + "px");
		svg.setAttribute("x", "0px");
		svg.setAttribute("y", "0px");
		svg.setAttribute("viewBox", "0 0 " + width + " " + height);

		svg.setAttribute("xmlns", svgns);
		svg.setAttribute("version", "1.1");

		svg.setAttribute("style", "transform: translate(0,0)");
	}

	createGroup(x, y, parent) {
		var group = this.document.createElementNS(svgns, "g");
		group.setAttribute("transform", "translate(" + x + ", " + y + ")");

		parent.appendChild(group);

		return group;
	}

	setGroupOptions(group, options) {
		group.setAttribute("style", "fill:" + options.lineColor + ";");
	}

	drawRect(x, y, width, height, parent) {
		var rect = this.document.createElementNS(svgns, "rect");

		rect.setAttribute("x", x);
		rect.setAttribute("y", y);
		rect.setAttribute("width", width);
		rect.setAttribute("height", height);

		parent.appendChild(rect);

		return rect;
	}
}

export default SVGRenderer;
