// ============================================================
//  sketch.js — 時光記憶圖譜
//  主程式：銀河背景 · 絲帶時間軸 · 星點節點 · 粒子特效
// ============================================================

// ── 全域設定 ──────────────────────────────────────────────
let stars = [];         // 背景星星陣列
let nodes = [];         // 學習節點（StarNode class）
let particles = [];     // 滑鼠粒子
let ripples = [];        // 點擊波紋
let selectedNode = null; // 目前選中節點

// 時間軸控制
let timeOffset = 0;      // 讓時間軸微微擺動的偏移量
let noiseScale = 0.003;  // Perlin noise 細膩度

// 視差
let parallaxX = 0, parallaxY = 0;

// ── 週次資料（在此擴充更多週次）────────────────────────────
// 📌 若要新增週次：在此陣列加一筆物件即可
const weekData = [
  { label: 'W1',  title: '第01週：魚缸',    url: 'https://tku414730019-netizen.github.io/pointy/',  color: '#7ee8fa' },
  { label: 'W2',  title: '第02週：字牆',   url: 'https://tku414730019-netizen.github.io/wordsea/',  color: '#a78bfa' },
  { label: 'W3',  title: '第03週：海葵',     url: 'https://tku414730019-netizen.github.io/waterweed/',  color: '#f0abfc' },
  { label: 'W4',  title: '第04週：電流急急棒',     url: 'https://tku414730019-netizen.github.io/buzz/',  color: '#86efac' },
  { label: 'W5',  title: '第05週：寶藏獵人',     url: 'https://tku414730019-netizen.github.io/dimonnn/',  color: '#fde68a' },
];

// ============================================================
//  CLASS：StarNode — 每個學習週次節點
// ============================================================
/*
 *  負責：
 *    - 儲存位置、週次資料、色彩
 *    - 渲染：星形 + 光暈 + 呼吸動畫
 *    - 互動：hover 發光放大、click 波紋
 */
class StarNode {
  constructor(x, y, data, index) {
    this.x = x;
    this.y = y;
    this.data = data;         // { label, title, url, color }
    this.index = index;

    this.baseR = 14;           // 基礎半徑
    this.r = this.baseR;
    this.isHovered = false;
    this.isSelected = false;

    // 呼吸動畫相位（每顆略有差異）
    this.breathPhase = random(TWO_PI);
    this.breathSpeed = random(0.025, 0.045);

    // 能量環動畫
    this.energyRings = [];
    for (let i = 0; i < 3; i++) {
      this.energyRings.push({ r: this.baseR, alpha: 0, delay: i * 18 });
    }

    // 花瓣展開狀態（hover 時觸發）
    this.bloomAngle = 0;
    this.blooming = false;
  }

  // ── 每幀更新 ────────────────────────────────────────────
  update() {
    // 呼吸動畫
    let breath = sin(frameCount * this.breathSpeed + this.breathPhase);

    if (this.isHovered || this.isSelected) {
      this.r = lerp(this.r, this.baseR * 1.8 + breath * 3, 0.12);
      this.blooming = true;
    } else {
      this.r = lerp(this.r, this.baseR + breath * 2, 0.08);
      this.blooming = false;
      this.bloomAngle = lerp(this.bloomAngle, 0, 0.1);
    }

    if (this.blooming) {
      this.bloomAngle = lerp(this.bloomAngle, TWO_PI, 0.08);
    }

    // 能量環擴散
    for (let ring of this.energyRings) {
      if (this.isSelected || this.isHovered) {
        ring.r += 1.2;
        ring.alpha -= 4;
        if (ring.r > this.baseR * 5) {
          ring.r = this.baseR + random(-2, 2);
          ring.alpha = 180;
        }
      } else {
        ring.r = lerp(ring.r, this.baseR, 0.06);
        ring.alpha = lerp(ring.alpha, 0, 0.08);
      }
    }
  }

