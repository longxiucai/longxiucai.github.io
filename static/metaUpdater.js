(function () {
    function updateMetaDescription(content) {
        let metaTag = document.querySelector('meta[property="og:description"]');
        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('property', 'og:description');
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
    }

    // 示例：从页面某个元素获取描述内容
    document.addEventListener("DOMContentLoaded", function () {
        let description = document.querySelector("h1")?.textContent || "默认描述";
        updateMetaDescription(description);
    });

    // 允许外部调用
    window.metaUpdater = {
        setDescription: updateMetaDescription
    };
})();
