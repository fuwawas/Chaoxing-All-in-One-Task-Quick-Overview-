// ==UserScript==
// @name         学习通作业考试全能速览
// @namespace    https://github.com/lcandy2/user.js/tree/main/websites/chaoxing.com/chaoxing-assignment
// @version      1.0 修复页面空白版
// @author       FURUL (fuwawas) + 空白修复
// @description  支持作业、考试列表快速查看 | 修复页面空白问题
// @license      AGPL-3.0-or-later
// @copyright    fuwawas All Rights Reserved
// @homepage     https://greasyfork.org/scripts/495345
// @homepageURL  https://greasyfork.org/scripts/495345
// @source       https://github.com/lcandy2/user.js/tree/main/websites/chaoxing.com/chaoxing-assignment
// @match        *://i.chaoxing.com/base*
// @match        *://mooc1-api.chaoxing.com/work/stu-work*
// @match        *://mooc1-api.chaoxing.com/exam-ans/exam/phone/examcode*
// @require      https://registry.npmmirror.com/vue/3.4.27/files/dist/vue.global.prod.js
// @require      data:application/javascript,%3Bwindow.Vue%3DVue%3B
// @require      https://registry.npmmirror.com/vuetify/3.6.6/files/dist/vuetify.min.js
// @require      data:application/javascript,%3B
// @resource     VuetifyStyle https://registry.npmmirror.com/vuetify/3.6.6/files/dist/vuetify.min.css
// @resource     MaterialIcons https://fonts.googleapis.com/icon?family=Material+Icons
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-end
// ==/UserScript==

