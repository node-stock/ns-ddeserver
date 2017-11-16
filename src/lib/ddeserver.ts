import { Client, DdeType } from 'ts-dde';
import { Store as db } from 'ns-store';
import { Log } from 'ns-common';
import { PubNub } from 'realstream';
import * as numeral from 'numeral';
import * as moment from 'moment';

const config = require('config');
Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');
const pubnub = new PubNub(config.pubnub);
/**
  * @class
  * @classdesc DDE服务器
  */
export class DdeServer {
  // 订阅数据信息
  service: DdeType;
  // 订阅连接对象
  conn: Client;

  constructor(opt: { symbols: string[], items: string[] }) {
    this.service = <DdeType>{ RSS: {} };
    for (const symbol of opt.symbols) {
      this.service.RSS[symbol + '.T'] = opt.items;
    }
  }
  connect() {
    db.init(config.store);
    this.conn = new Client(this.service);
    this.conn.connect();
    // 未连接上
    if (!this.conn.isConnected()) {
      Log.system.error('启动dde服务失败！');
      return;
    }
    Log.system.info(`dde主题:${this.conn.topic()},连接成功！`);
    // 断开事件
    this.conn.on('disconnected', (service: string, topic: string) => {
      Log.system.info(`服务:${service},主题:${topic},断开连接！`);
    });
    // 订阅事件
    this.conn.on('advise', (service: string, topic: string, item: string, text: string) => {
      try {
        const ddeMsg = {
          service, topic, item,
          text: text.trim().replace(/\0/g, ''),
          date: moment().format('YYYY-MM-DD')
        };
        console.log(ddeMsg);
        if (ddeMsg.text && numeral(ddeMsg.text).value() !== 0) {
          // pubnub.publish('stock', ddeMsg);
          // 写入数据库
          db.model.Dde.upsert(ddeMsg);
        }
      } catch (err) {
        Log.system.error('订阅事件处理出错：', err.stack);
      }
    });
    // 订阅DDE数据
    this.conn.startAdvise();
  }

  isConnected() {
    return this.conn.isConnected();
  }

  close() {
    Log.system.info(`关闭dde主题:${this.conn.topic()}。`);
    db.close();
    this.conn.stopAdvise();
    this.conn.dispose();
  }
}
