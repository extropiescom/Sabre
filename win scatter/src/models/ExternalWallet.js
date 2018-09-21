import IdGenerator from '../util/IdGenerator';
import ecc from 'eosjs-ecc'

import {Blockchains} from './Blockchains'
import LedgerWallet from './hardware/LedgerWallet';
import wookong from './hardware/wookong';
import LiquidEOS from './hardware/LiquidEOS';
//const {remote} = window.require("electron");
//const { GetAddress } = remote.require("./src/models/hardware/solo/dllimport/EOSGetAddress");

export const EXT_WALLET_TYPES = {
    wookong:'Wookong solo',
    LEDGER:'Ledger Nano S',
    LIQUID_EOS:'Scatter/LiquidEOS DIY Hardware Wallet'
};

export const EXT_WALLET_TYPES_ARR = Object.keys(EXT_WALLET_TYPES).map(x => EXT_WALLET_TYPES[x]);

export default class ExternalWallet {

    constructor(_type = EXT_WALLET_TYPES.LEDGER, _blockchain = Blockchains.EOSIO){
        this.id = IdGenerator.text(64);
        this.type = _type;
        this.blockchain = _blockchain;
        this.interface = getInterface(_type, _blockchain);
        console.log("constructor");
    }

    static placeholder(){ return new ExternalWallet(); }
    static fromJson(json){
        console.log("fromJson");
        let p = Object.assign(this.placeholder(), json);
        p.interface = getInterface(p.type, p.blockchain);
        return p;
    }
}

const getInterface = (type, blockchain) => {
    console.log("getInterface");
    switch(type){
        case EXT_WALLET_TYPES.wookong: return wookong.typeToInterface(blockchain);
        case EXT_WALLET_TYPES.LEDGER: return LedgerWallet.typeToInterface(blockchain);
        case EXT_WALLET_TYPES.LIQUID_EOS: return LiquidEOS.typeToInterface();
    }
}

export class ExternalWalletInterface {
    
    constructor(handler){
        console.log("ExternalWalletInterface");
        this.handler = handler;
    }

    async sign(publicKey, trx, abi){
        return await this.handler.sign(publicKey, trx, abi);
    }

    async getPublicKey(){
        console.log("getPublicKey entry");
        const res = await GetAddress("");
        return res.payload;
       // return await this.handler.getPublicKey();
    }

    canConnect(){
        console.log("canConnect");
        return this.handler.canConnect();;
    }

}

