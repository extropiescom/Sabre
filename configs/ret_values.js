const { DLLRET } = require("../main/dllimport/dllconst");

const ret_success = 0;
const ret_err_network = -1;
const ret_err_unknown = -2;
const ret_err_argument = -3;
const ret_err_host_memory = -4;
const ret_err_enumdev_fail = -5;
const ret_err_opendev_fail = -6;
const ret_err_commdev_fail = -7;
const ret_err_needpin = -8;
const ret_err_canceldev = -9;
const ret_err_key_not_restored = -10;
const ret_err_key_already_restored = -11;
const ret_err_devcount_bad = -12;
const ret_err_retdata_invalid = -13;
const ret_err_devauth_failed = -14;
const ret_err_devstate_invalid = -15;
const ret_err_dev_waiting = -16;
const ret_err_devcommand_invalid = -17;
const ret_err_devcommand_failed = -18;
const ret_err_handle_invalid = -19;
const ret_err_costype_invalid = -20;
const ret_err_costype_unmatch = -21;
const ret_err_crypto_failed = -22;
const ret_err_devgroup_invalid = -23;
const ret_err_buffer_too_small = -24;
const ret_err_tx_parse = -25;
const ret_err_utxo_neq = -26;
const ret_err_txin_overcount = -27;
const ret_err_mutex = -28;
const ret_err_coin_invalid = -29;
const ret_err_coin_unmatch = -30;
const ret_err_derivepath_invalid = -31;
const ret_err_not_support = -32;
const ret_err_internal = -33;
const ret_err_bad_n_t = -34;
const ret_err_target_dev_invalid = -35;
const ret_err_timeout = -36;
const ret_err_dev_busy = -37;
const ret_err_verify_pin = -38;
const ret_err_pin_locked = -39;
const ret_err_confirm_pin = -40;

const convertToMsg = ret => {
    let msg;

    switch (ret) {
    case ret_success:
        msg = "success";
        break;
    case ret_err_network:
        msg = "network error";
        break;
    case ret_err_unknown:
        msg = "unknown error";
        break;
    case ret_err_argument:
        msg = "bad argument";
        break;
    case ret_err_host_memory:
        msg = "host memory error";
        break;
    case ret_err_enumdev_fail:
        msg = "enum device failed";
        break;
    case ret_err_opendev_fail:
        msg = "open device failed";
        break;
    case ret_err_commdev_fail:
        msg = "device communication failed";
        break;
    case ret_err_needpin:
        msg = "please input pin to unlock device";
        break;
    case ret_err_canceldev:
        msg = "device operation cancelled";
        break;
    case ret_err_key_not_restored:
        msg = "device key not restored yet";
        break;
    case ret_err_key_already_restored:
        msg = "device key already restored";
        break;
    case ret_err_devcount_bad:
        msg = "count of device illegal";
        break;
    case ret_err_retdata_invalid:
        msg = "invalid return data from device";
        break;
    case ret_err_devauth_failed:
        msg = "device authentication failed";
        break;
    case ret_err_devstate_invalid:
        msg = "device state invalid";
        break;
    case ret_err_dev_waiting:
        msg = "waiting for operation on device";
        break;
    case ret_err_devcommand_invalid:
        msg = "invalid device command";
        break;
    case ret_err_devcommand_failed:
        msg = "device command failed";
        break;
    case ret_err_handle_invalid:
        msg = "internal handle invalid";
        break;
    case ret_err_costype_invalid:
        msg = "device COS type invalid";
        break;
    case ret_err_costype_unmatch:
        msg = "device COS type unmatch";
        break;
    case ret_err_crypto_failed:
        msg = "crypto failed";
        break;
    case ret_err_devgroup_invalid:
        msg = "device group invalid";
        break;
    case ret_err_buffer_too_small:
        msg = "buffer too small";
        break;
    case ret_err_tx_parse:
        msg = "transaction parse failed";
        break;
    case ret_err_utxo_neq:
        msg = "count of UTXO not equal to count of input";
        break;
    case ret_err_txin_overcount:
        msg = "too many inputs in transaction";
        break;
    case ret_err_mutex:
        msg = "mutex error";
        break;
    case ret_err_coin_invalid:
        msg = "invalid coin type";
        break;
    case ret_err_coin_unmatch:
        msg = "error of changed coin type";
        break;
    case ret_err_derivepath_invalid:
        msg = "invalid derive path";
        break;
    case ret_err_not_support:
        msg = "operation not supported";
        break;
    case ret_err_internal:
        msg = "internal error";
        break;
    case ret_err_bad_n_t:
        msg = "bad N or T";
        break;
    case ret_err_target_dev_invalid:
        msg = "target device invalid";
        break;
    case ret_err_timeout:
        msg = "operation timeout";
        break;
    case ret_err_dev_busy:
        msg = "device busy";
        break;
    case ret_err_pin_locked:
        msg = "pin locked";
        break;
    case ret_err_confirm_pin:
        msg = "confirm pin errer";
        break;
    case ret_err_verify_pin:
        msg = "verify pin failed";
        break;
    default:
        msg = "unknown error";
        break;
    }

    return msg;
};

