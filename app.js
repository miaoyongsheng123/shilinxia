// 文案都在这个文件顶部。改任务、线索或终局密码，只改这里。
const PASSWORD = "同心致远";
const STAFF_FLAG = "haibu-staff";
const SECRET_KEY = "haibu-shilinxia-secret-v1";
const FINAL_KEY = "haibu-shilinxia-final-v1";
const BASE_KEY = "haibu-base-url";

const TASKS = [
  "不经提醒，主动帮一位队友做一件小事。",
  "让全队在安全的地方完成一张创意合影，画面里要出现石头。",
  "在不暴露任务的前提下，让一位其他队员说出「合作」。",
  "组织全队喊一句鼓励口号。你不能先宣布这是任务。",
  "问一位非本队队员：今天最期待哪一段路，并听对方说完。",
  "找到一处安全提示，提醒本队队友看一眼。",
  "把自己的水让队友先喝一口，不要解释原因。",
  "给队伍里最安静的人一句具体的称赞。",
  "记下三位队友今天的一个小目标，结束前向裁判口述。",
  "在宽敞安全的地方，带全队一起拍手三次。",
  "用一句话向其他队伍的人介绍「海步」，不要说这是任务。",
  "观察路旁一种植物，给它起一个像药名的外号，只在队内分享。",
  "让两支不同队伍的人一起入镜合影。",
  "休息时把瓶盖或垃圾顺手收好，不要宣扬。",
  "向一位工作人员说一声谢谢，并说清你在谢什么。",
  "找出本队今天帮大家最多的人，公开感谢一个具体行为。",
  "不说话，用动作向另一队传递「加油」。",
  "请每位队友用一个词形容石林峡，你把这些词连成一句话。",
  "今天至少叫出三位非本队队员的名字。",
  "在不暴露任务的前提下，让队伍讨论一次：如果走散了先做什么。",
  "把队伍分成两人一组，互相检查鞋带和背包带。",
  "记住路上一种只属于今天的声音，休息时讲给队友听。",
  "邀请一位其他队伍的人，加入你们一次欢呼。",
  "发现队友状态不对时，问一句「要不要歇一下」，然后照做。",
  "给本队起一个今天的小队名，并让大家愿意跟着叫。",
  "在安全处带全队面向同一方向，一起慢慢呼吸三次。",
  "向裁判描述你看到的两种不同岩石，可以不用照片。",
  "帮另一队回答一个正在争论的小问题，答完就离开。",
  "让本队最活泼的人，安静听一位队友把一段话说完。",
  "在队内做一轮「今日感谢」：每人只说一个名字。",
  "把防晒、纸巾或绷带分享给还没准备的人。",
  "和队友约定一个只有你们懂的手势，之后真的用上一次。",
  "指出一处不该停留的地方，提醒队伍绕开。",
  "请一位队员用一两句话讲一个健康小知识。",
  "终点前带全队回顾：今天一起完成的一件小事。",
  "对走得太快的队友说「慢一点」，语气是关心。",
  "让全队在休息时把手机扣下两分钟，只聊天。",
  "发现别人队伍落下了物品，帮他们交回去。",
  "用队里现有的人，摆一个「八」或「心」的造型并合影。",
  "向另一队交换一个路上看到的细节，不涉及解谜线索。"
];