  // ── 渲染 ────────────────────────────────────────────────
  draw() {
    push();
    translate(this.x, this.y);

    let c = color(this.data.color);

    // 1. 外層光暈（大）
    if (this.isHovered || this.isSelected) {
      noStroke();
      let glowR = this.r * 3.5;
      for (let i = 5; i > 0; i--) {
        let a = map(i, 5, 0, 0, 60);
        fill(red(c), green(c), blue(c), a);
        ellipse(0, 0, glowR * (i / 3), glowR * (i / 3));
      }
    }

    // 2. 能量環
    noFill();
    for (let ring of this.energyRings) {
      if (ring.alpha > 2) {
        stroke(red(c), green(c), blue(c), ring.alpha);
        strokeWeight(1.2);
        ellipse(0, 0, ring.r * 2, ring.r * 2);
      }
    }

    // 3. 花瓣（hover 時展開）
    

    // 4. 主體：多邊形星形
    this._drawStar(0, 0, this.r * 0.45, this.r, 5);

    // 5. 中心亮點
    noStroke();
    fill(255, 255, 255, 220);
    ellipse(0, 0, this.r * 0.3, this.r * 0.3);

    // 6. 週次標籤
    this._drawLabel();

    pop();
  }

  // ── 畫星形（五芒星）────────────────────────────────────
  _drawStar(x, y, r1, r2, points) {
    let c = color(this.data.color);
    let alpha = this.isHovered || this.isSelected ? 255 : 200;

    // 填色
    fill(red(c), green(c), blue(c), alpha);
    stroke(255, 255, 255, 160);
    strokeWeight(this.isHovered ? 1.8 : 1.0);

    // 🔑 beginShape + vertex 畫星形
    beginShape();
    for (let i = 0; i < points * 2; i++) {
      let angle = (PI / points) * i - HALF_PI;
      let r = (i % 2 === 0) ? r2 : r1;
      vertex(x + cos(angle) * r, y + sin(angle) * r);
    }
    endShape(CLOSE);
  }

  // ── 標籤 ────────────────────────────────────────────────
  _drawLabel() {
    let c = color(this.data.color);
    noStroke();
    textAlign(CENTER, CENTER);

    if (this.isHovered || this.isSelected) {
      // 展開顯示完整標題
      textFont('Orbitron, sans-serif');
      textSize(9.5);
      fill(red(c), green(c), blue(c), 230);
      text(this.data.label, 0, -this.r * 1.7);

      // 標題背景
      let tw = textWidth(this.data.title) + 14;
      fill(4, 8, 26, 200);
      noStroke();
      rectMode(CENTER);
      rect(0, this.r * 2.2, tw, 20, 4);

      textSize(9);
      fill(255, 255, 255, 210);
      text(this.data.title, 0, this.r * 2.2);
    } else {
      textFont('Orbitron, sans-serif');
      textSize(8.5);
      fill(red(c), green(c), blue(c), 180);
      text(this.data.label, 0, -this.r * 1.6);
    }
  }

  // ── 碰撞偵測 ────────────────────────────────────────────
  isOver(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r + 8;
  }

  // ── 點擊處理 ────────────────────────────────────────────
  onClick() {
    this.isSelected = true;
    // 觸發 iframe 載入（呼叫 index.html 中的函式）
    if (window.loadWeek) {
      window.loadWeek(this.data.url, this.data.title);
    }
    // 產生點擊波紋
    ripples.push(new Ripple(this.x, this.y, this.data.color));
    // 爆開粒子
    for (let i = 0; i < 18; i++) {
      particles.push(new Particle(this.x, this.y, this.data.color, 'burst'));
    }
  }
}

