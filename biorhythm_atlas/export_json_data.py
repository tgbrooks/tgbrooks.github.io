"""
Script to export results data of the UKB PheWAS-SensR study to a
JSON format for easy loading in the webpage version.
"""

import pathlib
import json

import pandas

data_dir = pathlib.Path("../data/ukbb/longitudinal/cohort0/")
out_dir = pathlib.Path("data/")


files = [
    #dict(filename = "phecodes.three_components", index_col = "phenotype"),
    dict(filename = "predictive_tests.cox", index_col="meaning"),
    dict(filename = "predictive_tests_by_sex.cox", index_col="meaning"),
    dict(filename = "predictive_tests_by_age.cox", index_col="meaning"),
]
for file in files:
    index_col = file["index_col"]
    in_file = data_dir / f"{file['filename']}.txt"
    out_file = out_dir / f"{file['filename']}.json"
    df = pandas.read_csv(in_file, sep="\t", index_col=index_col)
    df.to_json(out_file, orient="index")

# Do the phecode details
df = pandas.read_excel(data_dir/"results.xlsx", sheet_name="PheCODEs", index_col=0)
df.index.name = "phecode"
df = df.reset_index().set_index("Meaning")
df.to_json(out_dir/"phecode_details.json", orient="index")
