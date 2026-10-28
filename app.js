const STATE_KEY = "haibu-hike-2026-v1";
const DEVICE_KEY = "haibu-hike-device";
const ADMIN_KEY = "haibu-hike-admin";

const app = document.getElementById("app");
let meta = null;
let suggestedBase = "";
let serverError = "";
let flashMessage = "";
let pullKey = "";
let pending = false;
let pickingTeam = false;
let adminPassword = "";
let adminBoard = null;
let adminLoading = false;
let pollTimer = 0;
let fillToken = 0;
let gateContent = null;
let qrBase = "";

function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function pointsText(value) {
  const rounded = Math.round(Number(value || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function whenText(stamp) {
  if (!stamp) return "还没有";
  return new Date(stamp).toLocaleString("zh-CN", { hour12: false });
}

function emptyState() {
  return {
    team: "",
    secretClaimed: false,
    secretDone: false,
    secretNote: "",
    secretTask: null,
    reportTeam: "",
    reportNote: "",
    reportOk: false,
    gates: {},
    review: {},
    scores: null,
    openGates: [1]
  };
}

function loadState() {
  try {
    const data = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    if (data && typeof data === "object") return Object.assign(emptyState(), data);
  } catch (err) { /* 这部手机记不住时，只留在本次打开里 */ }
  return emptyState();
}

function saveState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (err) { /* 忽略 */ }
}

function deviceId() {
  try {
    const saved = localStorage.getItem(DEVICE_KEY) || "";
    if (/^[A-Za-z0-9_-]{8,80}$/.test(saved)) return saved;
    const created = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, "");
    localStorage.setItem(DEVICE_KEY, created);
    return created;
  } catch (err) {
    return "memory" + Date.now().toString(36);
  }
}

function parseRoute() {
  let raw = location.hash || "#/";
  try { raw = decodeURIComponent(raw); } catch (err) { raw = location.hash || "#/"; }
  const parts = raw.replace(/^#/, "").split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "admin" || parts[0] === "console") return { name: "admin" };
  if (parts[0] === "secret") return { name: "secret" };
  if (parts[0] === "score") return { name: "score" };
  if (parts[0] === "gates") return { name: "gates" };
  if (parts[0] === "gate" && /^[1-5]$/.test(parts[1] || "")) return { name: "gate", id: Number(parts[1]) };
  return { name: "missing" };
}

function currentKey() {
  const route = parseRoute();
  return route.name + (route.id ? "/" + route.id : "") + ":" + (loadState().team || "");
}

function isOpen(state, id) {
  return (state.openGates || [1]).map(Number).includes(Number(id));
}

function localProgress(state) {
  return !!(state.secretClaimed || Object.keys(state.gates || {}).length);
}

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {})
    });
  } catch (err) {
    throw new Error("没连上计分服务");
  }
  let data = {};
  try { data = await response.json(); } catch (err) { data = {}; }
  if (!response.ok) {
    const error = new Error(data.error || "提交失败");
    error.status = response.status;
    error.boundTeam = data.boundTeam || "";
    throw error;
  }
  return data;
}

function applyServer(state, data) {
  const raw = data.raw || {};
  if (data.team) state.team = String(data.team);
  state.secretClaimed = !!raw.secretClaimed;
  state.secretDone = !!raw.secretDone;
  state.secretNote = raw.secretNote || "";
  state.secretTask = data.secret || null;
  state.reportTeam = raw.reportTeam || "";
  state.reportNote = raw.reportNote || "";
  state.reportOk = !!raw.reportOk;
  state.gates = raw.gates || {};
  state.review = data.review || {};
  state.scores = data.scores || null;
  state.openGates = data.openGates || [1];
}

async function sync(eventName, payload) {
  const state = loadState();
  const data = await postJson("/api/sync", {
    deviceId: deviceId(),
    team: state.team,
    event: eventName,
    state: payload || {}
  });
  applyServer(state, data);
  saveState(state);
  if (data.message) flashMessage = data.message;
  pullKey = currentKey();
}

async function pull() {
  let state = loadState();
  if (!state.team) return;
  try {
    const data = await postJson("/api/pull", { team: state.team, deviceId: deviceId() });
    state = loadState();
    applyServer(state, data);
    saveState(state);
    serverError = "";
  } catch (err) {
    if (!err.boundTeam) throw err;
    state = loadState();
    state.team = String(err.boundTeam);
    saveState(state);
    const data = await postJson("/api/pull", { team: state.team, deviceId: deviceId() });
    applyServer(state, data);
    saveState(state);
    serverError = "";
  }
}

