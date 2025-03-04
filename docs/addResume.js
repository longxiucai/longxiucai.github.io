document.addEventListener("DOMContentLoaded", function () {
  // ==================== 悬浮按钮 ====================
  const toggleButton = document.createElement("div");
  toggleButton.style.position = "fixed";
  toggleButton.style.width = "100px";
  toggleButton.style.height = "50px";
  toggleButton.style.lineHeight = "50px";
  toggleButton.style.textAlign = "center";
  toggleButton.style.background = "linear-gradient(135deg, #3498db, #5dade2)";
  toggleButton.style.color = "rgba(20,20,20)";
  toggleButton.style.borderRadius = "25px";
  toggleButton.style.cursor = "pointer";
  toggleButton.style.fontSize = "18px";
  toggleButton.style.fontWeight = "bold";
  toggleButton.style.userSelect = "none";
  toggleButton.style.zIndex = "10000";
  toggleButton.style.top = "10px";
  toggleButton.style.left = "10px";
  toggleButton.style.padding = "0 20px";
  toggleButton.style.display = "flex";
  toggleButton.style.alignItems = "center";
  toggleButton.style.justifyContent = "center";
  toggleButton.style.border = "none";
  toggleButton.style.boxShadow = "0 3px 8px rgba(52, 152, 219)";
  toggleButton.style.transition = "all 0.3s ease";
  toggleButton.style.touchAction = "manipulation";
  toggleButton.style.webkitTapHighlightColor = "transparent";

  // 按钮图标
  const icon = document.createElement("img");
  icon.src = "https://longxiucai.github.io/icons8-resume-50.png";
  icon.style.width = "30px";
  icon.style.height = "30px";
  icon.style.marginRight = "3px";
  icon.style.verticalAlign = "middle";

  // 按钮文字
  const text = document.createElement("span");
  text.innerText = "About";
  text.style.verticalAlign = "middle";

  toggleButton.appendChild(icon);
  toggleButton.appendChild(text);
  document.body.appendChild(toggleButton);

  // ==================== 简历容器 ====================
  const resumeWrapper = document.createElement("div");
  resumeWrapper.id = "resume-wrapper";
  resumeWrapper.style.position = "fixed";
  resumeWrapper.style.transition = "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)";
  resumeWrapper.style.overflow = "auto";
  resumeWrapper.style.backgroundColor = "#fff";
  resumeWrapper.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.3)";
  resumeWrapper.style.zIndex = "9999";
  resumeWrapper.style.transform = "scale(0)";
  resumeWrapper.style.borderRadius = "10px";
  resumeWrapper.style.padding = "0";
  resumeWrapper.style.opacity = "0";
  resumeWrapper.style.pointerEvents = "auto";
  resumeWrapper.style.boxSizing = "border-box";

  // iframe容器
  const iframeContainer = document.createElement("div");
  iframeContainer.style.width = "100%";
  iframeContainer.style.height = "100%";
  
  const resumeIframe = document.createElement("iframe");
  resumeIframe.src = "https://longxiucai.github.io/resume.html";
  resumeIframe.style.width = "100%";
  resumeIframe.style.height = "100%";
  resumeIframe.style.border = "none";
  resumeIframe.style.pointerEvents = "auto";
  
  iframeContainer.appendChild(resumeIframe);
  resumeWrapper.appendChild(iframeContainer);
  document.body.appendChild(resumeWrapper);

  // ==================== 核心逻辑 ====================
  let isResumeVisible = false;
  let isMobile = window.innerWidth <= 768;
  let lastWindowHeight = window.innerHeight;
  let hideTimer;

  // 更新按钮位置（移动端滚动隐藏）
  function updateButtonPosition() {
    if (window.innerWidth < 601) {
      const initialTop = 25;
      const scrollOffset = window.scrollY;
      const newTop = initialTop - scrollOffset;

      toggleButton.style.opacity = newTop < -60 ? "0" : "1";
      toggleButton.style.pointerEvents = newTop < -60 ? "none" : "auto";
      toggleButton.style.position = "absolute";
      toggleButton.style.top = `${newTop}px`;
      toggleButton.style.left = "60px";
    } else {
      toggleButton.style.position = "fixed";
      toggleButton.style.top = "10px";
      toggleButton.style.left = "10px";
      toggleButton.style.opacity = "1";
      toggleButton.style.pointerEvents = "auto";
    }
  }

  // 显示简历
  function showResume() {
    clearTimeout(hideTimer);
    isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      resumeWrapper.style.width = `${window.innerWidth - 40}px`;
      resumeWrapper.style.height = `${window.innerHeight * 0.9}px`;
      resumeWrapper.style.left = "20px";
      resumeWrapper.style.top = `${window.innerHeight * 0.05}px`;
      resumeWrapper.style.transform = "scale(1)";
    } else {
      const buttonRect = toggleButton.getBoundingClientRect();
      resumeWrapper.style.width = "880px";
      resumeWrapper.style.height = "565px";
      resumeWrapper.style.left = `${buttonRect.left}px`;
      resumeWrapper.style.top = `${buttonRect.top + 60}px`;
      resumeWrapper.style.transform = "scale(1)";
    }
    
    resumeWrapper.style.opacity = "1";
    isResumeVisible = true;
  }

  // 隐藏简历
  function hideResume() {
    resumeWrapper.style.transform = "scale(0)";
    resumeWrapper.style.opacity = "0";
    isResumeVisible = false;
  }

  // ==================== 事件监听 ====================
  // 统一交互
  function handleToggle() {
    if (!isResumeVisible) {
      showResume();
    } else {
      hideResume();
    }
  }

  // 点击事件
  toggleButton.addEventListener("click", handleToggle);
  
  // 移动端触摸事件
  toggleButton.addEventListener("touchstart", function(e) {
    e.preventDefault();
    handleToggle();
  });

  // PC端悬停逻辑
  if (!isMobile) {
    let hoverTimer;
    
    // 鼠标进入按钮
    toggleButton.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(showResume, 50);
    });
    
    // 鼠标离开按钮
    toggleButton.addEventListener("mouseleave", (e) => {
      clearTimeout(hoverTimer);
      if (isResumeVisible && !resumeWrapper.contains(e.relatedTarget)) {
        hideTimer = setTimeout(hideResume, 100);
      }
    });
    
    // 鼠标进入简历
    resumeWrapper.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
    });
    
    // 鼠标离开简历
    resumeWrapper.addEventListener("mouseleave", (e) => {
      if (!toggleButton.contains(e.relatedTarget)) {
        hideTimer = setTimeout(hideResume, 100);
      }
    });
  }

  // 移动端外部点击关闭
  document.addEventListener("touchend", function(e) {
    if (isMobile && isResumeVisible) {
      if (!resumeWrapper.contains(e.target) && e.target !== toggleButton) {
        hideResume();
      }
    }
  });

  // 窗口事件
  window.addEventListener("scroll", updateButtonPosition);
  window.addEventListener("resize", () => {
    isMobile = window.innerWidth <= 768;
    updateButtonPosition();
    
    // 虚拟键盘检测
    if (isMobile && Math.abs(lastWindowHeight - window.innerHeight) > 50) {
      setTimeout(() => {
        if (isResumeVisible) showResume();
      }, 300);
      lastWindowHeight = window.innerHeight;
    }
    
    if (isResumeVisible) showResume();
  });

  // 初始化
  updateButtonPosition();
});
