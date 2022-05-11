#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <emscripten.h>
#include "offaxis_struct.h"
#include "shockEvolution.h"

char * getVersion()
{
    int N = strlen(AFTERGLOWPY_VERSION);
    char *str = (char *) malloc((N+1) * sizeof(char));
    strncpy(str, AFTERGLOWPY_VERSION, N);
    str[N] = '\0';
    return str;
}

char * getGitVersion()
{
    int N = strlen(GIT_VERSION);
    char *str = (char *) malloc((N+1) * sizeof(char));
    strncpy(str, GIT_VERSION, N);
    str[N] = '\0';
    return str;
}

int getJetTypeCode(char *jetTypeStr)
{
    printf("%s\n", jetTypeStr);
    if(strcmp(jetTypeStr, "Cone") == 0)
        return _cone;
    else if(strcmp(jetTypeStr, "Top Hat") == 0)
        return _tophat;
    else if(strcmp(jetTypeStr, "Gaussian") == 0)
        return _Gaussian;
    else if(strcmp(jetTypeStr, "Power Law Core") == 0)
        return _powerlaw_core;
    else if(strcmp(jetTypeStr, "Gaussian Core") == 0)
        return _Gaussian_core;
    else if(strcmp(jetTypeStr, "Power Law") == 0)
        return _powerlaw;

    return -3;
}

int getEnvTypeCode(const char envTypeStr[])
{
    if(strcmp(envTypeStr, "ISM") == 0)
        return ENV_ISM;
    else if(strcmp(envTypeStr, "Wind") == 0)
        return ENV_WIND;
    else if(strcmp(envTypeStr, "Power Law") == 0)
        return ENV_PL;

    return -1;
}

int getGammaTypeCode(const char gammaTypeStr[])
{
    if(strcmp(gammaTypeStr, "Inf") == 0)
        return GAMMA_INF;
    else if(strcmp(gammaTypeStr, "Flat") == 0)
        return GAMMA_FLAT;
    else if(strcmp(gammaTypeStr, "Even Mass") == 0)
        return GAMMA_EVENMASS;

    return -1;
}

int calcFluxDensity(double *t, double *nu, double *Fnu, int N,
                    double d_L, double thetaV, double E0,
                    double thetaC, double thetaW, double b,
                    double n0, double p, double epse, double epsB,
                    double xiN, double g0,
                    int envType, double R0_env, double k_env, double rho1_env,
                    double E0_glob, double thetaC_glob,
                    int tRes, int latRes, int int_type,
                    double rtol_struct, double rtol_phi, double rtol_theta,
                    int nmax_phi, int nmax_theta,
                    int jet_type, int spec_type,
                    int spread, int counterjet, int gamma_type)
{

    double ta = t[0];
    double tb = t[0];

    int i;
    for(i=1; i<N; i++)
    {
        if(t[i] < ta)
            ta = t[i];
        if(t[i] > tb)
            tb = t[i];
    }

    /*
    printf("%d %d\n", jet_type, spec_type);
    printf("%.3f %.3e %.3f %.3e\n", thetaV, E0, thetaC, d_L);
    printf("%.3e %.3f %.3e %.3e %.3e\n", n0, p, epse, epsB, xiN);
    printf("%d %d %d\n", tRes, latRes, int_type);
    printf("%.3e %.3e %.3e\n", rtol_struct, rtol_phi, rtol_theta);
    printf("%d %d\n", nmax_phi, nmax_theta);
    printf("%d %d %d\n", spread, counterjet, gamma_type);
    */

    struct fluxParams fp;
    setup_fluxParams(&fp, d_L, thetaV, E0, thetaC, thetaW, b,
                        0, 0, 0, 0,
                        n0, p, epse, epsB, xiN, g0, 
                        envType, R0_env, k_env, rho1_env,
                        E0_glob, thetaC_glob, ta, tb,
                        tRes, latRes, int_type,
                        rtol_struct, rtol_phi, rtol_theta,
                        nmax_phi, nmax_theta,
                        spec_type, NULL, 0,
                        spread, counterjet, gamma_type);

    calc_flux_density(jet_type, spec_type, t, nu, Fnu, NULL, N, &fp);

    if(fp.error)
    {
        printf("ERROR\n");
        printf("%s\n", fp.error_msg);
        free_fluxParams(&fp);
        return 1;
    }

    free_fluxParams(&fp);

    return 0;
}

int main(int argc, char *argv[])
{
    EM_ASM(afterglowpyReady());
}