function page(title, body, opts) {
  const options = opts || {};
  const state = loadState();
  const eyebrow = options.eyebrow || (state.team ? "第 " + state.team + " 组" : "石林峡徒步");
  const flash = options.flash || "";
  return `
    <main class="sheet${options.wide ? " wide" : ""}">
      <header class="mast">
        <div class="seal">海步</div>
        <div>
          <p class="eyebrow">${esc(eyebrow)}</p>
          <h1>${esc(title)}</h1>
        </div>
      </header>
      ${serverError ? `<div class="callout warn page-alert"><strong>${esc(serverError)}</strong></div>` : ""}
      ${flash ? `<div class="callout page-alert"><p>${esc(flash)}</p></div>` : ""}
      ${body}
    </main>`;
}

function needTeam() {
  return page("先选本组", `
    <section class="card">
      <p>每组用队长的一部手机。选完就会锁在这部手机上。</p>
      <div class="actions"><a class="btn" href="#/">去选择</a></div>
    </section>`);
}

function homeHtml(state, flash) {
  if (!state.team || pickingTeam) {
    return page("选择本组", `
      <section class="card">
        <p>六组都参加闯关。第 1 组到第 5 组可以领取秘密任务，第 6 组不领。</p>
        <form class="stack" data-form="team">
          <label>本组
            <select name="team" required>
              <option value="">请选择</option>
              ${["1", "2", "3", "4", "5", "6"].map((id) => `<option value="${id}" ${state.team === id ? "selected" : ""}>第 ${id} 组</option>`).join("")}
            </select>
          </label>
          <p class="bad-text" data-error hidden></p>
          <button class="btn" type="submit">${state.team ? "改到这一组" : "确定本组"}</button>
        </form>
      </section>`, { flash });
  }
  const done = [1, 2, 3, 4, 5].filter((id) => {
    const review = (state.review || {})[String(id)] || {};
    return id === 5 ? review.orderOk : review.submitted;
  }).length;
  const total = state.scores ? state.scores.total : 0;
  return page("徒步计分", `
    <section class="hero">
      <p class="lede">已完成 ${done} / 5 关 · 当前 ${pointsText(total)} 分</p>
      <div class="doors">
        <a class="door" href="#/secret"><strong>秘密任务</strong><span>五个组各领一条，完成后 10 分</span></a>
        <a class="door" href="#/gates"><strong>闯关任务</strong><span>做完当前关，才看下一关</span></a>
      </div>
      <div class="actions">
        <a class="btn" href="#/score">看成绩单</a>
        ${localProgress(state) ? "" : '<button class="btn-ghost" type="button" data-action="repick">选错组了</button>'}
      </div>
      <p class="fine" style="margin-top:14px">照片和视频发到队伍群。这一页只记完成情况和分数。</p>
      <p class="fine"><a class="back" href="#/admin">工作人员入口</a></p>
    </section>`, { flash });
}

function secretHtml(state, flash) {
  if (!state.team) return needTeam();
  if (state.team === "6") {
    return page("秘密任务", `
      <section class="card">
        <p>第 6 组不领取秘密任务。请去做闯关。</p>
        <div class="actions"><a class="btn" href="#/gates">去闯关</a></div>
      </section>`, { flash });
  }
  if (!state.secretClaimed || !state.secretTask) {
    return page("秘密任务", `
      <section class="card">
        <p>这条任务只给第 ${esc(state.team)} 组。领到之后不要直接说出来。做完把凭证发到队伍群，再回来勾选。</p>
        <div class="actions"><button class="btn" type="button" data-action="claim-secret">领取本组任务</button></div>
        <p class="bad-text" data-error hidden></p>
      </section>`, { flash });
  }
  const task = state.secretTask;
  return page("秘密任务", `
    <article class="card task">
      <p class="task-no">${esc(task.id)} · ${esc(task.proof)} · 10 分</p>
      <p>${esc(task.text)}</p>
    </article>
    <p class="fine">不要直接说出任务。有人说破的话，可以在下面举报，裁判确认后举报方加 20 分。</p>
    <form class="stack" data-form="secret">
      <label>完成说明
        <textarea name="note" maxlength="200">${esc(state.secretNote)}</textarea>
      </label>
      <label class="choice"><input type="checkbox" name="done" ${state.secretDone ? "checked" : ""}><span>已完成，请裁判看本组记录</span></label>
      <p class="bad-text" data-error hidden></p>
      <button class="btn" type="submit">保存秘密任务</button>
    </form>
    <form class="stack" data-form="report">
      <h2>举报泄密</h2>
      <label>被举报的组
        <select name="reportTeam">
          <option value="">未选</option>
          ${["1", "2", "3", "4", "5"].filter((id) => id !== state.team).map((id) => `<option value="${id}" ${state.reportTeam === id ? "selected" : ""}>第 ${id} 组</option>`).join("")}
        </select>
      </label>
      <label>看到了什么
        <textarea name="reportNote" maxlength="200">${esc(state.reportNote)}</textarea>
      </label>
      <button class="btn" type="submit">提交给裁判</button>
      <p class="fine">${state.reportOk ? "裁判已确认，举报方加 20 分。" : "确认前不加分。"}</p>
    </form>
    <div class="actions"><a class="btn-ghost" href="#/">回首页</a></div>`, { flash });
}

