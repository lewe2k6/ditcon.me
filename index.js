import { patcher, metro } from "@vendetta";
import { storage } from "@vendetta/plugin";

// Khoi tao bo luu tru trang thai bat/tat (mac dinh la false)
storage.isFakeDeafen ??= false;

let unpatchGateway = null;

export const onLoad = () => {
    // Tim kiem Module chiu trach nhiem quan ly ket noi Gateway cua Discord
    const GatewayModule = metro.findByProps("getGatewaySocket", "send") || 
                          metro.findByProps("socket", "send") ||
                          metro.find(m => m?.default?.prototype?.send && m?.default?.prototype?.close);

    if (GatewayModule) {
        const targetObject = GatewayModule.default ? GatewayModule.default.prototype : GatewayModule;

        // Tien hanh patch (tiem ma) truoc khi ham send() goc duoc goi
        unpatchGateway = patcher.before("send", targetObject, (args) => {
            try {
                // Goi tin truyen len luon nam o tham so dau tien (args[0])
                let payload = args[0];

                // Neu goi tin la mot object chua du lieu va cau truc op: 4 (Voice State Update)
                if (payload && payload.op === 4 && payload.d) {
                    
                    // Kiem tra xem tinh nang Fake Deafen co dang duoc bat trong cai dat hay khong
                    if (storage.isFakeDeafen) {
                        // Ep buoc thuoc tinh tu diec va tu tat tieng thanh true truoc khi gui di
                        payload.d.self_deaf = true;
                        payload.d.self_mute = true;
                        
                        // Cap nhat lai tham so de ham goc gui du lieu da chinh sua len Server
                        args[0] = payload;
                        console.log("[FakeDeafen] Da can thiep thanh cong goi tin Gateway OP 4!");
                    }
                }
            } catch (error) {
                console.error("[FakeDeafen] Loi xu ly du lieu Gateway:", error);
            }
            return args;
        });
    } else {
        console.error("[FakeDeafen] Khong the tim thay Module quan ly ket noi Gateway cua Discord.");
    }
};

// Ham don dep va khoi phuc trang thai khi tat/go cai dat plugin
export const onUnload = () => {
    if (typeof unpatchGateway === "function") {
        unpatchGateway();
    }
};

// Giao dien nut bam bat/tat (Toggle) duoc nhung truc tiep vao phan cau hinh cua App
export const settings = () => {
    // Import cac thanh phan giao dien cua React Native duoc Discord dong goi san
    const { React } = metro.common;
    const { FormSwitchRow } = metro.findByProps("FormSwitchRow") || metro.findByProps("FormRow");
    
    // Su dung co che lang nghe trang thai cua Vendetta/Bunny storage
    const [isEnabled, setIsEnabled] = React.useState(storage.isFakeDeafen);

    return React.createElement(
        FormSwitchRow,
        {
            label: "Kich hoat Fake Deafen",
            subLabel: "Moi nguoi se thay ban trong trang thai tat mic & tai nghe nhung ban van nghe thay ho.",
            value: isEnabled,
            onValueChange: (value) => {
                storage.isFakeDeafen = value;
                setIsEnabled(value);
            }
        }
    );
};
