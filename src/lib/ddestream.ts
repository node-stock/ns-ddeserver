import { Log, Util, Scheduler } from 'ns-common';
import { BasePlan } from './types';
import { DdeServer } from './ddeserver';
import { MarketSpeed } from 'rakuten-auto-login';
import * as assert from 'power-assert';

const config = require('config');

export class DdeStream {

  static _startServ = () => {
    assert(config, 'config required.');
    assert(config.ddeserv, 'config.ddeserv required.');
    return new DdeServer({
      symbols: config.ddeserv.symbols,
      items: BasePlan
    });
  }

  static subscribeDde = async () => {
    Log.system.info('subscribeDde，dde服务订阅方法[启动]');

    // 如果为交易时间，直接启动dde服务
    if (Util.isTradeTime()) {
      Log.system.info('当前为交易时间，直接启动dde服务');
      const startServ = DdeStream._startServ();
      // 注册取消订阅事件
      DdeStream.unsubscribeDde(startServ);
    }
    Log.system.info('注册定时启动dde服务程序');

    const server: DdeServer = <DdeServer>{};
    const startDde = new Scheduler('55 8 * * *'); // */3 * * * * *
    startDde.invok((startServ: DdeServer) => {
      if (!Util.isTradeDate(new Date())) {
        Log.system.info('当前非交易日，不启动定时DDE数据订阅服务');
        return;
      }

      Log.system.info('启动定时DDE数据[订阅服务]');
      try {
        startServ = DdeStream._startServ();

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
    const stopDde = new Scheduler('01 15 * * *'); // '*/2 * * * * *'
    stopDde.invok((stopServ: DdeServer) => {
      Log.system.info('启动定时DDE数据[退订服务]');
      if (stopServ.isConnected()) {
        stopServ.close();
      }
      // 删除定时任务
      stopDde.reminder.cancel();
    }, serv);
    Log.system.info('unsubscribeDde，dde服务退订方法[终了]');
  }

  /**
   * 注册定时自动登录事件
   */
  static regAutoLogin() {
    assert(config, 'config required.');
    assert(config.account, 'config.account required.');
    Log.system.info('注册定时服务[乐天自动登录]');
    // 每天8点执行自动登录
    const stopDde = new Scheduler('01 8 * * *'); // '01 8 * * *'
    stopDde.invok((stopServ: DdeServer) => {
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
