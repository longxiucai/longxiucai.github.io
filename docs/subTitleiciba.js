function getRandomDate() {
    const today = new Date();
    const pastYear = new Date();
    pastYear.setFullYear(today.getFullYear() - 2); // 过去两年内随机
    const randomTime = pastYear.getTime() + Math.random() * (today.getTime() - pastYear.getTime());
    const randomDate = new Date(randomTime);
    
    return randomDate.toISOString().split('T')[0]; // 格式化 YYYY-MM-DD
}

function handleResponse(data) {
    console.log('获取到的数据:', data);
    const targetDiv = document.querySelector('div[style="margin-bottom: 16px;"]');

    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (error) {
            console.error('无法解析数据:', error);
            return;
        }
    }

    if (targetDiv && data && typeof data === 'object' && !Array.isArray(data)) {
        const isDarkMode = document.documentElement.getAttribute("data-color-mode") === "dark";
        const bgColor = isDarkMode ? '#2c3e50' : '#ffffff';
        const textColor = isDarkMode ? '#ecf0f1' : '#333';
        const subTextColor = isDarkMode ? '#bdc3c7' : '#555';
        const borderColor = isDarkMode ? '#2980b9' : '#3498db';
     //   const backgroundImage = data.picture ? `url(${data.picture})` : '';  

        const text = data.note || '未知的句子';
        const textSub = data.content || '未知的句子';
        const textCaption = data.caption || '未知来源';
        const textDate = data.dateline || '未知时间';
        const textFrom = textCaption + ' · ' + textDate;

        // 更新 HTML
        targetDiv.innerHTML = `
            <div style="
                position: relative;
                padding: 12px 20px;
                background-color: ${bgColor};
                border-radius: 8px;
                border-left: 4px solid ${borderColor};
                font-family: 'Arial', sans-serif;
                font-size: 16px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px;
                cursor: pointer; /* 让用户知道可以点击 */
                overflow: hidden;
                transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
            " onclick="loadRandomQuote()">
                <div style="position: relative; z-index: 1;">
                    <p style="font-size: 18px; font-weight: bold; color: ${textColor}; margin-bottom: 8px;">
                        ${text}
                    </p>
                    <p style="font-size: 16px; color: ${subTextColor}; line-height: 1.6; margin-bottom: 12px;">
                        ${textSub}
                    </p>
                    <p style="text-align: right; font-size: 14px; color: ${subTextColor}; margin-bottom: 0px;">
                        ------${textFrom}
                    </p>
                </div>
            </div>
        `;
    }
}

// 监听夜间模式切换
let lastMode = document.documentElement.getAttribute("data-color-mode");
const observer = new MutationObserver(() => {
    const currentMode = document.documentElement.getAttribute("data-color-mode");
    if (currentMode !== lastMode) {
        lastMode = currentMode;
        handleResponse(window.latestData);
    }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-color-mode"] });

// 记录数据并执行
window.latestData = null;
function handleDataUpdate(data) {
    window.latestData = data;
    handleResponse(data);
}

// **点击卡片加载随机日期的数据**
function loadRandomQuote() {
    const randomDate = getRandomDate();
    console.log(`加载日期: ${randomDate}`);

    // 移除旧 script 防止多次执行
    const oldScript = document.getElementById('quote-script');
    if (oldScript) {
        document.body.removeChild(oldScript);
    }

    // 创建新 script
    const script = document.createElement('script');
    script.id = 'quote-script';
    script.src = `https://open.iciba.com/dsapi/?date=${randomDate}&callback=handleDataUpdate`;
    document.body.appendChild(script);
}

// **首次加载时加载今天的数据**
function loadTodayQuote() {
    const today = new Date().toISOString().split('T')[0]; // 今天的日期
    console.log(`加载日期: ${today}`);

    // 移除旧 script 防止多次执行
    const oldScript = document.getElementById('quote-script');
    if (oldScript) {
        document.body.removeChild(oldScript);
    }

    // 创建新 script
    const script = document.createElement('script');
    script.id = 'quote-script';
    script.src = `https://open.iciba.com/dsapi/?date=${today}&callback=handleDataUpdate`;
    document.body.appendChild(script);
}

// **首次加载**
loadTodayQuote();
