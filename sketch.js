// ============================================================
// 數位藝廊：動態海草與幾何空間
// Digital Gallery: Dynamic Seaweed & Geometric Space
// 程式設計期中報告 — sketch.js  v2
// ============================================================
// 更新內容：
//   - 視差偏移大幅增強（三層：遠/中/近，倍率 0.2 / 0.5 / 0.9）
//   - 海葵改用仿附件 noise() + curveVertex 多層風格
//   - 新增 Bubble 氣泡 + BubbleParticle 爆破粒子
//   - 新增 Fish 游動小魚（vertex 魚身 + 魚尾）
//   - iframe 展開至螢幕 80%，scrolling=no 消除捲軸
// ============================================================

// ---------- 全域變數 ----------
let anemones   = [];     // 海葵陣列
let artworks   = [];     // 畫框陣列
let bubbles    = [];     // 氣泡陣列
let particles  = [];     // 爆破粒子陣列
let fishes     = [];     // 小魚陣列

let iframeEl;
let infoDiv;
let selectedIndex  = -1;
let iframeW = 0, iframeTargetW = 0;
let iframeH = 0, iframeTargetH = 0;

// 三層視差偏移（遠/中/近）
let px1 = 0, py1 = 0;
let px2 = 0, py2 = 0;
let px3 = 0, py3 = 0;

let time = 0;

// 海葵顏色系（對應附件三色）
const ANEMONE_COLORS = ["#256755", "#008C73", "#8BC7B4"];

// ============================================================
// setup()
// ============================================================
function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('canvas-container');

  // ---------- 初始化海葵（仿附件風格）----------
  const baseSpacing = 38;
  const count = floor(width / baseSpacing) + 2;
  for (let i = 0; i < count; i++) {
    anemones.push(new Anemone(
      i / count,
      i,
      ANEMONE_COLORS[i % ANEMONE_COLORS.length],
      random(26, 44),
      random(height * 0.25, height * 0.42),
      random(120, 260)
    ));
  }

  // ---------- 初始化畫框 ----------
  artworks.push(new Artwork(
    "作業一：Buzz",
    "https://tku414730019-netizen.github.io/buzz/",
    width * 0.28, height * 0.40
  ));
  artworks.push(new Artwork(
    "作業二：Dimonnn",
    "https://tku414730019-netizen.github.io/dimonnn/",
    width * 0.72, height * 0.40
  ));

  // ---------- 初始化小魚 ----------
  for (let i = 0; i < 6; i++) {
    fishes.push(new Fish());
  }

  // ---------- 建立 iframe（p5.dom）----------
  // scrolling="no" 搭配 overflow:hidden 消除多餘捲軸
  iframeEl = createElement('iframe');
  iframeEl.parent('iframe-container');
  iframeEl.attribute('frameborder', '0');
  iframeEl.attribute('allowfullscreen', '');
  iframeEl.attribute('scrolling', 'no');
  iframeEl.style('border-radius', '10px');
  iframeEl.style('border', '1px solid rgba(100,200,255,0.3)');
  iframeEl.style('background', '#ff5e00');
  iframeEl.style('display', 'block');
  iframeEl.style('overflow', 'hidden');
  iframeEl.style('transition', 'box-shadow 0.4s ease');

  // ---------- 建立資訊面板（p5.dom）----------
  infoDiv = createDiv('');
  infoDiv.parent('info-panel');
  infoDiv.html(`
    <div class="info-section">
      <h2>✦ 設計理念</h2>
      <p>本作品以「數位海洋展廳」為核心意象，將程式生成藝術與互動介面設計融合。深邃的深色背景象徵無邊的數位宇宙；仿附件風格的多層海葵以 <code>noise()</code> 驅動，搖曳出有機的生命感；漂浮的氣泡與游弋的小魚豐富了場景層次；幾何透視展廳框架呼應現代極簡主義美學，讓觀者在沉浸式體驗中感受科技與藝術的交融。</p>
    </div>
    <div class="info-section">
      <h2>⟡ 技術解析</h2>
      <ul>
        <li><strong>vertex() 繪圖</strong>：海葵每層以 <code>curveVertex()</code> 搭配 Catmull-Rom 樣條，配合 <code>noise()</code> 產生有機擺動曲線；透視展廳牆面與地板由 <code>beginShape()/vertex()</code> 四邊形構成；小魚身體使用 <code>curveVertex()</code> 橢圓輪廓，魚尾使用 <code>vertex()</code> 三角形。</li>
        <li><strong>class 物件導向</strong>：<code>Anemone</code>（海葵）、<code>Artwork</code>（畫框）、<code>Bubble</code>（氣泡）、<code>BubbleParticle</code>（粒子）、<code>Fish</code>（小魚）五個類別各自封裝屬性與行為。</li>
        <li><strong>Array + for 迴圈</strong>：<code>anemones[]</code>、<code>bubbles[]</code>、<code>fishes[]</code>、<code>particles[]</code> 四個陣列搭配 <code>for</code> 迴圈批次管理所有動態物件的生命週期。</li>
        <li><strong>p5.dom iframe</strong>：<code>createElement('iframe')</code> 動態建立，點擊畫框後 <code>attribute('src', url)</code> 更新內容；<code>scrolling="no"</code> 消除內嵌捲軸；<code>lerp()</code> 插值實現 80vw × 80vh 平滑展開動畫。</li>
        <li><strong>三層視差效果</strong>：場景分為遠景（展廳 ×0.2）、中景（海葵 ×0.5）、近景（畫框 ×0.9）三層，各以不同倍率 <code>map(mouseX...)</code> 偏移，大幅強化景深立體感。</li>
        <li><strong>Spotlight 燈光</strong>：<code>drawingContext.createRadialGradient()</code> 產生放射狀半透明橢圓光暈，模擬投射燈效果。</li>
      </ul>
    </div>
  `);

  colorMode(RGB, 255);
  frameRate(60);
}

