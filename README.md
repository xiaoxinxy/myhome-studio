# 我的家 · 院落与村庄工作室

根据自家照片与草图制作的3D院落、村庄生活和装修预览应用。当前版本 **0.10.0**，独立离线安卓App；此仓库为私人项目，包含现场照片与视频。

## 安装

从 [GitHub Release v0.10.0](https://github.com/xiaoxinxy/myhome-studio/releases/tag/v0.10.0) 下载「myhome-0.10.0.apk」（本机文件名为「我的家-0.10.0.apk」）。Android8.0+，系统WebView需支持WebGL2。模型、照片、视频和交互资源随包提供，首次启动无需电脑或网络。原签名覆盖安装可保留本机方案；卸载或清除数据会删除本机数据，建议先导出JSON备份。

本机安装包在「安装包/」，APK与校验文件同时作为Release附件保存，二进制安装包不进入Git历史。

## 功能

- 自家正房、东西厢房、前后院、两车棚与南院鸡鹅菜园；尺寸按照片估算。
- 十二户不同布局的邻居，以及小卖铺、村部、卫生所、理发店、菜地与果园，均有室内陈设。
- 丁字路网、支巷、电杆电线、排水箅子、井盖和路沿，街道有持续行驶的车辆与走动的居民。
- 小人第一/第三人称漫游、摇杆/WASD移动，开关门柜、坐下/躺下/起身、蹲下摸猫、自家车辆驾驶与骑行。
- 场所取货、问诊模拟、理发换色、浇灌采收与摘果；背景人车可招呼与停让。
- 昼夜、天气、画质调节，家具布置、材质改造、撤销重做、本机保存与JSON备份，PNG/GLB/CSV导出。

## 开发

需要Node.js20.19+或22.12+。

```sh
npm ci
npm run dev
```

打开 http://localhost:5180/ 。手机浏览器调试使用终端显示的局域网地址。

```sh
npm test
npm run build
npx playwright test
```

浏览器测试需要安装Chromium（npx playwright install chromium），也可通过PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH指定本机Chrome。离线APK测试需先构建APK，或下载当前Release的APK到「安装包/」。测试生成文件写入artifacts/和test-results/，不进入Git。scripts/check-*.mjs保留了场所、坐躺、车流及画质专项检查，需本机Chrome和已启动的开发服务。

## 安卓构建（Windows）

安装JDK17+，然后执行：

```sh
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-android.ps1
npm run android:build
```

输出到「安装包/」，构建会校验签名、资源路径、ZIP对齐和离线资源。首次准备Android工具需要网络。原签名密钥与凭据仅保存在本机.android-signing/，不会上传；在其他电脑继续发布覆盖升级包前，需要从安全备份恢复该目录。切勿替换现有签名密钥。

本机可执行npm run android:download，打开终端中的8090端口地址下载安装包。此入口只用于下载，安装完成后App独立运行。

## 目录

|目录|内容|
|---|---|
|src/|户型与碰撞模型、3D渲染、界面、交互和本机存储|
|public/references/|项目使用的现场照片与视频|
|android-app/src/、res/|原生安卓容器与资源|
|scripts/|构建、校验、下载服务和专项检查|
|tests/、src/model/*.test.ts|浏览器流程与模型逻辑测试|
|docs/verification/|当前版本验证记录、性能数据和代表截图|
|安装包/|当前APK（本机/Release）及校验与使用说明|
|artifacts/|可重新生成的测试输出，不提交Git|

本机node_modules/、.android-tools/为继续开发所需的已安装依赖；它们与签名目录均被Git忽略。旧APK、旧网页解包、调试导出模型、重复截图和构建缓存已从项目目录清理。

## 模型参考与验证

自家布局以现场资料与使用者确认信息为准；邻居和公共设施为参考实景的设计，非实测村庄复原。街巷参考[山西襄汾丁村](https://main.dmctv.com.cn/villages/14102310001/Index.html)；场所参考[杂货铺](https://smiletaiwan.cw.com.tw/article/510)、[老理发店](https://www.cpanet.cn/detail_picdetail_132829.html)、[村卫生室](https://www.shsys.moa.gov.cn/ncggfw/202001/t20200109_6334574.htm)。网上照片未作为在线依赖打包。

[0.10.0验证记录](docs/verification/verification-0.10.0.md)：50项逻辑测试通过，场所/坐躺/车流浏览器检查及最终APK断网测试通过。分级加载、静态/动态实例合批、附近碰撞查询与稳定的自适应分辨率控制用于减少开销。同分辨率街道软件渲染平均耗时193.4ms→195.6ms，新增内容后基本持平；这不是手机FPS，尚未进行安卓真机长期掉帧测试。