const convertFromDevRet = devRet => {
    let ret;

    switch (devRet >>> 0) {
    case DLLRET.PAEW_RET_SUCCESS:
        ret = ret_success;
        break;
    case DLLRET.PAEW_RET_UNKNOWN_FAIL:
        ret = ret_err_unknown;
        break;
    case DLLRET.PAEW_RET_ARGUMENTBAD:
        ret = ret_err_argument;
        break;
    case DLLRET.PAEW_RET_HOST_MEMORY:
        ret = ret_err_host_memory;
        break;
    case DLLRET.PAEW_RET_DEV_ENUM_FAIL:
        ret = ret_err_enumdev_fail;
        break;
    case DLLRET.PAEW_RET_DEV_OPEN_FAIL:
        ret = ret_err_opendev_fail;
        break;
    case DLLRET.PAEW_RET_DEV_COMMUNICATE_FAIL:
        ret = ret_err_commdev_fail;
        break;
    case DLLRET.PAEW_RET_DEV_NEED_PIN:
        ret = ret_err_needpin;
        break;
    case DLLRET.PAEW_RET_DEV_OP_CANCEL:
        ret = ret_err_canceldev;
        break;
    case DLLRET.PAEW_RET_DEV_KEY_NOT_RESTORED:
        ret = ret_err_key_not_restored;
        break;
    case DLLRET.PAEW_RET_DEV_KEY_ALREADY_RESTORED:
        ret = ret_err_key_already_restored;
        break;
    case DLLRET.PAEW_RET_DEV_COUNT_BAD:
        ret = ret_err_devcount_bad;
        break;
    case DLLRET.PAEW_RET_DEV_RETDATA_INVALID:
        ret = ret_err_retdata_invalid;
        break;
    case DLLRET.PAEW_RET_DEV_AUTH_FAIL:
        ret = ret_err_devauth_failed;
        break;
    case DLLRET.PAEW_RET_DEV_STATE_INVALID:
        ret = ret_err_devstate_invalid;
        break;
    case DLLRET.PAEW_RET_DEV_WAITING:
        ret = ret_err_dev_waiting;
        break;
    case DLLRET.PAEW_RET_DEV_COMMAND_INVALID:
        ret = ret_err_devcommand_invalid;
        break;
    case DLLRET.PAEW_RET_DEV_RUN_COMMAND_FAIL:
        ret = ret_err_devcommand_failed;
        break;
    case DLLRET.PAEW_RET_DEV_HANDLE_INVALID:
        ret = ret_err_handle_invalid;
        break;
    case DLLRET.PAEW_RET_COS_TYPE_INVALID:
        ret = ret_err_costype_invalid;
        break;
    case DLLRET.PAEW_RET_COS_TYPE_NOT_MATCH:
        ret = ret_err_costype_unmatch;
        break;
    case DLLRET.PAEW_RET_DEV_BAD_SHAMIR_SPLIT:
        ret = ret_err_crypto_failed;
        break;
    case DLLRET.PAEW_RET_DEV_NOT_ONE_GROUP:
        ret = ret_err_devgroup_invalid;
        break;
    case DLLRET.PAEW_RET_BUFFER_TOO_SAMLL:
        ret = ret_err_buffer_too_small;
        break;
    case DLLRET.PAEW_RET_TX_PARSE_FAIL:
        ret = ret_err_tx_parse;
        break;
    case DLLRET.PAEW_RET_TX_UTXO_NEQ:
        ret = ret_err_utxo_neq;
        break;
    case DLLRET.PAEW_RET_TX_INPUT_TOO_MANY:
        ret = ret_err_txin_overcount;
        break;
    case DLLRET.PAEW_RET_MUTEX_ERROR:
        ret = ret_err_mutex;
        break;
    case DLLRET.PAEW_RET_COIN_TYPE_INVALID:
        ret = ret_err_coin_invalid;
        break;
    case DLLRET.PAEW_RET_COIN_TYPE_NOT_MATCH:
        ret = ret_err_coin_unmatch;
        break;
    case DLLRET.PAEW_RET_DERIVE_PATH_INVALID:
        ret = ret_err_derivepath_invalid;
        break;
    case DLLRET.PAEW_RET_NOT_SUPPORTED:
        ret = ret_err_not_support;
        break;
    case DLLRET.PAEW_RET_INTERNAL_ERROR:
        ret = ret_err_internal;
        break;
    case DLLRET.PAEW_RET_BAD_N_T:
        ret = ret_err_bad_n_t;
        break;
    case DLLRET.PAEW_RET_TARGET_DEV_INVALID:
        ret = ret_err_target_dev_invalid;
        break;
    case DLLRET.PAEW_RET_CRYPTO_ERROR:
        ret = ret_err_crypto_failed;
        break;
    case DLLRET.PAEW_RET_DEV_TIMEOUT:
        ret = ret_err_timeout;
        break;
    case DLLRET.PAEW_RET_DEV_PIN_LOCKED:
        ret = ret_err_pin_locked;
        break;
    case DLLRET.PAEW_RET_DEV_PIN_CONFIRM_FAIL:
        ret = ret_err_confirm_pin;
        break;
    case DLLRET.PAEW_RET_DEV_PIN_VERIFY_FAIL:
        ret = ret_err_verify_pin;
        break;
    default:
        ret = ret_err_unknown;
        break;
    }

    return ret;
};

