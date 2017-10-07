/**
 * 楽天証券RSS对象
 */
export enum RssStock {
  date = '現在日付',
  time = '現在値詳細時刻',
  close = '現在値',
  open = '始値',
  high = '高値',
  low = '安値',
  step1 = '歩み１',
  step2 = '歩み２',
  step3 = '歩み３',
  step4 = '歩み４',
  step1_time = '歩み１詳細時刻',
  step2_time = '歩み２詳細時刻',
  step3_time = '歩み３詳細時刻',
  step4_time = '歩み４詳細時刻',
  volume = '出来高',
  turnover = '売買代金',
  vwap = '出来高加重平均',
  over_vol = 'OVER気配数量',
  under_vol = 'UNDER気配数量',
  bid1 = '最良売気配値１',
  bid2 = '最良売気配値２',
  bid3 = '最良売気配値３',
  bid4 = '最良売気配値４',
  bid5 = '最良売気配値５',
  bid6 = '最良売気配値６',
  bid7 = '最良売気配値７',
  bid8 = '最良売気配値８',
  bid9 = '最良売気配値９',
  bid10 = '最良売気配値１０',
  bid_vol1 = '最良売気配数量１',
  bid_vol2 = '最良売気配数量２',
  bid_vol3 = '最良売気配数量３',
  bid_vol4 = '最良売気配数量４',
  bid_vol5 = '最良売気配数量５',
  bid_vol6 = '最良売気配数量６',
  bid_vol7 = '最良売気配数量７',
  bid_vol8 = '最良売気配数量８',
  bid_vol9 = '最良売気配数量９',
  bid_vol10 = '最良売気配数量１０',
  ask1 = '最良買気配値１',
  ask2 = '最良買気配値２',
  ask3 = '最良買気配値３',
  ask4 = '最良買気配値４',
  ask5 = '最良買気配値５',
  ask6 = '最良買気配値６',
  ask7 = '最良買気配値７',
  ask8 = '最良買気配値８',
  ask9 = '最良買気配値９',
  ask10 = '最良買気配値１０',
  ask_vol1 = '最良買気配数量１',
  ask_vol2 = '最良買気配数量２',
  ask_vol3 = '最良買気配数量３',
  ask_vol4 = '最良買気配数量４',
  ask_vol5 = '最良買気配数量５',
  ask_vol6 = '最良買気配数量６',
  ask_vol7 = '最良買気配数量７',
  ask_vol8 = '最良買気配数量８',
  ask_vol9 = '最良買気配数量９',
  ask_vol10 = '最良買気配数量１０'
}

/**
 * 基本订阅对象
 */
export const BasePlan = [
  RssStock.close, RssStock.open, RssStock.high, RssStock.low,
  RssStock.volume, RssStock.over_vol, RssStock.under_vol,
  RssStock.bid1, RssStock.bid_vol1, RssStock.ask1, RssStock.ask_vol1
];