function gatesHtml(state, flash) {
  if (!state.team) return needTeam();
  const rows = (meta.gates || []).map((gate) => {
    const open = isOpen(state, gate.id);
    const review = (state.review || {})[String(gate.id)] || {};
    const finished = gate.id === 5 ? review.orderOk : review.submitted;
    const status = finished ? "已记 " + pointsText((state.scores && state.scores.gates[String(gate.id)]) || 0) + " 分" : (open ? "可以开始" : "完成上一关后开放");
    const inner = `<span class="task-no">第 ${gate.id} 关 · ${esc(gate.place)}</span><strong>${esc(gate.title)}</strong><span class="fine">${esc(status)}</span>`;
    return open
      ? `<a class="door" href="#/gate/${gate.id}">${inner}</a>`
      : `<div class="door lock-card">${inner}</div>`;
  }).join("");
  return page("闯关任务", `<div class="doors">${rows}</div><div class="actions"><a class="btn-ghost" href="#/">回首页</a></div>`, { flash });
}

function choice(name, value, label, current) {
  const text = value === label ? label : value + ". " + label;
  return `<label class="choice"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${current === value ? "checked" : ""} required><span>${esc(text)}</span></label>`;
}

function check(name, label, on) {
  return `<label class="choice"><input type="checkbox" name="${esc(name)}" ${on ? "checked" : ""}><span>${esc(label)}</span></label>`;
}

function quizMark(state, name) {
  const items = (((state.review || {})["1"] || {}).items) || [];
  const item = items.find((row) => row.name === name);
  if (!item || item.ok == null) return "";
  return item.ok ? ' <span class="tag ok">答对</span>' : ' <span class="tag bad">答错</span>';
}

function gateForm(content, state) {
  const saved = (state.gates || {})[String(content.id)] || {};
  let fields = "";
  if (content.type === "quiz") {
    fields = content.questions.map((question) => `
      <section class="card">
        <p class="task-no">${esc(question.title)} · 5 分${quizMark(state, question.name)}</p>
        <p>${esc(question.prompt)}</p>
        <div class="stack">${question.options.map(([value, label]) => choice(question.name, value, label, ((saved.answers || {})[question.name]))).join("")}</div>
      </section>`).join("");
  } else if (content.type === "theme") {
    fields = `
      <div class="stack">${content.themes.map((theme) => `
        <label class="choice"><input type="radio" name="theme" value="${esc(theme.id)}" ${saved.theme === theme.id ? "checked" : ""} required><span><strong>${esc(theme.title)}</strong><br>${esc(theme.text)}</span></label>
      `).join("")}</div>
      <div class="stack">${content.checks.map((item) => check(item.name, item.label, saved[item.name])).join("")}</div>`;
  } else if (content.type === "spots") {
    fields = content.spots.map((spot) => `
      <section class="card">
        <p class="task-no">${esc(spot.title)} · ${pointsText(spot.points)} 分</p>
        <p>${esc(spot.text)}</p>
        ${check(spot.name, "我们拍好了", !!saved[spot.name])}
      </section>`).join("");
  } else {
    const review = (state.review || {})["5"] || {};
    const piece = review.orderOk
      ? `<section class="card"><p class="task-no">本组碎片</p><p>${review.fragment ? esc(review.fragment) : "本组没有碎片，可以和其他组一起把口号交上去。"}</p></section>`
      : "";
    fields = `
      ${[0, 1, 2, 3].map((index) => `
        <label>第 ${index + 1} 步
          <select name="step${index}" required>
            <option value="">请选择</option>
            ${content.steps.map((step) => `<option value="${esc(step)}" ${(saved.order || [])[index] === step ? "selected" : ""}>${esc(step)}</option>`).join("")}
          </select>
        </label>`).join("")}
      ${piece}
      ${review.orderOk ? `<label>拼好的口号<input name="slogan" maxlength="20" value="${esc(saved.slogan || "")}" placeholder="八个字" autocomplete="off"></label>` : ""}
      ${review.sloganOk ? `<p class="fine">口号已对上。当前名次分 ${pointsText(state.scores ? state.scores.slogan : 0)}。</p>` : ""}`;
  }
  const review = (state.review || {})[String(content.id)] || {};
  const noted = review.submitted || review.orderOk
    ? `<p class="fine">这一关目前计入 ${pointsText(review.score || 0)} 分。</p>`
    : "";
  return `
    <p>${esc(content.intro || "")}</p>
    <form class="stack" data-form="gate" data-gate="${esc(content.id)}">
      ${fields}
      ${noted}
      <p class="bad-text" data-error hidden></p>
      <button class="btn" type="submit">提交这一关</button>
    </form>`;
}

