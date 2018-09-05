const sprintf = require("sprintf-js");
const ref = require("ref");
const { DLLAPI } = require("./dllfunction");
const { DLLUTIL } = require("./dllutility");
const { DLLRET, DLLDEVINFO, DLLDEVTYPE } = require("./dllconst");
const { PAEW_DevInfo, DLLTYPE } = require("./dllstruct");
const { voidPP } = DLLTYPE;

let { PAEW_InitContextWithDevName, PAEW_FreeContext, PAEW_GetDevInfo } = DLLAPI;

const ShowDevInfo = devInfo => {
    let strOutput = "";

    strOutput +=
        "COS Version: " +
        DLLUTIL.ewallet_print_buf(devInfo.pbCOSVersion.buffer) +
        "\n";
    strOutput += sprintf.sprintf(
        "Serial Number(String): %s\n",
        ref.alloc(ref.types.CString, devInfo.pbSerialNumber.buffer).deref()
    );
    strOutput +=
        "Serial Number(BIN): " +
        DLLUTIL.ewallet_print_buf(devInfo.pbSerialNumber.buffer) +
        "\n";
    strOutput += sprintf.sprintf(
        "Chain Type: %s\n",
        DLLUTIL.ewallet_chaintype2string(devInfo.ucChainType)
    );
    strOutput += sprintf.sprintf(
        "PIN State: %s\n",
        DLLUTIL.ewallet_pinstate2string(devInfo.ucPINState)
    );
    strOutput += sprintf.sprintf(
        "Life Cycle: %s\n",
        DLLUTIL.ewallet_lifecycle2string(devInfo.ucLifeCycle)
    );
    if (
        devInfo.ucCOSType ==
        DLLDEVINFO.COSTYPE.PAEW_DEV_INFO_COS_TYPE_DRAGONBALL
    ) {
        strOutput += sprintf.sprintf("N=%d, T=%d\n", devInfo.nN, devInfo.nT);
        strOutput +=
            "SessKey Hash: " +
            DLLUTIL.ewallet_print_buf(devInfo.pbSessKeyHash.buffer) +
            "\n";
    }
    console.log(strOutput);
};

const GetDevInfo = async (szDevName, callbackFunc, callbackParam) => {
    let ppPAEWContext = ref.alloc(voidPP);
    var pDevInfo = ref.alloc(PAEW_DevInfo);
    var devInfo = pDevInfo.deref();
    let res = 0;

    try {
        res = await new Promise((resolve, reject) => {
            PAEW_InitContextWithDevName.async(
                ppPAEWContext,
                szDevName,
                DLLDEVTYPE.PAEW_DEV_TYPE_HID,
                callbackFunc,
                callbackParam.ref(),
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(res);
                    } else {
                        reject(res);
                    }
                }
            );
        });

        res = await new Promise((resolve, reject) => {
            PAEW_GetDevInfo.async(
                ppPAEWContext.deref(),
                0,
                DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_PIN_STATE +
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_COS_TYPE +
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_CHAIN_TYPE +
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_SN +
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_COS_VERSION +
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_LIFECYCLE,
                pDevInfo,
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(res);
                    } else {
                        reject(res);
                    }
                }
            );
        });

        if (
            devInfo.ucCOSType ==
            DLLDEVINFO.COSTYPE.PAEW_DEV_INFO_COS_TYPE_DRAGONBALL
        ) {
            res = await new Promise((resolve, reject) => {
                PAEW_GetDevInfo.async(
                    ppPAEWContext.deref(),
                    0,
                    DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_PIN_STATE +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_COS_TYPE +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_CHAIN_TYPE +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_SN +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_COS_VERSION +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_LIFECYCLE +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_N_T +
                        DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_SESSKEY_HASH,
                    pDevInfo,
                    (err, res) => {
                        if (res == DLLRET.PAEW_RET_SUCCESS) {
                            resolve(res);
                        } else {
                            reject(res);
                        }
                    }
                );
            });
        }

        res = await new Promise((resolve, reject) => {
            PAEW_FreeContext.async(ppPAEWContext.deref(), (err, res) => {
                if (res == DLLRET.PAEW_RET_SUCCESS) {
                    resolve(res);
                } else {
                    reject(res);
                }
            });
        });
    } catch (err) {
        return { result: err, payload: null };
    }

    return { result: res, payload: devInfo };
};

module.exports = { GetDevInfo, ShowDevInfo };
