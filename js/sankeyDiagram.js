class SankeyDiagram extends Chart {

	/**
	 * Class constructor with initial configuration
	 * @param {Object}
	 */
	// Todo: Add or remove parameters from the constructor as needed
	constructor(_config, data, options) {
		super(_config, data);
		this.dimensions = _config.dimensions;
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
		vis.sankey = d3.sankey();

		vis.defs = vis.chartArea.append("defs");

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

		// Set the sankey diagram properties
		vis.sankey
			.nodeWidth(vis.config.width * 0.04)
			.nodePadding(vis.config.width * 0.01);

		vis.svg
			.attr('width', vis.config.containerWidth)
			.attr('height', vis.config.containerHeight);

		vis.sankey
			.size([vis.config.width, vis.config.height]);

		vis.graph = {
			nodes: [],
			links: []
		};

		const onlyUnique = (v, i, a) => a.indexOf(v) == i;

		const nodeOptions = [];

		vis.dimensions.forEach(d => {
			const uniqueOptions = vis.data.map(k => d + "///" + k[d]).filter(onlyUnique);
			vis.graph.nodes.push(...uniqueOptions);
			nodeOptions.push(uniqueOptions);
		});

		const links = {};
		nodeOptions.forEach((n, i) => {
			if (i < nodeOptions.length - 1) {
				n.forEach(k => {
					nodeOptions[i + 1].forEach(j => {
						const key = k + "///" + j;
						links[key] = {
							source: vis.graph.nodes.indexOf(k),
							target: vis.graph.nodes.indexOf(j),
							value: 0
						}
					});
				});
			}
		});

		const dimensionPairs = [];
		vis.dimensions.forEach((d, i) => {
			if (i < vis.dimensions.length - 1) {
				dimensionPairs.push([d, vis.dimensions[i + 1]]);
			}
		});

		const linksList = [];
		vis.data.forEach(d => {
			linksList.push(...dimensionPairs.map(([d0, d1]) => [d0, d[d0], d1, d[d1]]));
		});

		linksList.forEach(link => {
			const key = link[0] + "///" + link[1] + "///" + link[2] + "///" + link[3];
			links[key].value++;
		});

		vis.graph.nodes = vis.graph.nodes.map(n => {
			return { "name": n.trim() };
		});
		vis.graph.links = Object.values(links);
		
		vis.graph = vis.sankey(vis.graph);

		vis.renderVis();
	}

	renderVis() {
		let vis = this;
		
		const palette = d3.schemeTableau10;
		
		const getGradID = d => "linkGrad-" + d.source.name.replaceAll(/[\s\(\)\\\/\-,\.]/g, "") + d.target.name.replaceAll(/[\s\(\)\\\/\-,\.]/g, "");
		const nodeColour = d => { return d.color = palette[d.index % 10] };

		const grads = vis.defs.selectAll("linearGradient")
            .data(vis.graph.links, d => d.index)
			.join("linearGradient")
			.attr("id", getGradID)
			.attr("gradientUnits", "userSpaceOnUse")
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.target.x)
			.attr("y2", d => d.target.y);

		grads.html("") //erase any existing <stop> elements on update
			.append("stop")
			.attr("offset", "0%")
			.attr("stop-color", d => nodeColour(d.source));

		grads.append("stop")
			.attr("offset", "100%")
			.attr("stop-color", d => nodeColour(d.target));

		// add in the links
		vis.chartArea.selectAll(".link")
			.data(vis.graph.links.filter(l => l.width > 0))
			.join("path")
			.attr("class", "link")
			.attr("d", d3.sankeyLinkHorizontal())
			.style("stroke-width", d => d.width)
			.attr("stroke", d => d3.scaleLinear().domain([-1, 1]).range([palette[d.source.index % 10], palette[d.target.index % 10]])(0))
			.attr("opacity", 0.3)
			.attr("fill", "none")
	
		// add in the nodes
		vis.chartArea.selectAll(".node")
			.data(vis.graph.nodes)
			.join("rect")
			.attr("class", "node")
			.attr("fill", d => palette[d.index % 10])
			.attr("x", d => d.x0)
			.attr("y", d => d.y0)
			.attr("height", d => d.y1 - d.y0)
			.attr("width", vis.sankey.nodeWidth())
	
		// add in the title for the nodes
		vis.chartArea.selectAll(".node-text")
			.data(vis.graph.nodes)
			.join("text")
			.attr("class", "node-text")
			.attr("y", d => (d.y0 + d.y1) / 2)
			.attr("text-anchor", d => d.layer < vis.dimensions.length / 2 ? "start" : "end")
			.text(d => d.name.split("///")[1])
			.attr("x", d => d.layer < vis.dimensions.length / 2 ? d.x1 + 6 : d.x0 - 6)
			.attr("z-index", 1.5);
	}
}