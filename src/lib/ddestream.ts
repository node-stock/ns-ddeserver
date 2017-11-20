import { Log, Util, Scheduler } from 'ns-common';
import { BasePlan } from './types';
import { DdeServer } from './ddeserver';
import { MarketSpeed } from 'rakuten-auto-login';
import * as assert from 'power-assert';

const config = require('config');

export class DdeStream {
  ddeServ: DdeServer;

  constructor() {
    assert(config, 'config required.');
    assert(config.ddeserv, 'config.ddeserv required.');
    this.ddeServ = new DdeServer({
      symbols: config.ddeserv.symbols,
      items: BasePlan
    });

  }

  async start() {
    Log.system.info('subscribeDde，dde服务订阅方法[启动]');

    // 如果为交易时间，直接启动dde服务
    if (Util.isTradeTime()) {
      Log.system.info('当前为交易时间，直接启动dde服务');
      this.ddeServ.connect();
      // 注册取消订阅事件
      this.stop();
    }
    Log.system.info('注册定时启动dde服务程序');

    const startTask = new Scheduler('55 8 * * *'); // */3 * * * * *
    startTask.invok((startServ: DdeServer) => {
      if (!Util.isTradeDate(new Date())) {
        Log.system.info('当前非交易日，不启动定时DDE数据订阅服务');
        return;
      }

      Log.system.info('启动定时DDE数据[订阅服务]');
      try {
        this.ddeServ.connect();
        // 注册取消订阅事件
        this.stop();
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
    }, this.ddeServ);
    Log.system.info('stop，dde服务订阅方法[终了]');
  }

  stop() {
    Log.system.info('stop，dde服务退订方法[启动]');
    // 资源释放
    const stopTask = new Scheduler('01 15 * * *'); // '*/2 * * * * *'
    stopTask.invok((ddeServ: DdeServer) => {
      Log.system.info('启动定时DDE数据[退订服务]');
      ddeServ.close();
      // 删除定时任务
      stopTask.reminder.cancel();
    }, this.ddeServ);
    Log.system.info('stop，dde服务退订方法[终了]');
  }

  /**
   * 注册定时自动登录事件
   */
  regAutoLogin() {
    assert(config, 'config required.');
    assert(config.account, 'config.account required.');
    Log.system.info('注册定时服务[乐天自动登录]');
    // 每天8点执行自动登录
    const autoLoginTask = new Scheduler('01 8 * * *'); // '01 8 * * *'
    autoLoginTask.invok((stopServ: DdeServer) => {
      if (!Util.isTradeDate(new Date())) {
        return;
      }
      Log.system.info('自动登录乐天客户端...');
      const marketSpeed = new MarketSpeed({
        user: config.account.id,
        password: config.account.pass,
        version: config.marketspeed.version,
        dir: config.marketspeed.dir,
        filename: config.marketspeed.filename
      });
      marketSpeed.login().then(res => {
        Log.system.info(`自动登录乐天客户端成功`);
      }).catch((error) => {
        Log.system.error(`自动登录乐天客户端失败: ${error.message}`);
      });
    });
  }
}
