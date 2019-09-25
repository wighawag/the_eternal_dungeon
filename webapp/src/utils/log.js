// import * as axios from 'axios';
// import Pino from 'pino';
// import config from '../config';

// import crypto from 'crypto';
// function uuidv4() {
//     return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
//         (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
//     );
// }
// const sessionId = uuidv4();

const logger = console;
// const logger = Pino({
//     browser: {
//         asObject: false,
//         transmit: {
//             // level: 'info',
//             send: async function (level, logEvent) {
//                 if (config.apiUrl) {
//                     const logSecret = location.hash;
//                     if (logSecret && logSecret !== '') {
//                         try {
//                             await axios.post(config.apiUrl + '/log/' + logSecret.substr(1) + '/' + sessionId, logEvent);
//                         } catch (e) {
//                             console.log('failed to log', e);
//                         }
//                     }
//                 }
//             }
//         }
//     }
// });

export default {
    trace(...args) {
        if (process.browser) {
            logger.trace(...args);
        }
    },
    debug(...args) {
        if (process.browser) {
            logger.debug(...args);
        }
    },
    info(...args) {
        if (process.browser) {
            logger.info(...args);
        }
    },
    warn(...args) {
        if (process.browser) {
            logger.error(...args);
        }
    },
    error(...args) {
        if (process.browser) {
            logger.error(...args);
        }
    },
    fatal(...args) {
        if (process.browser) {
            logger.fatal(...args);
        }
    },
    silent(...args) {
        if (process.browser) {
            logger.silent(...args);
        }
    },
};
