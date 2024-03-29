const charts = {};
let filterOptions = [];
let allData;
let filteredData;

const resize = () => {
    const width = d3.max([window.innerWidth, 1920]);
    let height = d3.max([window.innerHeight, 1080]);
    if (width / height < 1.6 && width / height > 1.9) {
        height = width * 9 / 16;
    }

    document.getElementById("dashboard").setAttribute("style", "width: " + width + "px; height: " + height + "px; font-size: " + (width * 100 / 1920) + "%");

    d3.selectAll("g.tick text").attr("font-size", (width * 100 / 1920) + "%")

    Object.values(charts).forEach(c => {
        let container = document.getElementById(c.config.parentElement.substring(1) + "-container");
        c.config.containerWidth = container.clientWidth;
        c.config.containerHeight = container.clientHeight;
        c.updateVis();
    });
};
window.onresize = resize;

/**
 * Load data from CSV file asynchronously and render charts
 */
Promise.all([d3.csv('data/comfort-objects.csv'), d3.json('data/options.json')]).then(([data, options]) => {
    allData = data;
    filteredData = JSON.parse(JSON.stringify(data));

    const width = d3.max([window.innerWidth, 1600]);
    let height = d3.max([window.innerHeight, 900]);
    if (width / height < 1.6 && width / height > 1.9) {
        height = width * 9 / 16;
    }

    document.getElementById("dashboard").setAttribute("style", "width: " + width + "px; height: " + height + "px");
    
    let container = document.getElementById("bar-chart-container");
    charts["bar-chart"] = new BarChart({
        parentElement: "#bar-chart",
        width: container.clientWidth,
        height: container.clientHeight,
        dimension: "Gender",
        margin: {
            top: 0.08,
            right: 0.01,
            bottom: 0.10,
            left: 0.08
        }
    }, filteredData, options);

    container = document.getElementById("scatter-plot-container");
    charts["scatter-plot-softness"] = new ScatterPlot({
        parentElement: "#scatter-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        yDimension: "Age",
        xDimension: "Softness Rating",
        colourDimension: "Gender",
        margin: {
            top: 0.08,
            right: 0.01,
            bottom: 0.10,
            left: 0.08
        }
    }, filteredData, options);

    container = document.getElementById("radar-plot-container");
    charts["radar-plot"] = new RadarPlot({
        parentElement: "#radar-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        dimensions: ["Tends to be Lazy", "Has Few Artistic Interests", "Outgoing, Sociable", "Does a Thorough Job", "Tendency to Fidget"],
        layers: [null, null],
        margin: {
            top: 0.08,
            right: 0.01,
            bottom: 0.06,
            left: 0.08
        }
    }, filteredData, options);

    container = document.getElementById("jitter-plot-container");
    charts["scatter-plot-general"] = new ScatterPlot({
        parentElement: "#jitter-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        yDimension: "Object Category",
        xDimension: "Portability",
        colourDimension: "Gender",
        margin: {
            top: 0.16,
            right: 0.01,
            bottom: 0.10,
            left: 0.25
        }
    }, filteredData, options);

    container = document.getElementById("sankey-diagram-container");
    charts["sankey-diagram"] = new SankeyDiagram({
        parentElement: "#sankey-diagram",
        width: container.clientWidth,
        height: container.clientHeight,
        dimensions: ["Device Type", "Appearance", "Age", "Gender"],
        margin: {
            top: 0.18,
            right: 0.01,
            bottom: 0.01,
            left: 0.01
        }
    }, filteredData, options);

    container = document.getElementById("word-cloud-container");
    charts["word-cloud"] = new WordCloud({
        parentElement: "#word-cloud",
        width: container.clientWidth,
        height: container.clientHeight,
        dimension: "Size",
        margin: {
            top: 0.08,
            right: 0.01,
            bottom: 0.01,
            left: 0.01
        }
    }, filteredData);

    resize();
});

