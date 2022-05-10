APP = afterglowpy

SRC_DIR = src
OUT_DIR = js
AFTERGLOWPY_DIR = $(HOME)/Projects/afterglowpy/afterglowpy

APP_JS = $(OUT_DIR)/$(APP).js
APP_WASM = $(OUT_DIR)/$(APP).wasm

SRC = src/afterglowpy_api.c\
	$(AFTERGLOWPY_DIR)/offaxis_struct_funcs.c\
	$(AFTERGLOWPY_DIR)/shockEvolution.c\
	$(AFTERGLOWPY_DIR)/integrate.c\
	$(AFTERGLOWPY_DIR)/interval.c\

HDR = $(AFTERGLOWPY_DIR)/offaxis_struct.h\
		$(AFTERGLOWPY_DIR)/shockEvolution.h\
		$(AFTERGLOWPY_DIR)/integrate.h\
		$(AFTERGLOWPY_DIR)/interval.h\

AFTERGLOWPY_VER := $(shell python3 -c 'import afterglowpy as grb; print(grb.__version__)')

CURRENT_DIR := $(shell pwd)

GIT_VER := $(shell cd $(AFTERGLOWPY_DIR); git describe --always --tags --dirty; cd $(CURRENT_DIR))

EM_EXPORT_FUNCS = _calcFluxDensity,_getVersion,_getGitVersion,$\
				  _malloc,_free,_main
EM_EXPORT_METHODS = cwrap,getValue,setValue
OPT = -O3

INC = -I$(AFTERGLOWPY_DIR)
DEFS = -DAFTERGLOWPY_VERSION=\"$(AFTERGLOWPY_VER)\"\
	   -DGIT_VERSION=\"$(GIT_VER)\"

FLAGS = -s WASM=1 -Wall $(OPT) -sEXPORTED_FUNCTIONS=$(EM_EXPORT_FUNCS)\
		-sEXPORTED_RUNTIME_METHODS=$(EM_EXPORT_METHODS) $(DEFS)

default: $(APP_JS)

.PHONY: clean

$(APP_JS): $(SRC) $(HDR)
	emcc -o $(APP_JS) $(FLAGS) $(INC) $(DEFS) $(SRC)

clean:
	rm -f $(APP_JS) $(APP_WASM)
