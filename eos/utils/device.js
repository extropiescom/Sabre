const ref = require("ref");
const ffi = require("ffi");
const sprintf = require("sprintf-js");
const RETVALUE = require("../../configs/ret_values");

const { DLLAPI } = require("../dllimport/dllfunction");
const {
    DLLRET,
    DLLDEVINFO,
    DLLPSTEP,
    DLLPSTATUS,
    DLLCOINTYPE,
    DLLCONST,
    DLLDEVTYPE
} = require("../dllimport/dllconst");
const {
    CallbackParam,
    CallbackDataCOSUpdate,
    PAEW_DevInfo,
    DLLTYPE
} = require("../dllimport/dllstruct");
const { uint32Array } = DLLTYPE;
const { DLLUTIL } = require("../dllimport/dllutility");

const { voidPP } = DLLTYPE;
const {
    PAEW_InitContextWithDevName,
    PAEW_FreeContext,
    PAEW_GetDevInfo,
    PAEW_EOS_TXSign,
    PAEW_DeriveTradeAddress,
    PAEW_GetTradeAddress
} = DLLAPI;

let callbackParam = new CallbackParam();

const callbackFunc = ffi.Callback("int", [CallbackParam], function(cbparam) {
    let inspectorParam = {
        pstep: DLLPSTEP.pstep_invalid,
        pstatus: DLLPSTATUS.pstatus_invalid,
        ret_value: DLLRET.PAEW_RET_UNKNOWN_FAIL,
        dev_index: DLLCONST.INVALID_DEV_INDEX,
        dev_count: 0,
        coin_type: DLLCOINTYPE.PAEW_COIN_TYPE_INVALID,
        data: null
    };

    let strOutput = "";

    inspectorParam.pstep = cbparam.pstep;
    inspectorParam.pstatus = cbparam.pstatus;
    inspectorParam.ret_value = cbparam.ret_value;
    inspectorParam.dev_index = cbparam.dev_index;
    inspectorParam.dev_count = cbparam.dev_count;

    if (cbparam.pstep != DLLPSTEP.pstep_comm_enum_dev) {
        strOutput += sprintf.sprintf(
            "dev(%d/%d):\t",
            cbparam.dev_index + 1,
            cbparam.dev_count
        );
    } else {
        strOutput += "dev(?/?):\t";
    }

    strOutput += DLLUTIL.ewallet_step2string(cbparam.pstep) + "\t";
    strOutput += DLLUTIL.ewallet_status2string(cbparam.pstatus) + "\t";

    if (cbparam.pstatus == DLLPSTATUS.pstatus_finish) {
        strOutput += sprintf.sprintf(
            "ret_value=0x%x\t",
            cbparam.ret_value >>> 0
        );
        if (
            cbparam.pstep == DLLPSTEP.pstep_comm_addr_get &&
            cbparam.ret_value == DLLRET.PAEW_RET_SUCCESS
        ) {
            const nCoinType = ref
                .alloc(
                    ref.refType("uchar"),
                    cbparam.data.buffer.slice(0, ref.types.uchar.size)
                )
                .deref()
                .deref();

            const pbAddressData = cbparam.data.buffer.slice(
                ref.types.uchar.size + ref.types.size_t.size,
                cbparam.data.buffer.length
            );

            inspectorParam.coin_type = nCoinType;
            inspectorParam.data = ref
                .alloc(ref.types.CString, pbAddressData)
                .deref();

            strOutput += sprintf.sprintf(
                "coin type: %s\t",
                DLLUTIL.ewallet_cointype2string(nCoinType)
            );
            strOutput += sprintf.sprintf(
                "address: %s\t",
                ref.alloc(ref.types.CString, pbAddressData).deref()
            );
        } else if (
            cbparam.pstep == DLLPSTEP.pstep_comm_updatecos &&
            cbparam.ret_value == DLLRET.PAEW_RET_SUCCESS
        ) {
            const cosUpdate = ref
                .alloc(CallbackDataCOSUpdate, cbparam.data.buffer)
                .deref();

            inspectorParam.data = cosUpdate.nProgress;

            strOutput += sprintf.sprintf(
                "cos update progress: %%%d\t",
                cosUpdate.nProgress
            );
        }
    }

    console.log(strOutput);
});

let deviceList = [];

const devInitContext = async szDevName => {
    let ppPAEWContext = ref.alloc(voidPP);
    let res = 0;

    try {
        if (!szDevName) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_InitContextWithDevName.async(
                ppPAEWContext,
                szDevName,
                DLLDEVTYPE.PAEW_DEV_TYPE_HID,
                callbackFunc,
                callbackParam.ref(),
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
                    }
                }
            );
        });

        /*
        res = await new Promise((resolve, reject) => {
            PAEW_FreeContext.async(devContext, (err, res) => {
                if (res == DLLRET.PAEW_RET_SUCCESS) {
                    resolve(RETVALUE.convertFromDevRet(res));
                } else {
                    reject(RETVALUE.convertFromDevRet(res));
                }
            });
        });
        */
    } catch (err) {
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    const devIndex = szDevName;
    deviceList = deviceList.filter(elem => {
        return elem.devIndex != devIndex;
    });
    const devElement = {
        devIndex,
        devContext: ppPAEWContext.deref(),
        devBusy: false
    };
    deviceList.push(devElement);

    return { res, payload: devIndex };
};

