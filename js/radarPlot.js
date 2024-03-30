class RadarPlot extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, options, dispatch) {
		super(_config, data, dispatch)
		this.dimensions = _config.dimensions;
		this.options = options;
		this.likertMap = {
			"Strongly disagree": 1,
			"Somewhat disagree": 2,
			"Neither agree nor disagree": 3,
			"Somewhat agree": 4,
			"Strongly agree": 5,
			"Not at all important": 1,
			"Slightly important": 2,
			"Moderately important": 3,
			"Very important": 4,
			"Extremely important": 5,
		}
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
		vis.xScale = d3.scaleBand();
		vis.yScale = d3.scaleBand();

		vis.xAxis = d3.axisBottom(vis.xScale);
		vis.yAxis = d3.axisLeft(vis.yScale);

		// Append empty x-axis group and move it to the bottom of the chart
		vis.xAxisG = vis.chartArea.append('g')
			.attr('class', 'axis x-axis');

		// Append y-axis group
		vis.yAxisG = vis.chartArea.append('g')
			.attr('class', 'axis y-axis');

		vis.xAxisTitle = vis.chartArea.append("text")
			.style("text-anchor", "middle");

		vis.yAxisTitle = vis.chartArea.append("text")
			.attr("transform", "rotate(-90)")
			.style("text-anchor", "middle");
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginBottom;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},0)`);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight - vis.config.margin.top)
			.attr("transform", "translate(0, " + vis.config.margin.top + ")");

		vis.xAxisG
			.attr('transform', `translate(0,${vis.config.height})`);

		vis.yAxisTitle
			.attr("y", 0 - vis.config.margin.left + vis.config.width * 0.04)
			.attr("x", 0 - (vis.config.height / 2));

		vis.xAxisTitle
			.attr("x", vis.config.width / 2 )
			.attr("y",  vis.config.height + vis.config.margin.bottom - 16)

		vis.toNumber = d => d in vis.likertMap ? vis.likertMap[d] : +d;

		let yDomain = vis.options[vis.dimensions[0]].map(vis.toNumber).toSorted((a, b) => a - b);

		// Todo: Prepare data and scales
		vis.xScale
			.domain(vis.dimensions)
			.range([0, vis.config.width]);

		vis.yScale
			.domain(yDomain)
			.range([vis.config.height, 0])
			.paddingInner(0.02);
		
		vis.histograms = vis.dimensions.map(d => { return { dimension: d, options: yDomain.map(o => [o, vis.data.filter(k => vis.toNumber(k[d]) === o).length, d]) }; });
	
		// What is the biggest number of value in a bin? We need it cause this value will have a width of 100% of the bandwidth.
		let max = 0;
		vis.histograms.forEach(h => {
			const longest = d3.max(h.options.map(d => d[1]));
			max = d3.max([max, longest]);
		});
		
		// The maximum width of a violin must be x.bandwidth = the width dedicated to a group
		vis.violinWidth = d3.scaleLinear()
			.domain([0, max])
			.range([0, 0.9 * vis.xScale.bandwidth() / 2]);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;
		// Todo: Bind data to visual elements, update axes

		vis.histogramGs = vis.chartArea
			.selectAll(".histogram")
			.data(vis.histograms)
			.join("g")
			.attr("class", "histogram")
			.attr("transform", d => "translate(" + vis.xScale(d.dimension) +" , 0)");
		
		vis.histogramGs.selectAll(".bar")
			.data(d => d.options)
			.join("rect")
			.attr("class", "bar")
			.style("fill","#69b3a2")
			.attr("x", d => vis.xScale.bandwidth() / 2 - vis.violinWidth(d[1]))
			.attr("y", d => vis.yScale(d[0]))
			.attr("width", d => 2 * vis.violinWidth(d[1]))
			.attr("height", vis.yScale.bandwidth())
			.attr("stroke-width", d => {
				if (vis.emphasized.find(e => e[0] === d[2])) {
					return vis.toNumber(vis.emphasized.find(e => e[0] === d[2])[1]) === d[0] ? 2 : 0;
				}
				return 0;
			})
			.attr("stroke", "black");

		// Update the axes because the underlying scales might have changed
		if (d3.max(vis.xScale.domain().map(d => d.length)) > 6) {
			vis.xAxisG.call(vis.xAxis)
				.selectAll("text")  
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
					.attr("transform", "rotate(-25)");
		} else {
			vis.xAxisG.call(vis.xAxis);
		}

		if (d3.max(vis.yScale.domain().map(d => d.length)) > 6) {
			vis.yAxisG.call(vis.yAxis)
				.selectAll("text")  
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
					.attr("transform", "rotate(-25)");
		} else {
			vis.yAxisG.call(vis.yAxis);
		}

		vis.xAxisTitle.text(vis.xDimension);
		vis.yAxisTitle.text(vis.yDimension);
	}
}