// ============================================================
//  CLASS：Particle — 滑鼠粒子 / 爆炸粒子
// ============================================================
class Particle {
  constructor(x, y, col, type = 'trail') {
    this.x = x; this.y = y;
    this.col = col || '#7ee8fa';
    this.type = type;

    if (type === 'burst') {
      let angle = random(TWO_PI);
      let spd = random(2, 6);
      this.vx = cos(angle) * spd;
      this.vy = sin(angle) * spd;
      this.life = 255;
      this.decay = random(4, 9);
      this.size = random(2, 6);
    } else {
      // trail：跟隨滑鼠
      this.vx = random(-0.6, 0.6);
      this.vy = random(-1.5, -0.3);
      this.life = 180;
      this.decay = random(3, 7);
      this.size = random(1, 3.5);
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // 重力
    this.life -= this.decay;
    this.size *= 0.96;
  }

  draw() {
    if (this.life <= 0) return;
    let c = color(this.col);
    noStroke();
    fill(red(c), green(c), blue(c), this.life);
    ellipse(this.x, this.y, this.size, this.size);
  }

  isDead() { return this.life <= 0 || this.size < 0.3; }
}

// ============================================================
//  CLASS：Ripple — 點擊波紋
// ============================================================
class Ripple {
  constructor(x, y, col) {
    this.x = x; this.y = y;
    this.col = col;
    this.r = 10;
    this.maxR = 90;
    this.life = 255;
    this.speed = 3.5;
  }

  update() {
    this.r += this.speed;
    this.life = map(this.r, 10, this.maxR, 255, 0);
    this.speed *= 0.97;
  }

  draw() {
    let c = color(this.col);
    noFill();
    stroke(red(c), green(c), blue(c), this.life);
    strokeWeight(2.5);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);

    // 第二圈（稍慢）
    stroke(red(c), green(c), blue(c), this.life * 0.5);
    strokeWeight(1.2);
    ellipse(this.x, this.y, (this.r * 2) * 0.65, (this.r * 2) * 0.65);
  }

  isDead() { return this.r >= this.maxR; }
}

// ============================================================
//  CLASS：BackgroundStar — 背景星星
// ============================================================
class BackgroundStar {
  constructor() { this.reset(); }

  reset() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(0.5, 2.8);
    this.baseAlpha = random(40, 210);
    this.alpha = this.baseAlpha;
    this.twinkleSpeed = random(0.01, 0.04);
    this.twinklePhase = random(TWO_PI);
    // 視差層次（0=慢/遠, 1=快/近）
    this.layer = random();
  }

  update(px, py) {
    // 閃爍
    this.alpha = this.baseAlpha + sin(frameCount * this.twinkleSpeed + this.twinklePhase) * 60;
    this.alpha = constrain(this.alpha, 0, 255);

    // 視差偏移（根據滑鼠位置）
    this.drawX = this.x + px * this.layer * 18;
    this.drawY = this.y + py * this.layer * 10;
  }

  draw() {
    noStroke();
    // 大星星加一點光暈
    if (this.size > 2) {
      fill(180, 220, 255, this.alpha * 0.2);
      ellipse(this.drawX, this.drawY, this.size * 4, this.size * 4);
    }
    fill(220, 235, 255, this.alpha);
    ellipse(this.drawX, this.drawY, this.size, this.size);
  }
}

// ============================================================
//  p5.js 核心函式
// ============================================================

// ── setup ────────────────────────────────────────────────
function setup() {
  // 把 canvas 放進 #canvas-container
  let container = document.getElementById('canvas-container');
  let cnv = createCanvas(container.offsetWidth, container.offsetHeight);
  cnv.parent('canvas-container');

  // 建立背景星星
  for (let i = 0; i < 320; i++) {
    stars.push(new BackgroundStar());
  }

  // 計算節點位置（沿時間軸分佈）並建立 StarNode
  buildNodes();

  textFont('sans-serif');
}

// ── buildNodes：計算時間軸路徑並放置節點 ────────────────
/*
 *  🔑 此段是「時間軸生成核心」
 *  使用 for 迴圈 + getTimelinePoint() 在路徑上計算等距節點位置
 */
function buildNodes() {
  nodes = [];
  let total = weekData.length;
  for (let i = 0; i < total; i++) {
    // t 從 0.08 到 0.92，避免節點貼邊
    let t = map(i, 0, total - 1, 0.08, 0.92);
    let pos = getTimelinePoint(t);
    nodes.push(new StarNode(pos.x, pos.y, weekData[i], i));
  }
}

