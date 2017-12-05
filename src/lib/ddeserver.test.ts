import { DdeServer } from './ddeserver';
import { DdeStream } from './ddestream';
import { RssStock } from './types';
import * as assert from 'power-assert';
import { Log } from 'ns-common';

const config = require('config');

Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');

const testStart = async () => {

  let server: DdeServer;
  try {
    server = new DdeServer({ symbols: config.ddeserv.symbols, items: [RssStock.volume, RssStock.close] });
    server.connect();
    // 等待6秒
    await new Promise(resolve => setTimeout(resolve, 60000));
    server.close();
  } catch (err) {
    if (err.Code === 16394) {
      Log.system.info('与服务器连接失败');
      assert(false);
    }
    Log.system.error(err.stack);
    assert(true);
  }
};

const testDdeStream = async () => {

  const ddeStream = new DdeStream();
  // 启动Dde服务
  ddeStream.start().catch((err) => Log.system.error('启动Dde服务出错：', err.stack));
};

describe('DDE服务测试', () => {
  it('测试是否启动成功', testStart);
});
