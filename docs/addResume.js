document.addEventListener("DOMContentLoaded", function () {
  // 创建简历容器
  const resumeWrapper = document.createElement("div");
  resumeWrapper.id = "resume-wrapper";
  resumeWrapper.style.position = "fixed";
  resumeWrapper.style.transition = "all 0.5s ease"; // 添加过渡效果
  resumeWrapper.style.overflow = "hidden";  // 防止出现滚动条
  resumeWrapper.style.backgroundColor = "#fff"; // 白色背景
  resumeWrapper.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.2)"; // 增强的阴影效果
  resumeWrapper.style.zIndex = "9999";
  resumeWrapper.style.width = "0";
  resumeWrapper.style.height = "0";
  resumeWrapper.style.transform = "scale(0)"; // 初始缩小
  resumeWrapper.style.borderRadius = "10px"; // 圆角边缘
  resumeWrapper.style.padding = "20px"; // 增加内边距

  // 创建 iframe 载入简历
  const resumeIframe = document.createElement("iframe");
  resumeIframe.src = "https://longxiucai.github.io/resume.html";
  resumeIframe.style.width = "100%";
  resumeIframe.style.height = "100%";
  resumeIframe.style.border = "none";  // 去除iframe边框
  resumeIframe.style.boxSizing = "border-box";  // 防止 iframe 内容超出边界

  resumeWrapper.appendChild(resumeIframe);
  document.body.appendChild(resumeWrapper);
  // 创建悬浮按钮（改为 About Me 和图标）
  const toggleButton = document.createElement("div");
  toggleButton.style.position = "fixed";
  toggleButton.style.width = "150px"; // 设置宽度以适配文本和图标
  toggleButton.style.height = "50px";
  toggleButton.style.lineHeight = "50px";
  toggleButton.style.textAlign = "center";
  toggleButton.style.backgroundColor = "#3498db"; // 更加柔和的蓝色
  toggleButton.style.color = "#fff";
  toggleButton.style.borderRadius = "50px";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.fontSize = "16px";
  toggleButton.style.userSelect = "none";
  toggleButton.style.zIndex = "10000";
  toggleButton.style.top = "10px"; // 设置左上角的顶部距离
  toggleButton.style.left = "10px"; // 设置左上角的左边距离
  toggleButton.style.padding = "0 20px"; // 为按钮增加内边距
  toggleButton.style.transition = "background-color 0.3s ease, transform 0.2s"; // 按钮的渐变效果

  // 创建图标并插入按钮
  const icon = document.createElement("img");
  icon.src = "https://longxiucai.github.io/icons8-resume-50.png"; // 图标来源
  icon.style.width = "30px"; // 图标宽度
  icon.style.height = "30px"; // 图标高度
  icon.style.marginRight = "10px"; // 图标和文本之间的间距
  icon.style.verticalAlign = "middle"; // 让图标和文字垂直对齐

  const text = document.createElement("span");
  text.innerText = "About Me"; // 按钮文本
  text.style.verticalAlign = "middle"; // 确保文本垂直居中

  toggleButton.appendChild(icon);
  toggleButton.appendChild(text);

  document.body.appendChild(toggleButton);




  let isResumeVisible = false;
  let isClickedInsideResume = false; // 新增标记

  // 调试日志：输出按钮当前位置
  function logButtonPosition(context) {
    const rect = toggleButton.getBoundingClientRect();
    console.log(`[${context}] Button Rect:`, rect);
    return rect;
  }

  function updateResumePosition() {
    // 获取按钮的最新位置
    const buttonRect = logButtonPosition("updateResumePosition() - 获取最新按钮位置");

    // 计算动画的起始位置（使用按钮的中心）
    let startLeft = buttonRect.left + buttonRect.width / 2;
    let startTop = buttonRect.top + buttonRect.height / 2;

    console.log("动画起点（按钮中心）:", { startLeft, startTop });

    // 简历的目标宽度和高度
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const resumeWidth = Math.min(windowWidth * 0.5, 800);
    const resumeHeight = windowHeight * 0.8;

    // 计算简历的目标位置（从按钮位置展开）
    let finalLeft, finalTop;

    if (buttonRect.left + resumeWidth > windowWidth) {
      finalLeft = windowWidth - resumeWidth - 10  ; // 避免超出右侧
    } else {
      finalLeft = buttonRect.left ;
    }

    if (buttonRect.top + resumeHeight > windowHeight) {
      finalTop = windowHeight - resumeHeight - 10; // 避免超出底部
    } else {
      finalTop = buttonRect.top + buttonRect.height;
    }

    console.log("动画目标位置:", { finalLeft, finalTop, resumeWidth, resumeHeight });

    // 设置简历的初始位置和大小
    resumeWrapper.style.left = `${startLeft}px`;
    resumeWrapper.style.top = `${startTop}px`;
    resumeWrapper.style.width = "0px";
    resumeWrapper.style.height = "0px";
    resumeWrapper.style.transform = "scale(0)"; // 初始状态

    // 等待一小段时间后开始动画
    setTimeout(() => {
      resumeWrapper.style.left = `${finalLeft}px`;
      resumeWrapper.style.top = `${finalTop}px`;
      resumeWrapper.style.width = `${resumeWidth}px`;
      resumeWrapper.style.height = `${resumeHeight}px`;
      resumeWrapper.style.transform = "scale(1)"; // 放大显示
    }, 10);
  }

  toggleButton.addEventListener("click", function (event) {
    if (isResumeVisible) {
      // 关闭简历，回到按钮当前位置
      const buttonRect = logButtonPosition("关闭时按钮位置");
      console.log("按钮最新位置：", buttonRect);
      resumeWrapper.style.left = `${buttonRect.left}px`;
      resumeWrapper.style.top = `${buttonRect.top}px`;
      resumeWrapper.style.width = "0px";
      resumeWrapper.style.height = "0px";
      resumeWrapper.style.transform = "scale(0)";
      setTimeout(() => {
        isResumeVisible = false;
        console.log("简历已收起");
      }, 500);
    } else {
      updateResumePosition();
      isResumeVisible = true;
      console.log("简历展开");
    }
  });

  // 鼠标放在按钮上时自动展开
  toggleButton.addEventListener("mouseenter", function () {
    if (!isResumeVisible) {
      updateResumePosition();
      isResumeVisible = true;
      console.log("简历展开");
    }
  });

  // 鼠标离开按钮时，判断如果鼠标不在简历区域，才收起
  toggleButton.addEventListener("mouseleave", function () {
    if (isResumeVisible && !isClickedInsideResume) {
      setTimeout(() => {
        if (!resumeWrapper.matches(":hover")) {  // 确保鼠标不在简历上
          toggleButton.click(); // 触发关闭动画
          console.log("鼠标离开，简历收起");
        }
      }, 200); // 等待一小段时间，防止误触发
    }
  });

  // 如果鼠标进入简历区域时不收起
  resumeWrapper.addEventListener("mouseenter", function () {
    isClickedInsideResume = true;  // 记录鼠标进入简历区域
    console.log("鼠标进入简历区域，保持展开状态");
  });

  // 如果鼠标离开简历区域时，且不在按钮上，则收起
  resumeWrapper.addEventListener("mouseleave", function () {
    if (!toggleButton.matches(":hover")) {
      toggleButton.click(); // 触发关闭动画
      console.log("鼠标离开简历，简历收起");
    }
    isClickedInsideResume = false; // 清除标记
  });

  // 处理点击简历区域
  resumeWrapper.addEventListener("click", function () {
    isClickedInsideResume = true; // 当点击简历时，标记已点击
  });
});