// ── getTimelinePoint：依 t(0-1) 回傳時間軸上的 (x,y) ────
/*
 *  🔑 時間軸的定義：
 *    - x 方向：由左到右（進度感）
 *    - y 方向：用 sin + Perlin noise 產生「絲帶波動」
 */
function getTimelinePoint(t) {
  let margin = 80;

  // ✅ X 固定在左側 1/4 區域
  let x = width * 0.25 
        + sin(t * PI * 2.2 + timeOffset * 0.05) * 50
        +50;

  // ✅ Y：由下往上
  let y = lerp(height - margin, margin, t);

  return createVector(x, y);
}

// ── draw ─────────────────────────────────────────────────
function draw() {
  // 畫布尺寸跟容器同步
  resizeIfNeeded();

  // 視差偏移計算（-1 ~ 1）
  parallaxX = map(mouseX, 0, width, -1, 1);
  parallaxY = map(mouseY, 0, height, -1, 1);

  // 時間推進
  timeOffset += 0.25;

  // 1. 銀河背景
  drawGalaxy();

  // 2. 更新 & 繪製背景星星
  for (let s of stars) {
    s.update(parallaxX, parallaxY);
    s.draw();
  }

  // 3. 星雲霧氣
  drawNebula();

  // 4. 絲帶時間軸（核心 vertex 路徑）
  drawTimeline();

  // 5. 連接線（星座風格）
  drawConstellationLines();

  // 6. 節點更新 & 繪製
  updateNodes();

  // 7. 波紋
  for (let i = ripples.length - 1; i >= 0; i--) {
    ripples[i].update();
    ripples[i].draw();
    if (ripples[i].isDead()) ripples.splice(i, 1);
  }

  // 8. 粒子
  spawnTrailParticle();
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

// ── drawGalaxy：深色漸層背景 ─────────────────────────────
function drawGalaxy() {
  // 基底
  background(2, 3, 15);

  // 中央帶狀星雲暈光（微視差）
  let cx = width * 0.5 + parallaxX * 5;
  let cy = height * 0.5 + parallaxY * 3;

  noStroke();
  for (let i = 4; i > 0; i--) {
    let r = width * 0.85 * (i / 4);
    let a = map(i, 4, 0, 6, 0);
    fill(20, 12, 60, a);
    ellipse(cx, cy, r, r * 0.38);
  }
}

// ── drawNebula：柔霧星雲 ──────────────────────────────────
function drawNebula() {
  noStroke();
  // 藍紫霧
  let t = frameCount * 0.003;
  let nx = width * 0.35 + sin(t * 0.7) * 30 + parallaxX * 8;
  let ny = height * 0.45 + cos(t * 0.5) * 20 + parallaxY * 5;

  fill(80, 40, 180, 8);
  ellipse(nx, ny, width * 0.6, height * 0.4);

  // 青色霧
  fill(30, 120, 160, 7);
  ellipse(width * 0.65 - parallaxX * 6, height * 0.55 - parallaxY * 4, width * 0.45, height * 0.35);
}

// ── drawTimeline：核心絲帶時間軸 ─────────────────────────
/*
 *  🔑 此段是「vertex 時間軸」的核心
 *    - 用 for 迴圈 + getTimelinePoint() 逐點取樣
 *    - 用 beginShape / vertex / endShape 畫出曲線
 *    - 畫三層：粗光暈 → 中等帶透明 → 細亮線
 */
function drawTimeline() {
  let steps = 120; // 曲線細膩度

  // ── 層 1：寬光暈（絲帶感）────────────────────────────
  noFill();
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let p = getTimelinePoint(t);
    let alpha = map(t, 0, 1, 30, 80);
    stroke(100, 200, 255, alpha);
    strokeWeight(22);
    vertex(p.x, p.y);
  }
  endShape();

  // ── 層 2：中等帶（主體）──────────────────────────────
  noFill();
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let p = getTimelinePoint(t);
    let alpha = map(t, 0, 1, 50, 140);
    // 顏色從青色→紫色→粉色（成長感）
    let r = map(t, 0, 1, 80,  220);
    let g = map(t, 0, 1, 200,  80);
    let b = map(t, 0, 1, 230, 200);
    stroke(r, g, b, alpha);
    strokeWeight(5);
    vertex(p.x, p.y);
  }
  endShape();

  // ── 層 3：細亮線（高光）──────────────────────────────
  noFill();
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let p = getTimelinePoint(t);
    stroke(220, 240, 255, map(t, 0, 1, 80, 200));
    strokeWeight(1.2);
    vertex(p.x, p.y);
  }
  endShape();

  // ── 小刻度（週次標記）────────────────────────────────
  let total = weekData.length;
  for (let i = 0; i < total; i++) {
    let t = map(i, 0, total - 1, 0.08, 0.92);
    let p = getTimelinePoint(t);
    // 刻度短線（垂直於軸方向）
    let p2 = getTimelinePoint(min(t + 0.005, 1));
    let dx = p2.x - p.x, dy = p2.y - p.y;
    let len = sqrt(dx * dx + dy * dy);
    let nx = -dy / len * 8, ny = dx / len * 8;

    stroke(180, 230, 255, 100);
    strokeWeight(1);
    line(p.x + nx, p.y + ny, p.x - nx, p.y - ny);
  }
}