const TEAMS = {
  A: [
    { kind: "hint", text: "第 3 个字在 E 队手里。E 队有一条是假的。" },
    { kind: "true", text: "第 1 个字是「同」。" },
    { kind: "false", text: "第 1 个字是「山」。" }
  ],
  B: [
    { kind: "false", text: "整条密码一共六个字。" },
    { kind: "hint", text: "第 1 个字要和 A 队核对，两队对上的才算数。" },
    { kind: "true", text: "密码一共四个字，第 1 个字不是「合」。" }
  ],
  C: [
    { kind: "true", text: "第 2 个字是「心」。" },
    { kind: "false", text: "第 2 个字是「林」。" },
    { kind: "hint", text: "D 队能证明第 2 个字哪一条是真的。" }
  ],
  D: [
    { kind: "false", text: "第 2 个字是左右结构。" },
    { kind: "true", text: "第 2 个字只有 4 画。" },
    { kind: "hint", text: "去找 C 队。用笔画把他们的两种说法对一遍，留下对得上的那个字。" }
  ],
  E: [
    { kind: "hint", text: "问 F 队：第 3 个字有没有三点水。" },
    { kind: "false", text: "第 3 个字是「海」。" },
    { kind: "true", text: "第 3 个字是「致」。" }
  ],
  F: [
    { kind: "true", text: "第 3 个字没有三点水。" },
    { kind: "hint", text: "和第 3 个字有关的另一队是 E，他们有一条是错的。" },
    { kind: "false", text: "整句密码就是「海步医药」。" }
  ],
  G: [
    { kind: "false", text: "第 4 个字是「步」。" },
    { kind: "hint", text: "H 队知道最后一个字的部首和笔画。" },
    { kind: "true", text: "第 4 个字是「远」。" }
  ],
  H: [
    { kind: "hint", text: "去找 G 队核对最后一个字，别信听起来像公司名字的那个。" },
    { kind: "true", text: "第 4 个字是走之底，一共 7 画。" },
    { kind: "false", text: "第 4 个字是「峡」。" }
  ]
};

const KIND_LABEL = { true: "真线索", false: "干扰", hint: "交换提示" };

const ENTRIES = [
  { no: "1", title: "秘密任务", route: "#/secret", open: "#/secret/sample", openLabel: "预览", who: "全体各扫一次", file: "01-秘密任务.png" },
  { no: "2", title: "A队情报", route: "#/clue/A", who: "建议队长保管", file: "02-A队情报.png" },
  { no: "3", title: "B队情报", route: "#/clue/B", who: "建议队长保管", file: "03-B队情报.png" },
  { no: "4", title: "C队情报", route: "#/clue/C", who: "建议队长保管", file: "04-C队情报.png" },
  { no: "5", title: "D队情报", route: "#/clue/D", who: "建议队长保管", file: "05-D队情报.png" },
  { no: "6", title: "E队情报", route: "#/clue/E", who: "建议队长保管", file: "06-E队情报.png" },
  { no: "7", title: "F队情报", route: "#/clue/F", who: "建议队长保管", file: "07-F队情报.png" },
  { no: "8", title: "G队情报", route: "#/clue/G", who: "建议队长保管", file: "08-G队情报.png" },
  { no: "9", title: "H队情报", route: "#/clue/H", who: "建议队长保管", file: "09-H队情报.png" },
  { no: "10", title: "终局解密", route: "#/final", who: "到集合点再发", file: "10-终局解密.png" }
];

const app = document.getElementById("app");
let memorySecret = null;
let sessionPhotoUrl = "";
let storageOk = true;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function parseRoute() {
  let raw = location.hash || "#/";
  try {
    raw = decodeURIComponent(raw);
  } catch (err) {
    raw = location.hash || "#/";
  }
  const parts = raw.replace(/^#/, "").split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "console") return { name: "console" };
  if (parts[0] === "secret" && parts[1] === "sample") return { name: "sample" };
  if (parts[0] === "secret") return { name: "secret" };
  if (parts[0] === "final") return { name: "final" };
  if (parts[0] === "clue" && parts[1] && TEAMS[parts[1].toUpperCase()]) {
    return { name: "clue", team: parts[1].toUpperCase() };
  }
  return { name: "missing" };
}

function isStaffBrowser() {
  try {
    return sessionStorage.getItem(STAFF_FLAG) === "1";
  } catch (err) {
    return false;
  }
}

function loadSecret() {
  try {
    const raw = localStorage.getItem(SECRET_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Number.isInteger(data.taskId) && TASKS[data.taskId]) return data;
    }
  } catch (err) {
    storageOk = false;
  }
  return memorySecret;
}

