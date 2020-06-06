// ==UserScript==
// @name         bilibiliTool
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  bilibili工具箱
// @author       RaMui
// @match        *://*.bilibili.com/*
// @grant        none
// ==/UserScript==


/**
 * 监听页面切换
 */
const pageListener = () => {
    const config = { attributes: true, childList: true, subtree: true };
    const callback = (mutationsList) => {
        mutationsList.forEach(item => {
            if (item.target.className === 'clearfix col-full') {
                item.target.children[1].children[0].children[0].children[1].onclick = () => addUnsubscribe();
            }
            if (item.target.className === 'follow-content section') {
                document.querySelector('.batch').onclick = () => addUnsubscribe();
                addUnsubscribe();
            }
        });
        // 处理异常的取消操作，比如不反选/点返回而是直接切换页面
        if (document.getElementsByClassName('relation-list').length < 1) {
            cleanUnsubscribeIdList();
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.querySelector('.s-space'), config);
}

/**
 * 获取用户cookie信息
 */
const getCookie = () => {
    let cookie = '';
    document.cookie.split(';').forEach(v => {
        if (v.includes('bili_jct')) {
            cookie = v.split('=')[1];
        }
    });
    return cookie;
}

/**
 * 获取视频av号和封面
 */
const getAVNumAndPic = () => {
    if (window.location.href.includes('/video/')) {
        const picUrl = document.querySelector('meta[itemprop=image]').content;
        const url = document.querySelector('meta[itemprop=url]').content;
        setTimeout(() => {
            const li = document.createElement('li');
            li.innerText = '下载封面';
            li.onclick = () => picDownload(picUrl);
            document.querySelector('.more-ops-list').querySelector('ul').appendChild(li);
            const picLi = document.createElement('li');
            picLi.innerText = '查看封面';
            picLi.onclick = () => window.open(picUrl);
            document.querySelector('.more-ops-list').querySelector('ul').appendChild(picLi);
            if (!window.location.href.includes('/video/av')) {
                const urlLi = document.createElement('li');
                urlLi.innerText = '回到av号';
                urlLi.onclick = () => { window.location.href = url };
                document.querySelector('.more-ops-list').querySelector('ul').appendChild(urlLi);
            }
        }, 2000);
    }
}

/**
 * 增加取消关注按钮和点击事件
 */
const addUnsubscribe = () => {
    const span = document.createElement('span');
    const cookie = getCookie();
    span.setAttribute('class', 'select-cancel');
    span.setAttribute('style', 'display:none;margin-left:5px');
    span.setAttribute('id', 'unsubscribeId');
    span.innerText = '取消关注';
    if (document.querySelector('.back-to-info.icon') !== null) {
        document.querySelector('.back-to-info.icon').onclick = () => cleanUnsubscribeIdList();
    }
    span.onclick = () => {
        const list = window.localStorage.getItem('unsubscribeList');
        if (list !== null && JSON.parse(list).length > 0) {
            JSON.parse(list).forEach(value => {
                setTimeout(() => {
                    unsubscribeFunc(cookie, value);
                }, 1000);
            });
        }
        cleanUnsubscribeIdList();
        alert('已取消关注');
        location.reload();
    }
    if (document.querySelector('.edit-detail') !== null) {
        document.querySelector('.edit-detail').appendChild(span);
    }
    const div = document.getElementsByClassName('relation-list')[0].getElementsByClassName('follow-select');
    for (let i = 0; i < div.length; i++) {
        div[i].onclick = (e) => saveUnsubscribeIdList(e);
    }
}

/**
 * 保存需要取消关注的up主id
 * @param {*} e 当前选中的up主
 */
const saveUnsubscribeIdList = (e) => {
    const reg = new RegExp('/', 'g');
    const uid = e.target.parentNode.nextSibling.pathname.replace(reg, '');
    if (e.target.className === 'icon icon-follow-watched icon-follow-selected') {
        document.getElementById('unsubscribeId').style.display = '';
        if (window.localStorage.getItem('unsubscribeList') === null) {
            const list = [];
            list.push(uid);
            window.localStorage.setItem('unsubscribeList', JSON.stringify(list));
        } else {
            const oldList = JSON.parse(window.localStorage.getItem('unsubscribeList'));
            oldList.push(uid);
            window.localStorage.setItem('unsubscribeList', JSON.stringify(oldList));
        }
    } else {
        const list = JSON.parse(window.localStorage.getItem('unsubscribeList'));
        for (let i = 0; i < list.length; i++) {
            if (uid === list[i]) {
                list.splice(i, 1);
            }
        }
        if (list.length === 0) {
            document.getElementById('unsubscribeId').style.display = 'none';
        }
        window.localStorage.setItem('unsubscribeList', JSON.stringify(list));
    }
}

/**
 * 清除选中的所有up主
 */
const cleanUnsubscribeIdList = () => {
    window.localStorage.removeItem('unsubscribeList');
}
/**
 * 取消关注
 */
const unsubscribeFunc = (cookie, uid) => {
    const formData = new FormData();
    formData.append("fid", uid);
    formData.append("act", 2);
    formData.append("re_src", 11);
    formData.append("jsonp", 'jsonp');
    formData.append("csrf", cookie);
    const request = new XMLHttpRequest();
    request.withCredentials = true;
    request.open("POST", "https://api.bilibili.com/x/relation/modify");
    request.send(formData);
}

const setListener = () => {
    if (window.location.href.includes('https://space.bilibili.com')) {
        setTimeout(() => {
            pageListener();
            if (window.location.href.includes('/fans/follow')) {
                document.querySelector('.batch').onclick = () => addUnsubscribe();
            }
        }, 1500);
    }
}

/**
 * 下载封面
 * @param {*} picUrl
 */
const picDownload = (picUrl) => {
    picUrl = picUrl.replace('http', 'https');
    const request = new XMLHttpRequest();
    request.open('GET', picUrl, true);
    request.responseType = 'blob';
    request.onload = () => {
        const url = window.URL.createObjectURL(request.response);
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        a.click();
    }
    request.send();
}

(() => {
    'use strict';
    setListener();
    getAVNumAndPic();
    cleanUnsubscribeIdList();
})();