(function (Vuetify, Vue) {
  'use strict';

  // 核心配置（基于提供的HTML结构）
  const CONFIG = {
    homeworkUrl: 'https://mooc1-api.chaoxing.com/work/stu-work#chaoxing-assignment',
    examUrl: 'https://mooc1-api.chaoxing.com/exam-ans/exam/phone/examcode#chaoxing-assignment',
    // 精准导航栏父容器（从HTML中提取的唯一选择器）
    menuParentSelector: '.menu-list-ul',
    // 按钮配置（模仿现有导航项结构）
    buttons: [
      {
        id: 'first1000001',
        name: '全部作业',
        iconClass: 'icon-space icon-bj', // 复用现有图标class
        dataId: '1000001',
        url: 'https://mooc1-api.chaoxing.com/work/stu-work#chaoxing-assignment'
      },
      {
        id: 'first1000002',
        name: '全部考试',
        iconClass: 'icon-space icon-cj', // 复用现有图标class
        dataId: '1000002',
        url: 'https://mooc1-api.chaoxing.com/exam-ans/exam/phone/examcode#chaoxing-assignment'
      }
    ]
  };

  // 加载样式（仅加载Vuetify和图标，不删除原页面样式）
  const cssLoader = key => GM_addStyle(GM_getResourceText(key));
  cssLoader("VuetifyStyle");
  cssLoader("MaterialIcons");


  // -------------------------- 修复：导航按钮正常显示（不破坏页面） --------------------------
  const createNavButtons = () => {
    const menuParent = document.querySelector(CONFIG.menuParentSelector);
    if (!menuParent) {
      console.error('[适配失败] 未找到导航栏父容器：', CONFIG.menuParentSelector);
      return;
    }

    CONFIG.buttons.forEach(btnConfig => {
      if (document.getElementById(btnConfig.id)) return;

      // 1. 创建li容器（完全模仿现有结构）
      const liElement = document.createElement('li');
      liElement.setAttribute('level', '1');
      liElement.setAttribute('parent-id', '');
      liElement.setAttribute('table-type', '1');
      liElement.setAttribute('parent-type', '');
      liElement.setAttribute('data-id', btnConfig.dataId);
      liElement.style = '';

      // 2. 创建按钮核心div（完全模仿现有.label-item结构）
      const btnElement = document.createElement('div');
      btnElement.id = btnConfig.id;
      btnElement.setAttribute('role', 'menuitem');
      btnElement.setAttribute('level', '1');
      btnElement.setAttribute('focus_element', '0');
      btnElement.setAttribute('tabindex', '-1');
      btnElement.setAttribute('name', btnConfig.name);
      btnElement.setAttribute('imgName', 'icon-home');
      btnElement.setAttribute('dataurl', btnConfig.url);
      btnElement.setAttribute('class', 'label-item');
      btnElement.setAttribute('onclick', `setUrl('${btnConfig.dataId}','${btnConfig.url}',this,'0','${btnConfig.name}')`);
      btnElement.setAttribute('aria-label', `${btnConfig.name}菜单项`);

      // 3. 按钮内部结构（图标+文字+箭头）
      btnElement.innerHTML = `
        <span class="${btnConfig.iconClass}"></span>
        <h3 title="${btnConfig.name}">${btnConfig.name}</h3>
        <span class="slide-arrow icon-h-arrow-l hide"></span>
      `;

      // 4. 添加子菜单容器（模仿现有结构）
      const subMenuContainer = document.createElement('div');
      subMenuContainer.className = 'school-level';
      subMenuContainer.innerHTML = '<ul></ul>';

      // 5. 组装并插入到导航栏最前面
      liElement.appendChild(btnElement);
      liElement.appendChild(subMenuContainer);
      menuParent.prepend(liElement);

      console.log(`[适配成功] 已添加${btnConfig.name}按钮`);
    });
  };


  // -------------------------- 修复：任务列表提取（不依赖被隐藏的容器） --------------------------
  function extractTasks() {
    // 直接从原页面提取作业元素（去掉#chaoxing-assignment-wrapper的依赖）
    const taskElements = document.querySelectorAll('ul.nav > li');
    return Array.from(taskElements).map(task => {
      const option = task.querySelector('div[role="option"]');
      const raw = task.getAttribute("data") || "";
      const url = raw ? new URL(raw) : null;
      return {
        title: option?.querySelector("p")?.textContent || "",
        status: option?.querySelector("span:nth-of-type(1)")?.textContent || "",
        uncommitted: option?.querySelector("span:nth-of-type(1)")?.className.includes("status") || false,
        course: option?.querySelector("span:nth-of-type(2)")?.textContent || "",
        leftTime: option?.querySelector(".fr")?.textContent || "",
        workId: url?.searchParams.get("taskrefId") || "",
        courseId: url?.searchParams.get("courseId") || "",
        clazzId: url?.searchParams.get("clazzId") || "",
        raw
      };
    });
  }

  function extractExams() {
    // 直接从原页面提取考试元素（去掉#chaoxing-assignment-wrapper的依赖）
    const examElements = document.querySelectorAll('ul.ks_list > li');
    return Array.from(examElements).map(exam => {
      const dl = exam.querySelector("dl");
      const img = exam.querySelector("div.ks_pic > img");
      const raw = exam.getAttribute("data") || "";
      const url = raw ? new URL(window.location.protocol + "//" + window.location.host + raw) : null;
      const status = exam.querySelector("span.ks_state")?.textContent || "";
      return {
        title: dl?.querySelector("dt")?.textContent || "",
        status,
        timeLeft: dl?.querySelector("dd")?.textContent || "",
        expired: img?.getAttribute("src")?.includes("ks_02") || false,
        finished: status.includes("已完成") || status.includes("待批阅"),
        examId: url?.searchParams.get("taskrefId") || "",
        courseId: url?.searchParams.get("courseId") || "",
        classId: url?.searchParams.get("classId") || "",
        raw
      };
    });
  }


  // -------------------------- Vue组件和Vuetify配置（保留） --------------------------
  const API_VISIT_COURSE = "https://mooc1.chaoxing.com/visit/stucoursemiddle?ismooc2=1";
  const API_OPEN_EXAM = "https://mooc1-api.chaoxing.com/exam-ans/exam/test/examcode/examnotes";

  const TasksList = Vue.defineComponent({
    __name: "tasks-list",
    setup() {
      const tasks = extractTasks();
      const search = Vue.ref("");
      const headers = [
        { key: "title", title: "作业名称" },
        { key: "course", title: "课程" },
        { key: "leftTime", title: "剩余时间" },
        { key: "status", title: "状态" },
        { key: "action", title: "", sortable: false }
      ];
      const getLink = item => {
        const url = new URL(API_VISIT_COURSE);
        url.searchParams.append("courseid", item.courseId);
        url.searchParams.append("clazzid", item.clazzId);
        return url.href;
      };
      return () => Vue.h("v-card", { title: "作业列表", variant: "flat", style: { margin: '20px' } }, [
        Vue.h("v-text-field", {
          modelValue: search.value,
          "onUpdate:modelValue": v => search.value = v,
          label: "搜索",
          "prepend-inner-icon": "search",
          variant: "outlined",
          "hide-details": true,
          "single-line": true
        }),
        Vue.h("v-data-table", {
          items: tasks,
          search: search.value,
          hover: true,
          headers,
          sticky: true,
          "items-per-page": -1,
          "hide-default-footer": true,
          "item.action": ({ item }) => Vue.h("v-btn", {
            variant: item.uncommitted ? "tonal" : "plain",
            color: "primary",
            href: getLink(item),
            target: "_blank"
          }, item.uncommitted ? "立即完成" : "查看详情")
        })
      ]);
    }
  });

  const ExamsList = Vue.defineComponent({
    __name: "exams-list",
    setup() {
      const exams = extractExams();
      const search = Vue.ref("");
      const headers = [
        { key: "title", title: "考试名称" },
        { key: "timeLeft", title: "剩余时间" },
        { key: "status", title: "状态" },
        { key: "action", title: "", sortable: false }
      ];
      const getLink = item => {
        const url = new URL(API_OPEN_EXAM);
        url.searchParams.append("courseId", item.courseId);
        url.searchParams.append("classId", item.classId);
        url.searchParams.append("examId", item.examId);
        return url.href;
      };
      return () => Vue.h("v-card", { title: "考试列表", variant: "flat", style: { margin: '20px' } }, [
        Vue.h("v-text-field", {
          modelValue: search.value,
          "onUpdate:modelValue": v => search.value = v,
          label: "搜索",
          "prepend-inner-icon": "search",
          variant: "outlined",
          "hide-details": true,
          "single-line": true
        }),
        Vue.h("v-data-table", {
          items: exams,
          search: search.value,
          hover: true,
          headers,
          sticky: true,
          "items-per-page": -1,
          "hide-default-footer": true,
          "item.action": ({ item }) => Vue.h("v-btn", {
            variant: item.finished || item.expired ? "plain" : "tonal",
            color: "primary",
            href: getLink(item),
            target: "_blank"
          }, item.finished || item.expired ? "查看详情" : "前往考试")
        })
      ]);
    }
  });

  const appendApp = () => {
    const vuetify = Vuetify.createVuetify({
      icons: {
        defaultSet: "md",
        sets: { md: { component: props => Vue.h("span", { class: "material-icons" }, props.icon) } }
      }
    });
    // 创建独立容器挂载Vue组件，不影响原页面
    const appContainer = document.createElement("div");
    appContainer.style = "margin: 20px;";
    document.body.appendChild(appContainer);
    
    const app = Vue.createApp(urlDetection() === "homework" ? TasksList : ExamsList);
    app.use(vuetify).mount(appContainer);
  };


  // -------------------------- 修复：主逻辑（不破坏原页面） --------------------------
  const urlDetection = () => {
    const url = window.location.href;
    const hash = window.location.hash;
    if (hash.includes("chaoxing-assignment")) {
      return url.includes("work/stu-work") ? "homework" : url.includes("examcode") ? "exam" : "unknown";
    }
    return url.includes("i.chaoxing.com/base") ? "newHome" : "unknown";
  };

  const init = () => {
    const urlType = urlDetection();
    console.log(`[精准适配] 当前页面：${urlType}`);

    if (urlType === "newHome") {
      // 延迟100ms确保导航栏加载完成
      setTimeout(() => {
        createNavButtons();
      }, 100);
    } else if (urlType === "homework" || urlType === "exam") {
      // 移除破坏页面的操作（wrap/remove），直接挂载Vue组件
      appendApp();
    }
  };


  // 启动初始化（监听DOM加载完成）
  if (document.readyState === "complete" || document.readyState === "interactive") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }

})(Vuetify, Vue);