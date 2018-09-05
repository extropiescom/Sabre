const usb = require("usb");
const sprintf = require("sprintf-js");
const os = require("os");

const {
    DLLRET,
    DLLPSTEP,
    DLLPSTATUS,
    DLLDEVINFO
} = require("./dllimport/dllconst");
const { GetDevInfo, ShowDevInfo } = require("./dllimport/GetDevInfo");

//define callback
const ffi = require("ffi");
const ref = require("ref");
const { DLLUTIL } = require("./dllimport/dllutility");
const {
    CallbackParam,
    CallbackDataAddrGet,
    CallbackDataCOSUpdate
} = require("./dllimport/dllstruct");

let callbackParam = new CallbackParam();

const callbackFunc = ffi.Callback("int", [CallbackParam], function(cbparam) {
    let strOutput = "";

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
        strOutput += sprintf.sprintf("ret_value=0x%x\t", cbparam.ret_value);
        if (
            cbparam.pstep == DLLPSTEP.pstep_comm_addr_get &&
            cbparam.ret_value == DLLRET.PAEW_RET_SUCCESS
        ) {
            const addrGet = ref
                .alloc(CallbackDataAddrGet, cbparam.data.buffer)
                .deref();

            strOutput += sprintf.sprintf(
                "coin type: %s\t",
                DLLUTIL.ewallet_cointype2string(addrGet.nCoinType)
            );
            strOutput += sprintf.sprintf(
                "address: %s\t",
                ref
                    .alloc(ref.types.CString, addrGet.pbAddressData.buffer)
                    .deref()
            );
        } else if (
            cbparam.pstep == DLLPSTEP.pstep_comm_updatecos &&
            cbparam.ret_value == DLLRET.PAEW_RET_SUCCESS
        ) {
            const cosUpdate = ref
                .alloc(CallbackDataCOSUpdate, cbparam.data.buffer)
                .deref();

            strOutput += sprintf.sprintf(
                "cos update progress: %%%d\t",
                cosUpdate.nProgress
            );
        }
    }

    console.log(strOutput);
});

let detectCallback = null;
const setDetectCallback = callback => {
    detectCallback = callback;
};
const invokeDetectCallback = (inputParam, eventType, devInfo) => {
    let detectParam = {};

    if (detectCallback) {
        const { szDevName, szDevNameForOpen } = inputParam;

        detectParam.devName = szDevName;
        detectParam.devNameForConnect = szDevNameForOpen;
        detectParam.eventType = eventType;

        if (devInfo) {
            detectParam.cosVersion = DLLUTIL.ewallet_print_buf(
                devInfo.pbCOSVersion.buffer
            );
            detectParam.serialNumber = sprintf.sprintf(
                "%s",
                ref
                    .alloc(ref.types.CString, devInfo.pbSerialNumber.buffer)
                    .deref()
            );
            detectParam.chainType = devInfo.ucChainType;
            detectParam.PINState = devInfo.ucPINState;
            detectParam.lifeCycle = devInfo.ucLifeCycle;
            detectParam.cosType = devInfo.ucCOSType;

            if (
                devInfo.ucCOSType ==
                DLLDEVINFO.COSTYPE.PAEW_DEV_INFO_COS_TYPE_DRAGONBALL
            ) {
                detectParam.n = devInfo.nN;
                detectParam.t = devInfo.nT;
                detectParam.sessKeyHash = DLLUTIL.ewallet_print_buf(
                    devInfo.pbSessKeyHash.buffer
                );
            }
        }
        detectCallback(detectParam);
    }
};

let usbDetectionInited = false;
//define usb
const testUSBInit = () => {
    if (usbDetectionInited == true) {
        return;
    }

    usb.on("attach", async device => {
        let interfaceNumber = -1;

        if ("win32" != os.platform()) {
            device.open();
            for (let interIndex in device.interfaces) {
                if (
                    device.interfaces[interIndex].descriptor.bInterfaceClass ==
                    usb.LIBUSB_CLASS_HID
                ) {
                    interfaceNumber =
                        device.interfaces[interIndex].descriptor
                            .bInterfaceNumber;
                    break;
                }
            }
            device.close();
        } else {
            interfaceNumber = 0;
        }

        if (
            (device.deviceDescriptor.idProduct == 0x0101 &&
                device.deviceDescriptor.idVendor == 0x2f0a &&
                interfaceNumber != -1) ||
            (device.deviceDescriptor.idProduct == 0x0102 &&
                device.deviceDescriptor.idVendor == 0x2f0a &&
                interfaceNumber != -1)
        ) {
            const szDevNameForOpen = sprintf.sprintf(
                "%04x:%04x:%02x",
                device.busNumber,
                device.deviceAddress,
                interfaceNumber
            );
            const szDevName = sprintf.sprintf(
                "%04x:%04x",
                device.busNumber,
                device.deviceAddress
            );
            const strLog = sprintf.sprintf(
                "%s--PID_%04X&VID_%04X",
                szDevName,
                device.deviceDescriptor.idProduct,
                device.deviceDescriptor.idVendor
            );
            console.log("device attached: " + strLog);

            const { result, payload } = await GetDevInfo(
                szDevNameForOpen,
                callbackFunc,
                callbackParam
            );
            console.log("result = " + sprintf.sprintf("0x%x", result));
            if (result == DLLRET.PAEW_RET_SUCCESS) {
                ShowDevInfo(payload);
                invokeDetectCallback(
                    { szDevName, szDevNameForOpen },
                    "attach",
                    payload
                );
            }
        }
    });

    usb.on("detach", device => {
        if (
            (device.deviceDescriptor.idProduct == 0x0101 &&
                device.deviceDescriptor.idVendor == 0x2f0a) ||
            (device.deviceDescriptor.idProduct == 0x0102 &&
                device.deviceDescriptor.idVendor == 0x2f0a)
        ) {
            const szDevName = sprintf.sprintf(
                "%04x:%04x",
                device.busNumber,
                device.deviceAddress
            );

            const str = sprintf.sprintf(
                "%04x:%04x--PID_%04X&VID_%04X",
                device.busNumber,
                device.deviceAddress,
                device.deviceDescriptor.idProduct,
                device.deviceDescriptor.idVendor
            );
            console.log("device detached: " + str);

            invokeDetectCallback(
                { szDevName, szDevNameForOpen: null },
                "detach",
                null
            );
        }
    });

    usbDetectionInited = true;
};

module.exports = { testUSBInit, setDetectCallback };
