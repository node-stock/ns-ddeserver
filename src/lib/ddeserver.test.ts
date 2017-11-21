import { DdeServer } from './ddeserver';
import { RssStock } from './types';
import * as assert from 'power-assert';
import { Log } from 'ns-common';
import { InfluxDB, FieldType } from 'influx';

const config = require('config');
const influx = new InfluxDB({
  host: 'localhost',
  database: 'test',
  schema: [
    {
      measurement: 'tick',
      fields: {
        price: FieldType.INTEGER
      },
      tags: [
        'symbol'
      ]
    }
  ]
});

Log.init(Log.category.system, Log.level.ALL, 'ns-ddeserver');

const testStart = async (done: any) => {

  let server: DdeServer;
  try {
    server = new DdeServer({ symbols: config.ddeserv.symbols, items: [RssStock.volume, RssStock.close] });
    server.connect();
    // 等待6秒
    await new Promise(resolve => setTimeout(resolve, 6000));
    server.close();
  } catch (err) {
    if (err.Code === 16394) {
      Log.system.info('与服务器连接失败');
      assert(false);
      done();
      return;
    }
    Log.system.error(err.stack);
    assert(true);
    done();
  }
  done();
};

const testInflux = async (done: any) => {

  /*influx.writePoints([{
    measurement: 'tick',
    tags: { symbol: '6553' },
    fields: { price: 2000 }
  }]).then(res => console.log(influx.query('select * from tick').then(res2 => {
    console.log(res2)
  })));*/
  /*influx.queryRaw('select * from tick').then(res2 => {
    console.log('res2:', JSON.stringify(res2, null, 2))
  })*/
  // influx.dropContinuousQuery('cq_5m')
  await influx.createContinuousQuery('cq_5m', `
    SELECT
    max(price) as high,
    min(price) as low,
    first(price) as open,
    last(price) as close
    INTO candlstick_5m
    FROM tick
    GROUP BY time(5m), pair
  `.replace(/\n/g, ''), 'test');

  const res = await influx.showContinousQueries();
  const cq = res.find(o => o.name === 'cq_5m');
  console.log('cq:', JSON.stringify(cq, null, 2))

  // TODO
  // '3667.T'.split('.')[0] = symbol
  // 判断CQ是否存在，不存在则创建
  done();
};

describe('DDE服务测试', () => {
  it('测试是否启动成功', function (done) {
    this.timeout(20000);
    // testStart(done); // done();
    done();
  });
  it('测试Influx', function (done) {
    this.timeout(20000);
    testInflux(done); // done();
  });
});
