"""
Script to generate average temperature+acceleration plots for all phenotypes of interest
"""

import pathlib
import os 
import sys
import json

import pandas
import pylab

COHORT = 2


data_dir = pathlib.Path("../global_phewas/cohort2/").resolve()
fig_dir = pathlib.Path("figures/").resolve()
fig_dir.mkdir(exist_ok=True)
temp_out_dir = (fig_dir/ "temp/").resolve()
temp_out_dir.mkdir(exist_ok=True)
acc_out_dir = (fig_dir/ "acc/").resolve()
acc_out_dir.mkdir(exist_ok=True)

# Hack to get to the right imports and to allow those scripts to
# load the files we need
sys.path.insert(0, "../scripts")
import phewas_preprocess
import phewas_plots
import day_plots
os.chdir("../scripts")
print(os.getcwd())

data, ukbb, activity, activity_summary, activity_summary_seasonal, activity_variables, activity_variance, full_activity, phecode_data, phecode_groups, phecode_info, phecode_map, icd10_entries, icd10_entries_all, phecode_details = phewas_preprocess.load_data(COHORT)

# Load descriptions + categorization of activity variables and quantitative variables
activity_variable_descriptions = pandas.read_excel("../table_header.xlsx", index_col="Activity Variable", sheet_name="Variables", engine="openpyxl")
quantitative_variable_descriptions = pandas.read_excel("../quantitative_variables.xlsx", index_col=0, engine="openpyxl")


plotter = phewas_plots.Plotter(phecode_info, phecode_map, {}, activity_variables, activity_variable_descriptions, quantitative_variable_descriptions)

phenotypes = pandas.read_csv(data_dir/"phecodes.three_components.txt", index_col = "phenotype", sep="\t").index
phecodes = phecode_info.reset_index().set_index("phenotype").loc[phenotypes].phecode

print("Loaded data")

# Plot actigraphy and tempreature by  case/control status
# after matching cases and controls
match_counts = {}
def case_control(phecode, data=data, N=10):
    cats = data[phecode].astype("category").cat.rename_categories({0:"Control", 1:"Case"})
    colors = {"Case": "orange", "Control": "teal"}
    phenotype = phecode_info.loc[phecode].phenotype

    # Attempt to match case-control
    cases = data.index[cats == 'Case']
    matched_case = []
    matched_control = []
    remaining_cases = data.index[cats == "Control"]
    for case in cases:
        target_age = data.loc[case].age_at_actigraphy
        target_sex = data.loc[case].sex
        matches = data.index[((data.age_at_actigraphy - target_age).abs() < 1) & (data.sex == target_sex)]
        good_matches = remaining_cases[remaining_cases.isin(matches)]
        if len(good_matches) > 0:
            chosen_match = good_matches[0]
            remaining_cases = remaining_cases[remaining_cases != chosen_match]
            matched_case.append(case)
            matched_control.append(chosen_match)
        if len(matched_case) >= N:
            break
    print(f"Matched {len(matched_case)} case-control pairs from {len(cases)} cases")
    match_counts[phenotype] = len(matched_case)

    temp_fig, ax = pylab.subplots()
    for cat, ids in zip(['Case', 'Control'], [matched_case, matched_control]):
        day_plots.plot_average_trace(ids,
                    var="temp",
                    normalize_mean = True,
                    set_mean = 0,
                    ax=ax,
                    color=colors[cat] if colors is not None else None,
                    label=cat,
                    show_variance=True,
                    center="median",
                    )
    ax.set_ylabel("Temperature (C)")
    temp_fig.legend()
    temp_fig.gca().set_title(phenotype)
    temp_fig.tight_layout()

    acc_fig, ax = pylab.subplots()
    for cat, ids in zip(['Case', 'Control'], [matched_case, matched_control]):
        day_plots.plot_average_trace(ids,
                    var="acceleration",
                    ax=ax,
                    color=colors[cat] if colors is not None else None,
                    label=cat,
                    show_variance=True,
                    center="median",
                    )
    ax.set_ylabel("Acceleration (millig)")
    acc_fig.legend()
    acc_fig.gca().set_title(phecode_info.loc[phecode].phenotype)
    acc_fig.tight_layout()

    return temp_fig, acc_fig

# Generate for each phenotype these plots
available_ids = day_plots.get_ids_of_traces_available()
available_data = data[data.index.isin(available_ids)]
for phecode, phenotype in zip(phecodes, phenotypes):
    safe_phenotype = phenotype.replace("/", ",")
    temp_fig, acc_fig = case_control(phecode, data=available_data, N = 5000)
    temp_fig.savefig(temp_out_dir / f"{safe_phenotype}.png", dpi=300)
    acc_fig.savefig(acc_out_dir / f"{safe_phenotype}.png", dpi=300)
    pylab.close(temp_fig)
    pylab.close(acc_fig)
with open(fig_dir / "trace_match_counts.json", "w") as output:
    json.dump(match_counts, output)
#pandas.Series(match_counts).to_csv(fig_dir / "trace_match_counts.txt", sep="\t")

