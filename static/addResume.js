document.addEventListener("DOMContentLoaded", function () {
  // ==================== 创建悬浮按钮 ====================
  const toggleButton = document.createElement("div");
  Object.assign(toggleButton.style, {
    position: "fixed",
    width: "100px",
    height: "50px",
    lineHeight: "50px",
    textAlign: "center",
    background: "linear-gradient(135deg, #3498db, #5dade2)",
    color: "rgba(20,20,20)",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "bold",
    userSelect: "none",
    zIndex: "10000",
    top: "10px",
    left: "10px",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    boxShadow: "0 3px 8px rgba(52, 152, 219)",
    transition: "all 0.3s ease",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent"
  });

  // 按钮内容
  const icon = new Image();
  icon.src = "https://longxiucai.github.io/icons8-resume-50.png";
  icon.style.cssText = "width:30px;height:30px;margin-right:3px;vertical-align:middle";
  
  const text = document.createElement("span");
  text.textContent = "About";
  text.style.verticalAlign = "middle";
  
  toggleButton.append(icon, text);
  document.body.appendChild(toggleButton);

  // ==================== 创建简历容器 ====================
  const resumeWrapper = document.createElement("div");
  Object.assign(resumeWrapper.style, {
    position: "fixed",
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    overflow: "auto",
    backgroundColor: "#fff",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    zIndex: "9999",
    transform: "scale(0)",
    borderRadius: "10px",
    padding: "0",
    opacity: "0",
    pointerEvents: "auto",
    boxSizing: "border-box"
  });

  // iframe容器
  const iframeContainer = document.createElement("div");
  iframeContainer.style.cssText = "width:100%;height:100%;overflow:auto";
  
  const resumeIframe = document.createElement("iframe");
  resumeIframe.src = "https://longxiucai.github.io/resume.html";
  resumeIframe.style.cssText = "width:100%;height:100%;border:none;pointer-events:auto";
  
  iframeContainer.appendChild(resumeIframe);
  resumeWrapper.appendChild(iframeContainer);
  document.body.appendChild(resumeWrapper);

  // ==================== 核心逻辑 ====================
  let isResumeVisible = false;
  let isMobile = /Mobi|Android/i.test(navigator.userAgent);
  let hideTimer, hoverTimer, touchStartTime, touchStartY;

  // 更新按钮位置（移动端滚动隐藏）
  function updateButtonPosition() {
    if (window.innerWidth < 601) {
      const newTop = 25 - window.scrollY;
      toggleButton.style.opacity = newTop < -60 ? "0" : "1";
      toggleButton.style.pointerEvents = newTop < -60 ? "none" : "auto";
      toggleButton.style.position = "absolute";
      toggleButton.style.top = `${newTop}px`;
      toggleButton.style.left = "60px";
    } else {
      Object.assign(toggleButton.style, {
        position: "fixed",
        top: "10px",
        left: "10px",
        opacity: "1",
        pointerEvents: "auto"
      });
    }
  }

  // 显示简历
  function showResume() {
    clearTimeout(hideTimer);
    
    if (isMobile) {
      const viewport = window.visualViewport;
      Object.assign(resumeWrapper.style, {
        width: `${viewport.width - 40}px`,
        height: `${viewport.height * 0.9}px`,
        left: "20px",
        top: `${viewport.offsetTop + 20}px`,
        transform: "scale(1)",
        opacity: "1"
      });
    } else {
      const rect = toggleButton.getBoundingClientRect();
      Object.assign(resumeWrapper.style, {
        width: "880px",
        height: "565px",
        left: `${rect.left}px`,
        top: `${rect.top + 60}px`,
        transform: "scale(1)",
        opacity: "1"
      });
    }
    
    isResumeVisible = true;
  }

  // 隐藏简历
  function hideResume() {
    resumeWrapper.style.transform = "scale(0)";
    resumeWrapper.style.opacity = "0";
    isResumeVisible = false;
  }

  // ==================== 事件处理 ====================
  // 统一切换逻辑
  const handleToggle = () => isResumeVisible ? hideResume() : showResume();

  // 移动端触摸事件
  const initMobileEvents = () => {
    // 触摸处理
toggleButton.addEventListener("touchstart", e => {
  touchStartTime = Date.now();
  touchStartY = e.touches[0].clientY;  // 修改：正确获取 clientY
  toggleButton.style.transform = "scale(0.95)";
});

toggleButton.addEventListener("touchend", e => {
  toggleButton.style.transform = "scale(1)";
  const touch = e.changedTouches[0]; // 修改：正确获取 changedTouches 的 clientY
  const deltaY = Math.abs(touch.clientY - touchStartY); // 计算滑动距离

  if (Date.now() - touchStartTime < 300 && deltaY < 10) {
    handleToggle(); // 只有点击（非滑动）才切换简历
  }
});

    // 下滑关闭
    let startY = 0;
    resumeWrapper.addEventListener("touchstart", e => {
      startY = e.touches.clientY;
    });
    
    resumeWrapper.addEventListener("touchmove", e => {
      if (e.touches.clientY - startY > 50) hideResume();
    });

    // 外部点击关闭
    document.addEventListener("touchend", e => {
      if (!resumeWrapper.contains(e.target) && !toggleButton.contains(e.target)) {
        hideResume();
      }
    });
  };

  // PC端鼠标事件
  const initPCEvents = () => {
    // 悬停逻辑
    toggleButton.addEventListener("mouseenter", () => {
      hoverTimer = setTimeout(showResume, 100);
    });
    
    toggleButton.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hideTimer = setTimeout(() => {
        if (!resumeWrapper.matches(":hover")) hideResume();
      }, 100);
    });

    // 简历区域交互
    resumeWrapper.addEventListener("mouseenter", () => clearTimeout(hideTimer));
    resumeWrapper.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(hideResume, 100);
    });
    
    // 点击切换
    toggleButton.addEventListener("click", handleToggle);
  };

  // 初始化事件
  isMobile ? initMobileEvents() : initPCEvents();

  // ==================== 窗口事件 ====================
  window.addEventListener("scroll", updateButtonPosition);
  window.addEventListener("resize", () => {
    isMobile = /Mobi|Android/i.test(navigator.userAgent);
    updateButtonPosition();
    if (isResumeVisible) showResume();
  });

  // 虚拟键盘处理
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (isMobile && isResumeVisible) showResume();
    });
  }

  // 初始化
  updateButtonPosition();
});
