
const default_colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
                        "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];

// Useful constants in SI units.
const c = 2.99792458e8;
const h = 6.62607015e-34;
const eV = 1.602176634e-19;
const day = 86400.0;

class State {
    constructor(t0, Fp0, num0, nuc0, p, t_lc_min, t_lc_max, nu_lc,
                nu_sp_min, nu_sp_max, t_sp, F_min, F_max) {
        this.t0 = t0;
        this.Fp0 = Fp0;
        this.num0 = num0;
        this.nuc0 = nuc0;
        this.p = p;

        this.t_lc_min = t_lc_min;
        this.t_lc_max = t_lc_max;
        this.t_lc = geomspace(t_lc_min, t_lc_max, 300);

        this.nu_sp_min = nu_sp_min;
        this.nu_sp_max = nu_sp_max;
        this.nu_sp = geomspace(nu_sp_min, nu_sp_max, 300);

        this.F_min = F_min;
        this.F_max = F_max;

        this.nu_lc = [];
        this.match_factor_lc = [];
        this.color_lc = [];
        
        this.t_sp = [];
        this.match_factor_sp = [];
        this.color_sp = [];

        this.traces = [];

        this.dset = {};
        this.NDataTraces = 0;

        this.initialize_layout();
        this.get_elements();

        nu_lc.forEach(nu => this.addTraceLC(nu, "Hz"));
        t_sp.forEach(t => this.addTraceSP(t, "s"));
    }

    get_elements() {
        //this.plotLCctx = document.getElementById("plotLC").getContext('2d');
        //this.plotSPctx = document.getElementById("plotSP").getContext('2d');
        this.plotlyDiv = document.getElementById("plotlyDiv");

        this.fileDiv = document.getElementById("fileDiv");
        this.fileInput = document.getElementById("fileInput");
        this.fileStatusMsg = document.getElementById("fileStatusMsg");

        this.t0_slider = document.getElementById("t0_slider");
        this.t0_text = document.getElementById("t0_text");
        this.Fp0_slider = document.getElementById("Fp0_slider");
        this.Fp0_text = document.getElementById("Fp0_text");
        this.num0_slider = document.getElementById("num0_slider");
        this.num0_text = document.getElementById("num0_text");
        this.nuc0_slider = document.getElementById("nuc0_slider");
        this.nuc0_text = document.getElementById("nuc0_text");
        this.p_slider = document.getElementById("p_slider");
        this.p_text = document.getElementById("p_text");

        this.newLCFreqUnitForm = document.getElementById("newLCFreqUnitForm");
        this.newLCFreqText = document.getElementById("newLC_text");
        this.newLCAddButton = document.getElementById("newLC_enter");
        this.newSPTimeUnitForm = document.getElementById("newSPTimeUnitForm");
        this.newSPTimeText = document.getElementById("newSP_text");
        this.newSPAddButton = document.getElementById("newSP_enter");
    }

    slider_callback(parName) {
        return (e) => {this[parName] = e.target.valueAsNumber;
                       this.render();};
    }

    slider_log_callback(parName) {
        return (e) => {this[parName] = Math.pow(10.0, e.target.valueAsNumber);
                       this.render();};
    }

    text_callback(parName) {
        return (e) => {let val = Number(e.target.value);
                        if(!isNaN(val)) {
                            this[parName] = val;
                            this.render();
                        }};
    }

    file_callback() {
        return (e) => {
            const fileList = e.target.files;
            console.log(fileList);
            let file  = fileList[0];
            if(file) {
                const reader = new FileReader();
                reader.addEventListener("load", this.file_read_callback(),
                                        false);
                this.set_file_status("Loading file", "green");
                reader.readAsText(file);
            }
            else {
                this.set_file_status("Could not load file", "yellow");
            }

        };
    }

    file_read_callback() {
        return (e) => {
            console.log("File Read.");
            this.set_file_status("File Read", "green");
            this.addInputFile(e.target.result);
        };
    }

    button_add_callback(type, text_input, unit_input) {
        return (e) => {
            let val = Number(text_input.value);
            if(!isNaN(val)) {
                console.log("Add button clicked: " + type.toString() 
                            + " value: " + val.toString() + " unit: "
                            + unit_input.value);
                this.addTrace(type, val, unit_input.value);
                this.render();
            }
        };
    }

