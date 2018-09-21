const {remote} = window.require('electron');
const { GetAddress } = remote.getGlobal('services').EOSGetAddress;

const cache = {};

export default class wookong {
    constructor(blockchain){
        console.log("wookong constructor");
        this.blockchain = blockchain;
        this.init();
        
    }

    static typeToInterface(blockchain){
        console.log("wookong typeToInterface");
        if(!cache.hasOwnProperty(blockchain)) cache[blockchain] = new wookong(blockchain);
        return cache[blockchain];
    };

    async init(){
        this.canConnect = async () => { 
            console.log("wookong canConnect");
            return true; };
        this.getPublicKey = async () => {
            console.log("wookong getPublicKey");
            const res = await GetAddress([0, 2147483692, 2147483842, 2147483648, 0, 0]);
          
            console.log("res payload"+res.payload);
            return res.payload;}
    }


}
/*
    static typeToInterface(){
        const url = 'http://raspberrypi.local:3000';
        return new ExternalWalletInterface({
            sign(publicKey, trx, abi){
            },
            getPublicKey(){ return Http.get(url).then(res => {
                if(!res) return null;
                return res.key
            })},
            async canConnect(){
                return true;
            }
        });
    };
}*/