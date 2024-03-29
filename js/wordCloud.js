class WordCloud extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data) {
		super(_config, data);
		this.dimension = _config.dimension;
		this.initVis();
	}

	initVis() {
		let vis = this;

		// Define size of SVG drawing area
		vis.svg = d3.select(vis.config.parentElement);

		// Append group element that will contain our actual chart
		// and position it according to the given margin config
		vis.chartArea = vis.svg.append('g');

		vis.sizeScale = d3.scaleSqrt();

		vis.xForce = d3.forceX();
		vis.yForce = d3.forceY();

		vis.simulation = d3.forceSimulation()
			.force('x', vis.xForce)
			.force('y', vis.yForce)
			.force("collide", d3.forceCollide(d => 1.1 * vis.sizeScale(d.size)));

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		vis.config.margin.left = vis.config.containerWidth * vis.config.marginLeft;
		vis.config.margin.right = vis.config.containerWidth * vis.config.marginRight;
		vis.config.margin.top = vis.config.containerHeight * vis.config.marginTop;
		vis.config.margin.bottom = vis.config.containerHeight * vis.config.marginBottom;

		vis.chartArea
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.words = [];
		vis.data.forEach(d => vis.words.push(...d[vis.dimension].split(",")));

		vis.rollupData = d3.rollups(vis.words, d => d.length, d => d);
		vis.rollupData = vis.rollupData.map(d => { return { text: d[0], size: d[1], x: vis.config.width / 2 + Math.random(), y: vis.config.height / 2 + Math.random() } });
		
		vis.simulation
			.nodes(vis.rollupData);

		vis.sizeScale
			.domain(d3.extent(vis.rollupData.map(d => d.size)))
			.range([0.05 * vis.config.width, 0.15 * vis.config.width]);

		vis.simulation.force("x").x(vis.config.width / 2);
		vis.simulation.force("y").y(vis.config.height / 2);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		vis.nodes = vis.chartArea.selectAll(".word-group")
			.data(vis.rollupData)
			.join("g")
			.attr("class", "word-group")
			.attr("transform", d => "translate(" + d.x + ", " + d.y + ")");

		console.log(vis.rollupData)

		vis.nodes.selectAll(".word-circle")
			.data(d => {
				console.log(d)
				return [d]
			})
			.join("circle")
			.attr("class", "word-circle")
			.attr("r", d => vis.sizeScale(d.size))
			.attr("fill", "lightgrey");

		vis.nodes.selectAll(".word-text")
			.data(d => [d])
			.join("text")
			.attr("text-anchor", "middle")
			.attr("class", "word-text")
			.text(d => d.text);

		vis.simulation.on("tick", () => {
			vis.nodes
				.attr("transform", d => "translate(" + d.x + ", " + d.y + ")");
		});

		vis.data.forEach(d => {
			d.x = vis.config.width / 2;
			d.y = vis.config.height / 2;
		});

		vis.simulation.nodes(vis.rollupData);
		vis.simulation.alpha(1).alphaTarget(0.1).restart();
	}
}