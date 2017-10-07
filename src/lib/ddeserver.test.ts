import { DdeServer } from './ddeserver';
import { RssStock } from './types';
import * as assert from 'power-assert';

const testStart = async (done: any) => {

  const server = new DdeServer({ symbols: ['6553'], items: [RssStock.volume, RssStock.close] });

  // 等待6秒
  await new Promise(resolve => setTimeout(resolve, 6000));
  server.close();

  done();
};

describe('DDE服务测试', () => {
  it('测试是否启动成功', function (done) {
    this.timeout(20000);
    testStart(done);
  });
});

