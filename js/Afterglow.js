
class State {
    constructor(t0, Fp0, num0, nuc0, p, nu_lc, t_sp) {
        this.t0 = t0;
        this.Fp0 = Fp0;
        this.num0 = num0;
        this.nuc0 = nuc0;
        this.p = p;
        this.nu_lc = nu_lc;
        this.t_sp = t_sp;

        this.initialize();
    }

    initialize() {
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

    render() {

        let tr_lc1 = this.plotDiv.data[0]
        let tr_lc2 = this.plotDiv.data[1]
        let tr_lc3 = this.plotDiv.data[2]
        let tr_sp1 = this.plotDiv.data[3]
        let tr_sp2 = this.plotDiv.data[4]

        tr_lc1.y = lightcurve(tr_lc1.x, this.nu_lc[0], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
        tr_lc2.y = lightcurve(tr_lc2.x, this.nu_lc[1], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
        tr_lc3.y = lightcurve(tr_lc3.x, this.nu_lc[2], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
        tr_sp1.y = spectrum(tr_sp1.x, this.t_sp[0], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);
        tr_sp2.y = spectrum(tr_sp2.x, this.t_sp[1], this.t0, this.num0,
                                this.nuc0, this.Fp0, this.p);

        console.log(this);
        console.log(Math.min(...tr_lc1.y));
        console.log(Math.max(...tr_lc1.y));

        this.update_inputs();

        Plotly.react(this.plotDiv, [tr_lc1, tr_lc2, tr_lc3, tr_sp1, tr_sp2],
                     plotDiv.layout);
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

let state = new State(3600.0, 1.0, 1.0e14, 1.0e17, 2.5,
                      [1.0e10, 1.0e14, 1.0e18], [3600, 3.6e6]);

const inputElement = document.getElementById('input');

inputElement.addEventListener("change", handleFiles, false);

async function handleFiles() {
    const fileList = this.files;
    console.log(fileList);
    const text = await fileList[0].text();
    console.log(text);
}




var t0 = 3600.0;
var nu_m0 = 1.0e17;
var nu_c0 = 1.0e16;
var p = 2.5;
var Fp0 = 1.0;

var nu1 = 1.0e10;
var nu2 = 1.0e14;
var nu3 = 1.0e18;
var t1 = 3600.0;
var t2 = 1e6;

var tMin = 1e1;
var tMax = 1e8;
var nuMin = 1e6;
var nuMax = 1e20;

var Nt = 300;
var Nnu = 300;

var t = geomspace(tMin, tMax, Nt);
var nu = geomspace(nuMin, nuMax, Nnu);

var F_lc_1 = lightcurve(t, nu1, t0, nu_m0, nu_c0, Fp0, p);
var F_lc_2 = lightcurve(t, nu2, t0, nu_m0, nu_c0, Fp0, p);
var F_lc_3 = lightcurve(t, nu3, t0, nu_m0, nu_c0, Fp0, p);

var F_sp_1 = spectrum(nu, t1, t0, nu_m0, nu_c0, Fp0, p);
var F_sp_2 = spectrum(nu, t2, t0, nu_m0, nu_c0, Fp0, p);

var tr_lc1 = {x: t, y: F_lc_1, xaxis: 'x', yaxis: 'y'};
var tr_lc2 = {x: t, y: F_lc_2, xaxis: 'x', yaxis: 'y'};
var tr_lc3 = {x: t, y: F_lc_3, xaxis: 'x', yaxis: 'y'};

var tr_sp1 = {x: nu, y: F_sp_1, xaxis: 'x2', yaxis: 'y2'};
var tr_sp2 = {x: nu, y: F_sp_2, xaxis: 'x2', yaxis: 'y2'};

var minLogT = Math.log10(tMin);
var maxLogT = Math.log10(tMax);
var minLogNu = Math.log10(nuMin);
var maxLogNu = Math.log10(nuMax);

var minLogF = Math.log10(1e-7 * Fp0);
var maxLogF = Math.log10(1e1 * Fp0);


var layout = {
    grid: {rows: 1, columns: 2, pattern: 'independent'},
    xaxis: {type: 'log', range: [minLogT, maxLogT]},
    yaxis: {type: 'log', range: [minLogF, maxLogF]},
    xaxis2: {type: 'log', range: [minLogNu, maxLogNu]},
    yaxis2: {type: 'log', range: [minLogF, maxLogF]},
};


let plotDiv = document.getElementById("plot");
Plotly.newPlot(plotDiv,
    [tr_lc1, tr_lc2, tr_lc3, tr_sp1, tr_sp2], layout);

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
    state.render(plotDiv);
};

t0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.t0 = val;
        state.render(plotDiv);
    }
};

Fp0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.Fp0 = val;
    state.render(plotDiv);
};

Fp0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.Fp0 = val;
        state.render(plotDiv);
    }
};

num0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.num0 = val;
    state.render(plotDiv);
};

num0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.num0 = val;
        state.render(plotDiv);
    }
};

nuc0_slider.oninput = function() {
    let val = Math.pow(10.0, this.valueAsNumber);
    state.nuc0 = val;
    state.render(plotDiv);
};

nuc0_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.nuc0 = val;
        state.render(plotDiv);
    }
};

p_slider.oninput = function() {
    let val = this.valueAsNumber;
    state.p = val;
    state.render(plotDiv);
};

p_text.onchange = function() {
    let val = Number(this.value);
    if (!isNaN(val)) {
        state.p = val;
        state.render(plotDiv);
    }
};

