const app = new Vue({
    el: "#app",
    data: {
        phenotype: "Diabetes mellitus",
        phecodes: [],
        three_components_results: null,
        predictive_tests: null,
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
                    || this.predictive_tests === null) {
                return null;
            }

            let results = {
                three_components: this.three_components_results[this.phenotype],
                predictive_tests:  this.predictive_tests[this.phenotype],
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
            let plot = new Plotly.newPlot( "three_components_chart",
            [
                {
                    x: [Math.abs(three_comps.physical_eff)],
                    y: [2],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Physical Activity',
                    marker: {size: 12, color: "red"},
                },
                {
                    x: [Math.abs(three_comps.sleep_eff)],
                    y: [1],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Sleep',
                    marker: {size: 12, color: "blue"},
                },
                {
                    x: [Math.abs(three_comps.circ_eff)],
                    y: [0],
                    mode: 'markers',
                    type: 'scatter',
                    name: 'Circadian Rhythm',
                    marker: {size: 12, color: "green"},
                },

                // Error bars:
                {
                    x: [Math.abs(three_comps.physical_eff) - 1.96*three_comps.physical_se, Math.abs(three_comps.physical_eff) + 1.96*three_comps.physical_se],
                    y: [2, 2],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: "red"},
                    showlegend: false,
                },
                {
                    x: [Math.abs(three_comps.sleep_eff) - 1.96*three_comps.sleep_se, Math.abs(three_comps.sleep_eff) + 1.96*three_comps.sleep_se],
                    y: [1, 1],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: "blue"},
                    showlegend: false,
                },
                {
                    x: [Math.abs(three_comps.circ_eff) - 1.96*three_comps.circ_se, Math.abs(three_comps.circ_eff) + 1.96*three_comps.circ_se],
                    y: [0, 0],
                    mode: 'lines',
                    type: 'scatter',
                    line: {color: "green"},
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
                }
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

