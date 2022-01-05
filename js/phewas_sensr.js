const app = new Vue({
    el: "#app",
    data: {
        phenotype: "Diabetes mellitus",
        phecodes: [],
        three_components_results: null,
        predictive_tests: null,
        phecode_details: null,
        config: {
            three_components: {
                x_scale: 1000,
            },
        },
        redraw_plots: true,
    },

    computed: {
        phenotype_results: function() {
            if (this.phenotype === null
                    || this.three_components_results === null
                    || this.predictive_tests === null
                    || this.predictive_tests_by_age === null
                    || this.predictive_tests_by_sex === null
                    || this.phecode_details === null) {
                return null;
            }
            const phecode_details = this.phecode_details[this.phenotype];
            phecode_details.self_reported_condition_codes = phecode_details.self_reported_condition_codes || '';
            phecode_details.ICD10_codes = phecode_details.ICD10_codes || '';
            phecode_details.ICD9_codes = phecode_details.ICD9_codes || '';

            let results = {
                three_components: this.three_components_results[this.phenotype],
                predictive_tests:  this.predictive_tests[this.phenotype],
                predictive_tests_by_sex:  this.predictive_tests_by_sex[this.phenotype],
                predictive_tests_by_age:  this.predictive_tests_by_age[this.phenotype],
                phecode: phecode_details,
            };
            return results;
        },
    },

    mounted: function() {
        const app = this;
        fetch("data/phecodes.three_components.json")
            .then(response => response.json())
            .then(function(json){
                app.three_components_results = json;
                app.phecodes = Object.keys(json);
            });
        fetch("data/predictive_tests.cox.json")
            .then(response => response.json())
            .then(function(json){
                app.predictive_tests = json;
            });
        fetch("data/predictive_tests_by_sex.cox.json")
            .then(response => response.json())
            .then(function(json){
                app.predictive_tests_by_sex = json;
            });
        fetch("data/predictive_tests_by_age.cox.json")
            .then(response => response.json())
            .then(function(json){
                app.predictive_tests_by_age = json;
            });
        fetch("data/phecode_details.json")
            .then(response => response.json())
            .then(function(json){
                app.phecode_details = json;
            });
    },

    updated: function() {
        if (this.redraw_charts) {
            this.plot_results();
            this.redraw_charts = false;
        }
    },

    methods: {
        fmt: function(num) {
            // Format numbers for easy visibility
            if (num === null){ return 'N/A'; }
            return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
        },
        fmt_p: function(num) {
            // Format p-value to just 2 sig-figs
            if (num > 0.01) {
                return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
            } else if (num === null) {
                return 'N/A';
            } else {
                return num.toExponential(2);
            }

        },
        fmt_ci: function(num, SE) {
            //  Format number as SE to give 95% CI
            let lower = num - 1.96 * SE;
            let upper = num + 1.96 * SE;
            return this.fmt(num) + " " + this.fmt_range(lower, upper);
        },
        fmt_range: function(lower, upper) {
            return "(" + this.fmt(lower) + " - " + this.fmt(upper) + ")";
        },

        plot_results: function() {
            // Three components plot
            let three_comps = this.phenotype_results.three_components;
            let phys_color = "rgb(0.4588235294117647, 0.4392156862745098, 0.7019607843137254)";
            let sleep_color = "rgb(0.10588235294117647, 0.6196078431372549, 0.4666666666666667)";
            let circ_color = "rgb(0.8509803921568627, 0.37254901960784315, 0.00784313725490196)";
            let plot = new Plotly.newPlot( "three_components_chart",
            [
                {
                    x: [Math.abs(three_comps.physical_eff)],
                    y: [2],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Physical Activity',
                    marker: {size: 12, color: phys_color},
                },
                {
                    x: [Math.abs(three_comps.sleep_eff)],
                    y: [1],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Sleep',
                    marker: {size: 12, color: sleep_color},
                },
                {
                    x: [Math.abs(three_comps.circ_eff)],
                    y: [0],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Diurnal Rhythm',
                    marker: {size: 12, color: circ_color},
                },

                // Error bars:
                {
                    x: [Math.abs(three_comps.physical_eff) - 1.96*three_comps.physical_se, Math.abs(three_comps.physical_eff) + 1.96*three_comps.physical_se],
                    y: [2, 2],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: phys_color},
                    showlegend: false,
                },
                {
                    x: [Math.abs(three_comps.sleep_eff) - 1.96*three_comps.sleep_se, Math.abs(three_comps.sleep_eff) + 1.96*three_comps.sleep_se],
                    y: [1, 1],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: sleep_color},
                    showlegend: false,
                },
                {
                    x: [Math.abs(three_comps.circ_eff) - 1.96*three_comps.circ_se, Math.abs(three_comps.circ_eff) + 1.96*three_comps.circ_se],
                    y: [0, 0],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: circ_color},
                    showlegend: false,
                },
            ],
            {
                xaxis: {
                    range: [0.0,0.3],
                    title: "Effect size",
                },
                yaxis: {
                    showline: false,
                    showgrid: false,
                    showticklabels: false,
                    zeroline: false,
                },
                margin: {
                    l: 20,
                    r: 20,
                    t: 110,
                    b: 50,
                },
            },
            {staticPlot:true});
        },
    },

    watch: {
        phenotype_results : function() {
            this.redraw_charts = true;
        },
    },
});

