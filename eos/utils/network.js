const axios = require("axios");
const RETVALUE = require("../../configs/ret_values");

const post = async (url, data) => {
    try {
        const recv_data = (await axios.post(url, data)).data;
        return { res: RETVALUE.ret_success, payload: recv_data };
    } catch (err) {
        return { res: RETVALUE.ret_err_network, payload: err.message };
    }
};

module.exports = { post };