const fillHierarchicalSelection = (dropdown, options, filter, defaultOption, checkbox, onchange) => {
    d3.select(dropdown + " li a").text(defaultOption);
    let topLevel = d3.select(dropdown + " li").append("ul");
    options.forEach(o => {
        const midLevelLi = topLevel.append("li");
        midLevelLi.append("a").attr("href", "#").text(o["block"])
        const midLevel = midLevelLi.append("ul").attr("class", "level-2");
        if (checkbox) {
            o["options"].forEach(d => {
                const id = "checkbox-" + o["block"].split(/[\s\,\(\)\/]+/).join("-") + "-" + d.split(/[\s\,\(\)\/]+/).join("-")
                filterOptions.push({
                    id: id,
                    dimension: o["block"],
                    option: d
                });
                const option = midLevel.append("li").on("click", () => {
                    console.log("clicked");
                    const status = d3.select("#" + id).property("checked")
                    d3.select("#" + id).property("checked", !status);
                    onchange();
                });
                option.append("input")
                    .attr("type", "checkbox")
                    .attr("id", id)
                    .attr("name", o["block"] + " /// " + d)
                    .attr("value", o["block"] + " /// " + d)
                    .on("click", () => {
                        console.log("clicked");
                        const status = d3.select("#" + id).property("checked")
                        d3.select("#" + id).property("checked", !status);
                    })
                option.append("label")
                    .attr("for", d)
                    .text(d);
            });
        } else {
            o["dimensions"].forEach(d => {
                if (filter(d)) {
                    const option = midLevel.append("li").text(d["name"]).on("click", onchange);
                }
            });
        }

        if (midLevel.selectAll("li").size() == 0) {
            midLevelLi.remove();
        }
    });
};