    register_listeners() {

        this.t0_slider.addEventListener("input",
            this.slider_log_callback('t0'), false);
        this.Fp0_slider.addEventListener("input",
            this.slider_log_callback('Fp0'), false);
        this.num0_slider.addEventListener("input",
            this.slider_log_callback('num0'), false);
        this.nuc0_slider.addEventListener("input",
            this.slider_log_callback('nuc0'), false);
        this.p_slider.addEventListener("input",
            this.slider_callback('p'), false);
        
        this.t0_text.addEventListener("change", 
            this.text_callback('t0'), false);
        this.Fp0_text.addEventListener("change", 
            this.text_callback('Fp0'), false);
        this.num0_text.addEventListener("change", 
            this.text_callback('num0'), false);
        this.nuc0_text.addEventListener("change", 
            this.text_callback('nuc0'), false);
        this.p_text.addEventListener("change", 
            this.text_callback('p'), false);

        this.fileInput.addEventListener("change", this.file_callback(), false);

        this.newLCAddButton.addEventListener("click",
            this.button_add_callback("LC", this.newLCFreqText,
                this.newLCFreqUnitForm.newLCFreqUnit),
            false);

        this.newSPAddButton.addEventListener("click",
            this.button_add_callback("SP", this.newSPTimeText,
                this.newSPTimeUnitForm.newSPTimeUnit),
            false);
    }

    set_file_status(msg, color) {
        this.fileStatusMsg.innerHTML = msg;
        this.fileDiv.style.borderColor = color;
        this.fileDiv.style.borderWidth = "thick";
        this.fileDiv.style.borderStyle = "solid";
    }

    addInputFile(fileText) {
        console.log("Adding Input File");
        console.log(fileText);
        let dset = this.parseInputFile(fileText);

        if (dset.t.length == 0) {
            this.set_file_status("Could not parse file.", "red");
            return;
        }
        else {
            this.set_file_status("File OK.  Loaded " + dset.t.length.toString()
                                  + " datapoints.", "green");
        }

        //console.log(dset);

        this.dset = dset;

        this.removeDataTraces();
        this.buildDataTraces();
        this.render();
    }

    parseInputFile(fileText) {
        this.set_file_status("Parsing File", "green");
        let t = [];
        let nu = [];
        let Fnu = [];
        let Ferr = [];
        let lines = fileText.split('\n');
        lines.forEach(line => {
            let l = line.trim();
            let words = l.split(/[\s,;]+/, 4);
            if (words.length < 4) {
                return;
            }
            let tv = Number(words[0]);
            let nuv = Number(words[1]);
            let Fnuv = Number(words[2]);
            let Ferrv = Number(words[3]);

            if(isNaN(tv) || isNaN(nuv) || isNaN(Fnuv) || isNaN(Ferrv)) {
                return;
            }
            if(tv <= 0.0 || nuv <= 0.0 || Fnuv < 0.0) {
                return;
            }
            t.push(tv);
            nu.push(nuv);
            Fnu.push(Fnuv);
            Ferr.push(Ferrv);
        });

        return {t: t, nu:nu, Fnu:Fnu, Ferr:Ferr};

    }

    removeDataTraces() {

        if(this.NDataTraces == 0)
            return;

        let dataTraceIdx = [];

        for(let i = 1; i <= this.NDataTraces; i++) {
            this.traces.pop();
            dataTraceIdx.push(-i);
        }
        
        this.NDataTraces = 0;
    }

