import { MarketSpeed, InputType } from 'rakuten-auto-login';
const account = require('../../config/config.json').account;

const input: InputType = {
  user: account.id,
  password: account.pass,
  version: account.version,
  dir: account.dir,
  filename: account.filename
}
const marketSpeed = new MarketSpeed(input);
marketSpeed.login().then(res => console.log('marketSpeed login:', res));
