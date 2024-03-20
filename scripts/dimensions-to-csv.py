import csv
import json

structure = {}

with open("data/data-structure.csv") as csvFile:
    reader = csv.reader(csvFile)
    for row in reader:
        if row[2] == "categorical":
            if row[0] not in structure:
                structure[row[0]] = []
            structure[row[0]] += [row[1]]

listemizedStructure = []
for k in list(structure.keys()):
    listemizedStructure += [{
        "block": k,
        "dimensions": structure[k]
    }]

with open("data/dimensions.json", "w") as jsonFile:
    jsonFile.write(json.dumps(listemizedStructure, indent=4))