const devFreeContext = async devIndex => {
    let res = 0;

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_FreeContext.async(devContext, (err, res) => {
                if (res == DLLRET.PAEW_RET_SUCCESS) {
                    resolve(RETVALUE.convertFromDevRet(res));
                } else {
                    reject(RETVALUE.convertFromDevRet(res));
                }
            });
        });
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    deviceList = deviceList.filter(elem => {
        return elem.devIndex != devIndex;
    });

    return { res, payload: null };
};

const devGetDevInfo = async devIndex => {
    let res = 0;
    var pDevInfo = ref.alloc(PAEW_DevInfo);
    var devInfo = pDevInfo.deref();

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        devNode.devBusy = true;

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_GetDevInfo.async(
                devContext,
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
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
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
                    devContext,
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
                            resolve(RETVALUE.convertFromDevRet(res));
                        } else {
                            reject(RETVALUE.convertFromDevRet(res));
                        }
                    }
                );
            });
        }
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    devNode.devBusy = false;
    return { res, payload: devInfo };
};

const devGetPINStatus = async devIndex => {
    let res = 0;
    var pDevInfo = ref.alloc(PAEW_DevInfo);
    var devInfo = pDevInfo.deref();

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        devNode.devBusy = true;

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_GetDevInfo.async(
                devContext,
                0,
                DLLDEVINFO.TYPE.PAEW_DEV_INFOTYPE_PIN_STATE,
                pDevInfo,
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
                    }
                }
            );
        });
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    devNode.devBusy = false;
    return { res, payload: devInfo.ucPINState };
};

const devDeriveTradeAddress = async (devIndex, coinType, derivePath) => {
    let res = 0;

    let puiDerivePath = uint32Array(derivePath);
    let nDerivePathLen = derivePath.length;

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        devNode.devBusy = true;

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_DeriveTradeAddress.async(
                devContext,
                0,
                coinType,
                puiDerivePath,
                nDerivePathLen,
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
                    }
                }
            );
        });
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    devNode.devBusy = false;
    return {
        res,
        payload: null
    };
};

const devGetTradeAddress = async (devIndex, coinType) => {
    let res = 0;

    let pbTradeAddress = new Buffer(DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN);
    let pnTradeAddressLen = ref.alloc(
        "size_t",
        DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN
    );

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        devNode.devBusy = true;

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_GetTradeAddress.async(
                devContext,
                0,
                coinType,
                pbTradeAddress,
                pnTradeAddressLen,
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
                    }
                }
            );
        });
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    devNode.devBusy = false;
    return {
        res,
        payload: sprintf.sprintf(
            "%s",
            ref.alloc(ref.types.CString, pbTradeAddress).deref()
        )
    };
};

const devEOS_TXSign = async (devIndex, txData) => {
    let res = 0;

    let pbCurrentTX = txData;
    let nCurrentTXLen = pbCurrentTX.length;
    let pbTXSig = new Buffer(DLLCONST.PAEW_EOS_SIG_MAX_LEN);
    let pnTXSigLen = ref.alloc("size_t", DLLCONST.PAEW_EOS_SIG_MAX_LEN);

    const devNode = deviceList.find(elem => {
        return elem.devIndex === devIndex;
    });

    try {
        if (!devNode) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }
        if (devNode.devBusy == true) {
            res = RETVALUE.ret_err_dev_busy;
            throw res;
        }

        devNode.devBusy = true;

        const { devContext } = devNode;
        if (!devContext) {
            res = RETVALUE.ret_err_argument;
            throw res;
        }

        res = await new Promise((resolve, reject) => {
            PAEW_EOS_TXSign.async(
                devContext,
                0,
                pbCurrentTX,
                nCurrentTXLen,
                pbTXSig,
                pnTXSigLen,
                (err, res) => {
                    if (res == DLLRET.PAEW_RET_SUCCESS) {
                        resolve(RETVALUE.convertFromDevRet(res));
                    } else {
                        reject(RETVALUE.convertFromDevRet(res));
                    }
                }
            );
        });
    } catch (err) {
        devNode && (devNode.devBusy = false);
        return { res: err, payload: RETVALUE.convertToMsg(err) };
    }

    devNode.devBusy = false;
    return {
        res,
        payload: DLLUTIL.ewallet_chararray_to_string(
            pbTXSig,
            pnTXSigLen.deref() - 1
        )
    };
};

module.exports = {
    devInitContext,
    devFreeContext,
    devGetDevInfo,
    devGetPINStatus,
    devDeriveTradeAddress,
    devGetTradeAddress,
    devEOS_TXSign
};
