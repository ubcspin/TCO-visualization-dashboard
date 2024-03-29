import csv
import json

structure = {}
filters = []
options = {}

with open("data/data-structure.csv") as csvFile:
    reader = csv.reader(csvFile)
    for row in reader:
        print(row)
        if row[4].startswith("[DER] "):
            row[4] = row[4][6:]

        if row[2] == "":
            name = row[1]
        else:
            name = row[1] + ": " + row[2]

        if row[5] == "categorical":
            if name not in structure:
                structure[name] = []

            structure[name] += [{
                "name": row[3],
                "type": row[8],
                "#word-cloud": row[12] == "use",
                "#bar-chart": row[13] == "use",
                "#scatter-plot": row[14] == "use",
                "#jitter-plot": row[15] == "use",
                "#radar-plot": row[16] == "use",
                "#sankey-diagram": row[17] == "use",
            }]

            options[row[4]] = row[7].split(", ")
        
        if row[11] == "use":
            filters += [{
                "block": row[4],
                "options": row[7].split(", ")
            }]

print(structure)

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

with open("data/options.json", "w") as jsonFile:
    jsonFile.write(json.dumps(options, indent=4))