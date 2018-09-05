const ref = require("ref");
const { DLLAPI } = require("./dllfunction");
const { DLLRET, DLLDEVINFO, DLLCONST, DLLCOINTYPE, DLLDEVTYPE } = require("./dllconst");
const { PAEW_DevInfo } = require("./dllstruct");
const { DLLUTIL } = require("./dllutility");

const { DLLTYPE } = require("./dllstruct");
const { uint32Array } = DLLTYPE;

const voidPP = ref.refType(ref.refType(ref.types.void));

let {
    PAEW_InitContext,
    PAEW_FreeContext,
    PAEW_DeriveTradeAddress,
    PAEW_GetTradeAddress
} = DLLAPI;

const GetAddress = async (
    derivePath
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
		res = await new Promise((resolve, reject) => {
			PAEW_InitContext.async(
				ppPAEWContext,
				pnDevCount,
				0,
				0,
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
            pbTradeAddress,
            pnTradeAddressLen.deref() - 1
        )
    };
};

module.exports = { GetAddress };
