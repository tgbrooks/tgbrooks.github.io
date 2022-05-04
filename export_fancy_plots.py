"""
Script to generate 'fancy' plots vs acceleration_RA for all phenotypes of interest
"""

import pathlib
import os 

import pandas
import pylab

COHORT = 0


data_dir = pathlib.Path("../data/ukbb/longitudinal/cohort0/").resolve()
fig_dir = pathlib.Path("figures/").resolve()
fig_dir.mkdir(exist_ok=True)
out_dir = (fig_dir/ "fancy/").resolve()
out_dir.mkdir(exist_ok=True)

os.chdir("../data/ukbb/scripts")
import phewas_preprocess
import longitudinal_diagnoses
from longitudinal_analysis import fancy_case_control_plot

print(out_dir)


#### Load and preprocess the underlying data
data, ukbb, activity, activity_summary, activity_summary_seasonal, activity_variables, activity_variance, full_activity = phewas_preprocess.load_data(COHORT)
selected_ids = data.index
actigraphy_start_date = pandas.Series(data.index.map(pandas.to_datetime(activity_summary['file-startTime'])), index=data.index)

case_status, phecode_info, phecode_details = longitudinal_diagnoses.load_longitudinal_diagnoses(selected_ids, actigraphy_start_date)


results = pandas.read_csv(data_dir /"predictive_tests.cox.txt", sep="\t", dtype={"phecode": str})
phenotypes = results.meaning
phecodes = results.phecode

print("Loaded data")

for phecode, phenotype in list(zip(phecodes, phenotypes)):
    print(phecode, phenotype)
    fig = fancy_case_control_plot(
        data,
        case_status,
        phecode,
        title = phecode_info.loc[phecode]['phenotype'],
        var = "temp_amplitude",
        normalize=True,
        confidence_interval=True,
        rescale=True,
        annotate=False,
    )
    safe_phenotype = phenotype.replace("/", ",")
    fig.savefig(out_dir/f"{safe_phenotype}.png", dpi=300)
    pylab.close(fig)
