// ==UserScript==
// @name         护眼绿色背景样式@tc39
// @namespace    https://github.com/ssoda01
// @version      1.0
// @description  将 https://tc39.es/ecma262/ 页面的背景样式更改为护眼的绿色。
// @author       sodakoo
// @match        https://tc39.es/ecma262/*
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // 创建一个样式节点
    var style = document.createElement('style');
    style.innerHTML = `
        body {
            background-color: #cdeccd !important;
            color: #333333 !important;
        }
    `; // 设置背景颜色为绿色，文字颜色为深灰色

    // 将样式节点添加到文档头部
    document.head.appendChild(style);
})();