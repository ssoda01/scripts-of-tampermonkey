// ==UserScript==
// @name         B站动态评论批量点赞(2.0全自动大更新)
// @namespace    https://github.com/ssoda01
// @version      2.0
// @description  Bilibili dynamic comments batch likes(2.0 full automatic)
// @author       sodakoo
// @match        https://www.bilibili.com/opus/*
// @match        https://t.bilibili.com/*
// @license      GPL-3.0-only
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let loadAllBtn = null;
    let autoBtn = null;
    let isLoadingAll = false;
    let isAutoRunning = false;

    if (window.location.href.match(/^https:\/\/t\.bilibili\.com\/\d+\??.*$/) || window.location.href.match(/^https:\/\/www\.bilibili\.com\/opus\/\d+\??.*$/)) {
        const styleBatchLikes = `
    .batch-like-panel {
        position: fixed;
        top: 80px;
        right: 120px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 200px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .batch-like-panel button {
        box-sizing: border-box;
        width: 100%;
        margin: 0;
        cursor: pointer;
        transition: .2s ease;
        font-family: inherit;
    }
    .batch-like-primary {
        height: 44px;
        border: none;
        border-radius: 22px;
        background: #00AEEC;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        letter-spacing: 0.02em;
        box-shadow: 0 8px 20px #00aeec55;
    }
    .batch-like-primary:hover {
        background: #00a0db;
        box-shadow: 0 10px 24px #00aeec66;
    }
    .batch-like-secondary-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 8px;
        border-radius: 16px;
        background: #ffffffcc;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 14px #00000014;
    }
    .batch-like-secondary {
        height: 32px;
        border: 1px solid #d0d3d8;
        border-radius: 16px;
        background: transparent;
        color: #6b7078;
        font-size: 13px;
        font-weight: 400;
    }
    .batch-like-secondary:hover {
        border-color: #00AEEC;
        color: #00AEEC;
        background: #00aeec0f;
    }
`
        var style = document.createElement('style');
        style.innerHTML = styleBatchLikes;
        document.head.appendChild(style);

        const panel = document.createElement('div');
        panel.className = 'batch-like-panel';

        autoBtn = document.createElement('button');
        autoBtn.className = 'batch-like-primary';
        autoBtn.textContent = "一键全自动";
        panel.appendChild(autoBtn);

        const secondaryGroup = document.createElement('div');
        secondaryGroup.className = 'batch-like-secondary-group';

        loadAllBtn = document.createElement('button');
        loadAllBtn.className = 'batch-like-secondary';
        loadAllBtn.textContent = "加载全部评论";
        secondaryGroup.appendChild(loadAllBtn);

        const button = document.createElement('button');
        button.className = 'batch-like-secondary';
        button.textContent = "预览点赞";
        secondaryGroup.appendChild(button);

        const button2 = document.createElement('button');
        button2.className = 'batch-like-secondary';
        button2.textContent = "批量点赞";
        secondaryGroup.appendChild(button2);

        const button3 = document.createElement('button');
        button3.className = 'batch-like-secondary';
        button3.textContent = "批量取消赞";
        secondaryGroup.appendChild(button3);

        panel.appendChild(secondaryGroup);
        document.body.appendChild(panel);

        autoBtn.addEventListener('click', function () {
            if (isAutoRunning || isLoadingAll) {
                stopAllTasks();
                return;
            }
            runAutoLikeAll();
        });

        loadAllBtn.addEventListener('click', function () {
            if (isLoadingAll) {
                stopAllTasks();
                return;
            }
            loadAllComments();
        });

        button.addEventListener('click', function () {
            highlightListItems(getBatchList('get_all_unliked'))
        });

        button2.addEventListener('click', function () {
            likeListItems(getBatchList('get_all_unliked'))
        });

        button3.addEventListener('click', function () {
            likeListItems(getBatchList('get_all_liked'))
        });
    }

    function stopAllTasks() {
        isLoadingAll = false;
        isAutoRunning = false;
        if (loadAllBtn) loadAllBtn.textContent = "加载全部评论";
        if (autoBtn) autoBtn.textContent = "一键全自动";
    }

    function setStatus(text) {
        if (isAutoRunning && autoBtn) {
            autoBtn.textContent = text;
        } else if (loadAllBtn) {
            loadAllBtn.textContent = text;
        }
    }

    // 新版评论在 Shadow DOM 里，普通 querySelector 穿不透
    function queryAllDeep(selector, root = document) {
        const results = []
        const visit = (node) => {
            if (!node) return
            if (node.querySelectorAll) {
                results.push(...node.querySelectorAll(selector))
                for (const el of node.querySelectorAll('*')) {
                    if (el.shadowRoot) visit(el.shadowRoot)
                }
            }
        }
        visit(root)
        return results
    }

    // 已赞：fill 图标 + brand_blue；未赞：line 图标
    function isLikedIcon(icon) {
        if (!icon) return false
        const iconName = icon.getAttribute('icon') || ''
        if (iconName.includes('hand_thumbsup_fill')) return true
        if (iconName.includes('hand_thumbsup_line')) return false
        const style = icon.getAttribute('style') || ''
        return style.includes('brand_blue') || style.includes('--brand_blue')
    }

    function getCommentHost(el) {
        let node = el
        while (node) {
            const root = node.getRootNode && node.getRootNode()
            if (root instanceof ShadowRoot) {
                node = root.host
                const tag = (node.tagName || '').toLowerCase()
                if (tag === 'bili-comment-renderer' || tag === 'bili-comment-thread-renderer') {
                    return node
                }
                continue
            }
            node = node.parentElement
        }
        return null
    }

    // 主评论 = bili-comment-renderer；楼中楼 = bili-comment-reply-renderer
    function isMainComment(el) {
        let node = el
        while (node) {
            const root = node.getRootNode && node.getRootNode()
            if (root instanceof ShadowRoot) {
                node = root.host
                const tag = (node.tagName || '').toLowerCase()
                if (tag === 'bili-comment-reply-renderer') return false
                if (tag === 'bili-comment-renderer') return true
                continue
            }
            node = node.parentElement
        }
        return false
    }

    function getScrollHeight() {
        return Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
        )
    }

    function countMainComments() {
        return queryAllDeep('bili-comment-renderer').length
    }

    async function loadAllComments({ silent = false } = {}) {
        if (isLoadingAll) return countMainComments()
        isLoadingAll = true
        setStatus("加载中…(再点停止)")

        let stableRounds = 0
        const STABLE_NEED = 4
        const INTERVAL = 800
        let lastHeight = 0
        let lastCount = 0

        while (isLoadingAll) {
            window.scrollTo(0, getScrollHeight())

            await new Promise((r) => setTimeout(r, INTERVAL))
            if (!isLoadingAll) break

            const height = getScrollHeight()
            const count = countMainComments()
            if (height <= lastHeight && count <= lastCount) {
                stableRounds++
            } else {
                stableRounds = 0
                lastHeight = height
                lastCount = count
            }

            setStatus(`加载中…${count}条(再点停止)`)

            if (stableRounds >= STABLE_NEED) break
        }

        const finalCount = countMainComments()
        const stopped = !isLoadingAll
        isLoadingAll = false
        if (!isAutoRunning && loadAllBtn) loadAllBtn.textContent = "加载全部评论"
        if (!silent && !stopped) {
            alert(`加载完成，当前主评论约 ${finalCount} 条。`)
        }
        return finalCount
    }

    // 页面外层 CSS 穿不进 Shadow DOM；把高亮样式注入到评论内部 #body
    const HIGHLIGHT_STYLE = `
        :host(.🐈) #body {
            background: #e3a2a233 !important;
            outline: 2px solid #e3a2a2;
            border-radius: 8px;
            box-sizing: border-box;
        }
    `

    function ensureHighlightStyle(host) {
        const root = host && host.shadowRoot
        if (!root || root.querySelector('style[data-batch-like-hl]')) return
        const style = document.createElement('style')
        style.setAttribute('data-batch-like-hl', '1')
        style.textContent = HIGHLIGHT_STYLE
        root.appendChild(style)
    }

    function markComment(host) {
        if (!host) return
        ensureHighlightStyle(host)
        host.classList.add('🐈')
    }

    function clearHighlights() {
        for (const host of queryAllDeep('bili-comment-renderer, bili-comment-thread-renderer')) {
            host.classList.remove('🐈')
        }
    }

    function getBatchList(type) {
        const itemList = []
        const actionRenderers = queryAllDeep('bili-comment-action-buttons-renderer')
        for (const renderer of actionRenderers) {
            const root = renderer.shadowRoot
            if (!root) continue
            const likeBtn = root.querySelector('#like button')
            const icon = root.querySelector('#like bili-icon')
            if (!likeBtn || !icon) continue
            if (!isMainComment(likeBtn)) continue

            const liked = isLikedIcon(icon)
            if (type === 'get_all_liked' && liked) {
                itemList.push(likeBtn)
            } else if (type === 'get_all_unliked' && !liked) {
                itemList.push(likeBtn)
            }
        }
        return itemList
    }

    function highlightListItems(list, { silent = false } = {}) {
        clearHighlights()
        let counter = 0
        for (const item of list) {
            counter++
            markComment(getCommentHost(item))
        }
        if (!silent) {
            setTimeout(() => {
                alert(`预览点赞完成，预计会赞${counter}条主评论。当前未赞评论已标红。`)
            }, 100)
        }
        return counter
    }

    function likeListItems(list, { silent = false, onProgress = null } = {}) {
        const TIME_STEP = 1000
        const total = list.length

        return new Promise((resolve) => {
            if (total === 0) {
                if (!silent) alert(`批量操作完成，本次赞/取消了0条主评论。`)
                resolve(0)
                return
            }

            let counter = 0
            for (const item of list) {
                counter++
                const index = counter
                setTimeout(() => {
                    // 全自动中途停止后，跳过尚未执行的点击
                    if (silent && !isAutoRunning) return
                    const host = getCommentHost(item)
                    if (host) host.scrollIntoView({ block: 'center', inline: 'nearest' })
                    item.click()
                    if (onProgress) onProgress(index, total)
                }, TIME_STEP * index)
            }
            setTimeout(() => {
                clearHighlights()
                if (!silent) {
                    alert(`批量操作完成，本次赞/取消了${total}条主评论。`)
                }
                resolve(total)
            }, TIME_STEP * total + TIME_STEP)
        })
    }

    async function runAutoLikeAll() {
        if (isAutoRunning) return
        isAutoRunning = true
        setStatus("全自动·加载中…")

        try {
            const loaded = await loadAllComments({ silent: true })
            if (!isAutoRunning) return

            setStatus("全自动·预览中…")
            const list = getBatchList('get_all_unliked')
            const previewCount = highlightListItems(list, { silent: true })
            await new Promise((r) => setTimeout(r, 600))
            if (!isAutoRunning) return

            if (previewCount === 0) {
                alert(`全自动完成：已加载约 ${loaded} 条主评论，无需点赞。`)
                return
            }

            setStatus(`全自动·点赞 0/${previewCount}`)
            await likeListItems(list, {
                silent: true,
                onProgress: (i, total) => {
                    if (isAutoRunning) setStatus(`全自动·点赞 ${i}/${total}`)
                }
            })

            if (isAutoRunning) {
                alert(`全自动完成：加载约 ${loaded} 条，已点赞 ${previewCount} 条主评论。`)
            }
        } finally {
            isAutoRunning = false
            isLoadingAll = false
            if (loadAllBtn) loadAllBtn.textContent = "加载全部评论"
            if (autoBtn) autoBtn.textContent = "一键全自动"
        }
    }
})();
