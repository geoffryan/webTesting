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
                                                'number', []);
        this.c_getGitVersion = Module.cwrap('getGitVersion',
                                                'number', []);
        this.c_getJetTypeCode = Module.cwrap('getJetTypeCode',
                                                'number', ['number']);
        this.c_getEnvTypeCode = Module.cwrap('getEnvTypeCode',
                                                'number', ['number']);
        this.c_getGammaTypeCode = Module.cwrap('getGammaTypeCode',
                                                'number', ['number']);
    }

    getVersion() {

        let ver_buf = this.c_getVersion();
        let ver = UTF8ToString(ver_buf);
        Module._free(ver_buf);

        return ver;
    }

    getGitVersion() {

        let ver_buf = this.c_getGitVersion();
        let ver = UTF8ToString(ver_buf);
        Module._free(ver_buf);

        return ver;
    }

    getJetTypeCode(jetTypeName) {
        let bufSize = 4*jetTypeName.length + 1;
        let c_jetTypeName = Module._malloc(bufSize);
        stringToUTF8(jetTypeName, c_jetTypeName, bufSize);
        
        let jetType = this.c_getJetTypeCode(c_jetTypeName);

        Module._free(c_jetTypeName);

        return jetType;
    }

    getEnvTypeCode(envTypeName) {
        let bufSize = 4*envTypeName.length + 1;
        let c_envTypeName = Module._malloc(bufSize);
        stringToUTF8(envTypeName, c_envTypeName, bufSize);
        
        let envType = this.c_getEnvTypeCode(c_envTypeName);

        Module._free(c_envTypeName);

        return envType;
    }

    getGammaTypeCode(gammaTypeName) {
        let bufSize = 4*gammaTypeName.length + 1;
        let c_gammaTypeName = Module._malloc(bufSize);
        stringToUTF8(gammaTypeName, c_gammaTypeName, bufSize);
        
        let gammaType = this.c_getGammaTypeCode(c_gammaTypeName);

        Module._free(c_gammaTypeName);

        return gammaType;
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

        console.log("in GRB fluxDensity");
        console.log(Z);

        let err = this.c_calcFluxDensity(c_t, c_nu, c_Fnu, N,
                                Z.dL, Z.thetaV, Z.E0, Z.thetaC, Z.thetaW, Z.b,
                                Z.n0, Z.p, Z.epse, Z.epsB, Z.xiN, -1,
                                Z.envType, 1.0e18, 0, 0, 
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


