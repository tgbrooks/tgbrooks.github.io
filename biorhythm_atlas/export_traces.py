"""
Script to generate average temperature+acceleration plots for all phenotypes of interest
"""

import pathlib
import os 
import sys
import json

import pandas
import pylab

COHORT = 0


data_dir = pathlib.Path("../results/longitudinal/cohort0/").resolve()
fig_dir = (data_dir/ "figures/").resolve()
fig_dir.mkdir(exist_ok=True)
temp_out_dir = (fig_dir/ "temp/").resolve()
temp_out_dir.mkdir(exist_ok=True)
acc_out_dir = (fig_dir/ "acc/").resolve()
acc_out_dir.mkdir(exist_ok=True)

# NOTE: run this from the /scripts/ directory
# so that we can import these
import phewas_preprocess
import day_plots
import longitudinal_diagnoses

#### Load and preprocess the underlying data
data, ukbb, activity, activity_summary, activity_summary_seasonal, activity_variables, activity_variance, full_activity = phewas_preprocess.load_data(COHORT)
actigraphy_start_date = pandas.Series(data.index.map(pandas.to_datetime(activity_summary['file-startTime'])), index=data.index)

COVARIATES = ["sex", "ethnicity_white", "overall_health", "smoking", "age_at_actigraphy_cat", "BMI", "college_education", "alcohol_frequency", "townsend_deprivation_index"]
complete_cases = (~data[COVARIATES + ['age_at_actigraphy', 'temp_amplitude']].isna().any(axis=1))
complete_case_ids = complete_cases.index[complete_cases]

case_status, phecode_info, phecode_details = longitudinal_diagnoses.load_longitudinal_diagnoses(complete_case_ids, actigraphy_start_date, OUTDIR=data_dir, RECOMPUTE=False)

results = pandas.read_csv(data_dir /"predictive_tests.cox.txt", sep="\t", dtype={"phecode": str})
phenotypes = results.meaning
phecodes = results.phecode

print("Loaded data")

# Plot actigraphy and tempreature by  case/control status
# after matching cases and controls
match_counts = {}
def case_control(phecode, phenotype, data=data, N=10):
    colors = {"Case": "orange", "Control": "teal"}


    # Attempt to match case-control
    diagnoses = case_status[case_status.PHECODE == phecode].set_index('ID').case_status.cat.set_categories(['case', 'control', 'exclude'])
    status = data.index.map(diagnoses).fillna('control')
    cases = data.index[status == 'case']
    controls = data.index[status == 'control']
    matched_case = []
    matched_control = []
    remaining_controls = controls
    for case in cases:
        target_age = data.loc[case].age_at_actigraphy
        target_sex = data.loc[case].sex
        matches = data.index[((data.age_at_actigraphy - target_age).abs() < 1) & (data.sex == target_sex)]
        good_matches = remaining_controls[remaining_controls.isin(matches)]
        if len(good_matches) > 0:
            chosen_match = good_matches[0]
            remaining_controls = remaining_controls[remaining_controls != chosen_match]
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
for phecode, phenotype in list(zip(phecodes, phenotypes)):
    safe_phenotype = phenotype.replace("/", ",")
    temp_fig, acc_fig = case_control(phecode, phenotype, data=available_data, N = 5000)
    temp_fig.savefig(temp_out_dir / f"{safe_phenotype}.png", dpi=300)
    acc_fig.savefig(acc_out_dir / f"{safe_phenotype}.png", dpi=300)
    pylab.close(temp_fig)
    pylab.close(acc_fig)
with open(fig_dir / "trace_match_counts.json", "w") as output:
    json.dump(match_counts, output)
#pandas.Series(match_counts).to_csv(fig_dir / "trace_match_counts.txt", sep="\t")

