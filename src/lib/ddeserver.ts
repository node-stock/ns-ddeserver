import { Client, DdeType } from 'ts-dde';
import { Store as db } from 'ns-store';
import { Log } from 'ns-common';
import { PubNub } from 'realstream';

const config = require('../../config/config');
Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');
db.init(config.store);
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
    try {
      this.service = <DdeType>{ RSS: {} };
      for (const symbol of opt.symbols) {
        this.service.RSS[symbol + '.T'] = opt.items;
      }

      this.conn = new Client(this.service);
      this.conn.connect();
      if (!this.conn.isConnected()) {
        Log.system.error(`服务:${this.conn.service()},连接失败！`);
      }
      // 断开事件
      this.conn.on('disconnected', () => {
        Log.system.info(`服务:${this.conn.service()},主题:${this.conn.topic()},断开连接！`);
      });
      // 订阅事件
      this.conn.on('advise', (service: string, topic: string, item: string, text: string) => {
        try {
          const ddeMsg = { service, topic, item, text: text.trim().replace(/\0/g, '') };
          console.log(ddeMsg);
          pubnub.publish('stock', ddeMsg);
          // 写入数据库
          db.model.Dde.upsert(ddeMsg);
        } catch (err) {
          Log.system.error('订阅事件处理出错：', err.stack);
        }
      });
      // 订阅DDE数据
      this.conn.startAdvise();
    } catch (err) {
      Log.system.error(err.stack);
      throw err;
    }
  }

  close() {
    Log.system.info(`关闭dde服务:${this.conn.service()}。`);
    this.conn.stopAdvise();
    this.conn.dispose();
  }
}
