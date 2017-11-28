import { Client, DdeType } from 'ts-dde';
import { Store as db } from 'ns-store';
import { Log, Util } from 'ns-common';
import { PubNub } from 'realstream';
import { InfluxDB } from 'ns-influxdb';
import { Kapacitor } from 'ns-kapacitor';

import * as numeral from 'numeral';
import * as moment from 'moment';

const config = require('config');
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
  influxdb: InfluxDB;
  kapacitor: Kapacitor;

  constructor(opt: { symbols: string[], items: string[] }) {
    this.service = <DdeType>{ RSS: {} };
    for (const symbol of opt.symbols) {
      this.service.RSS[symbol + '.T'] = opt.items;
    }
  }

  async initInflux() {

    this.influxdb = new InfluxDB(config.influxdb);
    await this.influxdb.initDB();
    await this.influxdb.initCQ();
  }

  async initKapacitor() {
    this.kapacitor = new Kapacitor(config.kapacitor);
    await this.kapacitor.initTemplate();
    await this.kapacitor.initTask();
  }

  async connect() {
    await this.initInflux();
    await this.initKapacitor();
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
    this.conn.on('advise', async (service: string, topic: string, item: string, text: string) => {
      try {
        const ddeMsg = {
          service, topic, item,
          text: text.trim().replace(/\0/g, ''),
          date: moment().format('YYYY-MM-DD')
        };
        console.log(ddeMsg);
        if (ddeMsg.text && numeral(ddeMsg.text).value() !== 0) {
          // 收集现在值 且 当前为交易时间
          if (ddeMsg.item === '現在値' && Util.isTradeTime()) {
            await this.influxdb.putTick({
              symbol: topic.split('.')[0],
              price: numeral(ddeMsg.text).value()
            });
          }
          // pubnub.publish('stock', ddeMsg);
          // 写入数据库
          await db.model.Dde.upsert(ddeMsg);
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

  async close() {
    Log.system.info(`关闭dde主题:${this.conn.topic()}。`);
    await this.influxdb.dropCQ();
    this.conn.stopAdvise();
    this.conn.dispose();
  }
}
