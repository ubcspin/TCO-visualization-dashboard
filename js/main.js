const charts = {};

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/comfort-objects.csv').then(data => {
    console.log(data);
    
    let container = document.getElementById("bar-chart-container");
    charts["bar-chart"] = new BarChart({
        parentElement: "#bar-chart",
        width: container.clientWidth - 20,
        height: container.clientHeight - 70,
        dimension: "Gender"
    }, JSON.parse(JSON.stringify(data)));

    container = document.getElementById("scatter-plot-container");
    charts["scatter-plot-softness"] = new ScatterPlot({
        parentElement: "#scatter-plot",
        width: container.clientWidth - 20,
        height: container.clientHeight - 70,
        yDimension: "Age",
        xDimension: "Softness Rating",
        colourDimension: "Gender"
    }, JSON.parse(JSON.stringify(data)));

    // charts.push(new RadarPlot());

    container = document.getElementById("jitter-plot-container");
    charts["scatter-plot-general"] = new ScatterPlot({
        parentElement: "#jitter-plot",
        width: container.clientWidth - 20,
        height: container.clientHeight - 70,
        yDimension: "Object Category",
        xDimension: "Portability",
        colourDimension: "Gender"
    }, JSON.parse(JSON.stringify(data)));

    // charts.push(new SankeyDiagram());

    // charts.push(new WordCloud());
});

const fillDropdownSelection = (dropdown, options, optionSelector, hierarchySelector) => {
    options.forEach(o => {
        const option = document.createElement("option")
        option.text = option.value = optionSelector(o);
        dropdown.appendChild(option);
        if (hierarchySelector) {
            hierarchySelector(o).forEach(so => {
                const option = document.createElement("option")
                option.text = option.value = "--- " + so;
                dropdown.appendChild(option);
            });
        }
    });
};

d3.json('data/dimensions.json').then(dimensions => {
    let dropdown = document.getElementById("bar-chart-dimension-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"]);
    dropdown.onchange = () => {
        let selection = document.getElementById("bar-chart-dimension-selector").value;
        if (selection.startsWith("--- ")) {
            selection = selection.substring(4);
        }
        charts["bar-chart"].dimension = selection;
        charts["bar-chart"].updateVis();

        charts["scatter-plot-softness"].colourDimension = selection;
        charts["scatter-plot-softness"].updateVis();
    }
    
    dropdown = document.getElementById("scatter-plot-dimension-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"]);
    dropdown.onchange = () => {
        let selection = document.getElementById("scatter-plot-dimension-selector").value;
        if (selection.startsWith("--- ")) {
            selection = selection.substring(4);
        }
        charts["scatter-plot-softness"].yDimension = selection;
        charts["scatter-plot-softness"].updateVis();
    }
});