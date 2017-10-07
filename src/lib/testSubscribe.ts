import { PubNub } from 'realstream';
import * as util from 'util';

const config = require('../../config/config');
const pubnub = new PubNub(config.pubnub);

pubnub.subscribe(['stock'], (message: any, channel: string) => {
  console.log('频道: ' + channel);
  console.log('订阅: ' + util.inspect(message, true, null));
})