function gateShell(state, id, flash) {
  const info = (meta.gates || []).find((gate) => gate.id === id) || { title: "闯关", place: "" };
  const next = id < 5 && isOpen(state, id + 1);
  return page("第 " + id + " 关 · " + info.title, `
    <p class="fine">${esc(info.place || "")}</p>
    <div id="gate-body"><p>正在取出这一关。</p></div>
    <div class="actions">
      ${next ? `<a class="btn" href="#/gate/${id + 1}">下一关</a>` : ""}
      <a class="btn-ghost" href="#/gates">全部关卡</a>
      <a class="btn-ghost" href="#/score">成绩单</a>
    </div>`, { flash });
}

function scoreHtml(state, flash) {
  if (!state.team) return needTeam();
  const scores = state.scores || { secret: 0, report: 0, gates: {}, slogan: 0, total: 0 };
  const rows = [
    ["秘密任务", scores.secret, 10],
    ["第 1 关 峡谷密码", scores.gates["1"], 20],
    ["第 2 关 玻璃步道", scores.gates["2"], 20],
    ["第 3 关 彩虹池", scores.gates["3"], 30],
    ["第 4 关 寻宝", scores.gates["4"], 30],
    ["第 5 关 排序", scores.gates["5"], 20],
    ["口号名次", scores.slogan, 10],
    ["举报", scores.report, 20]
  ];
  const review = (state.review || {})["5"] || {};
  return page("第 " + state.team + " 组成绩", `
    <section class="card result">
      <div class="stamp">分</div>
      <h2>${pointsText(scores.total)}</h2>
      <p>把这一页给裁判看。口号名次和举报要等后台确认，点刷新就能看到新分数。</p>
    </section>
    <ul class="score-list">
      ${rows.map(([label, got, max]) => `<li><span>${esc(label)}</span><strong>${pointsText(got)} / ${max}</strong></li>`).join("")}
      <li><span>合计</span><strong>${pointsText(scores.total)}</strong></li>
    </ul>
    <section class="card">
      <p>口号：${esc(review.slogan || "还没提交")} · ${review.sloganOk ? "八个字正确" : "尚未对上"} · ${esc(whenText(review.sloganAt))}</p>
      ${state.reportTeam ? `<p>已举报第 ${esc(state.reportTeam)} 组：${esc(state.reportNote || "未写说明")}</p>` : ""}
    </section>
    <div class="actions">
      <button class="btn" type="button" data-action="reload">刷新成绩</button>
      <a class="btn-ghost" href="#/">回首页</a>
    </div>`, { flash });
}

function itemsHtml(items) {
  return (items || []).map((item) => {
    const flag = item.ok === true ? '<span class="tag ok">对</span>' : item.ok === false ? '<span class="tag bad">错</span>' : "";
    const answer = item.answer ? " · 答案 " + item.answer : "";
    const points = item.points != null ? " · " + pointsText(item.points) + " 分" : "";
    return `<li><span class="k">${esc(item.label)}</span>${esc(item.value || "未填")}${answer ? esc(answer) : ""} ${points ? esc(points) : ""} ${flag}</li>`;
  }).join("");
}

