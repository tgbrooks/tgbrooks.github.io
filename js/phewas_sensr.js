const app = new Vue({
    el: "#app",
    data: {
        phenotype: "Diabetes mellitus",
        phecodes: [],
        three_components_results: null,
        predictive_tests: null,
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

    methods: {
        fmt: function(num) {
            // Format numbers for easy visibility
            return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
        },
        fmt_p: function(num) {
            // Format p-value to just 2 sig-figs
            if (num > 0.01) {
                return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
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
    },
});

