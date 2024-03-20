const charts = {};

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/comfort-objects.csv').then(data => {   
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
        height: container.clientHeight - 120,
        yDimension: "Object Category",
        xDimension: "Portability",
        colourDimension: "Gender"
    }, JSON.parse(JSON.stringify(data)));

    // charts.push(new SankeyDiagram());

    container = document.getElementById("word-cloud-container");
    charts["word-cloud"] = new WordCloud({
        parentElement: "#word-cloud",
        width: container.clientWidth - 20,
        height: container.clientHeight - 70,
        dimension: "Size"
    }, JSON.parse(JSON.stringify(data)));
});

const fillDropdownSelection = (dropdown, options, optionSelector, hierarchySelector, defaultOption) => {
    options.forEach(o => {
        if (hierarchySelector) {
            hierarchySelector(o).forEach(so => {
                const option = document.createElement("option")
                option.text = option.value = "[" + optionSelector(o) + "] " + so;
                dropdown.appendChild(option);
                if (defaultOption === so) {
                    dropdown.value = option.value;
                }
            });
        } else {
            const option = document.createElement("option")
            option.text = option.value = optionSelector(o);
            dropdown.appendChild(option);
            if (defaultOption === o) {
                dropdown.value = option.value;
            }
        }
    });
};

d3.json('data/dimensions.json').then(dimensions => {
    let dropdown = document.getElementById("bar-chart-dimension-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"], "Gender");
    dropdown.onchange = () => {
        let selection = document.getElementById("bar-chart-dimension-selector").value;
        if (selection.startsWith("--- ")) {
            selection = selection.substring(4);
        }
        charts["bar-chart"].dimension = selection;
        charts["bar-chart"].updateVis();

        charts["scatter-plot-softness"].colourDimension = selection;
        charts["scatter-plot-softness"].updateVis();

        charts["scatter-plot-general"].colourDimension = selection;
        charts["scatter-plot-general"].updateVis();
    }
    
    dropdown = document.getElementById("scatter-plot-dimension-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"], "Age");
    dropdown.onchange = () => {
        let selection = document.getElementById("scatter-plot-dimension-selector").value;
        if (selection.startsWith("[")) {
            selection = selection.substring(selection.indexOf("]") + 2);
        }
        charts["scatter-plot-softness"].yDimension = selection;
        charts["scatter-plot-softness"].updateVis();
    }
    
    dropdown = document.getElementById("jitter-plot-dimension-y-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"], "Object Category");
    dropdown.onchange = () => {
        let selection = document.getElementById("jitter-plot-dimension-y-selector").value;
        if (selection.startsWith("[")) {
            selection = selection.substring(selection.indexOf("]") + 2);
        }
        charts["scatter-plot-general"].yDimension = selection;
        charts["scatter-plot-general"].updateVis();
    }
    
    dropdown = document.getElementById("jitter-plot-dimension-x-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"], "Portability");
    dropdown.onchange = () => {
        let selection = document.getElementById("jitter-plot-dimension-x-selector").value;
        if (selection.startsWith("[")) {
            selection = selection.substring(selection.indexOf("]") + 2);
        }
        charts["scatter-plot-general"].xDimension = selection;
        charts["scatter-plot-general"].updateVis();
    }
    
    dropdown = document.getElementById("word-cloud-dimension-selector");
    fillDropdownSelection(dropdown, dimensions, o => o["block"], (o) => o["dimensions"], "Size");
    dropdown.onchange = () => {
        let selection = document.getElementById("word-cloud-dimension-selector").value;
        if (selection.startsWith("[")) {
            selection = selection.substring(selection.indexOf("]") + 2);
        }
        charts["word-cloud"].dimension = selection;
        charts["word-cloud"].updateVis();
    }
});