function teamCard(row) {
  const secretLine = row.secret
    ? `${row.secret.id} ${row.secret.text}（${row.secretClaimed ? "已领" : "未领"}，${row.secretDone ? "已完成" : "未完成"}）`
    : "本组不领取秘密任务";
  const gates = [1, 2, 3, 4, 5].map((id) => {
    const review = (row.review || {})[String(id)] || {};
    const auto = (row.scores.auto || {})[String(id)];
    return `
      <section class="card">
        <p class="task-no">第 ${id} 关 · 计入 ${pointsText(review.score)} 分 · 自动 ${pointsText(auto)} 分${review.override ? " · 已核定" : ""}</p>
        <p class="fine">${esc(whenText(review.at))}</p>
        <ol class="clue-list">${itemsHtml(review.items)}</ol>
        ${id === 5 ? `<p>碎片：${esc(review.fragment || "无")} · ${review.fragmentOpen ? "已发给该组" : "还没排对"} · 口号 ${esc(review.slogan || "未填")} · ${review.sloganOk ? "正确" : "未对上"} · 名次分 ${pointsText(review.sloganPoints || 0)}</p>` : ""}
        <label>核定分（留空就用自动分，排序这一栏最多 20）
          <input class="score-input" name="adjust${id}" inputmode="decimal" value="${row.adjust && row.adjust[String(id)] != null ? esc(row.adjust[String(id)]) : ""}">
        </label>
      </section>`;
  }).join("");
  return `
    <details class="card team-card">
      <summary>第 ${esc(row.team)} 组 · ${pointsText(row.scores.total)} 分</summary>
      <div class="stack">
        <p>${esc(secretLine)}</p>
        ${row.secretNote ? `<p>完成说明：${esc(row.secretNote)}</p>` : ""}
        <p>举报：${row.reportTeam ? "第 " + esc(row.reportTeam) + " 组" : "无"} ${esc(row.reportNote || "")} ${row.reportOk ? "· 已加 20 分" : ""}</p>
        <form class="stack" data-form="adjust" data-team="${esc(row.team)}">
          ${gates}
          <label class="choice"><input type="checkbox" name="reportOk" ${row.reportOk ? "checked" : ""}><span>确认举报，这一组加 20 分</span></label>
          <p class="bad-text" data-error hidden></p>
          <button class="btn" type="submit">保存第 ${esc(row.team)} 组</button>
        </form>
        <button class="btn-ghost" type="button" data-action="reset-team" data-team="${esc(row.team)}">清空这一组</button>
      </div>
    </details>`;
}

