class RadarPlot extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, options) {
		super(_config, data)
		this.dimensions = _config.dimensions;
		this.layers = _config.layers;
		this.options = options;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g');

		// Todo: initialize scales, axes, static elements, etc.
	}

	updateVis() {
		let vis = this;

		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginLeft;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// Todo: Prepare data and scales
	}

	renderVis() {
		let vis = this;
		// Todo: Bind data to visual elements, update axes
	}
}