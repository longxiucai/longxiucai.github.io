Gmeek-html<!DOCTYPE html><html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>love</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #ffe6f2;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }

        h1 {
            color: #ff69b4;
            margin-bottom: 30px;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 10;
        }

        .heart-img {
            width: 100px;
            margin-bottom: 20px;
            position: relative;
            z-index: 10;
        }

        .buttons {
            display: flex;
            gap: 20px;
            position: relative;
            z-index: 10;
        }

        button {
            padding: 15px 30px;
            font-size: 18px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.2s ease; /* 加快动画速度 */
            box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.2);
        }

        #yesBtn {
            background-color: #ff69b4;
            color: white;
        }

        #noBtn {
            background-color: #d3d3d3;
            color: #666;
        }

        canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }

        .new-interface {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 230, 242, 0.9); /* 粉色半透明背景 */
            color: #ff69b4;
            text-align: center;
            padding-top: 20%;
            font-size: 2em;
            z-index: 1000;
        }

        @media (max-width: 600px) {
            h1 {
                font-size: 1.8em;
            }
            .buttons {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <canvas id="fireworksCanvas"></canvas>
    <img src="/static/heart.png" alt="爱心" class="heart-img" onerror="this.style.display='none'">
    <h1>可以成为我的恋人吗？</h1>
    <div class="buttons">
        <button id="yesBtn" onclick="accept()">可❤️以</button>
        <button id="noBtn" onclick="shrink()">不可以</button>
    </div>

    <div id="newInterface" class="new-interface">
        <h2>❤️ 就知道你会同意的 ❤️</h2>
        <p>愿我们的未来如烟花般绚烂！</p>
    </div>

    <script>
        // ==================== 按钮交互逻辑 ====================
        function shrink() {
            const yesBtn = document.getElementById('yesBtn');
            const noBtn = document.getElementById('noBtn');
            
            // 增大可以按钮（加快变化速度）
            const currentYesSize = parseFloat(window.getComputedStyle(yesBtn).fontSize);
            yesBtn.style.fontSize = (currentYesSize * 1.5) + 'px'; // 增大比例调整为 1.5
            yesBtn.style.padding = (currentYesSize * 0.8) + 'px ' + (currentYesSize * 1.6) + 'px';
            
            // 减小不可以按钮（加快变化速度）
            const currentNoSize = parseFloat(window.getComputedStyle(noBtn).fontSize);
            if (currentNoSize > 8) {
                noBtn.style.fontSize = (currentNoSize * 0.6) + 'px'; // 缩小比例调整为 0.6
                noBtn.style.padding = (currentNoSize * 0.2) + 'px ' + (currentNoSize * 0.4) + 'px';
            }
        }

        function accept() {
            const newInterface = document.getElementById('newInterface');
            newInterface.style.display = 'block';
            launchFireworks();
        }

        // ==================== 烟花特效 ====================
        const canvas = document.getElementById("fireworksCanvas");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let fireworks = [];

        function Firework(x, y) {
            this.x = x;
            this.y = y;
            this.color = "hsl(" + (Math.random() * 360) + ", 100%, 50%)";
            this.particles = [];
            for (let i = 0; i < 30; i++) {
                this.particles.push(new Particle(this.x, this.y, this.color));
            }
        }

        function Particle(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 4 + 1;
            this.speedX = (Math.random() - 0.5) * 6;
            this.speedY = (Math.random() - 0.5) * 6;
            this.life = 100;
        }

        Particle.prototype.update = function () {
            this.x += this.speedX;
            this.y += this.speedY;
            this.speedY += 0.05; // 模拟重力
            this.life -= 2;
        }

        Particle.prototype.draw = function () {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        function animate() {
            ctx.fillStyle = "rgba(255, 230, 242, 0.9)"; // 粉色背景，轻微透明
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            for (let i = fireworks.length - 1; i >= 0; i--) {
                let firework = fireworks[i];
                for (let j = firework.particles.length - 1; j >= 0; j--) {
                    let particle = firework.particles[j];
                    particle.update();
                    particle.draw();

                    if (particle.life <= 0) {
                        firework.particles.splice(j, 1);
                    }
                }
                if (firework.particles.length === 0) {
                    fireworks.splice(i, 1);
                }
            }
            requestAnimationFrame(animate);
        }

        function launchFireworks() {
            setInterval(() => {
                fireworks.push(new Firework(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height / 2
                ));
            }, 500); // 每 500ms 发射一个烟花
        }

        animate();
    </script>
</body>
</html>