// ============================================================
// draw() — 主迴圈
// ============================================================
function draw() {
  background(6, 8, 18);

  // ---------- 三層視差計算 ----------
  // 遠景（展廳牆面）：偏移倍率最小 → 感覺最遠
  let tpx = map(mouseX, 0, width,  -90, 90);
  let tpy = map(mouseY, 0, height, -45, 45);
  px1 = lerp(px1, tpx * 0.2, 0.04);  py1 = lerp(py1, tpy * 0.2, 0.04);
  // 中景（海葵）：中等偏移
  px2 = lerp(px2, tpx * 0.5, 0.05);  py2 = lerp(py2, tpy * 0.5, 0.05);
  // 近景（畫框）：偏移最大 → 感覺最近
  px3 = lerp(px3, tpx * 0.9, 0.06);  py3 = lerp(py3, tpy * 0.9, 0.06);

  // ---------- 遠景：透視展廳 ----------
  drawGallerySpace(px1, py1);

  // ---------- 中景：海葵（座標原點移至底部）----------
  push();
  translate(px2, py2);
  translate(0, height);
  for (let i = 0; i < anemones.length; i++) {
    anemones[i].display();
  }
  pop();

  // ---------- 氣泡 ----------
  updateBubbles();

  // ---------- 小魚 ----------
  for (let i = 0; i < fishes.length; i++) {
    fishes[i].update();
    fishes[i].display();
  }

  // ---------- 近景：畫框 + Spotlight ----------
  for (let i = 0; i < artworks.length; i++) {
    drawSpotlight(artworks[i].x + px3 * 0.3, artworks[i].y - 10);
    artworks[i].display(i === selectedIndex, px3, py3);
  }

  // ---------- iframe 尺寸動畫 ----------
  iframeW = lerp(iframeW, iframeTargetW, 0.10);
  iframeH = lerp(iframeH, iframeTargetH, 0.10);
  iframeEl.style('width',  floor(iframeW) + 'px');
  iframeEl.style('height', floor(iframeH) + 'px');

  // ---------- 標題文字 ----------
  drawTitle();

  time += 0.007;
}

