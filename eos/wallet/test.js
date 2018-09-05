const eos = require("./eos");
const { GetAddress } = require("../dllimport/EOSGetAddress");
const wallet_conf = require("../../configs/wallet_config.json");

const sign_test = () => {
    let action_transfer = {
        account: "eosio.token",
        name: "transfer",
        authorization: [
            {
                actor: "bladexwallet",
                permission: "active"
            }
        ],
        data: {
            from: "bladexwallet",
            to: "extropiescom",
            amount: "0.0001 EOS",
            memo: "m"
        }
    };

    let action_create_conference = {
        account: "eosprepay",
        name: "create",
        authorization: [
            {
                actor: "ximinchcybex",
                permission: "active"
            }
        ],
        data: {
            conf_name: "beijing1",
            organizer: "ximinchcybex",
            fee: "1.0000 SYS"
        }
    };

    let action_cancel_conference = {
        account: "eosprepay",
        name: "cancel",
        authorization: [
            {
                actor: "ximinchcybex",
                permission: "active"
            }
        ],
        data: {
            conf_name: "beijing1",
            organizer: "ximinchcybex"
        }
    };

    let actions = [];
    actions.push(action_transfer);
    //actions.push(action_create_conference);
    //actions.push(action_cancel_conference);

    eos.signTx(actions);
};

sign_test();

get_address=async () => {
  const res = await GetAddress(...wallet_conf.eos.testnet.derivePathPrefix);
  //res.payload
  //res.result
}
