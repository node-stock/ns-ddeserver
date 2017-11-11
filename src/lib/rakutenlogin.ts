import { MarketSpeed, InputType } from 'rakuten-auto-login';
const config = require('config');

const input: InputType = {
  user: config.account.id,
  password: config.account.pass,
  version: config.marketspeed.version,
  dir: config.marketspeed.dir,
  filename: config.marketspeed.filename
}
const marketSpeed = new MarketSpeed(input);
marketSpeed.login().then(res => console.log('marketSpeed login:', res));
