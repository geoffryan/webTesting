var afterglowpyOK = false;

function afterglowpyReady() {
    console.log("afterglowpy OK to go!");
    afterglowpyOK = true;
}

class AfterglowpyCaller {
    constructor() {
        let sig = [];
        for(let i = 0; i<35; i++) {
            sig.push('number');
        }

        this.c_calcFluxDensity = Module.cwrap('calcFluxDensity',
                                                'number', sig);
        this.c_getVersion = Module.cwrap('getVersion',
                                                null, ['number', 'number']);
        this.c_getGitVersion = Module.cwrap('getGitVersion',
                                                null, ['number', 'number']);
    }

    getVersion() {

        let N = 1024;
        let buf = Module._malloc(N);

        this.c_getVersion(buf, N);

        let ver_bytes = [];
        for(let i = 0; i<N; i++)
        {
            let val = Module.getValue(buf+i, 'i8');
            if(val === 0) {
                break;
            }
            ver_bytes.push(val);
        }

        Module._free(buf);

        let ver = String.fromCharCode(...ver_bytes);

        return ver;
    }

    fluxDensity(t, nu, Z) {
        let size = 8;
        let N = t.length;

        let c_t = Module._malloc(N * size);
        let c_nu = Module._malloc(N * size);
        let c_Fnu = Module._malloc(N * size);
        for(let i = 0; i<N; i++) {
            Module.setValue(c_t + i*size, t[i] / (1 + Z.z), 'double');
            Module.setValue(c_nu + i*size, nu[i] * (1 + Z.z), 'double');
        }

        let err = this.c_calcFluxDensity(c_t, c_nu, c_Fnu, N,
                                Z.dL, Z.thetaV, Z.E0, Z.thetaC, Z.thetaW, Z.b,
                                Z.n0, Z.p, Z.epse, Z.epsB, Z.xiN, -1,
                                0, 0, 0, 0, 
                                Z.E0, Z.thetaC, 
                                1000, 5, 7,
                                0.01, 0.01, 0.01, 1000, 1000,
                                Z.jetType, Z.specType,
                                7, 0, 0);

        if(err > 0) {
            console.log("There was an error!");
        }

        let Fnu = [];

        for(let i = 0; i<N; i++) {
            Fnu.push((1+Z.z) * Module.getValue(c_Fnu + i*size, 'double'));
        }

        Module._free(c_t);
        Module._free(c_nu);
        Module._free(c_Fnu);

    return Fnu
    }
}


