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

var NsliderSteps = 100;
var sliderMin = 1e6;
var sliderMax = 1e20;
var sliderVals = geomspace(sliderMin, sliderMax, NsliderSteps);
var sliderSteps = [];
for (var i = 0; i < NsliderSteps; i++) {
    var val = sliderVals[i]
    sliderSteps.push({method: 'skip', label: val.toString(), value: val});
}

var layout = {
    grid: {rows: 1, columns: 2, pattern: 'independent'},
    xaxis: {type: 'log', range: [minLogT, maxLogT]},
    yaxis: {type: 'log', range: [minLogF, maxLogF]},
    xaxis2: {type: 'log', range: [minLogNu, maxLogNu]},
    yaxis2: {type: 'log', range: [minLogF, maxLogF]},
    sliders: [{
        pad: {t:30}, 
        currentvalue: {xanchor: 'right', prefix: 'nu_m: ', font: {size: 20}},
        steps: sliderSteps}]
};


var TESTER = document.getElementById("tester");
Plotly.newPlot(TESTER,
    [tr_lc1, tr_lc2, tr_lc3, tr_sp1, tr_sp2], layout);
TESTER.on('plotly_sliderchange', function(data) {
        var val = data.step.value;
        console.log("Change to " + val.toString() + "!");
        tr_lc1.y = lightcurve(tr_lc1.x, nu1,t0, val, nu_c0, Fp0, p);
        tr_lc2.y = lightcurve(tr_lc2.x, nu2,t0, val, nu_c0, Fp0, p);
        tr_lc3.y = lightcurve(tr_lc3.x, nu3,t0, val, nu_c0, Fp0, p);
        tr_sp1.y = spectrum(tr_sp1.x, t1, t0, val, nu_c0, Fp0, p);
        tr_sp2.y = spectrum(tr_sp2.x, t2, t0, val, nu_c0, Fp0, p);
        Plotly.react(TESTER, [tr_lc1, tr_lc2, tr_lc3, tr_sp1, tr_sp2], layout);}
);

