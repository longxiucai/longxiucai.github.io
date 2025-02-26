function handleResponse(data) {
    console.log('获取到的数据:', data);
    const targetDiv = document.querySelector('div[style="margin-bottom: 16px;"]');

    // 判断是否是 JSON 字符串
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data); // 将字符串解析为对象
        } catch (error) {
            console.error('无法解析数据:', error);
            return;
        }
    }

    if (targetDiv && data && typeof data === 'object' && !Array.isArray(data)) {
        // 判断是否处于夜间模式
        const isDarkMode = document.documentElement.getAttribute("data-color-mode") === "dark";
        // 定义样式
        const bgColor = isDarkMode ? '#2c3e50' : '#ffffff';
        const textColor = isDarkMode ? '#ecf0f1' : '#333';
        const subTextColor = isDarkMode ? '#bdc3c7' : '#555';
        const borderColor = isDarkMode ? '#2980b9' : '#3498db';

        // 使用解构来处理数据字段
        const { hitokoto, from, from_who } = data;

        // 防止undefined或null值
        const safeHitokoto = hitokoto || '未知的句子';
        const safeFrom = from || '未知来源';
        const safeFromWho = from_who || '未知作者';

        targetDiv.innerHTML = `
            <div style="
                padding: 12px 20px;
                background-color: ${bgColor};
                border-radius: 8px;
                border-left: 4px solid ${borderColor};
                font-family: 'Arial', sans-serif;
                font-size: 16px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                margin-bottom: 16px;
                transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
            ">
                <p style="font-size: 18px; font-weight: bold; color: ${textColor}; margin-bottom: 8px;">
                    ${safeHitokoto}
                </p>
                <p style="text-align: right; font-size: 14px; color: ${subTextColor};margin-bottom: 0px;">
           			 ------ ${safeFrom}  | ${safeFromWho}
                </p>
            </div>
        `;
    } else {
        console.error('数据格式不正确:', data);
    }
}

// 监听夜间模式切换
const observer = new MutationObserver(() => {
    if (window.latestData) {
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

const script = document.createElement('script');
script.src = 'https://v1.hitokoto.cn/?callback=handleDataUpdate';
document.body.appendChild(script);
