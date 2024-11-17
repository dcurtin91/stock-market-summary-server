//** deploy to firebase **/

// import * as functions from 'firebase-functions/v2';
// import axios from 'axios';

// export const summarizeMarket = functions.scheduler.onSchedule(
//     {
//         schedule: 'every day 16:00',
//     },
//     async () => {
//         const url = 'https://stock-market-summary-server-b48b85a337b0.herokuapp.com/summarize-market';

//         try {
//             const response = await axios.get(url);
//             console.log(response);
//         } catch (err) {
//             console.error(err)
//         }
//     }
// );