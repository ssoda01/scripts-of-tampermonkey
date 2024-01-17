# scripts-of-tampermonkey
简单的脚本库 记录一些小工具 with chatgpt

## 推特只看原创内容
[greasyfork](https://greasyfork.org/zh-CN/scripts/479243-%E6%8E%A8%E7%89%B9%E5%8F%AA%E7%9C%8B%E5%8E%9F%E5%88%9B%E5%86%85%E5%AE%B9)

### Release Note
#### v1.1
2023-11-19
- 新增移动端适配 #1 感谢@windy1021

## wunderwelt price tool

[greasyfork](https://greasyfork.org/zh-CN/scripts/480734-wunderwelt-price-tool)


逛wunderwelt的时候，感觉都是日元换算很麻烦。于是就有了这个插件。

### 使用方法
1. 请在最右侧输入框输入当前汇率，输入完毕后可以按下回车。
2. 左侧按钮上显示出当前汇率。点击该按钮，会自动在页面上增加CNY价格标签。
（没有汇率时按钮不会被激活）

不想看CNY价格的时候就刷新一下页面。

## boss直聘批量屏蔽外包
[greasyfork](https://greasyfork.org/zh-CN/scripts/485051-boss%E7%9B%B4%E8%81%98%E6%89%B9%E9%87%8F%E5%B1%8F%E8%94%BD%E5%A4%96%E5%8C%85)

从网上搜了一下[常见外包公司汇总](https://blog.csdn.net/qq_43073558/article/details/120855582)，拿到调用搜索接口拿到它们的encryptComId。
跑完脚本之后，会手动屏蔽23家公司。（然后boss会自动帮你追加屏蔽786家公司，显示在它的智能屏蔽的模块里。*2024年01月17日时候是这个数，随着时间的推移不一定是786。反正它会自动帮你屏蔽一系列关联公司就是了。*）

### 使用方法
1. 打开网页[boss直聘-(右上角头像菜单)-隐私保护](https://www.zhipin.com/web/geek/privacy-set?)
2. 点击【自动获取Token】
3. 点击【开始启动】
4. 运行完成，看到页面上显示的文本：“屏蔽列表添加成功，请刷新页面”后，刷新页面。

注意：为了你的账号安全，请不要在任何场合分享你的token！

### 其他
- 外包列表在代码里变量为：companyNameCodeMap。
- 懒得写关闭面板之类的功能了，有意向的朋友可以一起建设。

### 屏蔽列表
#### 手动屏蔽 23 家公司
- 上海新致软件股份有限公司
- 东软集团股份有限公司
- 江苏海隆软件技术有限公司
- 亚信科技（中国）有限公司
- 深圳市网新新思软件有限公司
- ...

#### 智能屏蔽 786 家公司
- 北京中软国际科技服务有限公司
- 深圳软通动力科技有限公司
- 上海思芮信息科技有限公司
- 无锡文思海辉信息技术有限公司
- 中软国际科技服务有限公司成都分公司
- ...
