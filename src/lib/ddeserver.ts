import { Client, DdeType } from 'ts-dde';
import { Store as db } from 'ns-store';
import { Log, Util, Scheduler } from 'ns-common';
import { PubNub } from 'realstream';
import { BasePlan } from './types';
import * as childProcess from 'child_process';

const config = require('../../config/config');
db.init(config.store);
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

    this.conn = new Client(this.service);
    this.conn.connect();
    if (!this.conn.isConnected()) {
      Log.system.error(`服务:${this.conn.service()},连接失败！`);
      Log.system.info('自动登录乐天客户端...');
      const workProcess = childProcess.exec('node rakutenlogin.js', {
        cwd: __dirname
      }, (error, stdout, stderr) => {
        if (error) {
          Log.system.error(`自动登录乐天客户端失败: ${error.stack}`);
        }
        workProcess.kill();
      })
    } else {
      Log.system.info(`服务:${this.conn.service()},连接成功！`);
    }
    // 断开事件
    this.conn.on('disconnected', () => {
      Log.system.info(`服务:${this.conn.service()},主题:${this.conn.topic()},断开连接！`);
    });
    // 订阅事件
    this.conn.on('advise', (service: string, topic: string, item: string, text: string) => {
      try {
        const ddeMsg = { service, topic, item, text: text.trim().replace(/\0/g, '') };
        Log.system.info(ddeMsg);
        pubnub.publish('stock', ddeMsg);
        // 写入数据库
        db.model.Dde.upsert(ddeMsg);
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
    Log.system.info(`关闭dde服务:${this.conn.service()}。`);
    this.conn.stopAdvise();
    this.conn.dispose();
  }
}

export class DdeStream {
  static subscribeDde = () => {
    Log.system.info('subscribeDde，dde服务订阅方法[启动]');

    // 如果为交易时间，直接启动dde服务
    if (Util.isTradeTime()) {
      Log.system.info('当前为交易时间，直接启动dde服务');

      const startServ = new DdeServer({
        symbols: ['6553', '6664'],
        items: BasePlan
      });
    }
    Log.system.info('注册定时启动dde服务程序');

    const server: DdeServer = <DdeServer>{};
    const startDde = new Scheduler('55 8 * * *');
    startDde.invok((startServ: DdeServer) => {
      if (!Util.isTradeDate(new Date())) {
        Log.system.info('当前非交易日，不启动定时DDE数据订阅服务');
        return;
      }

      Log.system.info('启动定时DDE数据订阅服务');
      try {
        startServ = new DdeServer({
          symbols: ['6553', '6664'],
          items: BasePlan
        });

        // 注册取消订阅事件
        DdeStream.unsubscribeDde(startServ);
      } catch (err) {
        if (err.Code === 16394) {
          Log.system.error('与服务器连接失败');
          return;
        }
        Log.system.error(err.stack)
        if (startServ.isConnected()) {
          Log.system.info('发送异常，关闭DDE数据订阅服务');
          startServ.close();
        }
      }
    }, server);
    Log.system.info('subscribeDde，dde服务订阅方法[终了]');
  }

  static unsubscribeDde = (serv: DdeServer) => {
    Log.system.info('unsubscribeDde，dde服务退订方法[启动]');
    // 资源释放
    const stopDde = new Scheduler('31 15 * * *');
    stopDde.invok((stopServ: DdeServer) => {
      if (stopServ.isConnected()) {
        Log.system.info('关闭DDE数据订阅服务');
        stopServ.close();
      }
      stopDde.reminder.cancel()
    }, serv)
    Log.system.info('unsubscribeDde，dde服务退订方法[终了]');
  }
}
