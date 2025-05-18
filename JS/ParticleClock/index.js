// 获取画布并启用高频像素读取（必要用于 getImageData 提高效率）
// Get canvas and enable high-frequency pixel reading (important for getImageData performance)
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d", {
  willReadFrequently: true,
});

// 初始化画布大小，适配高分屏（Retina）
// Initialize canvas size, support HiDPI screens
function initCanvasSize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
}

initCanvasSize();

// 生成 [min, max] 范围内的随机整数
// Generate a random integer between [min, max]
function getRandom(min, max) {
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

// 粒子类，每个粒子是一个可移动的圆点
// Particle class, each is a movable circle
class Particle {
  constructor() {
    // 随机大小 / Random size
    this.size = getRandom(2 * devicePixelRatio, 7 * devicePixelRatio);

    // 以画布中心为圆心，随机角度生成初始位置 / Random position around canvas center
    const r = Math.min(canvas.width, canvas.height) / 2;
    const rad = (getRandom(0, 360) * Math.PI) / 180;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    this.x = cx + r * Math.cos(rad);
    this.y = cy + r * Math.sin(rad);
  }

  // 绘制粒子 / Draw the particle
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fillStyle = "green"; // 绿色粒子 / Green particle
    ctx.fill();
  }

  // 将粒子移动到目标位置 / Move particle to target (tx, ty)
  moveTo(tx, ty) {
    const duration = 500; // 动画时长 / Duration in ms
    const sx = this.x,
      sy = this.y;
    const xSpeed = (tx - sx) / duration;
    const ySpeed = (ty - sy) / duration;
    const startTime = Date.now();

    const _move = () => {
      const t = Date.now() - startTime;
      this.x = sx + xSpeed * t;
      this.y = sy + ySpeed * t;

      if (t >= duration) {
        this.x = tx;
        this.y = ty;
        return;
      }

      requestAnimationFrame(_move);
    };

    _move();
  }
}

const particles = []; // 粒子数组 / Array of particles

// 清空画布 / Clear the canvas
function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 绘制所有粒子 / Draw all particles
function draw() {
  clear();
  for (const p of particles) {
    p.draw();
  }
  requestAnimationFrame(draw);
}

let text = null; // 当前文本缓存 / Current text cache

// 获取当前时间字符串 / Get current time string
function getText() {
  return new Date().toLocaleTimeString();
}

// 启动绘图循环 / Start drawing loop
draw();

// 每秒更新一次文本和粒子目标位置 / Update every second
setInterval(() => {
  updata();
}, 1000);

// 更新时间文本及粒子目标坐标 / Update text and move particles to target points
function updata() {
  const curText = getText();
  if (text === curText) return;

  clear();
  text = curText;

  const { width, height } = canvas;
  ctx.fillStyle = "#fff"; // 白色字体 / White text
  ctx.textBaseline = "middle";
  ctx.font = `${120 * devicePixelRatio}px 'Roboto Mono', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, width / 2, height / 2); // 绘制当前时间 / Draw current time

  const points = getPoints(); // 提取文字像素点 / Get text pixels
  clear();

  // 为每个像素点分配一个粒子 / Assign particle to each text pixel
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    let p = particles[i];
    if (!p) {
      p = new Particle(); // 新建粒子 / Create new particle
      particles.push(p);
    }
    p.moveTo(x, y); // 粒子移动到对应点 / Move to pixel position
  }

  // 多余的粒子删除 / Remove extra particles
  if (points.length < particles.length) {
    particles.splice(points.length);
  }
}

// 获取当前画布上所有非透明像素（即文字）的位置
// Get all visible (non-transparent) pixels as coordinate points
function getPoints() {
  const points = [];
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gap = 6 * devicePixelRatio; // 点间距，越小越密集 / Gap between scan points

  for (let i = 0; i < canvas.width; i += gap) {
    for (let j = 0; j < canvas.height; j += gap) {
      const index = (i + j * canvas.width) * 4;
      const a = data[index + 3]; // alpha 通道 / Alpha channel
      if (a > 128) {
        // 非透明判断 / Check if pixel is visible
        points.push([i, j]);
      }
    }
  }

  return points;
}
