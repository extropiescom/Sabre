const Eos = require("eosjs");
const BigNumber = require("bignumber.js");
const sprintf = require("sprintf-js");
const { post } = require("../network");
const ret_values = require("../../../configs/ret_values");
const wallet_conf = require("../../../configs/wallet_config.json");

const { Fcbuffer, format } = Eos.modules;

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

const getBalance = async (contract, address, symbol, testNet) => {
    const header = testNet
        ? wallet_conf.eos.testnet.server
        : wallet_conf.eos.formalnet.server;

    const url = "/v1/chain/get_currency_balance";
    const send_data = { code: contract, account: address, symbol };

    try {
        let split_data = "0 " + symbol;
        const ret_data = await post(header + url, send_data);
        if (ret_data.res == ret_values.ret_success) {
            if (ret_data.payload[0]) {
                split_data = ret_data.payload[0]; //"2.9998 EOS"
            }
        } else {
            throw ret_data;
        }
        return { res: ret_values.ret_success, payload: split_data };
    } catch (err) {
        return { res: err.res, payload: err.payload };
    }
};

const getRawTx = async (actions, testNet) => {
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
    const header = testNet
        ? wallet_conf.eos.testnet.server
        : wallet_conf.eos.formalnet.server;

    try {
        ret_data = await post(header + "/v1/chain/get_info", null, true);
        if (ret_data.res != ret_values.ret_success) {
            throw ret_data;
        }
        trans.expiration = timestamp_delay(
            ret_data.payload.head_block_time,
            60
        );

        let chain_id = ret_data.payload.chain_id;
        ret_data = await post(
            header + "/v1/chain/get_block",
            { block_num_or_id: ret_data.payload.last_irreversible_block_num },
            true
        );
        if (ret_data.res != ret_values.ret_success) {
            throw ret_data;
        }
        trans.ref_block_num = ret_data.payload.block_num % 65536;
        trans.ref_block_prefix = ret_data.payload.ref_block_prefix;

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
                header + "/v1/chain/abi_json_to_bin",
                {
                    code: account,
                    action: name,
                    args: Object.values(data)
                },
                true
            );
            if (ret_data.res != ret_values.ret_success) {
                throw ret_data;
            }
            act_inner.data = ret_data.payload.binargs;

            trans.actions.push(act_inner);
        }

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

        return { res: ret_values.ret_success, payload: { txData, txDataPad } };
    } catch (err) {
        console.log(err.payload);
        return {
            res: err.res,
            payload: err.payload
        };
    }
};

//signatures must be array
//txData must be Buffer
const pushSignedTx = async (txData, signatures, testNet) => {
    let ret_data = null;
    const header = testNet
        ? wallet_conf.eos.testnet.server
        : wallet_conf.eos.formalnet.server;

    try {
        ret_data = await post(
            header + "/v1/chain/push_transaction",
            {
                signatures, //must be array
                compression: "none",
                packed_context_free_data: "",
                packed_trx: txData.toString("hex")
            },
            true
        );
        if (ret_data.res != ret_values.ret_success) {
            throw ret_data;
        }

        return { res: ret_values.ret_success, payload: null };
    } catch (err) {
        console.log(err.payload);
        return {
            res: err.res,
            payload: err.payload
        };
    }
};

module.exports = { getBalance, getRawTx, pushSignedTx };