// ── drawConstellationLines：星座連線 ─────────────────────
function drawConstellationLines() {
  if (nodes.length < 2) return;
  for (let i = 0; i < nodes.length - 1; i++) {
    let a = nodes[i], b = nodes[i + 1];
    let alpha = (a.isHovered || b.isHovered || a.isSelected || b.isSelected) ? 120 : 35;
    stroke(180, 200, 255, alpha);
    strokeWeight(0.8);
    line(a.x, a.y, b.x, b.y);
  }
}

// ── updateNodes：節點更新與互動偵測 ──────────────────────
function updateNodes() {
  let anyHovered = false;
  let total = nodes.length;

  for (let i = 0; i < total; i++) {
    let n = nodes[i];

    // ⭐ 每幀重新抓時間軸位置
    let t = map(i, 0, total - 1, 0.08, 0.92);
    let pos = getTimelinePoint(t);
    n.x = pos.x;
    n.y = pos.y;

    // hover 判定
    n.isHovered = n.isOver(mouseX, mouseY);
    if (n.isHovered) anyHovered = true;

    n.update();
    n.draw();
  }

  cursor(anyHovered ? 'pointer' : 'default');
}

// ── spawnTrailParticle：滑鼠拖尾粒子 ────────────────────
function spawnTrailParticle() {
  if (frameCount % 3 === 0) {
    // 顏色依位置變換
    let hue = map(mouseX, 0, width, 180, 280);
    let col = `hsl(${hue},80%,70%)`;
    particles.push(new Particle(mouseX, mouseY, col, 'trail'));
  }
}

// ── mousePressed：點擊節點 ───────────────────────────────
function mousePressed() {
  let clicked = false;
  for (let n of nodes) {
    if (n.isOver(mouseX, mouseY)) {
      // 先清除所有選中
      for (let m of nodes) m.isSelected = false;
      n.onClick();
      selectedNode = n;
      clicked = true;
      break;
    }
  }
  // 點擊空白區域：波紋
  if (!clicked) {
    ripples.push(new Ripple(mouseX, mouseY, '#7ee8fa'));
  }
}

// ── 視窗 resize ──────────────────────────────────────────
let lastW = 0, lastH = 0;
function resizeIfNeeded() {
  let container = document.getElementById('canvas-container');
  if (!container) return;
  let w = container.offsetWidth, h = container.offsetHeight;
  if (abs(w - lastW) > 2 || abs(h - lastH) > 2) {
    resizeCanvas(w, h);
    lastW = w; lastH = h;
    buildNodes(); // 重算節點位置
  }
}

// ── 提供給 index.html 呼叫：清除選中 ───────────────────
window.clearSelectedNode = function () {
  for (let n of nodes) n.isSelected = false;
  selectedNode = null;
};