// ============================================================
// drawGallerySpace(px, py) — 透視展廳（遠景層）
// ============================================================
function drawGallerySpace(px, py) {
  push();
  translate(px, py);
  let cx = width / 2;
  let cy = height * 0.55;

  // 後牆
  fill(10, 13, 26);
  noStroke();
  rect(width * 0.1, height * 0.08, width * 0.8, height * 0.6);

  // 地板（透視四邊形）
  fill(12, 16, 35);
  stroke(28, 48, 88, 70);
  strokeWeight(0.5);
  beginShape();
    vertex(0, height);
    vertex(width, height);
    vertex(width * 0.85, cy);
    vertex(width * 0.15, cy);
  endShape(CLOSE);

  // 縱向格線
  stroke(35, 65, 115, 45);
  strokeWeight(0.7);
  for (let i = 0; i <= 12; i++) {
    let t  = i / 12;
    let bx = lerp(0, width, t);
    let tx = lerp(width * 0.15, width * 0.85, t);
    line(bx, height, tx, cy);
  }
  // 橫向格線
  for (let d = 0.08; d < 1; d += 0.13) {
    let y  = lerp(cy, height, d);
    let x1 = lerp(width * 0.15, 0, d);
    let x2 = lerp(width * 0.85, width, d);
    line(x1, y, x2, y);
  }

  // 左右牆
  fill(9, 12, 24);
  noStroke();
  beginShape();
    vertex(0, 0); vertex(width * 0.15, height * 0.08);
    vertex(width * 0.15, cy); vertex(0, cy);
  endShape(CLOSE);
  beginShape();
    vertex(width, 0); vertex(width * 0.85, height * 0.08);
    vertex(width * 0.85, cy); vertex(width, cy);
  endShape(CLOSE);

  // 天花板線
  stroke(55, 95, 155, 90);
  strokeWeight(1);
  line(width * 0.15, height * 0.08, width * 0.85, height * 0.08);
  line(width * 0.15, height * 0.08, 0, 0);
  line(width * 0.85, height * 0.08, width, 0);
  pop();
}

// ============================================================
// drawSpotlight(x, y)
// ============================================================
function drawSpotlight(x, y) {
  push();
  let grad = drawingContext.createRadialGradient(x, y, 0, x, y + 90, 200);
  grad.addColorStop(0,    'rgba(130,210,255,0.20)');
  grad.addColorStop(0.35, 'rgba(80,160,255,0.10)');
  grad.addColorStop(1,    'rgba(0,0,0,0)');
  drawingContext.fillStyle = grad;
  drawingContext.beginPath();
  drawingContext.ellipse(x, y + 90, 170, 230, 0, 0, Math.PI * 2);
  drawingContext.fill();
  pop();
}

// ============================================================
// drawTitle()
// ============================================================
function drawTitle() {
  push();
  textAlign(CENTER, TOP);
  fill(175, 215, 255, 215);
  textSize(min(width * 0.03, 28));
  textStyle(BOLD);
  text("數位藝廊 · DIGITAL GALLERY", width / 2, 22);
  fill(100, 158, 220, 140);
  textSize(min(width * 0.015, 13));
  textStyle(ITALIC);
  text("動態海草與幾何空間  ·  Dynamic Seaweed & Geometric Space", width / 2, 56);
  pop();
}

// ============================================================
// updateBubbles() — 氣泡生命週期管理
// ============================================================
function updateBubbles() {
  if (random() < 0.055) bubbles.push(new Bubble());

  for (let i = bubbles.length - 1; i >= 0; i--) {
    let b = bubbles[i];
    b.update();
    if (b.isDead()) {
      for (let k = 0; k < 10; k++) {
        particles.push(new BubbleParticle(b.x, b.y, b.opacity));
      }
      bubbles.splice(i, 1);
    } else {
      b.display();
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
}

// ============================================================
// mousePressed()
// ============================================================
function mousePressed() {
  for (let i = 0; i < artworks.length; i++) {
    if (artworks[i].isClicked(mouseX, mouseY, px3, py3)) {
      if (selectedIndex === i) {
        selectedIndex = -1;
        iframeTargetW = 0;
        iframeTargetH = 0;
        iframeEl.attribute('src', 'about:blank');
        iframeEl.style('box-shadow', 'none');
      } else {
        selectedIndex = i;
        iframeEl.attribute('src', artworks[i].url);
        // 展開至螢幕 80%（消除捲軸的關鍵）
        iframeTargetW = windowWidth  * 0.80;
        iframeTargetH = windowHeight * 0.80;
        iframeEl.style('box-shadow', '0 0 60px rgba(60,150,255,0.40)');
      }
      return;
    }
  }
  if (selectedIndex !== -1) {
    selectedIndex = -1;
    iframeTargetW = 0;
    iframeTargetH = 0;
    iframeEl.attribute('src', 'about:blank');
    iframeEl.style('box-shadow', 'none');
  }
}

// ============================================================
// windowResized()
// ============================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (artworks.length >= 2) {
    artworks[0].x = width * 0.28;  artworks[0].y = height * 0.40;
    artworks[1].x = width * 0.72;  artworks[1].y = height * 0.40;
  }
  if (selectedIndex !== -1) {
    iframeTargetW = windowWidth  * 0.80;
    iframeTargetH = windowHeight * 0.80;
  }
}

