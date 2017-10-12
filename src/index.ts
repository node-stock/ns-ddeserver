import { DdeStream } from './lib/ddeserver';

// 启动Dde服务
DdeStream.subscribeDde();
// 注册自动登录定时器
DdeStream.regAutoLogin();