function saveSecret(data) {
  memorySecret = data;
  try {
    localStorage.setItem(SECRET_KEY, JSON.stringify(data));
    storageOk = true;
  } catch (err) {
    storageOk = false;
  }
}

function loadFinal() {
  try {
    const data = JSON.parse(sessionStorage.getItem(FINAL_KEY) || "null");
    return data && data.ok ? data : null;
  } catch (err) {
    return null;
  }
}

function defaultBase() {
  if (location.protocol === "file:") return "";
  const url = new URL(location.href);
  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname = url.pathname.replace(/[^/]*$/, "");
  return url.toString();
}

function baseNeedsWarning(base) {
  const value = base.trim();
  if (!value || location.protocol === "file:") return true;
  const withProtocol = /^https?:\/\//i.test(value) ? value : "http://" + value;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(?::|\/|$)/i.test(withProtocol);
}

function syncBaseWarning(base) {
  const warn = document.getElementById("base-warn");
  if (warn) warn.hidden = !baseNeedsWarning(base);
}

function currentBase() {
  try {
    const saved = sessionStorage.getItem(BASE_KEY);
    if (saved !== null) return saved;
  } catch (err) {
    // 继续用当前地址。
  }
  return defaultBase();
}

function joinUrl(base, route) {
  let clean = base.trim();
  if (!clean) return "";
  if (!/^https?:\/\//i.test(clean)) clean = "http://" + clean;
  clean = clean.replace(/#.*$/, "");
  let url;
  try {
    url = new URL(clean);
  } catch (err) {
    return "";
  }
  const hash = route.charAt(0) === "#" ? route : "#" + route;
  const last = url.pathname.split("/").filter(Boolean).pop() || "";
  if (last.indexOf(".") === -1 && !url.pathname.endsWith("/")) url.pathname += "/";
  url.hash = hash;
  return url.toString();
}

function page(title, body, wide) {
  const staffLink = isStaffBrowser()
    ? '<a class="back no-print" href="#/console">返回工作人员台</a>'
    : "";
  return `
    <main class="sheet${wide ? " wide" : ""}">
      ${staffLink}
      <header class="mast">
        <div class="seal">海步</div>
        <div>
          <p class="eyebrow">奔跑吧 · 石林峡</p>
          <h1>${esc(title)}</h1>
        </div>
      </header>
      ${body}
    </main>`;
}

function homeHtml() {
  return page("峡谷情报争夺战", `
    <section class="hero">
      <p class="lede">海步医药轻徒步团建。大约 85 人、8 支队伍。手机扫码领任务、看本队线索，终点拼出四个字。</p>
      <ol class="steps">
        <li><span class="num">1</span><span>工作人员在工作台生成 10 张二维码，打印或投到只给队长看的屏幕上。</span></li>
        <li><span class="num">2</span><span>每人扫秘密任务。各队只看自己的情报，再当面交换。</span></li>
        <li><span class="num">3</span><span>到集合点扫终局码。密码对了，把页面给裁判看。积分仍由工作人员手工记。</span></li>
      </ol>
      <div class="actions">
        <a class="btn" href="#/console">打开工作人员台</a>
      </div>
      <p class="fine" style="margin-top:14px">队员不用打开这一页，直接扫现场发的码。窄路和陡坡不要停下来看手机。</p>
    </section>
  `);
}

function secretCard(data, preview) {
  const task = TASKS[data.taskId];
  const status = data.done ? "已完成" : "未完成";
  const photo = sessionPhotoUrl && !preview
    ? `<img class="photo-preview" alt="刚才选择的证明照片" src="${esc(sessionPhotoUrl)}">`
    : "";
  return `
    <article class="card task">
      <p class="task-no">${preview ? "预览" : "任务 " + (data.taskId + 1)}</p>
      <p>${esc(task)}</p>
    </article>
    ${preview ? '<p class="note">这是样式预览，不会记到这台手机上。正式二维码请让队员自己扫。</p>' : `
    <form class="stack" data-form="secret">
      <div class="row">
        <label>姓名（选填）<input name="name" maxlength="20" value="${esc(data.name || "")}" placeholder="裁判核对用"></label>
        <label>队伍（选填）
          <select name="team">
            <option value="">未选</option>
            ${Object.keys(TEAMS).map((id) => `<option value="${id}"${data.team === id ? " selected" : ""}>${id}队</option>`).join("")}
          </select>
        </label>
      </div>
      <label>完成说明
        <textarea name="note" maxlength="200" placeholder="用一两句话写你做了什么">${esc(data.note || "")}</textarea>
      </label>
      <label class="no-print">证明照片（只留在这次打开里，不会上传）
        <input name="photo" type="file" accept="image/*" capture="environment">
      </label>
      ${photo}
      <div class="actions">
        <button class="btn" type="submit">${data.done ? "更新完成记录" : "标记完成"}</button>
        <span class="status ${data.done ? "done" : "wait"}">${status}</span>
      </div>
      <p class="fine">${storageOk
        ? "完成后把这个页面给裁判看。不要把任务截图发到群里。刷新不会换任务。"
        : "这部手机没有记下任务，刷新可能会换成另一条。请先把页面给裁判看。"}</p>
    </form>`}
  `;
}

function secretHtml() {
  const data = loadSecret();
  const body = data
    ? secretCard(data, false)
    : `
      <section class="card">
        <p class="lede">扫到这里的人，每人领一条只属于这台手机的秘密任务。点下去之后就会定住。</p>
        <div class="actions"><button class="btn" type="button" data-action="claim">领取我的任务</button></div>
      </section>
      <p class="fine">任务可能和别人重复。裁判看完成情况给分。请在安全、宽敞的地方看手机。</p>`;
  return page("秘密任务", body);
}

function sampleHtml() {
  return page("秘密任务", secretCard({ taskId: 0, name: "林夏", team: "A", note: "", done: false }, true));
}

function clueHtml(team) {
  const clues = TEAMS[team].map((clue, index) => `
    <li><span class="k">线索 ${index + 1}</span>${esc(clue.text)}</li>
  `).join("");
  return page(team + "队情报", `
    <section class="card">
      <p class="lede">这三张只给 ${esc(team)} 队。可以口头交换，尽量别把整页亮给别的队。</p>
      <ol class="clue-list">${clues}</ol>
    </section>
    <p class="fine">三条里有真有假。终局密码要八队合在一起才完整。</p>
  `);
}

function finalHtml() {
  const saved = loadFinal();
  const body = saved ? successBlock(saved) : `
    <section class="card">
      <p class="lede">八队情报拼成一句话。把四个汉字交给这里。</p>
      <form class="stack" data-form="final">
        <label>队伍
          <select name="team">
            <option value="">未选</option>
            ${Object.keys(TEAMS).map((id) => `<option value="${id}">${id}队</option>`).join("")}
          </select>
        </label>
        <label>密码
          <input name="password" maxlength="12" autocomplete="off" placeholder="四个汉字" enterkeyhint="done">
        </label>
        <button class="btn" type="submit">提交密码</button>
        <p class="bad-text" id="final-msg" hidden></p>
      </form>
    </section>`;
  return page("终局解密", body);
}

function successBlock(data) {
  const who = data.team ? data.team + "队" : "你们";
  return `
    <section class="card result">
      <div class="stamp">破解</div>
      <h2>对上了</h2>
      <p>${esc(who)}拼出的密码是「${esc(PASSWORD)}」。</p>
      <p class="fine">把这个页面给裁判看。排名和加分由工作人员当场宣布。</p>
    </section>`;
}

function consoleHtml() {
  const base = currentBase();
  const fileMode = location.protocol === "file:";
  const localHost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(base);
  const showWarn = fileMode || localHost || !base;
  const warn = `<div class="callout warn no-print" id="base-warn"${showWarn ? "" : " hidden"}>
        <strong>手机还扫不开。</strong>
        <p>二维码里的地址必须是队员手机打得开的网址。直接双击文件，或用 localhost，手机都不认。</p>
        <p>在这个文件夹打开终端，运行 <code>python3 -m http.server 8080</code>。电脑和手机连同一个 Wi-Fi，把下面地址改成 <code>http://电脑的局域网IP:8080</code>。</p>
      </div>`;
  const teams = Object.keys(TEAMS).map((id) => `
    <section class="team-block">
      <h3>${id}队</h3>
      <div class="stack">
        ${TEAMS[id].map((clue) => `<div class="key-clue ${clue.kind}"><span class="k">${KIND_LABEL[clue.kind]}</span>${esc(clue.text)}</div>`).join("")}
      </div>
    </section>
  `).join("");
  const pool = TASKS.map((task, index) => `<li><strong>${index + 1}.</strong> ${esc(task)}</li>`).join("");
  return `
    <main class="sheet wide">
      <header class="mast">
        <div class="seal">海步</div>
        <div>
          <p class="eyebrow">请勿投屏给全体队员</p>
          <h1>工作人员台</h1>
        </div>
      </header>
      <div class="jumps no-print">
        <button class="btn-small" type="button" data-action="jump" data-target="qr-sheet">十张二维码</button>
        <button class="btn-small" type="button" data-action="jump" data-target="key-sheet">线索总表</button>
        <button class="btn-small" type="button" data-action="jump" data-target="task-pool">任务池</button>
      </div>
      ${warn}
      <section class="section qr-only" id="qr-sheet">
        <h2>十张二维码</h2>
        <p class="lede">1 号全体领取秘密任务，2 到 9 号是八队情报，10 号到终点再打开。</p>
        <label class="stack no-print">队员手机打得开的地址
          <input id="base-url" value="${esc(base)}" placeholder="http://192.168.1.20:8080" autocomplete="off">
        </label>
        <div class="actions no-print">
          <button class="btn" type="button" data-action="print-qr">打印二维码</button>
          <button class="btn-ghost" type="button" data-action="use-here">填入当前网址</button>
          <a class="btn-ghost" href="#/secret/sample">预览任务卡</a>
        </div>
        <div class="qr-grid" id="qr-grid"></div>
      </section>
      <section class="section key-only" id="key-sheet">
        <h2>线索总表</h2>
        <div class="callout">
          <p>终局密码是 <strong>${esc(PASSWORD)}</strong>。页面核对只看四个字是否一致，分数请手工记。</p>
          <p class="fine">判题备忘：心是 4 画，不是左右结构；林是 8 画，左右结构。致没有三点水，海有。远是走之底、7 画；步也是 7 画，但不是走之底；峡不是走之底。</p>
        </div>
        <div class="actions no-print">
          <button class="btn-ghost" type="button" data-action="print-key">打印线索总表</button>
          <button class="btn-ghost" type="button" data-action="clear-final">清空本机终局记录</button>
          <button class="btn-ghost" type="button" data-action="clear-secret">清空本机秘密任务</button>
        </div>
        <div class="team-grid">${teams}</div>
      </section>
      <section class="section key-only" id="task-pool">
        <h2>秘密任务池</h2>
        <p class="note">共 ${TASKS.length} 条。每人第一次领取时随机抽一条，记在自己的手机里。85 人里会有重复，按完成情况给分。</p>
        <div class="card pool"><ol>${pool}</ol></div>
      </section>
    </main>`;
}

function missingHtml() {
  return page("这个入口没有对应环节", `
    <section class="card">
      <p>请回到现场二维码再扫一次。工作人员从首页进入工作台。</p>
      <div class="actions"><a class="btn" href="#/">回到首页</a></div>
    </section>
  `);
}

function render() {
  const route = parseRoute();
  if (route.name === "console") {
    try { sessionStorage.setItem(STAFF_FLAG, "1"); } catch (err) { /* 没有存储也不影响出码 */ }
  }
  const titles = {
    home: "峡谷情报争夺战",
    console: "工作人员台",
    secret: "秘密任务",
    sample: "秘密任务预览",
    final: "终局解密",
    clue: route.team ? route.team + "队情报" : "情报",
    missing: "入口无效"
  };
  document.title = titles[route.name] || "峡谷情报争夺战";
  if (route.name === "home") app.innerHTML = homeHtml();
  else if (route.name === "console") app.innerHTML = consoleHtml();
  else if (route.name === "secret") app.innerHTML = secretHtml();
  else if (route.name === "sample") app.innerHTML = sampleHtml();
  else if (route.name === "clue") app.innerHTML = clueHtml(route.team);
  else if (route.name === "final") app.innerHTML = finalHtml();
  else app.innerHTML = missingHtml();
  if (route.name === "console") mountQr(currentBase());
  const heading = app.querySelector("h1");
  if (heading) heading.tabIndex = -1;
}

function makeQrCanvas(text) {
  if (typeof qrcode !== "function") throw new Error("二维码组件没有加载");
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  const qr = qrcode(0, "Q");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const scale = 12;
  const margin = 4;
  const size = (count + margin * 2) * scale;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#143528";
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
      }
    }
  }
  return canvas;
}