// ============================================================
// ★ CLASS: Anemone — 海葵（深度仿附件 noise 多層風格）
// 技術重點：
//   - noise(i/400, frameCount/100, id) 產生有機偏移（非純 sin）
//   - 4 層疊加，每層 xOffset 偏移 + alpha 遞減
//   - curveVertex 首尾各加控制點（Catmull-Rom 規範）
//   - 滑鼠距離影響（distFactor × heightFactor）同附件邏輯
// ============================================================
class Anemone {
  constructor(ratio, id, colorStr, sw, h, amp) {
    this.ratio    = ratio;
    this.id       = id;
    this.colorStr = colorStr;
    this.sw       = sw;
    this.h        = h;
    this.amp      = amp;
  }

  display() {
    let xx = this.ratio * width;
    const layers = 4;
    const PTS    = 280;

    for (let L = 0; L < layers; L++) {
      let xOffset  = map(L, 0, layers - 1, -70, 6);
      let baseCol  = color(this.colorStr);
      baseCol.setAlpha(155 - L * 28);

      noFill();
      strokeWeight(this.sw * map(L, 0, layers - 1, 1, 0.45));
      stroke(baseCol);

      beginShape();
      curveVertex(xx + xOffset, 0); // 首控制點

      for (let i = 0; i < PTS; i++) {
        let progress = i / PTS;

        // noise() 有機偏移（附件核心邏輯）
        let deltaFactor = map(i, 0, 50, 0, 1, true);
        let deltaX = deltaFactor *
          (noise(i / 400, frameCount / 100 * 0.5, this.id) - 0.5) * this.amp;

        // 滑鼠互動（補償視差偏移 px2）
        let globalMX   = mouseX - px2;
        let influenceR = width * 0.30;
        let distToMouse = abs(globalMX - xx);
        let normDist   = constrain(1 - distToMouse / influenceR, 0, 1);
        let distFactor = pow(normDist, 2);
        let heightFactor = pow(progress, 1.8);
        let yNorm      = mouseY / height;
        let distFromC  = abs(yNorm - 0.5);
        let mouseYFact = pow(1 - distFromC * 2, 2);
        let vertInteract = heightFactor * mouseYFact;
        let mouseDelta = map(mouseX, 0, width, -180, 180);
        let mouseEffect  = mouseDelta * distFactor * vertInteract;

        let yy = -progress * this.h;
        curveVertex(xx + deltaX + xOffset + mouseEffect, yy);

        if (i === PTS - 1) {
          curveVertex(xx + deltaX + xOffset + mouseEffect, yy); // 尾控制點
        }
      }
      endShape();
    }
  }
}

// ============================================================
// ★ CLASS: Bubble — 氣泡
// ============================================================
class Bubble {
  constructor() {
    this.x       = random(width);
    this.y       = height + 10;
    this.radius  = random(6, 22);
    this.speedY  = random(0.6, 1.6) * 1.6;
    this.opacity = random(70, 190);
    this.life    = 0;
    this.maxLife = random(280, 480);
    this.popY    = random() < 0.7
      ? random(height * 0.08, height * 0.88)
      : -60;
  }

  update() { this.y -= this.speedY; this.life++; }

  isDead() {
    return this.y < this.popY || this.y < -this.radius || this.life > this.maxLife;
  }

  display() {
    let a = this.opacity * (1 - this.life / this.maxLife);
    noStroke();
    fill(255, a);
    circle(this.x, this.y, this.radius * 2);
    fill(255, a * 0.55);
    circle(
      this.x - this.radius * 0.38,
      this.y - this.radius * 0.38,
      this.radius * 0.48
    );
  }
}