function adminHtml(flash) {
  if (!adminPassword) {
    return page("工作人员后台", `
      <section class="card">
        <p>查看六个组的提交情况和分数。密码写在服务器的 server.py 里。</p>
        <form class="stack" data-form="login">
          <label>密码
            <input name="password" type="password" autocomplete="off" required>
          </label>
          <p class="bad-text" data-error hidden></p>
          <button class="btn" type="submit">进入</button>
        </form>
      </section>`, { flash, wide: true, eyebrow: "工作人员" });
  }
  if (!adminBoard) {
    return page("工作人员后台", `<section class="card"><p>正在读取各组成绩。</p></section>`, { flash, wide: true, eyebrow: "工作人员" });
  }
  const rows = adminBoard.ranking || [];
  const here = location.protocol + "//" + location.host + "/";
  const local = /localhost|127\.0\.0\.1/i.test(location.host);
  const baseValue = qrBase || (local && suggestedBase ? suggestedBase : here);
  const log = (adminBoard.log || []).slice(0, 30).map((item) =>
    `<li>${esc(whenText(item.at))} · 第 ${esc(item.team)} 组 · ${esc(item.event)} · 当时 ${pointsText(item.total)} 分</li>`
  ).join("");
  const key = adminBoard.key || {};
  return page("工作人员后台", `
    <div class="actions no-print">
      <button class="btn" type="button" data-action="refresh-admin">刷新</button>
      <button class="btn-ghost" type="button" data-action="logout">退出</button>
      <a class="btn-ghost" href="#/">选手首页</a>
    </div>
    <section class="card" id="qr-sheet">
      <h2>现场二维码</h2>
      <p>只贴这一张。扫开是首页，里面有秘密任务和闯关任务。</p>
      ${local ? '<div class="callout warn page-alert"><strong>现在打开的是本机地址。</strong><p>手机请用下面这个局域网地址。电脑和手机要在同一个 Wi-Fi。</p></div>' : ""}
      <label class="stack">手机打得开的地址
        <input id="base-url" value="${esc(baseValue)}" autocomplete="off">
      </label>
      <div class="qr-grid" id="qr-grid"></div>
    </section>
    <h2>当前排名</h2>
    <div class="table-wrap"><table class="board">
      <thead><tr><th>名次</th><th>组</th><th>总分</th><th>秘密</th><th>举报</th><th>1</th><th>2</th><th>3</th><th>4</th><th>排序</th><th>口号</th><th>更新</th></tr></thead>
      <tbody>${rows.map((row, index) => `<tr>
        <td>${index + 1}</td>
        <td>第 ${esc(row.team)} 组</td>
        <td><strong>${pointsText(row.scores.total)}</strong></td>
        <td>${pointsText(row.scores.secret)}</td>
        <td>${pointsText(row.scores.report)}</td>
        ${[1, 2, 3, 4, 5].map((id) => `<td>${pointsText(row.scores.gates[String(id)])}</td>`).join("")}
        <td>${pointsText(row.scores.slogan)}</td>
        <td>${esc(whenText(row.updatedAt))}</td>
      </tr>`).join("")}</tbody>
    </table></div>
    ${rows.map(teamCard).join("")}
    <section class="section">
      <h2>最近提交</h2>
      <ol class="log">${log || "<li>还没有提交</li>"}</ol>
    </section>
    <section class="section">
      <h2>答案</h2>
      <div class="card">
        <ol>
          ${(key.quiz || []).map((item) => `<li>${esc(item.title)}：${esc(item.answer)}</li>`).join("")}
          <li>顺序：${esc((key.order || []).join(" → "))}</li>
          <li>口号：${esc(key.slogan || "")}</li>
          <li>碎片：${esc((key.fragments || []).map((item) => item.team + " " + item.text).join("，"))}。第 6 组没有碎片。</li>
        </ol>
        <ol class="clue-list">${(key.secrets || []).map((item) => `<li><span class="k">第 ${esc(item.team)} 组 ${esc(item.id)}</span>${esc(item.text)}</li>`).join("")}</ol>
      </div>
    </section>`, { flash, wide: true, eyebrow: "工作人员" });
}

function missingHtml(flash) {
  return page("入口无效", `<section class="card"><div class="actions"><a class="btn" href="#/">回首页</a></div></section>`, { flash });
}

function stopPoll() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = 0;
}

function startPoll() {
  stopPoll();
  pollTimer = window.setInterval(async () => {
    const el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    if (parseRoute().name !== "admin" || !adminPassword) return;
    try {
      const board = await postJson("/api/admin/board", { password: adminPassword });
      if (parseRoute().name !== "admin") return;
      adminBoard = board;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    } catch (err) { /* 下一轮再读 */ }
  }, 8000);
}

function render() {
  stopPoll();
  const route = parseRoute();
  const state = loadState();
  const flash = flashMessage;
  flashMessage = "";
  document.title = route.name === "admin" ? "工作人员后台" : "石林峡徒步计分";
  if (route.name === "admin") {
    app.innerHTML = adminHtml(flash);
    if (adminPassword && adminBoard) {
      mountQr();
      startPoll();
    } else if (adminPassword && !adminBoard && !adminLoading) {
      adminLoading = true;
      postJson("/api/admin/board", { password: adminPassword }).then((board) => {
        adminBoard = board;
        serverError = "";
        render();
      }).catch((err) => {
        adminPassword = "";
        adminBoard = null;
        try { sessionStorage.removeItem(ADMIN_KEY); } catch (ignore) { /* 忽略 */ }
        serverError = err.status === 401 ? "密码不对" : (err.message || "后台没有打开");
        render();
      }).finally(() => { adminLoading = false; });
    }
    return;
  }
  let fillId = 0;
  if (!meta) {
    app.innerHTML = page("石林峡徒步", `<section class="card"><p>请让工作人员先运行 python server.py，再用终端里打印的网址打开。</p></section>`, { flash });
  } else if (route.name === "home") app.innerHTML = homeHtml(state, flash);
  else if (route.name === "secret") app.innerHTML = secretHtml(state, flash);
  else if (route.name === "gates") app.innerHTML = gatesHtml(state, flash);
  else if (route.name === "score") app.innerHTML = scoreHtml(state, flash);
  else if (route.name === "gate") {
    if (!state.team) app.innerHTML = needTeam();
    else if (!isOpen(state, route.id)) {
      app.innerHTML = page("这一关还没开放", `<section class="card"><p>先提交上一关，再回来。</p><div class="actions"><a class="btn" href="#/gates">返回关卡</a></div></section>`, { flash });
    } else {
      gateContent = null;
      app.innerHTML = gateShell(state, route.id, flash);
      fillId = route.id;
    }
  } else app.innerHTML = missingHtml(flash);
  if (fillId) fillGate(fillId);
  const key = currentKey();
  if (state.team && pullKey !== key) {
    pullKey = key;
    pull().then(() => {
      if (currentKey() !== key) return;
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      render();
    }).catch((err) => {
      if (currentKey() !== key) return;
      serverError = err.message || "没能同步成绩";
      render();
    });
  }
}