    buildDataTraces() {
        if(Object.keys(this.dset).length < 4 || this.dset.t.length == 0) {
            this.NDataTraces = 0;
            return;
        }

        let t_lc = [];
        let Fnu_lc = [];
        let Ferr_lc = [];

        let nu_sp = [];
        let Fnu_sp = [];
        let Ferr_sp = [];

        let Nlc = this.nu_lc.length;
        let Nsp = this.t_sp.length;

        for(let i = 0; i < Nlc + 1; i++) {
            t_lc.push([]);
            Fnu_lc.push([]);
            Ferr_lc.push([]);
        }

        for(let i = 0; i < Nsp + 1; i++) {
            nu_sp.push([]);
            Fnu_sp.push([]);
            Ferr_sp.push([]);
        }

        // Split the datasets according to whether they match with
        // a model trace.
        
        // First split for the light curves
        this.dset.nu.forEach( (nu, j) => {
            for(let i = 0; i < Nlc; i++) {
                if (nu > this.nu_lc[i]/this.match_factor_lc[i] 
                    && nu < this.nu_lc[i]*this.match_factor_lc[i])
                {
                    t_lc[i].push(this.dset.t[j]);
                    Fnu_lc[i].push(this.dset.Fnu[j]);
                    Ferr_lc[i].push(this.dset.Ferr[j]);
                    return;
                }
            }
            t_lc[Nlc].push(this.dset.t[j]);
            Fnu_lc[Nlc].push(this.dset.Fnu[j]);
            Ferr_lc[Nlc].push(this.dset.Ferr[j]);
        });

        // And now for the spectra
        this.dset.t.forEach( (t, j) => {
            for(let i = 0; i < Nsp; i++) {
                if (t > this.t_sp[i]/this.match_factor_sp[i] 
                    && t < this.t_sp[i]*this.match_factor_sp[i])
                {
                    nu_sp[i].push(this.dset.nu[j]);
                    Fnu_sp[i].push(this.dset.Fnu[j]);
                    Ferr_sp[i].push(this.dset.Ferr[j]);
                    return;
                }
            }
            nu_sp[Nsp].push(this.dset.nu[j]);
            Fnu_sp[Nsp].push(this.dset.Fnu[j]);
            Ferr_sp[Nsp].push(this.dset.Ferr[j]);
        });

        let lc_traces = [];
        let sp_traces = [];

        for(let i = 0; i < Nlc + 1; i++)
        {
            let color = i < Nlc ? this.color_lc[i] : "grey";
            let alpha = i < Nlc ? 1.0 : 0.3;

            if(t_lc.length == 0) {
                continue;
            }

            let tr_lc = {x: t_lc[i], y: Fnu_lc[i],
                         error_y: {array: Ferr_lc[i],
                                    type: "data", symmetric: true,
                                    color: color, opacity: alpha},
                         type: "scatter", mode: "markers",
                         marker: {color: color, opacity: alpha},
                         xaxis: "x", yaxis: "y",
                         name: "LC - "+i.toString()};
            lc_traces.push(tr_lc);
        }

        for(let i = 0; i < Nsp + 1; i++)
        {
            let color = i < Nsp ? this.color_sp[i] : "grey";
            let alpha = i < Nsp ? 1.0 : 0.3;
            
            if(nu_sp.length == 0) {
                continue;
            }

            let tr_sp = {x: nu_sp[i], y: Fnu_sp[i],
                         error_y: {array: Ferr_sp[i],
                                    type: "data", symmetric: true,
                                    color: color, opacity: alpha},
                         type: "scatter", mode: "markers",
                         marker: {color: color, opacity: alpha},
                         xaxis: "x2", yaxis: "y2",
                         name: "SP - "+i.toString()};
            sp_traces.push(tr_sp);
        }

        // Adding the unmatched data first so is plotted under
        // the matched data.

        this.traces.push(lc_traces[Nlc]);
        this.NDataTraces++;
        for(let i = 0; i < Nlc; i++) {
            this.traces.push(lc_traces[i]);
            this.NDataTraces++;
        }

        this.traces.push(sp_traces[Nsp]);
        this.NDataTraces++;
        for(let i = 0; i < Nsp; i++) {
            this.traces.push(sp_traces[i]);
            this.NDataTraces++;
        }
    }

    addTrace(type, val, unit_str) {
        console.log("Adding a trace.");
        if(type === "LC") {
            this.addTraceLC(val, unit_str);
        }
        else if(type === "SP") {
            this.addTraceSP(val, unit_str);
        }
    }