// ============================================================
// ★ CLASS: BubbleParticle — 氣泡爆破粒子
// ============================================================
class BubbleParticle {
  constructor(x, y, opacity) {
    this.x = x; this.y = y;
    let angle = random(TWO_PI);
    let spd   = random(1.5, 4);
    this.vx = cos(angle) * spd;
    this.vy = sin(angle) * spd;
    this.life = 0;
    this.maxLife = random(10, 18);
    this.opacity = opacity * 0.7;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life++; }
  isDead() { return this.life >= this.maxLife; }
  display() {
    let a = this.opacity * (1 - this.life / this.maxLife);
    noStroke();
    fill(200, 230, 255, a);
    circle(this.x, this.y, 3);
  }
}

// ============================================================
// ★ CLASS: Fish — 游動小魚
// 技術重點：
//   - 魚身：curveVertex() 多點橢圓輪廓（可自由變形）
//   - 魚尾：vertex() 三角形（三個頂點精確控制）
//   - sin() 驅動上下擺動 + 魚尾左右搖擺
//   - dir 控制朝向，scale(-1,1) 水平翻轉
// ============================================================
class Fish {
  constructor() { this.reset(true); }

  reset(randomY = false) {
    this.dir  = random() < 0.5 ? 1 : -1;
    this.x    = this.dir === 1 ? -60 : width + 60;
    this.y    = randomY ? random(height * 0.10, height * 0.75) : this.y;
    this.vx   = this.dir * random(0.6, 1.8);
    this.size = random(14, 32);
    this.col  = color(
      random(30, 100), random(140, 220), random(180, 255), random(160, 215)
    );
    this.wobbleOffset = random(100);
    this.wobbleAmp    = random(4, 12);
    this.wobbleSpeed  = random(1.5, 3.0);
    this.tailPhase    = random(100);
  }

  update() {
    this.x += this.vx;
    this.y += sin(time * this.wobbleSpeed + this.wobbleOffset) * 0.4;
    if (this.x > width + 80 || this.x < -80) this.reset();
  }

  display() {
    push();
    translate(this.x, this.y);
    if (this.dir === -1) scale(-1, 1);

    let s = this.size;
    let tailSwing = sin(time * this.wobbleSpeed * 2 + this.tailPhase) * 0.38;

    // ---- 魚尾（vertex 三角形）----
    fill(red(this.col), green(this.col), blue(this.col), alpha(this.col) * 0.7);
    noStroke();
    push();
    translate(-s * 0.6, 0);
    rotate(tailSwing);
    beginShape();
      vertex(0,       0);
      vertex(-s * 0.7,  s * 0.42);
      vertex(-s * 0.7, -s * 0.42);
    endShape(CLOSE);
    pop();

    // ---- 魚身（curveVertex 橢圓輪廓）----
    fill(this.col);
    noStroke();
    beginShape();
      curveVertex( s * 0.5,  0);
      curveVertex( s * 0.5,  0);
      curveVertex( s * 0.2, -s * 0.28);
      curveVertex(-s * 0.3, -s * 0.28);
      curveVertex(-s * 0.55, 0);
      curveVertex(-s * 0.3,  s * 0.28);
      curveVertex( s * 0.2,  s * 0.28);
      curveVertex( s * 0.5,  0);
      curveVertex( s * 0.5,  0);
    endShape(CLOSE);

    // ---- 魚眼 ----
    fill(255, 255, 255, 200);
    circle(s * 0.28, -s * 0.10, s * 0.22);
    fill(10, 30, 60, 220);
    circle(s * 0.30, -s * 0.10, s * 0.12);

    // ---- 背鰭（vertex 小三角）----
    fill(red(this.col), green(this.col), blue(this.col) + 20, alpha(this.col) * 0.6);
    beginShape();
      vertex( s * 0.1, -s * 0.28);
      vertex(-s * 0.1, -s * 0.52);
      vertex(-s * 0.3, -s * 0.28);
    endShape(CLOSE);

    pop();
  }
}

// ============================================================
// ★ CLASS: Artwork — 畫框
// ============================================================
class Artwork {
  constructor(title, url, x, y) {
    this.title  = title;
    this.url    = url;
    this.x      = x;
    this.y      = y;
    this.w      = min(width * 0.28, 260);
    this.h      = min(height * 0.34, 195);
    this.hoverAnim = 0;
  }