async function fillGate(id) {
  const token = ++fillToken;
  try {
    const content = await postJson("/api/gate-content", {
      team: loadState().team,
      deviceId: deviceId(),
      gate: id
    });
    if (token !== fillToken) return;
    content.id = id;
    gateContent = content;
    const host = document.getElementById("gate-body");
    if (!host) return;
    host.innerHTML = gateForm(content, loadState());
  } catch (err) {
    if (token !== fillToken) return;
    const host = document.getElementById("gate-body");
    if (host) host.innerHTML = `<p class="bad-text">${esc(err.message || "这一关没有打开")}</p>`;
  }
}

function normalizeBase(value) {
  let clean = String(value || "").trim();
  if (!clean) return "";
  if (!/^https?:\/\//i.test(clean)) clean = "http://" + clean;
  try {
    const url = new URL(clean);
    url.hash = "#/";
    url.search = "";
    return url.toString();
  } catch (err) {
    return "";
  }
}

function makeQrCanvas(text) {
  qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const scale = 8;
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
      if (qr.isDark(row, col)) ctx.fillRect((col + margin) * scale, (row + margin) * scale, scale, scale);
    }
  }
  return canvas;
}

function mountQr() {
  const grid = document.getElementById("qr-grid");
  const input = document.getElementById("base-url");
  if (!grid || !input) return;
  const url = normalizeBase(input.value);
  grid.innerHTML = `
    <article class="qr-card">
      <strong>徒步游戏首页</strong>
      <div class="qr-box"></div>
      <span class="url">${url ? esc(url) : "地址还不能用"}</span>
      <div class="actions">
        <button class="btn-small" type="button" data-action="download-qr" ${url ? "" : "disabled"}>下载二维码</button>
      </div>
    </article>`;
  const box = grid.querySelector(".qr-box");
  if (!url || typeof qrcode !== "function") {
    box.textContent = "二维码还没生成";
    return;
  }
  try {
    const canvas = makeQrCanvas(url);
    const img = new Image();
    img.alt = "徒步游戏首页二维码";
    img.src = canvas.toDataURL("image/png");
    box.appendChild(img);
  } catch (err) {
    box.textContent = "生成失败";
  }
}

function gatePayload(form, content) {
  if (content.type === "quiz") {
    const answers = {};
    content.questions.forEach((question) => { answers[question.name] = form[question.name].value; });
    return { answers };
  }
  if (content.type === "theme") {
    const payload = { theme: form.theme.value };
    content.checks.forEach((item) => { payload[item.name] = !!(form[item.name] && form[item.name].checked); });
    return payload;
  }
  if (content.type === "spots") {
    const payload = {};
    content.spots.forEach((item) => { payload[item.name] = !!(form[item.name] && form[item.name].checked); });
    return payload;
  }
  return {
    order: [0, 1, 2, 3].map((index) => form["step" + index].value),
    slogan: form.slogan ? form.slogan.value.trim() : ""
  };
}

function Cancelled() {}

async function run(work, form) {
  if (pending) return;
  pending = true;
  try {
    await work();
    serverError = "";
    render();
  } catch (err) {
    if (err instanceof Cancelled) return;
    serverError = err.message || "提交失败";
    const node = form && form.querySelector("[data-error]");
    if (node) {
      node.hidden = false;
      node.textContent = serverError;
    } else render();
  } finally {
    pending = false;
  }
}

