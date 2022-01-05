"""
Script to generate 'fancy' plots vs acceleration_RA for all phenotypes of interest
"""

import pathlib
import os 

import pandas
import pylab

COHORT = 2


data_dir = pathlib.Path("../data/ukbb/global_phewas/cohort2/").resolve()
fig_dir = pathlib.Path("figures/").resolve()
fig_dir.mkdir(exist_ok=True)
out_dir = (fig_dir/ "fancy/").resolve()
out_dir.mkdir(exist_ok=True)

os.chdir("../data/ukbb/scripts")
import phewas_preprocess
import phewas_plots

print(out_dir)


data, ukbb, activity, activity_summary, activity_summary_seasonal, activity_variables, activity_variance, full_activity, phecode_data, phecode_groups, phecode_info, phecode_map, icd10_entries, icd10_entries_all, phecode_details = phewas_preprocess.load_data(COHORT)

medications = phewas_preprocess.load_medications(data.index)

# Load descriptions + categorization of activity variables and quantitative variables
activity_variable_descriptions = pandas.read_excel("../table_header.xlsx", index_col="Activity Variable", sheet_name="Variables", engine="openpyxl")
quantitative_variable_descriptions = pandas.read_excel("../quantitative_variables.xlsx", index_col=0, engine="openpyxl")


plotter = phewas_plots.Plotter(phecode_info, phecode_map, {}, activity_variables, activity_variable_descriptions, quantitative_variable_descriptions)

phenotypes = pandas.read_csv(data_dir/"phecodes.three_components.txt", index_col = "phenotype", sep="\t").index
phecodes = phecode_info.reset_index().set_index("phenotype").loc[phenotypes].phecode

print("Loaded data")

for phecode, phenotype in zip(phecodes, phenotypes):
    print(phecode, phenotype)
    fig = plotter.fancy_case_control_plot(data, phecode, var="acceleration_RA", normalize=True, confidence_interval=True, rescale=True, annotate=False)
    safe_phenotype = phenotype.replace("/", ",")
    fig.savefig(out_dir/f"{safe_phenotype}.png", dpi=300)
    pylab.close(fig)
