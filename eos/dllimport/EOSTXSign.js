const ref = require("ref");
const { DLLAPI } = require("./dllfunction");
const { DLLRET, DLLDEVINFO, DLLCONST, DLLCOINTYPE, DLLDEVTYPE } = require("./dllconst");
const { PAEW_DevInfo } = require("./dllstruct");
const { DLLUTIL } = require("./dllutility");

const { DLLTYPE } = require("./dllstruct");
const { uint32Array } = DLLTYPE;

const voidPP = ref.refType(ref.refType(ref.types.void));

let {
    PAEW_InitContextWithDevName,
    PAEW_InitContext,
    PAEW_FreeContext,
    PAEW_GetDevInfo,
    PAEW_DeriveTradeAddress,
    PAEW_GetTradeAddress,
    PAEW_EOS_TXSign
} = DLLAPI;

const EOSTXSign = async (
    szDevName,
    callbackFunc,
    callbackParam,
    derivePath,
    txData
) => {
    let ppPAEWContext = ref.alloc(voidPP);
    let pnDevCount = ref.alloc("size_t");
    let pDevInfo = ref.alloc(PAEW_DevInfo);
    let devInfo = pDevInfo.deref();

    let puiDerivePath = uint32Array(derivePath);
    let nDerivePathLen = derivePath.length;

    let pbTradeAddress = new Buffer(DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN);
    let pnTradeAddressLen = ref.alloc("size_t", DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN);

    let pbCurrentTX = txData;
    let nCurrentTXLen = pbCurrentTX.length;
    let pbTXSig = new Buffer(DLLCONST.PAEW_EOS_SIG_MAX_LEN);
    let pnTXSigLen = ref.alloc("size_t", DLLCONST.PAEW_EOS_SIG_MAX_LEN);
    let res = 0;

    try {
        if (szDevName != undefined) {
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
        } else {
            res = await new Promise((resolve, reject) => {
                PAEW_InitContext.async(
                    ppPAEWContext,
                    pnDevCount,
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
        }

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
            PAEW_DeriveTradeAddress.async(
                ppPAEWContext.deref(),
                0,
                DLLCOINTYPE.PAEW_COIN_TYPE_EOS,
                puiDerivePath,
                nDerivePathLen,
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
            PAEW_GetTradeAddress.async(
                ppPAEWContext.deref(),
                0,
                DLLCOINTYPE.PAEW_COIN_TYPE_EOS,
                pbTradeAddress,
                pnTradeAddressLen,
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
            PAEW_EOS_TXSign.async(
                ppPAEWContext.deref(),
                0,
                pbCurrentTX,
                nCurrentTXLen,
                pbTXSig,
                pnTXSigLen,
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
            PAEW_FreeContext.async(ppPAEWContext.deref(), (err, res) => {
                if (res == DLLRET.PAEW_RET_SUCCESS) {
                    resolve(res);
                } else {
                    reject(res);
                }
            });
        });
    } catch (err) {
        throw { result: err, payload: null };
    }

    return {
        result: res,
        payload: DLLUTIL.ewallet_chararray_to_string(
            pbTXSig,
            pnTXSigLen.deref() - 1
        )
    };
};

module.exports = { EOSTXSign };