Promise.all([d3.json('data/dimensions.json'), d3.json("data/filters.json")]).then(([dimensions, filters]) => {
    fillHierarchicalSelection("#global-filter", filters, o => true, "Filter", true, (event) => {
        filteredData = JSON.parse(JSON.stringify(allData));

        const selectedGenders = filterOptions.filter(d => d.dimension === "Gender").map(d => {
            return { option: d.option, checked: d3.select("#" + d.id).property("checked") };
        }).filter(d => d.checked).map(d => d.option);
        if (selectedGenders.length > 0) {
            filteredData = filteredData.filter(d => selectedGenders.includes(d["Gender"]));
        }

        const selectedCBs = filterOptions.filter(d => d.dimension === "Cultural Background").map(d => {
            return { option: d.option, checked: d3.select("#" + d.id).property("checked") };
        }).filter(d => d.checked).map(d => d.option);
        console.log(selectedCBs);
        if (selectedCBs.length > 0) {
            filteredData = filteredData.filter(d => {
                let found = false;
                selectedCBs.forEach(cb => {
                    console.log(cb);
                    if (d["Cultural Background"].includes(cb)) {
                        found = true;
                    }
                })
                return found;
            });
        }

        const selectedAges = filterOptions.filter(d => d.dimension === "Age").map(d => {
            return { option: d.option, checked: d3.select("#" + d.id).property("checked") };
        }).filter(d => d.checked).map(d => d.option);
        if (selectedAges.length > 0) {
            filteredData = filteredData.filter(d => selectedAges.includes(d["Age"]));
        }

        charts["bar-chart"].ogData = filteredData;
        charts["bar-chart"].updateVis();

        charts["scatter-plot-softness"].ogData = filteredData;
        charts["scatter-plot-softness"].updateVis();

        charts["scatter-plot-general"].ogData = filteredData;
        charts["scatter-plot-general"].updateVis();

        charts["sankey-diagram"].ogData = filteredData;
        charts["sankey-diagram"].updateVis();

        charts["word-cloud"].ogData = filteredData;
        charts["word-cloud"].updateVis();
    });

    fillHierarchicalSelection("#bar-chart-dimension-selector", dimensions, o => o["#bar-chart"], "Gender", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#bar-chart-dimension-selector li a").text(selection);

        charts["bar-chart"].dimension = selection;
        charts["bar-chart"].updateVis();

        charts["scatter-plot-softness"].colourDimension = selection;
        charts["scatter-plot-softness"].updateVis();

        charts["scatter-plot-general"].colourDimension = selection;
        charts["scatter-plot-general"].updateVis();
    });
    
    fillHierarchicalSelection("#scatter-plot-dimension-selector", dimensions, o => o["#scatter-plot"], "Age", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#scatter-plot-dimension-selector li a").text(selection);

        charts["scatter-plot-softness"].yDimension = selection;
        charts["scatter-plot-softness"].updateVis();
    });
    
    ["Tends to be Lazy", "Has Few Artistic Interests", "Outgoing, Sociable", "Does a Thorough Job", "Tendency to Fidget"].forEach((d, i) => {
        fillHierarchicalSelection("#radar-plot-dimension-" + (i + 1) + "-selector", dimensions, o => o["#radar-plot"], d, false, (event) => {
            let selection;
            if (event.explicitOriginalTarget) {
                selection = event.explicitOriginalTarget.textContent;
            } else {
                selection = event.srcElement.innerText;
            }
    
            d3.select("#radar-plot-dimension-" + (i + 1) + "-selector li a").text(selection);
            
            charts["radar-plot"].dimensions[i] = selection;
            charts["radar-plot"].updateVis();
        });
    });
    
    fillHierarchicalSelection("#jitter-plot-dimension-y-selector", dimensions, o => o["#jitter-plot"], "Object Category", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#jitter-plot-dimension-y-selector li a").text(selection);
        
        charts["scatter-plot-general"].yDimension = selection;
        charts["scatter-plot-general"].updateVis();
    });
    
    fillHierarchicalSelection("#jitter-plot-dimension-x-selector", dimensions, o => o["#jitter-plot"], "Portability", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#jitter-plot-dimension-x-selector li a").text(selection);
        
        charts["scatter-plot-general"].xDimension = selection;
        charts["scatter-plot-general"].updateVis();
    });
    
    ["Device Type", "Appearance", "Age", "Gender"].forEach((d, i) => {
        fillHierarchicalSelection("#sankey-diagram-dimension-" + (i + 1) + "-selector", dimensions, o => o["#sankey-diagram"], d, false, (event) => {
            let selection;
            if (event.explicitOriginalTarget) {
                selection = event.explicitOriginalTarget.textContent;
            } else {
                selection = event.srcElement.innerText;
            }
    
            d3.select("#sankey-diagram-dimension-" + (i + 1) + "-selector li a").text(selection);
            
            charts["sankey-diagram"].dimensions[i] = selection;
            charts["sankey-diagram"].updateVis();
        });
    });

    const checkSankeyDimensionCount = (value) => {
        d3.select("#sankey-diagram-layer-count").text(value);
        const dimensions = [];
        const lefts = {
            2: [0, 81],
            3: [0, 41, 81],
            4: [0, 25.5, 56, 81]
        };
        [1, 2, 3, 4].forEach((n, i) => {
            if (n <= value) {
                d3.select("#sankey-diagram-dimension-" + n + "-selector")
                    .style("display", "block")
                    .style("left", lefts[value][i] + "%");
                dimensions.push(d3.select("#sankey-diagram-dimension-" + n + "-selector li a").text());
            } else {
                d3.select("#sankey-diagram-dimension-" + n + "-selector")
                    .style("display", "none");
            }
        });
        charts["sankey-diagram"].dimensions = dimensions;
        charts["sankey-diagram"].updateVis();
    };

    d3.select("#sankey-diagram-layer-minus").on("click", () => {
        let value = +d3.select("#sankey-diagram-layer-count").text();
        value = d3.max([value - 1, 2]);
        checkSankeyDimensionCount(value);
    });

    d3.select("#sankey-diagram-layer-plus").on("click", () => {
        let value = +d3.select("#sankey-diagram-layer-count").text();
        value = d3.min([value + 1, 4]);
        checkSankeyDimensionCount(value);
    });
    
    fillHierarchicalSelection("#word-cloud-dimension-selector", dimensions, o => o["#word-cloud"], "Size", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        console.log(selection);

        d3.select("#word-cloud-dimension-selector li a").text(selection);
        
        charts["word-cloud"].dimension = selection;
        charts["word-cloud"].updateVis();
    });
});