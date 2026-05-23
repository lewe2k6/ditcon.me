// Lấy các bộ công cụ lõi từ môi trường toàn cục của client di động
const { patcher, metro, storage } = window.vendetta || window.bunny || window.revenge;

// Khởi tạo trạng thái lưu trữ nút gạt
storage.isFakeDeafen ??= false;

let unpatchGateway = null;

// BẮT BUỘC dùng từ khóa export trực tiếp để hệ thống Fetch của app nhận diện
export const onLoad = () => {
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
    } else {
        console.error("[FakeDeafen] Gateway module not found");
    }
};

export const onUnload = () => {
    if (typeof unpatchGateway === "function") {
        unpatchGateway();
    }
};

export const settings = () => {
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