  // isClicked — 加入視差校正，點擊區域與視覺吻合
  isClicked(mx, my, px, py) {
    let ox = this.x + px * 0.3;
    let oy = this.y + py * 0.2;
    return (
      mx > ox - this.w / 2 && mx < ox + this.w / 2 &&
      my > oy - this.h / 2 && my < oy + this.h / 2
    );
  }

  display(isSelected, px, py) {
    push();
    let ox = this.x + px * 0.3;
    let oy = this.y + py * 0.2;
    let hw = this.w / 2;
    let hh = this.h / 2;

    let isHover = (
      mouseX > ox - hw - 5 && mouseX < ox + hw + 5 &&
      mouseY > oy - hh - 5 && mouseY < oy + hh + 5
    );
    this.hoverAnim = lerp(this.hoverAnim, isHover ? 1 : 0, 0.1);

    // 光暈
    let ga = isSelected ? 210 : map(this.hoverAnim, 0, 1, 40, 130);
    let gc = isSelected ? color(80, 160, 255, ga) : color(60, 120, 220, ga);
    let gs = isSelected ? 20 : 8 + this.hoverAnim * 6;
    for (let g = gs; g > 0; g -= 3) {
      noFill();
      stroke(red(gc), green(gc), blue(gc), ga * (g / gs) * 0.4);
      strokeWeight(g);
      rect(ox - hw, oy - hh, this.w, this.h, 4);
    }

    // 內部（vertex 矩形）
    fill(14, 18, 38, 230);
    stroke(isSelected ? color(80,160,255,180) : color(50,90,160,120));
    strokeWeight(isSelected ? 2 : 1);
    beginShape();
      vertex(ox - hw, oy - hh);
      vertex(ox + hw, oy - hh);
      vertex(ox + hw, oy + hh);
      vertex(ox - hw, oy + hh);
    endShape(CLOSE);

    // 邊框條
    let fw = 6 + this.hoverAnim * 2;
    fill(isSelected ? color(60,130,220,160) : color(40,70,130,100));
    noStroke();
    rect(ox - hw, oy - hh,      this.w, fw,  4, 4, 0, 0);
    rect(ox - hw, oy + hh - fw, this.w, fw,  0, 0, 4, 4);
    rect(ox - hw, oy - hh, fw, this.h);
    rect(ox + hw - fw, oy - hh, fw, this.h);

    // 角標（vertex L 形）
    stroke(isSelected ? color(120,200,255,200) : color(80,140,200,140));
    strokeWeight(2);
    noFill();
    let cs = 16;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
      let cx2 = ox + sx * (hw - 4);
      let cy2 = oy + sy * (hh - 4);
      beginShape();
        vertex(cx2, cy2 - sy * cs);
        vertex(cx2, cy2);
        vertex(cx2 - sx * cs, cy2);
      endShape();
    });

    // 未選中：動態背景 + 提示
    if (!isSelected) {
      noStroke();
      for (let row = 0; row < 8; row++) {
        let rowY = map(row, 0, 7, oy - hh + 14, oy + hh - 14);
        let a    = 28 + sin(time * 2 + row * 0.5) * 14;
        fill(38, 78, 155, a);
        rect(ox - hw + 10, rowY, this.w - 20, 3, 1);
      }
      let pr = 18 + sin(time * 3) * 4;
      stroke(100, 180, 255, 115 + sin(time * 3) * 50);
      strokeWeight(1.5);
      noFill();
      circle(ox, oy, pr * 2);
      stroke(100, 180, 255, 75);
      strokeWeight(1);
      circle(ox, oy, pr * 2.8);
      fill(120, 180, 255, 155 + sin(time * 2) * 40);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(11);
      text("CLICK TO VIEW", ox, oy + hh * 0.55);
    }

    // 標題
    fill(178, 210, 255, 200);
    noStroke();
    textAlign(CENTER, TOP);
    textSize(13);
    textStyle(BOLD);
    text(this.title, ox, oy + hh + 10);
    if (isSelected) {
      fill(100, 160, 255, 145);
      textSize(10);
      textStyle(NORMAL);
      text("▶ 已載入 iframe · 點擊關閉", ox, oy + hh + 28);
    }
    pop();
  }
}
// ============================================================
// 程式碼結束 — 期中報告 v2
// ============================================================