    addTraceLC(nu_val, nu_unit) {

        let nu = 0.0;
        let name = "";
        if(nu_unit === "Hz") {
            nu = nu_val;
            name = "ν = " + nu.toExponential(1) + " Hz";
        } else if (nu_unit === "nm") {
            nu = c / (1.0e-9 * nu_val);
            name = "λ = " + nu_val.toFixed(1) + " nm";
        } else if (nu_unit === "keV") {
            nu = nu_val * 1000.0 * eV / h;
            name = "ν = " + nu_val.toFixed(1) + " keV";
        }
        else {
            console.log("Unknown frequency unit: " + nu_unit.toString());
            return;
        }

        if (nu <= 0.0) {
            console.log("Frequency not positive: " + nu_val.toString() + " "
                        + nu_unit.toString() + " = " + nu.toExponential(3)
                        + " Hz.");
            return;
        }

        console.log("Adding a Light Curve at frequency: " + nu_val.toString()
                    + " " + nu_unit.toString() + " = " + nu.toExponential(3)
                    + " Hz.");

        let Fnu = this.t_lc.map(t => this.flux(t, nu));

        let Ntraces = this.nu_lc.length + this.t_sp.length;
        let color = default_colors[Ntraces % default_colors.length];

        let trace = {x: this.t_lc, y: Fnu,
                      type: "scatter", mode: "line",
                      line: {color: color, opacity: 0.8},
                      xaxis: 'x', yaxis: 'y',
                      name: name};

        this.traces.splice(this.nu_lc.length, 0, trace);
        this.nu_lc.push(nu);
        this.color_lc.push(color);
        this.match_factor_lc.push(1.1);

        this.removeDataTraces();
        this.buildDataTraces();
    }

    addTraceSP(t_val, t_unit) {

        let t = 0.0;
        let name = "";
        if(t_unit === "s") {
            t = t_val;
            name = "t = " + t_val.toExponential(2) + " s";
        } else if (t_unit === "d") {
            t = day * t_val;
            name = "t = " + t_val.toExponential(2) + " d";
        } else {
            console.log("Unknown time unit: " + t_unit.toString());
            return;
        }

        if (t <= 0.0) {
            console.log("Time not positive: " + t_val.toString() + " "
                        + t_unit.toString() + " = " + t.toExponential(3)
                        + " s.");
            return;
        }

        console.log("Adding a Spectrum at time: " + t_val.toString()
                    + " " + t_unit.toString() + " = " + t.toExponential(3)
                    + " s.");

        let Fnu = this.nu_sp.map(nu => this.flux(t, nu));

        let Ntraces = this.nu_lc.length + this.t_sp.length;
        let color = default_colors[Ntraces % default_colors.length];

        let trace = {x: this.nu_sp, y: Fnu,
                      type: "scatter", mode: "line",
                      line: {color: color, opacity: 0.8},
                      xaxis: 'x2', yaxis: 'y2',
                      name: name};

        this.traces.splice(Ntraces, 0, trace);
        this.t_sp.push(t);
        this.color_sp.push(color);
        this.match_factor_sp.push(1.1);

        this.removeDataTraces();
        this.buildDataTraces();
    }
    

    initialize_layout() {


        let N_lc = this.nu_lc.length;
        let N_sp = this.t_sp.length;

        this.layout = {
            grid: {rows: 1, columns: 2, pattern: 'independent'},
            xaxis: {type: 'log',
                    range: [Math.log10(this.t_lc_min),
                            Math.log10(this.t_lc_max)]},
            yaxis: {type: 'log',
                    range: [Math.log10(this.F_min),
                            Math.log10(this.F_max)]},
            xaxis2: {type: 'log',
                    range: [Math.log10(this.nu_sp_min),
                            Math.log10(this.nu_sp_max)]},
            yaxis2: {type: 'log',
                    range: [Math.log10(this.F_min),
                            Math.log10(this.F_max)]},
        };
    }