function mountQr(base) {
  const grid = document.getElementById("qr-grid");
  if (!grid) return;
  grid.innerHTML = ENTRIES.map((entry) => {
    const url = joinUrl(base, entry.route);
    return `
      <article class="qr-card" data-route="${esc(entry.route)}">
        <strong>${esc(entry.no)} · ${esc(entry.title)}</strong>
        <div class="qr-box"></div>
        <span class="fine">${esc(entry.who)}</span>
        <span class="url">${url ? esc(url) : "先填写上面的地址"}</span>
        <div class="actions no-print">
          <button class="btn-small" type="button" data-action="copy-link" data-url="${esc(url)}" ${url ? "" : "disabled"}>复制链接</button>
          <button class="btn-small" type="button" data-action="download-qr" data-url="${esc(url)}" data-filename="${esc(entry.file)}" ${url ? "" : "disabled"}>下载</button>
          <a class="btn-small" href="${esc(entry.open || entry.route)}">${esc(entry.openLabel || "本机打开")}</a>
        </div>
      </article>`;
  }).join("");
  grid.querySelectorAll(".qr-card").forEach((card) => {
    const button = card.querySelector("[data-action='download-qr']");
    const url = button ? button.getAttribute("data-url") : "";
    const box = card.querySelector(".qr-box");
    if (!url) {
      box.textContent = "地址空着";
      return;
    }
    try {
      const canvas = makeQrCanvas(url);
      const img = new Image();
      img.alt = card.querySelector("strong").textContent;
      img.src = canvas.toDataURL("image/png");
      box.appendChild(img);
    } catch (err) {
      box.textContent = "生成失败，请换一个 http 开头的地址。";
    }
  });
}