module.exports = {
    convertFromDevRet,
    convertToMsg,
    ret_success,
    ret_err_network,
    ret_err_unknown,
    ret_err_argument,
    ret_err_host_memory,
    ret_err_enumdev_fail,
    ret_err_opendev_fail,
    ret_err_commdev_fail,
    ret_err_needpin,
    ret_err_canceldev,
    ret_err_key_not_restored,
    ret_err_key_already_restored,
    ret_err_devcount_bad,
    ret_err_retdata_invalid,
    ret_err_devauth_failed,
    ret_err_devstate_invalid,
    ret_err_dev_waiting,
    ret_err_devcommand_invalid,
    ret_err_devcommand_failed,
    ret_err_handle_invalid,
    ret_err_costype_invalid,
    ret_err_costype_unmatch,
    ret_err_crypto_failed,
    ret_err_devgroup_invalid,
    ret_err_buffer_too_small,
    ret_err_tx_parse,
    ret_err_utxo_neq,
    ret_err_txin_overcount,
    ret_err_mutex,
    ret_err_coin_invalid,
    ret_err_coin_unmatch,
    ret_err_derivepath_invalid,
    ret_err_not_support,
    ret_err_internal,
    ret_err_bad_n_t,
    ret_err_target_dev_invalid,
    ret_err_timeout,
    ret_err_dev_busy
};
