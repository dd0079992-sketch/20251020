// 圓圈可以使用的五種顏色 (十六進制)
const AVAILABLE_COLORS = [
    '#ffe5ec',
    '#ffc2d1',
    '#ffb3c6',
    '#ff8fab',
    '#fb6f92'
  ];
  
  const BACKGROUND_COLOR = '#a2d2ff';
  
  let circles = [];
  const NUM_CIRCLES = 100;
  
  // *** 新增：音效變數 ***
  let popSound; 
  
  // *** 新增：全域計分與顯示變數 ***
  let score = 0;
  const DISPLAY_NUMBER = '414730902'; // 左上角顯示的數字
  
  // *** 新增：preload 函式來載入音效 (需要 p5.sound.js) ***
  function preload() {
    // 警告：請將 'assets/pop.mp3' 替換為您的音效檔案的實際路徑和檔名！
    popSound = loadSound('assets/pop.mp3'); 
  }
  
  
  // *** 新增一個類別來處理爆炸的碎片 (Particle) ***
  class Particle {
    constructor(x, y, r, color, alpha) {
      this.x = x;
      this.y = y;
      this.r = r * random(0.05, 0.2); // 碎片半徑
      this.color = color;
      this.alpha = alpha;
      this.color.setAlpha(this.alpha);
      this.vel = p5.Vector.random2D(); // 隨機方向的向量
      this.vel.mult(random(2, 8)); // 設定一個速度
      this.gravity = 0.1; // 模擬重力
      this.lifespan = 255;
    }
  
    update() {
      this.vel.y += this.gravity; // 受重力影響向下加速
      this.x += this.vel.x;
      this.y += this.vel.y;
      this.lifespan -= 5; // 逐漸消失
      this.color.setAlpha(max(0, this.lifespan)); // 確保透明度不小於 0
    }
  
    display() {
      noStroke();
      fill(this.color);
      ellipse(this.x, this.y, this.r * 2);
    }
  
    isFinished() {
      return this.lifespan < 0;
    }
  }
  
  class Bubble {
    constructor() {
      this.reset();
    }
  
    reset() {
      let colorHex = random(AVAILABLE_COLORS);
      this.color = color(colorHex);
      this.alpha = random(50, 200);
      this.color.setAlpha(this.alpha);
      this.r = random(50, 200); // 這是圓的「直徑」
      this.x = random(width);
      this.y = random(height, height * 2); // 從下方或更下方開始
      this.speed = random(0.5, 3.0);
      
      // *** 爆炸相關屬性初始化/重設 ***
      this.exploded = false; 
      this.explosionParticles = []; 
      this.explosionTimer = 0; // 用於計時爆炸結束，然後重設氣球
    }
  
    // *** 新增：檢查點擊是否在氣球內 ***
    contains(px, py) {
      // 氣球的半徑是直徑 this.r 的一半
      const d = dist(px, py, this.x, this.y);
      return d < this.r / 2 && !this.exploded; // 只有未爆炸的氣球才能被點擊
    }
  
    // *** 新增：計算並增加分數 ***
    getScoreValue() {
      // this.r 是直徑
      if (this.r >= 150) {
        return 3;
      } else if (this.r >= 100) {
        return 2;
      } else if (this.r >= 50) { // 50~100 (含50, 不含100)
        return 1;
      }
      return 0;
    }
  
    // *** 執行爆炸的邏輯 (已新增音效播放) ***
    explode() {
      this.exploded = true;
      this.explosionTimer = 0;
      const numParticles = floor(random(10, 20)); // 產生 10 到 20 個碎片
      
      // *** 音效處理：播放載入的音效檔案 ***
      if (popSound && popSound.isLoaded()) {
         popSound.stop(); 
         popSound.play(0, random(0.8, 1.2), random(0.5, 1.0)); // 播放，並加入隨機速度和音量
      }
  
      // 產生碎片
      for (let i = 0; i < numParticles; i++) {
        this.explosionParticles.push(new Particle(this.x, this.y, this.r / 2, color(this.color), this.alpha));
      }
      
      // 點擊爆炸時，更新分數
      score += this.getScoreValue();
    }
  
    move() {
      if (this.exploded) {
        // 如果已經爆炸，更新碎片
        for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
          this.explosionParticles[i].update();
          if (this.explosionParticles[i].isFinished()) {
            this.explosionParticles.splice(i, 1);
          }
        }
        this.explosionTimer++;
        
        // 當所有碎片都消失，或爆炸時間超過 60 幀（約 1 秒），則重設氣球
        if (this.explosionParticles.length === 0 || this.explosionTimer > 60) {
           this.reset();
        }
        return; // 爆炸時不執行正常的上飄邏輯
      }
  
      // 正常的上飄邏輯
      this.y -= this.speed;
      this.x += sin(frameCount * 0.01 + this.y * 0.005) * 0.5;
  
      // *** 移除隨機爆炸邏輯 (僅保留點擊爆炸) ***
      // if (this.y < height && this.y > 0 && frameCount % 100 === 0 && random() < 0.1) {
      //   this.explode();
      //   return; 
      // }
  
      // 如果氣球完全飄出畫布上方，則重設
      if (this.y < -this.r) {
        this.reset();
      }
    }
  
    display() {
      if (this.exploded) {
        // *** 爆炸時繪製碎片 ***
        for (let p of this.explosionParticles) {
          p.display();
        }
        return; // 爆炸時不繪製圓形和內部圖案
      }
      
// --- 繪製原本的圓形 ---
noStroke();
fill(this.color);
ellipse(this.x, this.y, this.r, this.r);

// --- 在圓的右上方添加星型 (原有程式碼) ---
const circleRadius = this.r / 2;
const starOuterRadius = this.r / 10; // 星形外半徑 (直徑為 this.r / 5)
const starInnerRadius = starOuterRadius / 2; // 星形內半徑
const numPoints = 5; // 五角星

const offsetDistanceStar = circleRadius / 2; // 距離圓心的偏移量
const angleOffsetStar = -PI / 4; // 右上方的角度

const starX = this.x + cos(angleOffsetStar) * offsetDistanceStar;
const starY = this.y + sin(angleOffsetStar) * offsetDistanceStar;

fill(255, this.alpha); // 白色，並使用和圓圈一樣的透明度

beginShape();
let angle = TWO_PI / numPoints;
let halfAngle = angle / 2.0;
for (let a = -HALF_PI; a < TWO_PI - HALF_PI; a += angle) {
  let sx = starX + cos(a) * starOuterRadius;
  let sy = starY + sin(a) * starOuterRadius;
  vertex(sx, sy);
  sx = starX + cos(a + halfAngle) * starInnerRadius;
  sy = starY + sin(a + halfAngle) * starInnerRadius;
  vertex(sx, sy);
}
endShape(CLOSE);
  
      // --- 在圓的左上方添加方形 (新增的程式碼) ---
      const squareSize = this.r / 5; // 方形大小為圓直徑的五分之一
      
      // 計算方形中心點的偏移位置
      const offsetDistanceFromCenter = circleRadius / 2;
      const angleOffsetSquare = -3 * PI / 4; // 左上方的角度 (-135度)
  
      const squareCenterX = this.x + cos(angleOffsetSquare) * offsetDistanceFromCenter;
      const squareCenterY = this.y + sin(angleOffsetSquare) * offsetDistanceFromCenter;
  
      // 設定方形的樣式
      fill(255, this.alpha); // 白色，並使用和圓圈一樣的透明度
      
      // 繪製方形
      push(); // 推入繪圖狀態，以便更改 rectMode 不影響其他部分
      rectMode(CENTER);
      rect(squareCenterX, squareCenterY, squareSize, squareSize);
      pop(); // 彈出繪圖狀態
    }
  }
  
  function setup() {
    createCanvas(windowWidth, windowHeight);
    // *** 設置 colorMode 以確保 setAlpha 正常運作 ***
    colorMode(RGB, 255, 255, 255, 255); 
    
    for (let i = 0; i < NUM_CIRCLES; i++) {
      circles.push(new Bubble());
    }
  }
  
  function draw() {
    background(BACKGROUND_COLOR);
    for (let i = 0; i < circles.length; i++) {
      circles[i].move();
      circles[i].display();
    }
  
    // *** 繪製 UI 元素：左上角數字 ***
    push();
    textSize(24);
    textFont('Arial'); 
    fill(0); // 黑色
    textAlign(LEFT, TOP);
    text(DISPLAY_NUMBER, 15, 15);
    pop();
  
    // *** 繪製 UI 元素：右上角計分板 ***
    push();
    textSize(24);
    textFont('Arial'); 
    fill(0); // 黑色
    textAlign(RIGHT, TOP);
    text('Score: ' + score, width - 15, 15);
    pop();
  }
  
  function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
  }
  
  // *** 關鍵：處理滑鼠點擊 (取代 mousePressed 的主要邏輯) ***
  function mouseClicked() {
    // 嘗試啟動音訊上下文（確保聲音可用）
    userStartAudio(); 
  
    // 從後面開始迭代，確保點擊到最上層的氣球
    for (let i = circles.length - 1; i >= 0; i--) {
      let bubble = circles[i];
      
      // 檢查點擊是否在氣球內且氣球未爆炸
      if (bubble.contains(mouseX, mouseY)) {
        bubble.explode();
        // 找到第一個被點擊的氣球後，立即停止檢查
        return; 
      }
    }
  }