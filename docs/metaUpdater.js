function handleResponse(data) {
    console.log('获取到的数据:', data);
    const targetDiv = document.querySelector('div[style="margin-bottom: 16px;"]');
    if (targetDiv && data) {
        targetDiv.innerHTML = `
            <p><strong>${data.note}</strong></p>
            <p><em>${data.content}</em></p>
             <p style="text-align: right;"><em>------${data.caption}·${data.dateline}</em></p>
        `;
    }
}

const script = document.createElement('script');
script.src = 'https://open.iciba.com/dsapi/?callback=handleResponse';
document.body.appendChild(script);
