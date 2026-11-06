"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailEvent = void 0;
const node_events_1 = require("node:events");
const common_1 = require("../../common");
exports.emailEvent = new node_events_1.EventEmitter();
exports.emailEvent.on(common_1.enums.EventsEnum.SEND_EMAIL, async ({ recipient, subject = common_1.enums.EmailSubjectEnum.CONFIRM_EMAIL, data, }) => {
    try {
        await common_1.sendEmail.sendEmail({
            ...recipient,
            subject,
            html: common_1.sendEmail.emailTemplate({ subject, data }),
        });
    }
    catch (error) {
        console.log(`Failed to send email`, error);
    }
});
