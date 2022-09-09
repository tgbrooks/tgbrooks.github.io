// Register components
Vue.component('v-select', VueSelect.VueSelect);

// Main app
const app = new Vue({
    el: "#app",
    data: {
        phenotype: "Type 2 diabetes",
        phecodes: [],
        predictive_tests: null,
        phecode_details: null,
        trace_match_counts: null,
        config: {
        },
    },

    computed: {
        phenotype_results: function() {
            if (this.phenotype === null
                    || this.predictive_tests === null
                    || this.predictive_tests_by_age === null
                    || this.predictive_tests_by_sex === null
                    || this.phecode_details === null
                    || this.trace_match_counts === null) {
                return null;
            }
            const phecode_details = this.phecode_details[this.phenotype];
            phecode_details.self_reported_condition_codes = phecode_details.self_reported_condition_codes || '';
            phecode_details.ICD10_codes = phecode_details.ICD10_codes || '';
            phecode_details.ICD9_codes = phecode_details.ICD9_codes || '';

            let results = {
                predictive_tests:  this.predictive_tests[this.phenotype],
                predictive_tests_by_sex:  this.predictive_tests_by_sex[this.phenotype],
                predictive_tests_by_age:  this.predictive_tests_by_age[this.phenotype],
                phecode: phecode_details,
                trace_match_counts: this.trace_match_counts[this.phenotype],
            };
            return results;
        },
        file_path_phenotype: function() {
            return this.phenotype.replace("/", ",");
        },
    },

    mounted: function() {
        const app = this;
        const url = new URL(document.URL);
        const url_phenotype = url.searchParams.get("phenotype", null);
        if (url_phenotype !== null) {
            app.phenotype = url_phenotype;
        }

        fetch("data/predictive_tests.cox.json")
            .then(response => response.json())
            .then(function(json){
                app.predictive_tests = json;
                app.phecodes = Object.keys(json);
                app.phecodes.sort(function (a,b) {
                    // Sort alphabetically ignoring case
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                    if (a < b) {
                        return  -1;
                    } else if (a > b) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
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
        fetch("figures/trace_match_counts.json")
            .then(response => response.json())
            .then(function(json){
                app.trace_match_counts =  json;
            });
    },

    updated: function() {
    },

    methods: {
        fmt: function(num) {
            // Format numbers for easy visibility
            if (num === null || num === undefined){ return 'N/A'; }
            return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
        },
        fmt_p: function(num) {
            // Format p-value to just 2 sig-figs
            if (num > 0.01) {
                return num.toLocaleString('en-US', {maximumSignificantDigits: 3});
            } else if (num === null || num == undefined) {
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
            return "(" + this.fmt(lower) + " \u2013 " + this.fmt(upper) + ")";
        },
    },

    watch: {
        phenotype: function(newval, oldval) {
            if (newval !== oldval) {
                let url = new URL(document.URL);
                url.searchParams.set("phenotype", newval);
                window.history.replaceState(null, document.title, url);
            }
        },
    },
});