    recalc_model_traces() {
        let N_lc = this.nu_lc.length;
        let N_sp = this.t_sp.length;

        for ( let i = 0; i < N_lc; i++)
        {
            this.traces[i].y = this.traces[i].x.map(t => 
                this.flux(t, this.nu_lc[i]));
            
            //this.plotLC.data.datasets[i].data.forEach( pt => {
            //    pt.y = this.flux(pt.x, this.nu_lc[i]);});
        }
        for ( let i = 0; i < N_sp; i++)
        {
            this.traces[N_lc+i].y = this.traces[N_lc+i].x.map(nu => 
                this.flux(this.t_sp[i], nu));
            //this.plotSP.data.datasets[i].data.forEach( pt => {
            //    pt.y = this.flux(this.t_sp[i], pt.x);});
        }
    }

    flux(t, nu) {
        return flux(t, nu, this.t0, this.Fp0, this.num0, this.nuc0, this.p);
    }

    render() {

        console.log("render");

        this.recalc_model_traces();

        this.update_inputs();

        Plotly.react(this.plotlyDiv, this.traces, this.layout);
        
        //this.plotLC.update();
        //this.plotSP.update();
    }

    update_inputs() {
        
        this.t0_slider.value = Math.log10(this.t0);
        let t0_str = this.t0.toExponential(2);
        this.t0_text.setRangeText(t0_str, 0, 16, "preserve");
        
        this.Fp0_slider.value = Math.log10(this.Fp0);
        let Fp0_str = this.Fp0.toExponential(2);
        this.Fp0_text.setRangeText(Fp0_str, 0, 16, "preserve");
        
        this.num0_slider.value = Math.log10(this.num0);
        let num0_str = this.num0.toExponential(2);
        this.num0_text.setRangeText(num0_str, 0, 16, "preserve");
        
        this.nuc0_slider.value = Math.log10(this.nuc0);
        let nuc0_str = this.nuc0.toExponential(2);
        this.nuc0_text.setRangeText(nuc0_str, 0, 16, "preserve");
        
        this.p_slider.value = this.p;
        let p_str = this.p.toFixed(2);
        this.p_text.setRangeText(p_str, 0, 16, "preserve");
    }
}

function linspace(a, b, N) {
    var arr = [];
    var dx = (b - a)/(N-1);
    for (var i = 0; i<N; i++) {
        arr.push(a + dx*i);
    }
    return arr;
}

function geomspace(a, b, N) {
    var arr = [];
    var la = Math.log(a);
    var lb = Math.log(b);
    var dx = (lb - la)/(N-1);
    for (var i = 0; i<N; i++) {
        arr.push(Math.exp(la + dx*i));
    }
    return arr;
}

function flux(t, nu, t0, Fp0, nu_m0, nu_c0, p) {

    let nu_m = nu_m0 * Math.pow(t/t0, -1.5);
    let nu_c = nu_c0 * Math.pow(t/t0, -0.5);
    if (nu_m < nu_c) {
        if (nu < nu_m) {
            return Fp0 * Math.pow(nu/nu_m, 1.0/3.0);
        }
        else if (nu < nu_c) {
            return Fp0 * Math.pow(nu/nu_m, 0.5*(1-p));
        }
        else {
            return (Fp0 * Math.pow(nu_c/nu_m, 0.5*(1-p))
                    * Math.pow(nu/nu_c, -0.5*p));
        }
    }
    else {
        if (nu < nu_c) {
            return Fp0 * Math.pow(nu/nu_c, 1.0/3.0);
        }
        else if (nu < nu_m) {
            return Fp0 * Math.pow(nu/nu_c, -0.5);
        }
        else {
            return (Fp0 * Math.pow(nu_m/nu_c, -0.5)
                    * Math.pow(nu/nu_m, -0.5*p));
        }
    }
}

const t0 = 3600.0;
const Fp0 = 1.0;
const num0 = 1.0e17;
const nuc0 = 1.0e16;
const p = 2.5;

const nu_lc = [];
const t_sp = [];

const tMin = 1e1;
const tMax = 1e8;
const nuMin = 1e6;
const nuMax = 1e20;
const Fmin = 1e-7;
const Fmax = 1e1;

let state = new State(t0, Fp0, num0, nuc0, p, tMin, tMax, nu_lc,
                      nuMin, nuMax, t_sp, Fmin, Fmax);
state.addTraceLC(5.0, "keV");
state.addTraceSP(1.0, "d");
state.register_listeners();
state.render();

