// export * from './lib/ddeserver';
import { DdeServer } from './lib/ddeserver';
import { BasePlan } from './lib/types';
import { Log, Util, Scheduler } from 'ns-common';

Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');
const subscribeDde = () => {
  Log.system.info('启动DdeServer...');
  const server: DdeServer = <DdeServer>{};
  const startDde = new Scheduler('55 8 * * *');
  startDde.invok((startServ: DdeServer) => {

    Log.system.info('启动DDE数据订阅服务');
    try {
      startServ = new DdeServer({
        symbols: ['6553', '6664'],
        items: BasePlan
      });

      // 资源释放
      const stopDde = new Scheduler('31 15 * * *');
      stopDde.invok((stopServ: DdeServer) => {
        if (stopServ.isConnected()) {
          Log.system.info('关闭DDE数据订阅服务');
          stopServ.close();
        }
        stopDde.reminder.cancel()
      }, startServ)
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

};

subscribeDde();
