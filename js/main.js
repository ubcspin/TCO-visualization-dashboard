const charts = {};
let filterOptions = [];
let allData;
let filteredData;

let photoMap;

let popupDimensions = [];

let globalFontSize;

const dispatch = d3.dispatch("specifyIndividual", "specifyGroup", "popUpProfile");

const checkSankeyDimensionCount = (value) => {
    d3.select("#sankey-diagram-layer-count").text(value);
    const dimensions = [];
    const lefts = {
        2: [0, 82],
        3: [0, 41, 82],
        4: [0, 25.5, 56, 82],
        5: [0, 17.5, 41, 64.5, 82]
    };
    [1, 2, 3, 4, 5].forEach((n, i) => {
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

const resize = () => {
    const width = d3.max([window.innerWidth, 1600]);
    let height = d3.max([window.innerHeight, 900]);
    if (width / height < 1.6 && width / height > 1.9) {
        height = width * 9 / 16;
    }

    document.getElementById("participant-profile").setAttribute("style", "font-size: " + (width * 100 / 1920) + "%")
    document.getElementById("dashboard").setAttribute("style", "width: " + width + "px; height: " + height + "px; font-size: " + (width * 100 / 1920) + "%");
    const selectors = document.getElementsByClassName("selector");
    for (let i = 0; i < selectors.length; i++) {
        selectors.item(i).setAttribute("style", "height: " + (height * 0.015) + "px; margin: " + (height * 0.004) + "px; padding: " + (height * 0.006) + "px")
    }

    const dropdowns = document.querySelectorAll(".selector ul");
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns.item(i).setAttribute("style", "width: " + (width * 0.13) + "px")
    }

    const presets = document.querySelectorAll(".preset ul li");
    for (let i = 0; i < presets.length; i++) {
        presets.item(i).setAttribute("style", "height: " + (height * 0.014) + "px; padding: " + (height * 0.006) + "px")
    }

    globalFontSize = width * 100 / 1920;

    d3.selectAll("g.tick text").attr("font-size", globalFontSize + "%");

    Object.values(charts).forEach(c => {
        let container = document.getElementById(c.config.parentElement.substring(1) + "-container");
        c.config.containerWidth = container.clientWidth;
        c.config.containerHeight = container.clientHeight;
        c.updateVis();
    });

    checkSankeyDimensionCount(+d3.select("#sankey-diagram-layer-count").text());
};

window.onresize = resize;

const fillFlatSelection = (dropdown, options, defaultOption, onchange) => {
    d3.select(dropdown + " li a").text(defaultOption["name"]);
    let topLevel = d3.select(dropdown + " li").append("ul");
    options.forEach(o => {
        topLevel.append("li").text(o["name"]).on("click", onchange);
    });
};

const fillHierarchicalSelection = (dropdown, options, filter, defaultOption, checkbox, onchange) => {
    d3.select(dropdown + " li a").text(defaultOption);
    let topLevel = d3.select(dropdown + " li").append("ul");
    options.forEach(o => {
        const midLevelLi = topLevel.append("li");
        midLevelLi.append("a").attr("href", "#").text(o["block"]);
        const midLevel = midLevelLi.append("ul").attr("class", "level-2");
        if (checkbox) {
            o["options"].forEach(d => {
                const id = "checkbox-" + o["block"].split(/[\s\,\(\)\/]+/).join("-") + "-" + d.split(/[\s\,\(\)\/]+/).join("-");
                filterOptions.push({
                    id: id,
                    dimension: o["block"],
                    option: d
                });
                const option = midLevel.append("li").on("click", () => {
                    console.log("clicked");
                    const status = d3.select("#" + id).property("checked");
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
                    midLevel.append("li").text(d["name"]).on("click", onchange);
                }
            });
        }

        if (midLevel.selectAll("li").size() == 0) {
            midLevelLi.remove();
        }
    });
};

/**
 * Load data from CSV file asynchronously and render charts
 */
Promise.all([d3.csv('data/comfort-objects.csv'), d3.json('data/options.json'), d3.json('data/dimensions.json'), d3.json("data/filters.json"), d3.json("data/presets.json"), d3.json("data/photos.json")]).then(([data, options, dimensions, filters, presets, photos]) => {
    allData = data;
    filteredData = JSON.parse(JSON.stringify(data));

    photoMap = photos;

    const onlyUnique = (value, index, array) => {
        return array.indexOf(value) === index;
    };

    dimensions.forEach(b => {
        const block = [];
        b.dimensions.forEach(d => {
            if (d["#profile"]) {
                block.push(d.name);
            }
        });
        popupDimensions.push(block);
    });

    const dimensionMatch = [];
    dimensions.forEach(b => {
        dimensionMatch.push(...b.dimensions.map(d => {
            if (d["#word-cloud"] || d["#bar-chart"] || d["#scatter-plot"] || d["#jitter-plot"] || d["#radar-plot"] || d["#sankey-diagram"]) {
                let fromData = [];
                allData.forEach(k => {
                    fromData.push(...k[d.name].split(","));
                })
                fromData = fromData.filter(onlyUnique).sort();
                const fromStructure = d.type.split(", ").sort();
    
                return {
                    mismatch: fromData.some(k => !fromStructure.includes(k)),
                    data: fromData,
                    structure: fromStructure
                };
            }
        }).filter(d => d));
    });

    console.log(dimensionMatch);


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
            gap: 0.10,
            top: 0.04,
            right: 0.01,
            bottom: 0.20,
            left: 0.10
        }
    }, filteredData, options, dispatch);
    
    container = document.getElementById("simple-bar-container");
    charts["simple-bar"] = new SimpleBar({
        parentElement: "#simple-bar",
        width: container.clientWidth,
        height: container.clientHeight,
        margin: {
            gap: 0,
            top: 0.10,
            right: 0.04,
            bottom: 0,
            left: 0
        }
    }, filteredData, filteredData.length, dispatch);

    container = document.getElementById("scatter-plot-container");
    charts["scatter-plot-softness"] = new ScatterPlot({
        parentElement: "#scatter-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        yDimension: "Age",
        xDimension: "Softness Rating",
        colourDimension: "Gender",
        margin: {
            gap: 0.10,
            top: 0.04,
            right: 0.01,
            bottom: 0.15,
            left: 0.15
        }
    }, filteredData, options, dispatch);

    container = document.getElementById("radar-plot-container");
    charts["radar-plot"] = new RadarPlot({
        parentElement: "#radar-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        dimensions: ["Tendency to Fidget", "Emotional Attachment to Objects", "Values Design and Aesthetics", "Non-Functional Personal Objects"],
        margin: {
            gap: 0.10,
            top: 0.04,
            right: 0.01,
            bottom: 0.26,
            left: 0.08
        }
    }, filteredData, options, dispatch);

    container = document.getElementById("jitter-plot-container");
    charts["scatter-plot-general"] = new ScatterPlot({
        parentElement: "#jitter-plot",
        width: container.clientWidth,
        height: container.clientHeight,
        yDimension: "Object Category",
        xDimension: "Portability",
        colourDimension: "Gender",
        margin: {
            gap: 0.08,
            top: 0.04,
            right: 0.01,
            bottom: 0.20,
            left: 0.25
        }
    }, filteredData, options, dispatch);

    container = document.getElementById("sankey-diagram-container");
    charts["sankey-diagram"] = new SankeyDiagram({
        parentElement: "#sankey-diagram",
        width: container.clientWidth,
        height: container.clientHeight,
        dimensions: ["Device Type", "Appearance", "Age", "Gender", "Education"],
        margin: {
            gap: 0.14,
            top: 0.04,
            right: 0.01,
            bottom: 0.01,
            left: 0.01
        }
    }, filteredData, options, dispatch);

    container = document.getElementById("word-cloud-container");
    charts["word-cloud"] = new WordCloud({
        parentElement: "#word-cloud",
        width: container.clientWidth,
        height: container.clientHeight,
        dimension: "Size",
        margin: {
            gap: 0.08,
            top: 0.04,
            right: 0.01,
            bottom: 0.01,
            left: 0.01
        }
    }, filteredData, dispatch);

    document.getElementById("photo-gallery-button").onclick = () => {
        location.href = "gallery.html"
    };

    document.getElementById("schema-link").onclick = () => {
        window.open("https://docs.google.com/spreadsheets/d/e/2PACX-1vTC-dHTIb4KiGqFQy5jg439IKjv2L7M0IosUELEpOJs6fWA1i2SBAmkbZ5zOIp-EU8SCTx4xsaulBaP/pubhtml?gid=0&single=true", '_blank').focus();
    };

    document.getElementById("feedback-button").onclick = () => {
        window.open("https://ubc.ca1.qualtrics.com/jfe/form/SV_9AEuYPxO5ZvDijI", '_blank').focus();
    };

    document.getElementById("info-button").onclick = () => {
        window.open("https://docs.google.com/presentation/d/e/2PACX-1vSTttNjY3mJD6D9PYhgdL8VHYISdGtkV9eOeuYvPUpLGsLJh402gNfvCOjfKuG_u_s2ihACtIpek4pV/pub?start=false&loop=false&delayms=60000", '_blank').focus();
    };

    document.getElementById("faded-background").onclick = () => {
        document.getElementById("blocker").style.display = "none";
    };

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

        charts["simple-bar"].ogData = filteredData;
        charts["simple-bar"].updateVis();

        charts["scatter-plot-softness"].ogData = filteredData;
        charts["scatter-plot-softness"].updateVis();

        charts["radar-plot"].ogData = filteredData;
        charts["radar-plot"].updateVis();

        charts["scatter-plot-general"].ogData = filteredData;
        charts["scatter-plot-general"].updateVis();

        charts["sankey-diagram"].ogData = filteredData;
        charts["sankey-diagram"].updateVis();

        charts["word-cloud"].ogData = filteredData;
        charts["word-cloud"].updateVis();
    });

    document.getElementById("clear-filter-button").onclick = () => {
        filteredData = JSON.parse(JSON.stringify(allData));

        filterOptions.forEach(d => {
            d3.select("#" + d.id).property("checked", false);
        });

        charts["bar-chart"].ogData = filteredData;
        charts["bar-chart"].updateVis();

        charts["simple-bar"].ogData = filteredData;
        charts["simple-bar"].updateVis();

        charts["scatter-plot-softness"].ogData = filteredData;
        charts["scatter-plot-softness"].updateVis();

        charts["radar-plot"].ogData = filteredData;
        charts["radar-plot"].updateVis();

        charts["scatter-plot-general"].ogData = filteredData;
        charts["scatter-plot-general"].updateVis();

        charts["sankey-diagram"].ogData = filteredData;
        charts["sankey-diagram"].updateVis();

        charts["word-cloud"].ogData = filteredData;
        charts["word-cloud"].updateVis();
    };

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

    fillFlatSelection("#radar-plot-preset-selector", presets["Radar"], presets["Radar"][1], (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#radar-plot-preset-selector li a").text(selection);
        
        charts["radar-plot"].dimensions = presets["Radar"].find(p => p["name"] === selection)["dimensions"];
        charts["radar-plot"].updateVis();
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
    
    ["Device Type", "Appearance", "Age", "Gender", "Education"].forEach((d, i) => {
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

    fillFlatSelection("#sankey-diagram-preset-selector", presets["Sankey"], presets["Sankey"][1], (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#sankey-diagram-preset-selector li a").text(selection);

        const dimensions = presets["Sankey"].find(p => p["name"] === selection)["dimensions"];

        dimensions.forEach((d, i) => {
            d3.select("#sankey-diagram-dimension-" + (i + 1) + "-selector li a").text(d);
        });
        
        checkSankeyDimensionCount(dimensions.length);
        
        charts["sankey-diagram"].dimensions = dimensions;
        charts["sankey-diagram"].updateVis();
    });

    d3.select("#sankey-diagram-layer-minus").on("click", () => {
        let value = +d3.select("#sankey-diagram-layer-count").text();
        value = d3.max([value - 1, 2]);
        checkSankeyDimensionCount(value);
    });

    d3.select("#sankey-diagram-layer-plus").on("click", () => {
        let value = +d3.select("#sankey-diagram-layer-count").text();
        value = d3.min([value + 1, 5]);
        checkSankeyDimensionCount(value);
    });
    
    fillHierarchicalSelection("#word-cloud-dimension-selector", dimensions, o => o["#word-cloud"], "Size", false, (event) => {
        let selection;
        if (event.explicitOriginalTarget) {
            selection = event.explicitOriginalTarget.textContent;
        } else {
            selection = event.srcElement.innerText;
        }

        d3.select("#word-cloud-dimension-selector li a").text(selection);
        
        charts["word-cloud"].dimension = selection;
        charts["word-cloud"].updateVis();
    });

    resize();
});

dispatch.on("specifyIndividual", i => {
    if (i) {
        charts["bar-chart"].emphasized = [i[charts["bar-chart"].dimension]];
        charts["bar-chart"].renderVis();
        
        charts["scatter-plot-softness"].emphasized = [i["SNo"]];
        charts["scatter-plot-softness"].renderVis();
        
        charts["radar-plot"].emphasized = charts["radar-plot"].dimensions.map(d => [d, i[d]]);
        charts["radar-plot"].renderVis();
        
        charts["scatter-plot-general"].emphasized = [i["SNo"]];
        charts["scatter-plot-general"].renderVis();
        
        charts["sankey-diagram"].emphasized = charts["sankey-diagram"].dimensions.map(d => [d, i[d]]);
        charts["sankey-diagram"].renderVis();
        
        charts["word-cloud"].emphasized = i[charts["word-cloud"].dimension].split(",");
        charts["word-cloud"].renderVis();

    } else {
        charts["bar-chart"].emphasized = [];
        charts["bar-chart"].renderVis();
        
        charts["scatter-plot-softness"].emphasized = [];
        charts["scatter-plot-softness"].renderVis();
        
        charts["radar-plot"].emphasized = [];
        charts["radar-plot"].renderVis();
        
        charts["scatter-plot-general"].emphasized = [];
        charts["scatter-plot-general"].renderVis();
        
        charts["sankey-diagram"].emphasized = [];
        charts["sankey-diagram"].renderVis();
        
        charts["word-cloud"].emphasized = [];
        charts["word-cloud"].renderVis();
    }
});

dispatch.on("specifyGroup", (g, home) => {
    if (g) {
        const filteredData = allData.filter(d => g.every(k => d[k.dimension].split(",").includes(k.option)));

        if (home === "bar-chart") {
            charts["bar-chart"].emphasized = [g[0].option];
            charts["bar-chart"].renderVis();
        } else {
            charts["bar-chart"].ogData = filteredData;
            charts["bar-chart"].updateVis();
        }

        charts["simple-bar"].ogData = filteredData;
        charts["simple-bar"].updateVis();

        charts["scatter-plot-softness"].emphasized = allData.filter(d => g.every(o => d[o.dimension] === o.option)).map(d => d["SNo"]);
        charts["scatter-plot-softness"].renderVis();
        
        charts["radar-plot"].ogData = filteredData;
        charts["radar-plot"].updateVis();
        
        charts["scatter-plot-general"].emphasized = allData.filter(d => g.every(o => d[o.dimension] === o.option)).map(d => d["SNo"]);
        charts["scatter-plot-general"].renderVis();
        
        if (home === "sankey-diagram") {
            const emphasizeFilters = [];
            charts["sankey-diagram"].dimensions.forEach(d => {
                if (g.find(k => k.dimension === d)) {
                    emphasizeFilters.push([d, g.find(k => k.dimension === d).option])
                }
            });
            charts["sankey-diagram"].emphasized = emphasizeFilters;
            charts["sankey-diagram"].renderVis();
        } else {
            charts["sankey-diagram"].ogData = filteredData;
            charts["sankey-diagram"].updateVis();
        }
        
        if (home === "word-cloud") {
            charts["word-cloud"].emphasized = [g[0].option];
            charts["word-cloud"].renderVis();
        } else {
            charts["word-cloud"].ogData = filteredData;
            charts["word-cloud"].updateVis();
        }

    } else {   
        charts["bar-chart"].emphasized = [];
        charts["bar-chart"].ogData = allData;
        charts["bar-chart"].updateVis();

        charts["simple-bar"].ogData = allData;
        charts["simple-bar"].updateVis();
             
        charts["scatter-plot-softness"].emphasized = [];
        charts["scatter-plot-softness"].renderVis();
        
        charts["radar-plot"].emphasized = [];
        charts["radar-plot"].ogData = allData;
        charts["radar-plot"].updateVis();
        
        charts["scatter-plot-general"].emphasized = [];
        charts["scatter-plot-general"].renderVis();
        
        charts["sankey-diagram"].emphasized = [];
        charts["sankey-diagram"].ogData = allData;
        charts["sankey-diagram"].updateVis();
        
        if (home === "word-cloud") {
            charts["word-cloud"].emphasized = [];
            charts["word-cloud"].renderVis();
        } else {
            charts["word-cloud"].emphasized = [];
            charts["word-cloud"].ogData = allData;
            charts["word-cloud"].updateVis();
        }
    }
});

dispatch.on("popUpProfile", d => {
    const profile = document.getElementById("participant-profile");
    profile.innerHTML = "";
    
    const name = document.createElement("h2");
    name.classList.add("profile-option");
    name.innerText = d["Object Identification: Description"];
    profile.appendChild(name);

    let foundPhoto = false;
    photoMap.forEach(ph => {
        if (ph.number === d["SNo"]) {
            foundPhoto = true;
            const img = document.createElement("img");
            img.classList.add("profile-image");
            img.src = ph.path;
            profile.appendChild(img);
        }
    });

    if (!foundPhoto) {
        const img = document.createElement("img");
        img.classList.add("profile-image");
        img.src = "media/image_not_available.png";
        profile.appendChild(img);
    }

    popupDimensions.forEach(b => {
        b.forEach(pd => {
            if (pd in d) {
                const p = document.createElement("p");
                p.classList.add("profile-option");
                p.innerHTML = "<b>" + pd + "</b>: " + d[pd];
                profile.appendChild(p);
            }
        });
        const br = document.createElement("br");
        profile.appendChild(br);
    });
    
    document.getElementById("blocker").style.display = "block";
});