function readSecretForm(form, previous) {
  return {
    taskId: previous.taskId,
    name: form.name.value.trim().slice(0, 20),
    team: form.team.value,
    note: form.note.value.trim().slice(0, 200),
    done: true,
    claimedAt: previous.claimedAt
  };
}

function normalizePassword(value) {
  return value.replace(/\s+/g, "").replace(/遠/g, "远");
}

function samePositionCount(value) {
  const input = Array.from(normalizePassword(value));
  const answer = Array.from(PASSWORD);
  let count = 0;
  for (let i = 0; i < answer.length; i += 1) {
    if (input[i] === answer[i]) count += 1;
  }
  return count;
}

function showFinalMessage(text) {
  const node = document.getElementById("final-msg");
  if (!node) return;
  node.hidden = false;
  node.textContent = text;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  const old = button.textContent;
  button.textContent = "已复制";
  window.setTimeout(() => { button.textContent = old; }, 1200);
}

function downloadQr(url, filename) {
  const canvas = makeQrCanvas(url);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function printMode(className) {
  document.body.classList.remove("print-qr", "print-key");
  document.body.classList.add(className);
  const done = () => {
    document.body.classList.remove(className);
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const action = button.getAttribute("data-action");
  if (action === "claim") {
    const data = {
      taskId: Math.floor(Math.random() * TASKS.length),
      name: "",
      team: "",
      note: "",
      done: false,
      claimedAt: Date.now()
    };
    saveSecret(data);
    render();
  } else if (action === "jump") {
    const target = document.getElementById(button.getAttribute("data-target"));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (action === "copy-link") {
    copyText(button.getAttribute("data-url"), button);
  } else if (action === "download-qr") {
    downloadQr(button.getAttribute("data-url"), button.getAttribute("data-filename"));
  } else if (action === "print-qr") {
    printMode("print-qr");
  } else if (action === "print-key") {
    printMode("print-key");
  } else if (action === "use-here") {
    const input = document.getElementById("base-url");
    if (!input) return;
    input.value = defaultBase();
    try { sessionStorage.setItem(BASE_KEY, input.value); } catch (err) { /* 忽略 */ }
    mountQr(input.value);
    syncBaseWarning(input.value);
  } else if (action === "clear-secret") {
    memorySecret = null;
    sessionPhotoUrl = "";
    try { localStorage.removeItem(SECRET_KEY); } catch (err) { /* 忽略 */ }
    button.textContent = "已清空";
  } else if (action === "clear-final") {
    try { sessionStorage.removeItem(FINAL_KEY); } catch (err) { /* 忽略 */ }
    button.textContent = "已清空";
  }
});

function rememberSecretForm(form, previous) {
  saveSecret({
    taskId: previous.taskId,
    name: form.name.value.trim().slice(0, 20),
    team: form.team.value,
    note: form.note.value.trim().slice(0, 200),
    done: previous.done,
    claimedAt: previous.claimedAt
  });
}

app.addEventListener("input", (event) => {
  if (event.target.id === "base-url") {
    try { sessionStorage.setItem(BASE_KEY, event.target.value); } catch (err) { /* 忽略 */ }
    mountQr(event.target.value);
    syncBaseWarning(event.target.value);
    return;
  }
  const form = event.target.form;
  if (form && form.dataset.form === "secret" && event.target.name !== "photo") {
    const previous = loadSecret();
    if (previous) rememberSecretForm(form, previous);
  }
});

app.addEventListener("change", (event) => {
  if (event.target.name !== "photo" || !event.target.files || !event.target.files[0]) return;
  if (sessionPhotoUrl) URL.revokeObjectURL(sessionPhotoUrl);
  sessionPhotoUrl = URL.createObjectURL(event.target.files[0]);
  const form = event.target.form;
  const previous = loadSecret();
  if (form && previous) rememberSecretForm(form, previous);
  render();
});

app.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  if (form.dataset.form === "secret") {
    const previous = loadSecret();
    if (!previous) return;
    saveSecret(readSecretForm(form, previous));
    render();
  } else if (form.dataset.form === "final") {
    const value = normalizePassword(form.password.value);
    if (value.length !== PASSWORD.length) {
      showFinalMessage("密码是四个汉字。");
      return;
    }
    if (value === PASSWORD) {
      const data = { ok: true, team: form.team.value, at: Date.now() };
      try { sessionStorage.setItem(FINAL_KEY, JSON.stringify(data)); } catch (err) { /* 忽略 */ }
      render();
      return;
    }
    const hit = samePositionCount(value);
    showFinalMessage(hit > 0
      ? "还没对上。四个字里有 " + hit + " 个字连位置都正确，其余再去跟别的队换。"
      : "一个位置都没对上。留意每队都有一条假情报。");
  }
});

window.addEventListener("hashchange", render);
render();
