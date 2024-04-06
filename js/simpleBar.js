class SimpleBar extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, total, dispatch) {
		super(_config, data, dispatch)
        this.total = total;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g');

		vis.xScale = d3.scaleLinear();

		vis.xAxisTitle1 = vis.chartArea.append("text")
            .attr("text-anchor", "start");

        vis.xAxisTitle2 = vis.chartArea.append("text")
            .attr("text-anchor", "end");
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		vis.config.margin.gap = vis.config.containerHeight * vis.config.marginGap;
		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginBottom;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.gap - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth - vis.config.margin.gap)
			.attr('height', vis.config.containerHeight)
			.attr("transform", "translate(" + vis.config.margin.gap + ", 0)");

		vis.xAxisTitle1
			.attr("x", 0)
			.attr("y", 3 * vis.config.margin.top)

        vis.xAxisTitle2
            .attr("x", 0.6 * vis.config.width)
            .attr("y", 3 * vis.config.margin.top)

		vis.count = vis.data.length;

        // Set the scale input domains
        vis.xScale
            .domain([0, vis.total])
            .range([0, vis.config.width]);

		vis.renderVis();
	}

	renderVis() {
        const vis = this;

		// Add rectangles
		vis.bars = vis.chartArea.selectAll('.bar')
			.data([[vis.count, vis.total], [0, vis.count]])
			.join('rect')
			.attr('class', 'bar')
			.attr('fill', (_, i) => i === 0 ? "#c2d684" : "#273617")
			.attr('width', d => vis.xScale(d[1] - d[0]))
			.attr('height', vis.config.height / 8)
			.attr('x', d => vis.xScale(d[0]))
			.attr('y', 4 * vis.config.height / 8);

		vis.xAxisTitle1.text("Responses: ");
        vis.xAxisTitle2.text(vis.count + " / " + vis.total);

		d3.selectAll("g.tick text").attr("font-size", globalFontSize + "%");
	}
}