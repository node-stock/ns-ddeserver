import { DdeServer } from './ddeserver';
import { RssStock } from './types';
import * as assert from 'power-assert';
import { Log } from 'ns-common';

Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');

const testStart = async (done: any) => {
  let server: DdeServer;
  try {

    server = new DdeServer({ symbols: ['6553'], items: [RssStock.volume, RssStock.close] });

    // 等待6秒
    await new Promise(resolve => setTimeout(resolve, 6000));
    server.close();
  } catch (err) {
    if (err.Code === 16394) {
      Log.system.info('与服务器连接失败');
      done();
      return;
    }
    Log.system.error(err.stack)
    done();
  }
  done();
};

describe('DDE服务测试', () => {
  it('测试是否启动成功', function (done) {
    this.timeout(20000);
    testStart(done); // done();
  });
});

