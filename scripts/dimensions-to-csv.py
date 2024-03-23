import csv
import json

structure = {}
filters = []

with open("data/data-structure.csv") as csvFile:
    reader = csv.reader(csvFile)
    for row in reader:
        if row[2] == "":
            name = row[1]
        else:
            name = row[1] + ": " + row[2]

        if row[4] == "categorical":
            if name not in structure:
                structure[name] = []

            structure[name] += [{
                "name": row[3],
                "type": row[8],
                "#word-cloud": row[11] == "use",
                "#bar-chart": row[12] == "use",
                "#scatter-plot": row[13] == "use",
                "#jitter-plot": row[13] == "use",
                "#radar-plot": row[14] == "use",
                "#sankey-diagram": row[15] == "use",
            }]
        
        if row[10] == "use":
            filters += [{
                "block": row[3],
                "options": row[7].split(", ")
            }]

listemizedStructure = []
for k in list(structure.keys()):
    listemizedStructure += [{
        "block": k,
        "dimensions": structure[k]
    }]

with open("data/dimensions.json", "w") as jsonFile:
    jsonFile.write(json.dumps(listemizedStructure, indent=4))

with open("data/filters.json", "w") as jsonFile:
    jsonFile.write(json.dumps(filters, indent=4))