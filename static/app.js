/* 电子继承 App · E-Inherit · 前端 */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const DEPT_NAME = {
  production: "生产部",
  finance: "财务部",
  ip: "知识产权部",
  admin: "行政部",
  board: "董事会",
};

const API_BASE = (document.querySelector("base")?.href || "/").replace(/\/?$/, "/");
async function api(path, opts = {}) {
  const url = path.startsWith("http") ? path : (API_BASE.replace(/\/$/, "") + (path.startsWith("/") ? path : "/" + path));
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => t.classList.remove("show"), 2600);
}

function show(id) {
  $$(".panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add("active");
  $$(".tabbar button").forEach((b) => {
    b.classList.toggle("active", b.dataset.go === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  const loaders = {
    home: refreshHome,
    brain: refreshBrain,
    checkin: refreshCheckin,
    legacy: refreshLegacy,
    assets: refreshAssets,
    med: refreshMed,
    member: refreshMember,
    travel: refreshTravel,
    company: refreshCompany,
    guard: refreshGuard,
    handover: refreshHandover,
    heirs: refreshHeirs,
    icu: refreshIcu,
    aftercare: refreshAftercare,
    executor: () => {},
  };
  if (loaders[id]) loaders[id]();
}

function actionClass(action) {
  if (String(action).includes("销毁") && !String(action).includes("转赠")) return "action-destroy";
  if (String(action).includes("销售")) return "action-sale";
  if (String(action).includes("转赠")) return "action-gift";
  return "";
}

function fmtMoney(n) {
  return "¥" + Number(n || 0).toFixed(2);
}

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("zh-CN", { hour12: false });
}

async function refreshHome() {
  try {
    const { user } = await api("/api/me");
    const co = await api("/api/company");
    const pill = $("#memberPill");
    if (user.is_member) {
      pill.className = "pill member";
      pill.textContent = `会员至 ${user.member_until_iso}`;
    } else {
      pill.className = "pill guest";
      pill.textContent = "未开通会员";
    }
    const overdue = user.checkin_overdue;
    const grace = user.checkin_in_grace;
    $("#homeHint").innerHTML = overdue
      ? `⚠ 报备已过冷静期。将先电话联系您，再联系备用联系人。盘点进度 ${co.progress.pct}%。`
      : grace
        ? `⏳ 已过报备点，仍在冷静期（${user.grace_hours}h）。盘点进度 ${co.progress.pct}%。`
        : `einherit.cn · 盘点进度 ${co.progress.pct}%（${co.progress.filled}/5 部门）· 下次报备 ${fmtTime(user.checkin_due_at)}`;
  } catch (e) {
    $("#homeHint").textContent = "服务未就绪：" + e.message;
  }
}

let _mindmapCache = null;

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function buildMindmapSvg(map, compact) {
  const W = 420;
  const H = compact ? 420 : 460;
  const cx = W / 2;
  const cy = compact ? 118 : 128;
  const R = compact ? 78 : 88;
  const lines = [];
  const nodes = [];

  const center = map.center || { label: "主人", go: "company" };
  for (const n of map.radial || []) {
    const [x, y] = polar(cx, cy, R, Number(n.angle) || 0);
    lines.push(
      `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#c9c2b6" stroke-width="1.6"/>`
    );
    nodes.push(
      `<g class="brain-node" data-go="${esc(n.go || "heirs")}" transform="translate(${x},${y})">
        <circle r="18" fill="#fffcf7" stroke="#5b7f6e" stroke-width="1.6"/>
        <text text-anchor="middle" dy="4" font-size="12" fill="#1c2430" font-family="Songti SC, serif">${esc(n.label)}</text>
      </g>`
    );
  }

  // spine down through 长子 to trunk
  const bridge = map.heir_bridge || { label: "长子", go: "heirs" };
  const trunkY = cy + R + 36;
  const barY = trunkY + 42;
  lines.push(
    `<line x1="${cx}" y1="${cy + 22}" x2="${cx}" y2="${barY}" stroke="#5b7f6e" stroke-width="2"/>`
  );
  nodes.push(
    `<g class="brain-node" data-go="${esc(bridge.go || "heirs")}" transform="translate(${cx},${trunkY})">
      <rect x="-28" y="-12" width="56" height="24" rx="8" fill="#e7efe9" stroke="#3f5e50" stroke-width="1.4"/>
      <text text-anchor="middle" dy="4" font-size="12" fill="#3f5e50" font-family="Songti SC, serif">${esc(bridge.label)}</text>
    </g>`
  );

  const trunk = map.trunk || [];
  const n = Math.max(trunk.length, 1);
  const left = 48;
  const right = W - 48;
  const span = right - left;
  lines.push(
    `<line x1="${left}" y1="${barY}" x2="${right}" y2="${barY}" stroke="#5b7f6e" stroke-width="2"/>`
  );

  trunk.forEach((item, i) => {
    const x = left + (span * (i + 0.5)) / n;
    const leafY = barY + 54;
    lines.push(
      `<line x1="${x}" y1="${barY}" x2="${x}" y2="${leafY - 18}" stroke="#c9c2b6" stroke-width="1.6"/>`
    );
    if (item.kind === "company" || (item.children && item.children.length)) {
      nodes.push(
        `<g class="brain-node" data-go="${esc(item.go || "company")}" transform="translate(${x},${leafY})">
          <circle r="22" fill="#f3ead8" stroke="#b08d57" stroke-width="1.6"/>
          <text text-anchor="middle" dy="4" font-size="11" fill="#7a5d2e" font-family="Songti SC, serif">${esc(item.label)}</text>
        </g>`
      );
      const kids = item.children || [];
      if (kids.length) {
        const subY = leafY + 52;
        const subW = Math.min(90, 36 * kids.length);
        lines.push(
          `<line x1="${x}" y1="${leafY + 22}" x2="${x}" y2="${subY - 18}" stroke="#c9c2b6" stroke-width="1.4"/>`,
          `<line x1="${x - subW / 2}" y1="${subY - 18}" x2="${x + subW / 2}" y2="${subY - 18}" stroke="#c9c2b6" stroke-width="1.4"/>`
        );
        kids.forEach((ch, j) => {
          const cx2 = x - subW / 2 + (subW * (j + 0.5)) / kids.length;
          lines.push(
            `<line x1="${cx2}" y1="${subY - 18}" x2="${cx2}" y2="${subY - 4}" stroke="#c9c2b6" stroke-width="1.4"/>`
          );
          nodes.push(
            `<g class="brain-node" data-go="${esc(ch.go || "company")}" transform="translate(${cx2},${subY + 8})">
              <rect x="-26" y="-11" width="52" height="22" rx="6" fill="#fffcf7" stroke="#5b7f6e" stroke-width="1.2"/>
              <text text-anchor="middle" dy="4" font-size="10" fill="#1c2430">${esc(ch.label)}</text>
            </g>`
          );
        });
      }
    } else if (item.kind === "slot") {
      nodes.push(
        `<g class="brain-node" data-go="${esc(item.go || "legacy")}" transform="translate(${x},${leafY})">
          <line x1="0" y1="-8" x2="0" y2="14" stroke="#c9c2b6" stroke-width="1.6" stroke-dasharray="3 3"/>
          <text text-anchor="middle" y="28" font-size="16" fill="#b0a89c">${esc(item.label || "…")}</text>
        </g>`
      );
    } else {
      nodes.push(
        `<g class="brain-node" data-go="${esc(item.go || "assets")}" transform="translate(${x},${leafY})">
          <rect x="-24" y="-12" width="48" height="24" rx="6" fill="#fffcf7" stroke="#5b7f6e" stroke-width="1.4"/>
          <text text-anchor="middle" dy="4" font-size="11" fill="#1c2430">${esc(item.label)}</text>
        </g>`
      );
    }
  });

  nodes.unshift(
    `<g class="brain-node" data-go="${esc(center.go || "company")}" transform="translate(${cx},${cy})">
      <circle r="26" fill="#5b7f6e" stroke="#3f5e50" stroke-width="2"/>
      <text text-anchor="middle" dy="5" font-size="14" fill="#fff" font-family="Songti SC, serif" font-weight="700">${esc(center.label || "主人")}</text>
    </g>`
  );

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
    ${lines.join("")}
    ${nodes.join("")}
  </svg>`;
}

async function renderBrainMap(sel, { compact = false } = {}) {
  const el = $(sel);
  if (!el) return;
  if (!_mindmapCache) {
    const { map } = await api("/api/mindmap");
    _mindmapCache = map;
  }
  el.innerHTML = buildMindmapSvg(_mindmapCache, compact);
}

async function refreshBrain() {
  const { map } = await api("/api/mindmap");
  _mindmapCache = map;
  if ($("#brainNote")) $("#brainNote").textContent = map.note || "";
  await renderBrainMap("#brainMapFull", { compact: false });

  const rows = [];
  rows.push({ key: "center", label: "中心（主人）", value: map.center?.label || "主人" });
  (map.radial || []).forEach((n, i) => {
    rows.push({ key: `radial.${i}`, label: `放射 ${i + 1}`, value: n.label || "" });
  });
  rows.push({ key: "heir_bridge", label: "下承（长子）", value: map.heir_bridge?.label || "长子" });
  (map.trunk || []).forEach((n, i) => {
    rows.push({ key: `trunk.${i}`, label: `资产树 ${i + 1}`, value: n.label || "" });
    (n.children || []).forEach((c, j) => {
      rows.push({ key: `trunk.${i}.child.${j}`, label: `└ 子节点`, value: c.label || "" });
    });
  });
  $("#brainEditList").innerHTML = rows
    .map(
      (r) => `<label class="field"><span class="row-label">${esc(r.label)}</span>
      <input data-brain-key="${esc(r.key)}" value="${esc(r.value)}"/></label>`
    )
    .join("");
}

function applyBrainEdits(map) {
  const next = JSON.parse(JSON.stringify(map));
  $$("[data-brain-key]").forEach((inp) => {
    const key = inp.dataset.brainKey;
    const val = inp.value.trim();
    if (key === "center") next.center.label = val || "主人";
    else if (key === "heir_bridge") next.heir_bridge.label = val || "长子";
    else if (key.startsWith("radial.")) {
      const i = Number(key.split(".")[1]);
      if (next.radial[i]) next.radial[i].label = val;
    } else if (key.includes(".child.")) {
      const m = key.match(/^trunk\.(\d+)\.child\.(\d+)$/);
      if (m && next.trunk[m[1]]?.children?.[m[2]]) next.trunk[m[1]].children[m[2]].label = val;
    } else if (key.startsWith("trunk.")) {
      const i = Number(key.split(".")[1]);
      if (next.trunk[i]) next.trunk[i].label = val;
    }
  });
  return next;
}

async function refreshCheckin() {
  const box = $("#checkinBox");
  box.innerHTML = "<div class='card muted'>加载中…</div>";
  const { user, calls } = await api("/api/checkin/status");
  const statusHtml = user.checkin_overdue
    ? `<div class="alert">已过冷静期。状态机：calling_self → calling_backup → manual_review（不直接宣布身故）。</div>`
    : user.checkin_in_grace
      ? `<div class="alert">已过报备点，仍在冷静期（${user.grace_hours} 小时）。暂不外呼，请尽快打卡。</div>`
      : `<div class="ok">报备正常。最近一次：${fmtTime(user.last_checkin_at)}</div>`;
  const contacts = (user.backup_contacts || [])
    .map((c) => `<li>${c.name}（${c.relation}）· ${c.phone}</li>`)
    .join("");

  box.innerHTML = `
    ${statusHtml}
    <div class="card">
      <h3>一键报备</h3>
      <p class="muted">确认「我还安全」。漏报先进入冷静期，过期后才 AI 外呼本人，再按序通知备用联系人。</p>
      <div class="row">
        <button class="btn" id="doCheckin">我已安全 · 完成报备</button>
        <button class="btn ghost" id="forceOverdue">演示：制造逾期</button>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn secondary" id="escOk">演示：本人接通</button>
        <button class="btn secondary" id="escFail">演示：本人未接通</button>
      </div>
    </div>
    <div class="card">
      <h3>报备频率 / 冷静期 / 执行人</h3>
      <label class="field">间隔（小时）<input type="number" id="intervalHours" value="${user.checkin_interval_hours}" min="1"/></label>
      <label class="field">冷静期（小时）<input type="number" id="graceHours" value="${user.grace_hours || 72}" min="0"/></label>
      <label class="field">遗产执行人<input id="executorName" value="${user.executor_name || ""}" placeholder="董事会指定 CEO"/></label>
      <button class="btn ghost" id="saveInterval">保存</button>
      <h3 style="margin-top:16px">备用联系人</h3>
      <ul class="muted">${contacts || "<li>暂无</li>"}</ul>
    </div>
    <div class="card">
      <h3>外呼记录</h3>
      <div class="list">${
        (calls || []).length
          ? calls
              .map(
                (c) =>
                  `<div class="item"><span class="tag">${c.result}</span><strong>${c.target}</strong><div class="muted">${c.note}<br/>${fmtTime(c.created_at)}</div></div>`
              )
              .join("")
          : "<p class='muted'>暂无外呼记录</p>"
      }</div>
    </div>`;

  $("#doCheckin").onclick = async () => {
    await api("/api/checkin", { method: "POST", body: "{}" });
    toast("报备完成");
    refreshCheckin();
    refreshHome();
  };
  $("#forceOverdue").onclick = async () => {
    await api("/api/checkin/force-overdue", {
      method: "POST",
      body: JSON.stringify({ hours_ago: 48 }),
    });
    toast("已模拟逾期（若仍在冷静期内，外呼不会升级）");
    refreshCheckin();
    refreshHome();
  };
  $("#escOk").onclick = async () => {
    const r = await api("/api/checkin/escalate", {
      method: "POST",
      body: JSON.stringify({ simulate_unreachable: false }),
    });
    toast(r.message);
    refreshCheckin();
  };
  $("#escFail").onclick = async () => {
    const r = await api("/api/checkin/escalate", {
      method: "POST",
      body: JSON.stringify({ simulate_unreachable: true }),
    });
    toast(r.message);
    refreshCheckin();
  };
  $("#saveInterval").onclick = async () => {
    await api("/api/me", {
      method: "POST",
      body: JSON.stringify({
        checkin_interval_hours: Number($("#intervalHours").value || 24),
        grace_hours: Number($("#graceHours").value || 72),
        executor_name: $("#executorName").value,
      }),
    });
    toast("已保存");
    refreshCheckin();
  };
}

async function refreshLegacy() {
  const { items } = await api("/api/legacy");
  $("#lgList").innerHTML =
    items
      .map((it) => {
        const flags = [
          it.factory_reset ? "出厂重置" : null,
          it.clear_photos ? "清照片" : null,
          it.clear_chats ? "清聊天" : null,
        ]
          .filter(Boolean)
          .map((x) => `<span class="tag">${x}</span>`)
          .join("");
        return `<div class="item">
      <span class="tag">${DEPT_NAME[it.dept] || it.dept || ""}</span>
      <span class="tag">${it.category}</span>
      <span class="tag ${actionClass(it.action)}">${it.action}</span>
      ${flags}
      <strong>${it.title}</strong>
      <div class="muted">${it.beneficiary ? "接收人：" + it.beneficiary + " · " : ""}${it.notes || ""}</div>
    </div>`;
      })
      .join("") || "<p class='muted'>暂无条目</p>";
}

async function refreshCompany() {
  const data = await api("/api/company");
  const box = $("#companyBox");
  box.innerHTML = `
    <div class="card">
      <h3>${data.slogan}</h3>
      <p class="muted">把自己当成无限责任公司运营，降低对死亡话题的抗拒。</p>
      <div class="progress-bar"><i style="width:${data.progress.pct}%"></i></div>
      <div class="muted">进度 ${data.progress.filled}/5 部门已有内容</div>
    </div>
    ${data.depts
      .map(
        (d) => `
      <div class="card">
        <h3>${d.name}</h3>
        <p class="muted">${d.blurb} · ${d.examples}</p>
        <div class="muted">交割 ${d.legacy_count} · 备忘 ${d.asset_count}</div>
        <label class="field">补一条盘点
          <input data-dept="${d.id}" class="coTitle" placeholder="标题，如：工资卡尾号"/>
        </label>
        <label class="field"><textarea data-dept="${d.id}" class="coBody" rows="2" placeholder="内容"></textarea></label>
        <button class="btn secondary coAdd" data-dept="${d.id}">写入${d.name}</button>
        <div class="list" style="margin-top:10px">${
          (d.notes || [])
            .map(
              (n) =>
                `<div class="item"><strong>${n.title}</strong><div class="muted">${n.body || ""}</div></div>`
            )
            .join("") || "<p class='muted'>尚无盘点草稿</p>"
        }</div>
      </div>`
      )
      .join("")}`;

  $$(".coAdd").forEach((btn) => {
    btn.onclick = async () => {
      const dept = btn.dataset.dept;
      const title = $(`.coTitle[data-dept="${dept}"]`).value;
      const body = $(`.coBody[data-dept="${dept}"]`).value;
      await api("/api/company/note", {
        method: "POST",
        body: JSON.stringify({ dept, title, body }),
      });
      toast("已写入部门盘点");
      refreshCompany();
      refreshHome();
    };
  });
}

async function refreshGuard() {
  const data = await api("/api/self-guard");
  $("#guardList").innerHTML = data.items
    .map(
      (it) => `
    <div class="item">
      <div style="display:flex;align-items:center;gap:4px">
        <span class="sin-rank">${it.rank}</span>
        <strong style="margin:0">${it.sin} · ${it.en}</strong>
      </div>
      <div class="muted" style="margin-top:8px">危害：${it.harm}</div>
      <div class="muted">自保：${it.advice}</div>
      <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13px">
        <input type="checkbox" data-rank="${it.rank}" class="sinCheck" ${it.checked ? "checked" : ""}/>
        已纳入我的自保动作
      </label>
    </div>`
    )
    .join("");
  $$(".sinCheck").forEach((cb) => {
    cb.onchange = async () => {
      await api("/api/self-guard", {
        method: "POST",
        body: JSON.stringify({ sin_rank: Number(cb.dataset.rank), checked: cb.checked }),
      });
      toast(cb.checked ? "已勾选自保" : "已取消");
    };
  });
}

async function refreshHandover() {
  const data = await api("/api/handover");
  const snaps = await api("/api/snapshots").catch(() => ({ items: [] }));
  const exportUrl = API_BASE.replace(/\/$/, "") + "/export/handover.html";
  $("#handoverBox").innerHTML = `
    <div class="card">
      <h3>${data.brand}</h3>
      <p class="muted">${data.note}</p>
      <div class="stat" style="margin-top:10px">
        <div class="box"><span class="muted">域名</span><b style="font-size:14px">${data.domain}</b></div>
        <div class="box"><span class="muted">执行人</span><b style="font-size:14px">${data.executor}</b></div>
      </div>
      <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
        <a class="btn" href="${exportUrl}" target="_blank" rel="noopener">打印 / 导出 PDF</a>
        <button class="btn ghost" id="snapHand">保存版本快照</button>
      </div>
    </div>
    <div class="list">${
      data.todos.length
        ? data.todos
            .map(
              (t, i) => `
        <div class="item">
          <span class="tag">待办 ${i + 1}</span>
          <span class="tag">${DEPT_NAME[t.dept] || t.dept || ""}</span>
          <strong>${t.title}</strong>
          <div class="muted">${(t.ops || []).join(" · ")}</div>
          <div class="muted">${t.notes || ""}</div>
        </div>`
            )
            .join("")
        : "<p class='muted'>尚无交割条目，请先在「电子继承」写入安排</p>"
    }</div>
    <div class="card">
      <h3>历史快照</h3>
      <div class="list">${
        (snaps.items || []).length
          ? snaps.items
              .map(
                (s) =>
                  `<div class="item"><strong>${s.label}</strong><div class="muted">${fmtTime(s.created_at)}</div></div>`
              )
              .join("")
          : "<p class='muted'>尚无快照</p>"
      }</div>
    </div>`;
  const btn = $("#snapHand");
  if (btn) {
    btn.onclick = async () => {
      await api("/api/handover/snapshot", { method: "POST", body: "{}" });
      toast("已保存快照");
      refreshHandover();
    };
  }
}

async function refreshHeirs() {
  const [bene, emer, audit] = await Promise.all([
    api("/api/beneficiaries"),
    api("/api/emergency"),
    api("/api/audit"),
  ]);
  const sel = $("#emBene");
  if (sel) {
    sel.innerHTML =
      (bene.items || [])
        .map((b) => `<option value="${b.id}">${b.name}（${b.role}）</option>`)
        .join("") || `<option value="">请先添加受益人</option>`;
  }
  const statusLabel = {
    pending: "等待中",
    approved: "已批准",
    denied: "已拒绝",
    auto_granted: "到期自动放行",
  };
  $("#heirsBox").innerHTML = `
    <div class="card"><h3>受益人名单</h3>
      <div class="list">${
        (bene.items || []).length
          ? bene.items
              .map(
                (b) =>
                  `<div class="item"><span class="tag">${b.role}</span><strong>${b.name}</strong>
                  <div class="muted">${b.contact || ""} ${b.note || ""}</div></div>`
              )
              .join("")
          : "<p class='muted'>暂无受益人</p>"
      }</div>
    </div>
    <div class="card"><h3>紧急取用申请</h3>
      <div class="list">${
        (emer.items || []).length
          ? emer.items
              .map(
                (e) => `
        <div class="item">
          <span class="tag">${statusLabel[e.status] || e.status}</span>
          <strong>${e.beneficiary_name || "受益人#" + e.beneficiary_id}</strong>
          <div class="muted">${e.reason || ""} · 等待 ${e.wait_days} 天 · 截止 ${fmtTime(e.decide_by)}</div>
          ${
            e.status === "pending"
              ? `<div class="row" style="margin-top:8px;gap:8px">
                  <button class="btn secondary emDec" data-id="${e.id}" data-ok="1">批准</button>
                  <button class="btn ghost emDec" data-id="${e.id}" data-ok="0">拒绝</button>
                </div>`
              : ""
          }
        </div>`
              )
              .join("")
          : "<p class='muted'>暂无申请</p>"
      }</div>
    </div>
    <div class="card"><h3>审计日志</h3>
      <div class="list">${
        (audit.items || []).length
          ? audit.items
              .slice(0, 12)
              .map(
                (a) =>
                  `<div class="item"><span class="tag">${a.action}</span>
                  <div class="muted">${a.detail || ""} · ${fmtTime(a.created_at)}</div></div>`
              )
              .join("")
          : "<p class='muted'>暂无记录</p>"
      }</div>
    </div>`;
  $$(".emDec").forEach((btn) => {
    btn.onclick = async () => {
      await api("/api/emergency/decide", {
        method: "POST",
        body: JSON.stringify({ id: Number(btn.dataset.id), approve: btn.dataset.ok === "1" }),
      });
      toast(btn.dataset.ok === "1" ? "已批准" : "已拒绝");
      refreshHeirs();
    };
  });
}

async function refreshAssets() {
  const { items } = await api("/api/assets");
  $("#asList").innerHTML =
    items
      .map(
        (it) => `
    <div class="item">
      <span class="tag">${DEPT_NAME[it.dept] || ""}</span>
      <span class="tag">${it.visibility}</span>
      <strong>${it.platform}</strong>
      <div class="muted">${it.account_hint || ""} · ${it.summary || ""}</div>
      <div class="muted">处理：${it.dispose_note || "—"}</div>
    </div>`
      )
      .join("") || "<p class='muted'>暂无备忘</p>";
}

async function refreshMed(q = "", country = "") {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (country) qs.set("country", country);
  const { items } = await api("/api/hospitals?" + qs.toString());
  $("#medList").innerHTML =
    items
      .map(
        (h) => `
    <div class="item">
      <span class="tag">${h.country}</span>
      ${h.intl ? '<span class="tag">国际患者</span>' : ""}
      <strong>${h.name}</strong>
      <div class="muted">${h.city} · ${h.dept}<br/>${h.tags || ""}</div>
      <div class="row"><button class="btn secondary" data-hid="${h.id}">提交就医意向</button></div>
    </div>`
      )
      .join("") || "<p class='muted'>无匹配医院</p>";

  $$("#medList [data-hid]").forEach((btn) => {
    btn.onclick = async () => {
      await api("/api/hospitals/intent", {
        method: "POST",
        body: JSON.stringify({
          hospital_id: Number(btn.dataset.hid),
          note: "希望顾问协助评估就医路径",
        }),
      });
      toast("意向已提交");
    };
  });
}

async function refreshMember() {
  const { user, ledger } = await api("/api/me");
  $("#memberBox").innerHTML = `
    <div class="card">
      <h3>¥365 / 年 · 一天一块钱</h3>
      <p class="muted">托管电子继承与资产处理方法，并按您设定频率做生存报备守望。</p>
      <div class="stat" style="margin-top:12px">
        <div class="box"><span class="muted">会员</span><b>${user.is_member ? "已开通" : "未开通"}</b></div>
        <div class="box"><span class="muted">有效期</span><b style="font-size:16px">${user.member_until_iso || "—"}</b></div>
      </div>
      <div class="row">
        <button class="btn" id="payMember">${user.is_member ? "续费一年" : "开通 ¥365"}</button>
        <button class="btn ghost" id="lapseMember">演示：断缴</button>
      </div>
    </div>
    <div class="card">
      <h3>账单流水</h3>
      <div class="list">${
        ledger
          .map(
            (l) =>
              `<div class="item"><span class="tag">${l.kind}</span><strong>${l.note || l.kind}</strong><div class="muted">${fmtMoney(l.amount)} · ${fmtTime(l.created_at)}</div></div>`
          )
          .join("") || "<p class='muted'>暂无</p>"
      }</div>
    </div>`;
  $("#payMember").onclick = async () => {
    await api("/api/membership/pay", { method: "POST", body: "{}" });
    toast("会员已开通（演示）");
    refreshMember();
    refreshHome();
  };
  $("#lapseMember").onclick = async () => {
    const r = await api("/api/membership/lapse", { method: "POST", body: "{}" });
    toast(r.message);
    refreshMember();
    refreshHome();
  };
}

async function refreshTravel() {
  const { fund, ledger } = await api("/api/travel-fund");
  $("#travelBox").innerHTML = `
    <div class="card">
      <h3>差旅费预存</h3>
      <p class="muted">建议 ≥¥2000，上不封顶。会员断缴后未消费余额自动原路退回。</p>
      <div class="stat" style="margin-top:12px">
        <div class="box"><span class="muted">余额</span><b>${fmtMoney(fund.balance)}</b></div>
        <div class="box"><span class="muted">门槛</span><b>¥2000</b></div>
      </div>
      <label class="field" style="margin-top:12px">充值金额
        <input type="number" id="travelAmt" value="2000" min="1" step="100"/>
      </label>
      <button class="btn block" id="travelPay">预存入账</button>
    </div>
    <div class="card">
      <h3>相关流水</h3>
      <div class="list">${
        ledger
          .filter((l) => String(l.kind).startsWith("travel") || l.kind === "membership")
          .map(
            (l) =>
              `<div class="item"><span class="tag">${l.kind}</span><strong>${l.note}</strong><div class="muted">${fmtMoney(l.amount)} · ${fmtTime(l.created_at)}</div></div>`
          )
          .join("") || "<p class='muted'>暂无</p>"
      }</div>
    </div>`;
  $("#travelPay").onclick = async () => {
    const amount = Number($("#travelAmt").value || 0);
    try {
      await api("/api/travel-fund", {
        method: "POST",
        body: JSON.stringify({ amount, force: amount < 2000 }),
      });
      toast("预存成功");
      refreshTravel();
    } catch (e) {
      toast(e.message);
    }
  };
}

document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) {
    e.preventDefault();
    const target = go.dataset.go;
    if (target) show(target);
  }
});

$("#lgAdd").onclick = async () => {
  await api("/api/legacy", {
    method: "POST",
    body: JSON.stringify({
      title: $("#lgTitle").value,
      category: $("#lgCat").value,
      action: $("#lgAction").value,
      beneficiary: $("#lgBene").value,
      notes: $("#lgNotes").value,
      dept: $("#lgDept").value,
      factory_reset: $("#lgReset").checked,
      clear_photos: $("#lgPhotos").checked,
      clear_chats: $("#lgChats").checked,
    }),
  });
  $("#lgTitle").value = "";
  $("#lgNotes").value = "";
  toast("已写入交割手册");
  refreshLegacy();
};

$("#asAdd").onclick = async () => {
  await api("/api/assets", {
    method: "POST",
    body: JSON.stringify({
      platform: $("#asPlatform").value,
      account_hint: $("#asHint").value,
      summary: $("#asSummary").value,
      dispose_note: $("#asNote").value,
      dept: $("#asDept").value,
    }),
  });
  toast("备忘已保存");
  $("#asPlatform").value = "";
  refreshAssets();
};

$("#medSearch").onclick = () => refreshMed($("#medQ").value.trim(), $("#medCountry").value);

const SERVICE_LABEL = {
  delete_data: "删除电子数据",
  sell_asset: "变卖电子资产",
  field_visit: "上门执行",
  legal_consult: "法律顾问协办",
};

async function refreshIcu() {
  const { pack } = await api("/api/icu-pack");
  $("#icuPreview").innerHTML = pack
    .map(
      (p) => `<div class="item">
      <strong>${p.title}</strong>
      <div class="muted">${p.category} · ${p.action}</div>
      <div class="muted">${p.notes || ""}</div>
    </div>`
    )
    .join("");
}

async function refreshAftercare() {
  const { items, playbook } = await api("/api/aftercare");
  $("#aftercarePlaybook").innerHTML = `
    <h3>商业拆解（已钉进产品）</h3>
    <p class="muted">${playbook.story}</p>
    <ul class="muted" style="padding-left:1.1em;margin:0.6em 0 0">
      ${playbook.frames.map((f) => `<li><b>${f.t}</b> → ${f.map}</li>`).join("")}
    </ul>`;
  $("#acList").innerHTML = items.length
    ? items
        .map(
          (it) => `<div class="item">
      <strong>${it.title}</strong>
      <div class="muted">${SERVICE_LABEL[it.service_type] || it.service_type}
        · ${it.city || "未填城市"}
        · 差旅预算 ¥${fmtMoney(it.travel_budget)}
        · ${it.coop_state}
        · ${it.status}</div>
      <div class="muted">${it.visit_pref || ""} ${it.notes || ""}</div>
    </div>`
        )
        .join("")
    : `<div class="empty">暂无善后工单</div>`;
}

$("#icuApply").onclick = async () => {
  try {
    const r = await api("/api/icu-pack", {
      method: "POST",
      body: JSON.stringify({ beneficiary: $("#icuBene").value }),
    });
    toast(r.message || "已写入");
    show("handover");
  } catch (e) {
    toast(e.message);
  }
};

$("#acAdd").onclick = async () => {
  try {
    await api("/api/aftercare", {
      method: "POST",
      body: JSON.stringify({
        service_type: $("#acType").value,
        title: $("#acTitle").value,
        city: $("#acCity").value,
        visit_pref: $("#acPref").value,
        travel_budget: Number($("#acTravel").value || 0),
        coop_state: $("#acCoop").value,
        notes: $("#acNotes").value,
      }),
    });
    toast("善后工单已提交");
    $("#acTitle").value = "";
    refreshAftercare();
  } catch (e) {
    toast(e.message);
  }
};

$("#exAdd").onclick = async () => {
  try {
    await api("/api/executor-lead", {
      method: "POST",
      body: JSON.stringify({
        name: $("#exName").value,
        city: $("#exCity").value,
        phone: $("#exPhone").value,
        note: $("#exNote").value,
      }),
    });
    toast("加盟意向已收到");
    $("#exName").value = "";
    $("#exPhone").value = "";
  } catch (e) {
    toast(e.message);
  }
};

$("#bnAdd").onclick = async () => {
  try {
    await api("/api/beneficiaries", {
      method: "POST",
      body: JSON.stringify({
        name: $("#bnName").value,
        role: $("#bnRole").value,
        contact: $("#bnContact").value,
        note: $("#bnNote").value,
      }),
    });
    toast("受益人已保存");
    $("#bnName").value = "";
    refreshHeirs();
  } catch (e) {
    toast(e.message);
  }
};

$("#emReq").onclick = async () => {
  try {
    await api("/api/emergency/request", {
      method: "POST",
      body: JSON.stringify({
        beneficiary_id: Number($("#emBene").value || 0),
        wait_days: Number($("#emWait").value || 7),
        reason: $("#emReason").value,
      }),
    });
    toast("紧急取用已进入等待期");
    refreshHeirs();
  } catch (e) {
    toast(e.message);
  }
};

$("#brainSave").onclick = async () => {
  try {
    if (!_mindmapCache) {
      const { map } = await api("/api/mindmap");
      _mindmapCache = map;
    }
    const next = applyBrainEdits(_mindmapCache);
    const r = await api("/api/mindmap", {
      method: "POST",
      body: JSON.stringify({ map: next }),
    });
    _mindmapCache = r.map;
    toast("图谱已保存");
    refreshBrain();
  } catch (e) {
    toast(e.message);
  }
};

$("#brainReset").onclick = async () => {
  try {
    const r = await api("/api/mindmap", {
      method: "POST",
      body: JSON.stringify({ reset: true }),
    });
    _mindmapCache = r.map;
    toast("已恢复手绘默认结构");
    refreshBrain();
  } catch (e) {
    toast(e.message);
  }
};

refreshHome();
