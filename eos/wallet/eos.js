const axios = require("axios");
const Eos = require("eosjs");
const BigNumber = require("bignumber.js");
const sprintf = require("sprintf-js");
const wallet_conf = require("../../configs/wallet_config.json");
const { EOSTXSign } = require("../dllimport/EOSTXSign");

const {
    DLLRET,
    DLLPSTEP,
    DLLPSTATUS,
    DLLCOINTYPE,
    DLLCONST
} = require("../dllimport/dllconst");
const ffi = require("ffi");
const ref = require("ref");
const { DLLUTIL } = require("../dllimport/dllutility");
const {
    CallbackParam,
    CallbackDataCOSUpdate
} = require("../dllimport/dllstruct");

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
            /*
            const nAddressDataLen = ref
                .alloc(
                    ref.refType("size_t"),
                    cbparam.data.buffer.slice(
                        ref.types.uchar.size,
                        ref.types.uchar.size + ref.types.size_t.size
                    )
                )
                .deref()
                .deref();
            */
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

////////////////////////

const { Fcbuffer, format } = Eos.modules;

const post = async (url, data, testNet) => {
    const header = testNet
        ? wallet_conf.eos.testnet.server
        : wallet_conf.eos.formalnet.server;
    return (await axios.post(header + url, data)).data;
};

const name_str_pad = (num, n) => {
    let len = num.toString().length;

    while (len < n) {
        num = "0" + num;
        len++;
    }
    return num;
};

const name_str_reverse = str => {
    let ret = "";

    for (let i = str.length - 1; i >= 1; i -= 2) {
        ret += str[i - 1];
        ret += str[i];
    }

    return ret;
};

const name_to_storage = (str, littlendian = true) => {
    let ret = 0;
    let padstr = name_str_pad(str, 16);
    if (littlendian == true) {
        let revstr = name_str_reverse(padstr);
        ret = new BigNumber(revstr, 16).toString(10);
    } else {
        ret = new BigNumber(padstr, 16).toString(10);
    }

    return ret;
};

const timestamp_delay = (timestamp, secs) => {
    const date = new Date(timestamp);
    const date2 = date.getTime() + secs * 1000;
    const time = new Date(date2);
    return sprintf.sprintf(
        "%04d-%02d-%02dT%02d:%02d:%02d",
        time.getFullYear(),
        time.getMonth() + 1,
        time.getDate(),
        time.getHours(),
        time.getMinutes(),
        time.getSeconds()
    );
};

const signTx = async actions => {
    let trans = {
        expiration: "",
        ref_block_num: 0,
        ref_block_prefix: 0,
        max_net_usage_words: 0,
        max_cpu_usage_ms: 0,
        delay_sec: 0,
        context_free_actions: [],
        actions: [],
        transaction_extensions: [],
        signatures: [],
        context_free_data: []
    };

    let ret_data = null;

    try {
        ret_data = await post("/v1/chain/get_info", null, true);
        //console.log(ret_data);
        trans.expiration = timestamp_delay(ret_data.head_block_time, 60);
        let chain_id = ret_data.chain_id;

        ret_data = await post(
            "/v1/chain/get_block",
            { block_num_or_id: ret_data.last_irreversible_block_num },
            true
        );
        //console.log(ret_data);
        trans.ref_block_num = ret_data.block_num % 65536;
        trans.ref_block_prefix = ret_data.ref_block_prefix;

        for (let action of actions) {
            let { account, name, authorization, data } = action;

            let act_inner = {
                account: name_to_storage(format.encodeNameHex(account)),
                name: name_to_storage(format.encodeNameHex(name)),
                authorization: [],
                data: ""
            };

            for (let auth of authorization) {
                let { actor, permission } = auth;
                let auth_inner = {
                    actor: name_to_storage(format.encodeNameHex(actor)),
                    permission: name_to_storage(
                        format.encodeNameHex(permission)
                    )
                };

                act_inner.authorization.push(auth_inner);
            }

            ret_data = await post(
                "/v1/chain/abi_json_to_bin",
                {
                    code: account,
                    action: name,
                    args: Object.values(data)
                },
                true
            );
            //console.log(ret_data);
            act_inner.data = ret_data.binargs;

            trans.actions.push(act_inner);
        }

        //console.log(JSON.stringify(trans));

        let definitions = {
            account_name: "uint64",
            action: {
                fields: {
                    account: "account_name",
                    name: "account_name",
                    authorization: "auth[]",
                    data: "bytes"
                }
            },
            auth: {
                fields: {
                    actor: "account_name",
                    permission: "account_name"
                }
            },
            trans_extention: {
                fields: {
                    ext_type: "uint16",
                    ext_value: "uint8[]"
                }
            },
            trans_def: {
                fields: {
                    expiration: "time",
                    ref_block_num: "uint16",
                    ref_block_prefix: "uint32",
                    max_net_usage_words: "varuint32",
                    max_cpu_usage_ms: "uint8",
                    delay_sec: "varuint32",
                    context_free_actions: "action[]",
                    actions: "action[]",
                    transaction_extensions: "trans_extention[]"
                }
            }
        };

        let fcbuffer = Fcbuffer(definitions, { defaults: true });
        let { trans_def } = fcbuffer.structs;
        let txData = Fcbuffer.toBuffer(trans_def, trans);

        //padding with chainid + txData + context_free_data_hash(32 bytes)
        let cfData = new Buffer(32);
        cfData.fill(0);
        let txChainID = new Buffer(chain_id, "hex");
        let txDataPad = new Buffer(txData.length + txChainID.length + 32);
        txChainID.copy(txDataPad, 0);
        txData.copy(txDataPad, txChainID.length);
        cfData.copy(txDataPad, txChainID.length + txData.length);
        
        console.log(txData.toString("hex"));
        console.log(txDataPad.toString("hex"));

        let txSig = await EOSTXSign(
            null,
            callbackFunc,
            callbackParam,
            [...wallet_conf.eos.testnet.derivePathPrefix, 0],
            txDataPad
        );
        if (txSig.result != DLLRET.PAEW_RET_SUCCESS) {
            return { result: txSig.result, payload: null };
        }
        console.log(txSig);

        console.log(
            JSON.stringify({
                signatures: [txSig.payload],
                compression: "none",
                packed_context_free_data: "",
                packed_trx: txData.toString("hex")
            })
        );

        ret_data = await post(
            "/v1/chain/push_transaction",
            {
                signatures: [txSig.payload],
                compression: "none",
                packed_context_free_data: "",
                packed_trx: txData.toString("hex")
            },
            true
        );
    } catch (err) {
        if (err.result != undefined) {
            console.log(sprintf.sprintf("0x%x", err.result >>> 0));
            return {
                result: err.result,
                payload: sprintf.sprintf("0x%x", err.result >>> 0)
            };
        } else {
            console.log(JSON.stringify(err.response.data));
            return {
                result: err.response.status,
                payload: JSON.stringify(err.response.data)
            };
        }
    }

    console.log(JSON.stringify(ret_data));
    console.log("transaction success");

    return { result: 0, payload: null };
};

module.exports = { signTx };
