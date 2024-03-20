class ScatterPlot extends Chart {
	/**
	 * Class constructor with basic chart configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data) {
		super()
		this.config = {
		parentElement: _config.parentElement,
		containerWidth: _config.width,
		containerHeight: _config.height,
		margin: {
			top: 30,
			right: 5,
			bottom: 50,
			left: 150
		}
		}
		this.xDimension = _config.xDimension;
		this.yDimension = _config.yDimension;
		this.colourDimension = _config.colourDimension;
		this.data = data;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement)
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.xScale = d3.scaleBand()
			.range([0, vis.config.width]);
		vis.yScale = d3.scaleBand()
			.range([0, vis.config.height])

		vis.xAxis = d3.axisBottom(vis.xScale);
		vis.yAxis = d3.axisLeft(vis.yScale);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chartArea.append('g')
			.attr('class', 'axis x-axis')
			.attr('transform', `translate(0,${vis.config.height})`);

		// Append y-axis group
		vis.yAxisG = vis.chartArea.append('g')
			.attr('class', 'axis y-axis');

		vis.xForce = d3.forceX();
		vis.yForce = d3.forceY();

		// Initialize force simulation
		vis.simulation = d3.forceSimulation()
			.force('collision', d3.forceCollide().radius(5))
			.force('x', vis.xForce)
			.force('y', vis.yForce);
		
		vis.simulation.nodes(vis.data);

		vis.yAxisTitle = vis.chartArea.append("text")
			.attr("transform", "rotate(-90)")
			.attr("font-size", 16)
			.attr("y", 0 - vis.config.margin.left + 16)
			.attr("x", 0 - (vis.config.height / 2))
			.style("text-anchor", "middle")

		vis.xAxisTitle = vis.chartArea.append("text")
		.attr("font-size", 16)
			.attr("x", vis.config.width / 2 )
			.attr("y", vis.config.height + vis.config.margin.bottom - 16)
			.style("text-anchor", "middle")

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		// Specificy x- and y-accessor functions
		vis.xValue = d => d[vis.xDimension];
		vis.yValue = d => d[vis.yDimension];
		vis.colourValue = d => d[vis.colourDimension];

		vis.colourData = d3.rollups(vis.data, d => d.length, d => vis.colourValue(d));

		// Set the scale input domains
		vis.xScale.domain(vis.data.map(vis.xValue).sort());
		vis.yScale.domain(vis.data.map(vis.yValue));

		vis.simulation.force("x").x(d => vis.xScale(vis.xValue(d)) + vis.xScale.bandwidth() / 2);
		vis.simulation.force("y").y(d => vis.yScale(vis.yValue(d)) + vis.yScale.bandwidth() / 2);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		const colourMap = {}
		vis.colourData.sort((a, b) => {
			if (a[0] < b[0]) {
				return -1;
			}
			if (a[0] > b[0]) {
				return 1;
			}
			return 0;
		}).forEach((d, i) => {
			colourMap[d[0]] = i;
		});

		vis.nodes = vis.chartArea.selectAll('.point')
			.data(vis.data, d => d["SNo"])
			.join(
				(enter) => {
					return enter.append("circle")
						.attr('r', 5)
						.attr('cx', vis.config.width / 2)
						.attr('cy', vis.config.height / 2)
						.attr('class', 'point')
				}
			)
			.attr('fill', d => d3.schemeTableau10[colourMap[vis.colourValue(d)]]);

		vis.simulation.on("tick", () => {
			vis.nodes
				.attr('cx', d => d.x)
				.attr('cy', d => d.y);
		});

		vis.simulation.nodes(vis.data);
		vis.simulation.alpha(1).alphaTarget(0.3).restart();

		vis.simulation.force("x").initialize(vis.data);

		// Update the axes because the underlying scales might have changed
		vis.xAxisG.call(vis.xAxis)
		vis.yAxisG.call(vis.yAxis);

		vis.xAxisTitle.text(vis.xDimension);
		vis.yAxisTitle.text(vis.yDimension);
	}
}