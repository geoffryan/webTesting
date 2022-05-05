
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
        this.nu_lc = nu_lc;
        
        this.nu_sp_min = nu_sp_min;
        this.nu_sp_max = nu_sp_max;
        this.nu_sp = geomspace(nu_sp_min, nu_sp_max, 300);
        this.t_sp = t_sp;

        this.F_min = F_min;
        this.F_max = F_max;

        this.traces = []

        this.get_elements();
    }

    get_elements() {
        this.plotDiv = document.getElementById("plot");
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
    }

    initialize_plot() {

        this.traces = [];

        let N_lc = this.nu_lc.length;
        let N_sp = this.t_sp.length;

        for ( let i = 0; i < N_lc; i++)
        {
            let Fnu = lightcurve(this.t_lc, this.nu_lc[i], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
            let name = "ν = " + this.nu_lc[i].toExponential(1) + " Hz";
            this.traces.push({x: this.t_lc, y: Fnu,
                              xaxis: 'x', yaxis: 'y',
                              name: name});
        }
        for ( let i = 0; i < N_sp; i++)
        {
            let Fnu = spectrum(this.nu_sp, this.t_sp[i], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
            let name = "t = " + this.t_sp[i].toExponential(1) + " s";
            this.traces.push({x: this.nu_sp, y: Fnu,
                              xaxis: 'x2', yaxis: 'y2',
                              name: name});
        }
    
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

    recalc_traces() {
        let N_lc = this.nu_lc.length;
        let N_sp = this.t_sp.length;

        for ( let i = 0; i < N_lc; i++)
        {
            this.traces[i].y = lightcurve(this.traces[i].x, this.nu_lc[i],
                                this.t0, this.num0, this.nuc0, this.Fp0,
                                this.p);
        }
        for ( let i = 0; i < N_sp; i++)
        {
            this.traces[N_lc+i].y = spectrum(this.traces[i].x, this.t_sp[i],
                                this.t0, this.num0, this.nuc0, this.Fp0,
                                this.p);
        }
    }

    render() {

        console.log("render");

        this.recalc_traces();

        this.update_inputs();

        Plotly.react(this.plotDiv, this.traces, this.layout);
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

function flux(t, nu, t0, nu_m0, nu_c0, Fp, p) {

    var nu_m = nu_m0 * Math.pow(t/t0, -1.5);
    var nu_c = nu_c0 * Math.pow(t/t0, -0.5);
    if (nu_m < nu_c) {
        if (nu < nu_m) {
            return Fp * Math.pow(nu/nu_m, 1.0/3.0);
        }
        else if (nu < nu_c) {
            return Fp * Math.pow(nu/nu_m, 0.5*(1-p));
        }
        else {
            return (Fp * Math.pow(nu_c/nu_m, 0.5*(1-p))
                    * Math.pow(nu/nu_c, -0.5*p));
        }
    }
    else {
        if (nu < nu_c) {
            return Fp * Math.pow(nu/nu_c, 1.0/3.0);
        }
        else if (nu < nu_m) {
            return Fp * Math.pow(nu/nu_c, -0.5);
        }
        else {
            return (Fp * Math.pow(nu_m/nu_c, -0.5)
                    * Math.pow(nu/nu_m, -0.5*p));
        }
    }
}

function lightcurve(t, nu_lc, t0, nu_m0, nu_c0, Fp, p) {
    return t.map(ti => flux(ti, nu_lc, t0, nu_m0, nu_c0, Fp, p));
}

function spectrum(nu, t_spec, t0, nu_m0, nu_c0, Fp, p) {
    return nu.map(nui => flux(t_spec, nui, t0, nu_m0, nu_c0, Fp, p));
}


const inputElement = document.getElementById('input');

inputElement.addEventListener("change", handleFiles, false);

async function handleFiles() {
    const fileList = this.files;
    console.log(fileList);
    const text = await fileList[0].text();
    console.log(text);
}




const t0 = 3600.0;
const Fp0 = 1.0;
const num0 = 1.0e17;
const nuc0 = 1.0e16;
const p = 2.5;

const nu_lc = [1.0e10, 1.0e14, 1.0e18];
const t_sp = [3.6e3, 3.6e5];

const tMin = 1e1;
const tMax = 1e8;
const nuMin = 1e6;
const nuMax = 1e20;
const Fmin = 1e-7;
const Fmax = 1e1;

let state = new State(t0, Fp0, num0, nuc0, p, tMin, tMax, nu_lc,
                      nuMin, nuMax, t_sp, Fmin, Fmax);
state.initialize_plot();
state.render();

let t0_slider = document.getElementById("t0_slider");
let t0_text = document.getElementById("t0_text");
let Fp0_slider = document.getElementById("Fp0_slider");
let Fp0_text = document.getElementById("Fp0_text");
let num0_slider = document.getElementById("num0_slider");
let num0_text = document.getElementById("num0_text");
let nuc0_slider = document.getElementById("nuc0_slider");
let nuc0_text = document.getElementById("nuc0_text");
let p_slider = document.getElementById("p_slider");
let p_text = document.getElementById("p_text");

t0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.t0 = val;
    state.render();
};

t0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.t0 = val;
        state.render();
    }
};

Fp0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.Fp0 = val;
    state.render();
};

Fp0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.Fp0 = val;
        state.render();
    }
};

num0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.num0 = val;
    state.render();
};

num0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.num0 = val;
        state.render();
    }
};

nuc0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.nuc0 = val;
    state.render();
};

nuc0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.nuc0 = val;
        state.render();
    }
};

p_slider.oninput = function() {
    let val = this.valueAsNumber;
    state.p = val;
    state.render();
};

p_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.p = val;
        state.render();
    }
};

