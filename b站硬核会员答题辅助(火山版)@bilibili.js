// ==UserScript==
// @name         b站硬核会员答题辅助(火山方舟ver.)
// @namespace    https://github.com/ssoda01
// @version      2025-09-08
// @description  b站硬核会员答题辅助 火山方舟ver. 可以自己选择其他模型
// @author       sodakoo
// @match        https://www.bilibili.com/h5/senior-newbie/qa
// @license      GPL-3.0-only
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==
(function () {
    'use strict';

    // 请输入你的火山CHAT API Key
    const authToken = prompt("请输入你的火山CHAT API Key:（ Authorization Token）");

    // 需要别的模型这里改
    const MODEL = "deepseek-v3-1-250821"

    // 火山方舟CHAT的ENDPOINT，一般不改（除非VOLC破坏性更新）
    const VOLC_CHAT_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

    // Prompt模板，想改可以改。
    const getPrompt = (questionText, answersText) => {
        return `只需要告诉我选哪个选项。问题: ${questionText}；选项：${answersText}`
    }

    // 后面不用改了

    let lastQuestionText = ""; // 存储上一次的文本
    let isThrottled = false; // 节流标志


    // 防抖函数
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // 节流函数
    function throttle(func, limit) {
        return function (...args) {
            if (!isThrottled) {
                func.apply(this, args);
                isThrottled = true;
                setTimeout(() => {
                    isThrottled = false;
                }, limit);
            }
        };
    }

    // 创建一个观察者实例
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                // 重新获取所有带有 fade-out 类的 senior-question 元素
                const fadeOutQuestions = document.querySelectorAll('.senior-question.fade-out');

                fadeOutQuestions.forEach(question => {
                    // 获取问题文本
                    const questionText = question.querySelector('.senior-question__qs').innerText;

                    // 获取所有答案文本
                    const answerElements = question.querySelectorAll('.senior-question__answer .senior-question__answer--item');
                    const answersText = Array.from(answerElements).map(answer => answer.innerText);

                    // 防抖处理，创建或更新内容
                    createOrUpdateContent(getPrompt(questionText, answersText));
                });
            }
        });
    });

    // 创建或更新内容的函数
    const createOrUpdateContent = throttle(debounce((questionText) => {
        // 如果新的文本和上一次的文本相同，则不发送请求
        if (questionText === lastQuestionText) {
            return;
        }

        lastQuestionText = questionText; // 更新上一次的文本

        // 使用彩色输出问题文本
        console.log('%c问题: ' + questionText, 'font-weight: bold;');

        // 发起 fetch 请求
        fetch(VOLC_CHAT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        content: questionText,
                        role: 'user'
                    }
                ],
                model: MODEL
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // 获取并处理响应中的内容
                const content = data.choices[0].message.content;

                // 使用彩色输出响应内容
                console.log('%c响应: ' + content, 'color: #279CF5; font-weight: bold;');
                // 你可以在这里处理 content，比如显示在页面上
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }, 1000), 2000); // 防抖延迟为 1000 毫秒，节流间隔为 2000 毫秒

    // 观察目标节点，配置观察选项
    const targetNode = document.body; // 你可以根据需要选择特定的父元素
    const config = { childList: true, subtree: true };

    // 开始观察
    observer.observe(targetNode, config);
})();