app.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const kind = form.dataset.form;
  run(async () => {
    if (kind === "team") {
      const next = form.team.value;
      const state = loadState();
      const previous = state.team;
      if (previous && previous !== next && localProgress(state)) {
        throw new Error("本组已经有进度。要换组，请让裁判在后台清空。");
      }
      state.team = next;
      saveState(state);
      pickingTeam = false;
      try {
        await sync(previous && previous !== next ? "改选" : "加入");
      } catch (err) {
        state.team = previous;
        saveState(state);
        throw err;
      }
      return;
    }
    if (kind === "secret") {
      await sync("保存秘密任务", {
        secretDone: !!(form.done && form.done.checked),
        secretNote: form.note.value.trim()
      });
      return;
    }
    if (kind === "report") {
      await sync("提交举报", {
        reportTeam: form.reportTeam.value,
        reportNote: form.reportNote.value.trim()
      });
      return;
    }
    if (kind === "gate") {
      if (!gateContent || Number(gateContent.id) !== Number(form.dataset.gate)) {
        throw new Error("这一关还没载入完，请再点一次");
      }
      const boxes = Array.from(form.querySelectorAll('input[type="checkbox"]'));
      if (boxes.length && boxes.every((box) => !box.checked)) {
        if (!window.confirm("一项都没勾选。提交后这一关先记 0 分，并打开下一关。")) {
          throw new Cancelled();
        }
      }
      await sync("提交第" + form.dataset.gate + "关", { gate: gatePayload(form, gateContent) });
      return;
    }
    if (kind === "login") {
      const password = form.password.value;
      const board = await postJson("/api/admin/board", { password });
      adminPassword = password;
      adminBoard = board;
      try { sessionStorage.setItem(ADMIN_KEY, password); } catch (err) { /* 忽略 */ }
      return;
    }
    if (kind === "adjust") {
      const adjust = {};
      [1, 2, 3, 4, 5].forEach((id) => { adjust[String(id)] = form["adjust" + id].value.trim(); });
      adminBoard = await postJson("/api/admin/adjust", {
        password: adminPassword,
        team: form.dataset.team,
        adjust,
        reportOk: !!(form.reportOk && form.reportOk.checked)
      });
      flashMessage = "已保存第 " + form.dataset.team + " 组";
    }
  }, form);
});

app.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const action = button.getAttribute("data-action");
  if (action === "claim-secret") {
    run(() => sync("领取秘密任务"));
  } else if (action === "repick") {
    pickingTeam = true;
    render();
  } else if (action === "reload") {
    run(async () => {
      await pull();
      pullKey = currentKey();
    });
  } else if (action === "download-qr") {
    const input = document.getElementById("base-url");
    const url = normalizeBase(input ? input.value : "");
    if (!url) return;
    const link = document.createElement("a");
    link.href = makeQrCanvas(url).toDataURL("image/png");
    link.download = "徒步游戏首页.png";
    link.click();
  } else if (action === "refresh-admin") {
    run(async () => {
      adminBoard = await postJson("/api/admin/board", { password: adminPassword });
    });
  } else if (action === "logout") {
    adminPassword = "";
    adminBoard = null;
    try { sessionStorage.removeItem(ADMIN_KEY); } catch (err) { /* 忽略 */ }
    render();
  } else if (action === "reset-team") {
    const team = button.getAttribute("data-team");
    if (!window.confirm("清空第 " + team + " 组在服务器上的成绩？这部手机可以重新选组。")) return;
    run(async () => {
      adminBoard = await postJson("/api/admin/reset", { password: adminPassword, team });
      flashMessage = "已清空第 " + team + " 组";
    });
  }
});

app.addEventListener("input", (event) => {
  if (event.target.id !== "base-url") return;
  qrBase = event.target.value;
  mountQr();
});

window.addEventListener("hashchange", () => {
  pullKey = "";
  render();
});

fetch("/api/meta").then(async (response) => {
  if (!response.ok) throw new Error("计分服务没有准备好");
  meta = await response.json();
  suggestedBase = meta.base || "";
}).catch(() => {
  serverError = "没连上计分服务。请让工作人员运行 python server.py，再用终端里打印的网址打开。";
}).finally(() => {
  try { adminPassword = sessionStorage.getItem(ADMIN_KEY) || ""; } catch (err) { adminPassword = ""; }
  render();
});
