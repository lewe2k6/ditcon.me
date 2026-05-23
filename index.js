(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        factory(exports);
    } else if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else {
        global = typeof globalThis !== 'undefined' ? globalThis : global || self;
        factory(global.fakeDeafenPlugin = {});
    }
})(this, (function (exports) { 'use strict';

    // Lấy chính xác môi trường lõi từ client Kettu/Revenge
    const client = window.revenge || window.bunny || window.vendetta;
    const { patcher, metro, storage } = client;

    // Khởi tạo trạng thái bộ lưu trữ
    storage.isFakeDeafen ??= false;
    let unpatchGateway = null;

    const onLoad = () => {
        const GatewayModule = metro.findByProps("getGatewaySocket", "send") || 
                              metro.findByProps("socket", "send") ||
                              metro.find(m => m?.default?.prototype?.send && m?.default?.prototype?.close);

        if (GatewayModule) {
            const targetObject = GatewayModule.default ? GatewayModule.default.prototype : GatewayModule;

            unpatchGateway = patcher.before("send", targetObject, (args) => {
                try {
                    let payload = args[0];
                    if (payload && payload.op === 4 && payload.d) {
                        if (storage.isFakeDeafen) {
                            payload.d.self_deaf = true;
                            payload.d.self_mute = true;
                            args[0] = payload;
                            console.log("[FakeDeafen] Intercepted Gateway OP 4");
                        }
                    }
                } catch (error) {
                    console.error("[FakeDeafen] Error:", error);
                }
                return args;
            });
        }
    };

    const onUnload = () => {
        if (typeof unpatchGateway === "function") {
            unpatchGateway();
        }
    };

    const settings = () => {
        const { React } = metro.common;
        const FormSwitchRow = metro.findByProps("FormSwitchRow") || metro.findByProps("FormRow");
        const [isEnabled, setIsEnabled] = React.useState(storage.isFakeDeafen);

        return React.createElement(
            FormSwitchRow,
            {
                label: "Kích hoạt Fake Deafen",
                subLabel: "Mọi người sẽ thấy bạn tắt mic và tai nghe, nhưng bạn vẫn nghe thấy họ bình thường.",
                value: isEnabled,
                onValueChange: (value) => {
                    storage.isFakeDeafen = value;
                    setIsEnabled(value);
                }
            }
        );
    };

    // Xuất các hàm theo đúng chuẩn cấu trúc mà Kettu yêu cầu
    exports.onLoad = onLoad;
    exports.onUnload = onUnload;
    exports.settings = settings;

    Object.defineProperty(exports, '__esModule', { value: true });
}));
