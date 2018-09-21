const ref = require("ref");
var {
    DLLAPI,
    callback,
    CallbackParam,
    TYPE,
    } = require('./dllfunction');
//const { DLLAPI } = require("./dllfunction");
const { DLLRET, DLLDEVINFO, DLLCONST, DLLCOINTYPE, DLLDEVTYPE } = require("./dllconst");
const { PAEW_DevInfo } = require("./dllstruct");
const { DLLUTIL } = require("./dllutility");

const { DLLTYPE } = require("./dllstruct");
//const { uint32Array } = DLLTYPE;
let { voidPP, uint32Array, ucharArray } = TYPE;

//const voidPP = ref.refType(ref.refType(ref.types.void));



/*let {
    PAEW_InitContext,
    PAEW_FreeContext,
    PAEW_DeriveTradeAddress,
    PAEW_GetTradeAddress
} = DLLAPI;*/

const GetAddress = async (
    derivePath
) => {
    
    var ppPAEWContext = ref.alloc(voidPP);
    var pnDevCount = ref.alloc("int");
    var param = new CallbackParam();
    let pDevInfo = ref.alloc(PAEW_DevInfo);
    console.log('derivePath', derivePath);
    let puiDerivePath = uint32Array(derivePath);
    console.log('puiDerivePath', puiDerivePath.length);
    console.log(puiDerivePath);
    let nDerivePathLen = derivePath.length;

    let pbTradeAddress = new Buffer(DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN);
    let pnTradeAddressLen = ref.alloc("size_t", DLLCONST.PAEW_COIN_ADDRESS_MAX_LEN);

    let res = 0;
    
    try {
        //console.log(ppPAEWContext);
        //console.log(pnDevCount);
        //console.log(callback);
        //console.log(param);
        console.log(DLLAPI.PAEW_InitContext);

        res = await DLLAPI.PAEW_InitContext(
				ppPAEWContext,
                pnDevCount,
                callback,
                param.ref());
		
        console.log("PAEW_InitContext");
        console.log(pnDevCount);
      /*  res = await new Promise((resolve, reject) => {
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
        });*/
        console.log(puiDerivePath);
        console.log(nDerivePathLen);

        res = await DLLAPI.PAEW_DeriveTradeAddress(
            ppPAEWContext.deref(),
                0,
                DLLCOINTYPE.PAEW_COIN_TYPE_EOS,
                puiDerivePath,
                nDerivePathLen,
        );
        console.log("PAEW_DeriveTradeAddress");
        console.log(res);

       /* res = await new Promise((resolve, reject) => {
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
        });*/
        res = await DLLAPI.PAEW_GetTradeAddress(
            ppPAEWContext.deref(),
            0,
            DLLCOINTYPE.PAEW_COIN_TYPE_EOS,
            1,
            pbTradeAddress,
            pnTradeAddressLen,
        );
        console.log("PAEW_GetTradeAddress");
        console.log(pbTradeAddress);

       /* res = await new Promise((resolve, reject) => {
            PAEW_FreeContext.async(ppPAEWContext.deref(), (err, res) => {
                if (res == DLLRET.PAEW_RET_SUCCESS) {
                    resolve(res);
                } else {
                    reject(res);
                }
            });
        });*/
        res =await DLLAPI.PAEW_FreeContext(
            ppPAEWContext.deref()
        );
        console.log("PAEW_FreeContext");

    } catch (err) {
        throw { result: err, payload: null };
        console.log("result: err"+err);
    }

    return {
        result: res,
        payload: DLLUTIL.ewallet_chararray_to_string(
            pbTradeAddress,
            pnTradeAddressLen.deref() - 1
        )
    };
};

module.exports = { GetAddress };
