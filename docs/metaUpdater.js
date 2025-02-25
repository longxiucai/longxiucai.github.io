(function () {
    function updateDivContent() {
        // 获取目标 div
        const targetDiv = document.querySelector('div[style="margin-bottom: 16px;"]');

        if (!targetDiv) {
            console.log('未找到目标 div');
            return;
        }

        // 发送请求获取数据
        fetch('http://v3.wufazhuce.com:8000/api/channel/one/0/0')
            .then(response => response.json()) // 解析 JSON 数据
            .then(data => {
                if (data && data.data && data.data.content_list && data.data.content_list[0]) {
                    // 从返回数据中提取 forward 字段并插入到目标 div
                    const forwardContent = data.data.content_list[0].forward;
                    const from = data.data.content_list[0].words_info;
                    targetDiv.innerHTML = `
                        <p><strong>${forwardContent}</strong></p>
                        <p style="text-align: right;"><em>—来自《${from}》</em></p>
                    `;
                } else {
                    console.log('API 返回数据格式不符合预期');
                }
            })
            .catch(error => console.error('获取数据失败:', error));
    }

    // 调用函数
    updateDivContent();
})();
