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
		vis.chartArea = vis.svg.append('g')
			.attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

		vis.sizeScale = d3.scaleLinear();

		vis.layout = d3.layout.cloud()
			.fontSize(d => vis.sizeScale(d.size))
			.rotate(0)
			.padding(30);

		vis.updateVis();
	}

	updateVis() {
		let vis = this;

		vis.data = JSON.parse(JSON.stringify(vis.ogData));

		// Calculate inner chart size. Margin specifies the space around the actual chart.
		vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
		vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.words = [];
		vis.data.forEach(d => vis.words.push(...d[vis.dimension].split(",")));

		vis.rollupData = d3.rollups(vis.words, d => d.length, d => d);
		vis.rollupData = vis.rollupData.map(d => { return { text: d[0], size: d[1] } });

		vis.sizeScale
			.domain(d3.extent(vis.rollupData.map(d => d.size)))
			.range([12, 40]);

		vis.layout
			.words(vis.rollupData)
			.size([vis.config.width, vis.config.height]);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;

		const draw = (words) => {
			vis.chartArea.selectAll(".word")
				.data(words)
				.join("text")
				.attr("class", "word")
				.attr("id", d => "word-" + vis.dimension.split(" ").join("-") + "-" + d.text.split(/[\s:\/(\)]+/).join("-"))
				.attr("font-size", d => d.size)
				.attr("text-anchor", "middle")
				.attr("transform", d => {
					return "translate(" + [d.x + vis.config.width / 2, d.y + vis.config.height / 2] + ")";
				})
				.text(d => d.text);

			vis.chartArea.selectAll(".word-backing")
				.data(words)
				.join("rect")
				.attr("class", "word-backing")
				.attr("width", d => {
					const word = d3.select("#word-" + vis.dimension.split(" ").join("-") + "-" + d.text.split(/[\s:\/\(\)]+/).join("-")).node().getBBox();
					return word.width + 10;
				})
				.attr("height", d => {
					const word = d3.select("#word-" + vis.dimension.split(" ").join("-") + "-" + d.text.split(/[\s:\/(\)]+/).join("-")).node().getBBox();
					return word.height + 10;
				})
				.attr("transform", d => {
					const word = d3.select("#word-" + vis.dimension.split(" ").join("-") + "-" + d.text.split(/[\s:\/(\)]+/).join("-")).node().getBBox();
					return "translate(" + [d.x + vis.config.width / 2 - 5 - word.width / 2, d.y + vis.config.height / 2 - 5 - 3 * word.height / 4] + ")";
				})
				.attr("opacity", 0.2)
				.attr("fill", "blue");
		};

		vis.layout.on("end", draw).start();
	}
}