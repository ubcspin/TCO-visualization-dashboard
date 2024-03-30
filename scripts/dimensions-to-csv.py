import csv
import json
import os

structure = {}
filters = []
options = {}

with open("data/data-structure.csv") as csvFile:
    reader = csv.reader(csvFile)
    for row in reader:
        if row[4].startswith("[DER] "):
            row[4] = row[4][6:]

        if row[2] == "":
            name = row[1]
        else:
            name = row[1] + ": " + row[2]

        if row[5] == "categorical" or row[5] == "numerical":
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

            options[row[4]] = list(map(lambda d: d.strip(), row[8].split(", ")))
        
        if row[11] == "use":
            filters += [{
                "block": row[4],
                "options": row[8].split(", ")
            }]

presets = {}

with open("data/presets.csv") as csvFile:
    reader = csv.reader(csvFile)
    next(reader, None)
    for row in reader:
        if row[0] not in presets:
            presets[row[0]] = []
        
        presets[row[0]] += [{
            "name": row[1],
            "dimensions": list(map(lambda d: d.strip(), row[2].split(", ")))
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

with open("data/options.json", "w") as jsonFile:
    jsonFile.write(json.dumps(options, indent=4))

with open("data/presets.json", "w") as jsonFile:
    jsonFile.write(json.dumps(presets, indent=4))

with open("data/photos.json", "w") as jsonFile:
    path = "media/object-photos"
    photos = os.listdir(path)
    photos = list(map(lambda p: { "path": path + "/" + p, "reproduced": "(rep)" in p }, photos))
    jsonFile.write(json.dumps(photos, indent=4))