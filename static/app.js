/* 电子继承 App · E-Inherit · 前端 */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const DEPT_NAME = {
  production: "生产部/个人产出类(工资 兼职 股票)",
  finance: "财务部/资金与负债类(银行卡 保险 贷款)",
  ip: "知识产权部/精神文化类(云盘 日记 游戏号)",
  admin: "行政部/实体钥匙类(手机平板 证件 恢复码)",
  board: "董事会/决策触发类(执行人 分配 报备)",
};
const DEPT_SHORT = {
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
    authvideo: refreshAuthVideo,
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
    appAbout: refreshAppAbout,
  };
  if (loaders[id]) loaders[id]();
}

/** 温和二次确认（无恐吓措辞） */
function calmConfirm(title, body) {
  const dlg = $("#confirmDialog");
  if (!dlg || typeof dlg.showModal !== "function") {
    return Promise.resolve(window.confirm(`${title}\n${body}`));
  }
  $("#confirmTitle").textContent = title;
  $("#confirmBody").textContent = body;
  dlg.returnValue = "";
  dlg.showModal();
  return new Promise((resolve) => {
    const onClose = () => {
      dlg.removeEventListener("close", onClose);
      resolve(dlg.returnValue === "ok");
    };
    dlg.addEventListener("close", onClose);
  });
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
  const graceRemain =
    user.checkin_in_grace && user.grace_remaining_human
      ? `<div class="grace-remain" id="graceRemain" aria-live="polite">
          <span class="muted">冷静期还剩</span>
          <strong>${esc(user.grace_remaining_human)}</strong>
          <span class="muted"> · 打个卡即可回到日常节奏</span>
        </div>`
      : "";
  const statusHtml = user.checkin_overdue
    ? `<div class="alert">已过冷静期。状态机：calling_self → calling_backup → manual_review（不直接宣布身故）。</div>`
    : user.checkin_in_grace
      ? `<div class="alert">已过报备点，仍在冷静期（设定 ${user.grace_hours} 小时）。暂不外呼，请尽快打卡。${graceRemain}</div>`
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

async function fillLegacyBenePick() {
  const sel = $("#lgBenePick");
  if (!sel) return;
  const prev = sel.value;
  const { items } = await api("/api/beneficiaries").catch(() => ({ items: [] }));
  sel.innerHTML =
    `<option value="">不指定（或下方手写）</option>` +
    (items || [])
      .map((b) => `<option value="${b.id}">${esc(b.name)}（${esc(b.role)}）</option>`)
      .join("");
  if (prev) sel.value = prev;
}

async function refreshLegacy() {
  await fillLegacyBenePick();
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
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || it.dept || ""}</span>
      <span class="tag">${it.category}</span>
      <span class="tag ${actionClass(it.action)}">${it.action}</span>
      ${flags}
      <strong>${esc(it.title)}</strong>
      <div class="muted">${it.beneficiary ? "接收人：" + esc(it.beneficiary) + " · " : ""}${esc(it.notes || "")}</div>
      <div class="row" style="margin-top:8px">
        <button class="btn ghost sm lgDel" type="button" data-id="${it.id}" data-title="${esc(it.title)}">移出手册</button>
      </div>
    </div>`;
      })
      .join("") || "<p class='muted'>暂无条目</p>";
  $$(".lgDel").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await calmConfirm(
        "移出这条交割安排？",
        `「${btn.dataset.title || "该条目"}」将从手册中拿下，之后还可以再写回来。`
      );
      if (!ok) return;
      await api("/api/legacy/delete", {
        method: "POST",
        body: JSON.stringify({ id: Number(btn.dataset.id) }),
      });
      toast("已移出");
      refreshLegacy();
    };
  });
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
        <button class="btn secondary coAdd" data-dept="${d.id}">写入${d.short || d.name}</button>
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
  const itemCount = data.item_count ?? (data.todos || []).length;
  const beneCount = data.beneficiary_count ?? 0;
  $("#handoverBox").innerHTML = `
    <div class="card">
      <h3>${data.brand}</h3>
      <p class="muted">${data.note}</p>
      <div class="stat" style="margin-top:10px">
        <div class="box"><span class="muted">域名</span><b style="font-size:14px">${data.domain}</b></div>
        <div class="box"><span class="muted">执行人</span><b style="font-size:14px">${data.executor}</b></div>
      </div>
      <div class="export-preview" id="handoverPreview">
        <span class="muted">导出前核对</span>
        <strong>将含 ${itemCount} 条交割</strong>
        <span class="muted">·</span>
        <strong>受益人 ${beneCount} 位</strong>
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
          <span class="tag">${DEPT_SHORT[t.dept] || DEPT_NAME[t.dept] || t.dept || ""}</span>
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

let _auditFilter = "";

async function refreshHeirs() {
  const typeQs = _auditFilter ? `?type=${encodeURIComponent(_auditFilter)}` : "";
  const [bene, emer, audit] = await Promise.all([
    api("/api/beneficiaries"),
    api("/api/emergency"),
    api("/api/audit" + typeQs),
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
  const types = audit.types || [
    { id: "checkin", label: "报备" },
    { id: "legacy", label: "交割" },
    { id: "aftercare", label: "工单" },
    { id: "auth", label: "授权" },
  ];
  const chipHtml = [
    `<button type="button" class="chip${!_auditFilter ? " active" : ""}" data-atype="">全部</button>`,
    ...types.map(
      (t) =>
        `<button type="button" class="chip${_auditFilter === t.id ? " active" : ""}" data-atype="${t.id}">${t.label}</button>`
    ),
  ].join("");
  $("#heirsBox").innerHTML = `
    <div class="card"><h3>受益人名单</h3>
      <div class="list">${
        (bene.items || []).length
          ? bene.items
              .map(
                (b) =>
                  `<div class="item"><span class="tag">${esc(b.role)}</span><strong>${esc(b.name)}</strong>
                  <div class="muted">${esc(b.contact || "")} ${esc(b.note || "")}</div>
                  <div class="row" style="margin-top:8px">
                    <button class="btn ghost sm bnDel" type="button" data-id="${b.id}" data-name="${esc(b.name)}">从名册拿下</button>
                  </div></div>`
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
    <div class="card"><h3>审计时间线</h3>
      <div class="chip-row" id="auditFilterChips" role="group" aria-label="按类型筛选">${chipHtml}</div>
      <div class="list" id="auditFilteredList">${
        (audit.items || []).length
          ? audit.items
              .slice(0, 16)
              .map(
                (a) =>
                  `<div class="item"><span class="tag">${esc(a.type_label || a.action)}</span>
                  <strong>${esc(a.action)}</strong>
                  <div class="muted">${esc(a.detail || "")} · ${fmtTime(a.created_at)}</div></div>`
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
  $$(".bnDel").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await calmConfirm(
        "从名册拿下这位受益人？",
        `「${btn.dataset.name || "该受益人"}」会离开名册；交割条目里已写的名字仍会保留。`
      );
      if (!ok) return;
      await api("/api/beneficiaries/delete", {
        method: "POST",
        body: JSON.stringify({ id: Number(btn.dataset.id) }),
      });
      toast("已从名册拿下");
      refreshHeirs();
    };
  });
  $$("#auditFilterChips [data-atype]").forEach((chip) => {
    chip.onclick = () => {
      _auditFilter = chip.dataset.atype || "";
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
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || ""}</span>
      <span class="tag">${it.visibility}</span>
      <strong>${esc(it.platform)}</strong>
      <div class="muted">${esc(it.account_hint || "")} · ${esc(it.summary || "")}</div>
      <div class="muted">处理：${esc(it.dispose_note || "—")}</div>
      <div class="row" style="margin-top:8px">
        <button class="btn ghost sm asDel" type="button" data-id="${it.id}" data-name="${esc(it.platform)}">删除备忘</button>
      </div>
    </div>`
      )
      .join("") || "<p class='muted'>暂无备忘</p>";
  $$(".asDel").forEach((btn) => {
    btn.onclick = async () => {
      const ok = await calmConfirm(
        "删除这条资产备忘？",
        `「${btn.dataset.name || "该备忘"}」将从列表拿下，需要时可再记一笔。`
      );
      if (!ok) return;
      await api("/api/assets/delete", {
        method: "POST",
        body: JSON.stringify({ id: Number(btn.dataset.id) }),
      });
      toast("已删除备忘");
      refreshAssets();
    };
  });
}

let _medRegion = "";

async function refreshMed(q = "", country = "") {
  const qs = new URLSearchParams();
  const qVal = q || ($("#medQ")?.value || "").trim();
  let countryVal = country || ($("#medCountry")?.value || "");
  if (_medRegion === "国内") countryVal = "中国";
  if (_medRegion === "国外" && (!countryVal || countryVal === "中国")) countryVal = "";
  if (qVal) qs.set("q", qVal);
  if (countryVal) qs.set("country", countryVal);
  let { items } = await api("/api/hospitals?" + qs.toString());
  if (_medRegion === "国外") {
    items = (items || []).filter((h) => h.country && h.country !== "中国");
  }
  $$("#medRegionChips .chip").forEach((c) => {
    c.classList.toggle("active", (c.dataset.region || "") === _medRegion);
  });
  $("#medList").innerHTML =
    items
      .map(
        (h) => `
    <div class="item">
      <span class="tag">${esc(h.country)}</span>
      ${h.intl ? '<span class="tag">国际患者</span>' : ""}
      <strong>${esc(h.name)}</strong>
      <div class="muted">${esc(h.city)} · ${esc(h.dept)}<br/>${esc(h.tags || "")}</div>
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
  const short = Number(fund.shortfall || 0);
  const tip = fund.meets_threshold
    ? `<div class="hint soft" id="travelThresholdTip">差旅预存已达建议门槛，可安心安排上门。</div>`
    : `<div class="hint soft" id="travelThresholdTip">
        当前余额略低于建议门槛（差 ${fmtMoney(short)}）。可先演示补足，便于上门差旅记账。
        <button class="btn sm" type="button" id="travelTopupHint">补足至 ¥2000</button>
      </div>`;
  $("#travelBox").innerHTML = `
    <div class="card">
      <h3>差旅费预存</h3>
      <p class="muted">建议 ≥¥2000，上不封顶。会员断缴后未消费余额自动原路退回。</p>
      <div class="stat" style="margin-top:12px">
        <div class="box"><span class="muted">余额</span><b>${fmtMoney(fund.balance)}</b></div>
        <div class="box"><span class="muted">门槛</span><b>¥${Number(fund.threshold || 2000)}</b></div>
      </div>
      ${tip}
      <label class="field" style="margin-top:12px">充值金额
        <input type="number" id="travelAmt" value="${fund.meets_threshold ? 2000 : Math.max(2000, Math.ceil(short) || 2000)}" min="1" step="100"/>
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
  const tipBtn = $("#travelTopupHint");
  if (tipBtn) {
    tipBtn.onclick = () => {
      const need = Math.max(2000, Math.ceil(Number(fund.shortfall || 2000)));
      $("#travelAmt").value = String(need);
      toast("已填入建议补足金额，确认后点预存入账");
    };
  }
}

document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".hub-toggle");
  if (toggle) {
    e.preventDefault();
    const hub = toggle.closest(".hub");
    if (hub) {
      hub.classList.toggle("open");
      const open = hub.classList.contains("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      const chev = toggle.querySelector(".hub-chevron");
      if (chev) chev.textContent = open ? "▾" : "▸";
    }
    return;
  }
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
      beneficiary_id: Number($("#lgBenePick")?.value || 0),
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
  if ($("#lgBenePick")) $("#lgBenePick").value = "";
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

$("#medSearch").onclick = () => {
  _medRegion = "";
  refreshMed($("#medQ").value.trim(), $("#medCountry").value);
};

$$("#medRegionChips [data-region]").forEach((chip) => {
  chip.onclick = () => {
    _medRegion = chip.dataset.region || "";
    if (_medRegion === "国内" && $("#medCountry")) $("#medCountry").value = "中国";
    if (_medRegion === "国外" && $("#medCountry")) $("#medCountry").value = "";
    if (!_medRegion && $("#medCountry")) $("#medCountry").value = "";
    refreshMed($("#medQ").value.trim(), $("#medCountry").value);
  };
});

const SERVICE_LABEL = {
  delete_data: "删除电子数据",
  sell_asset: "变卖电子资产",
  field_visit: "上门执行",
  legal_consult: "法律顾问协办",
};

async function refreshIcu() {
  const data = await api("/api/icu-checklist").catch(async () => {
    const { pack } = await api("/api/icu-pack");
    return {
      items: (pack || []).map((p, i) => ({
        ...p,
        pack_key: `icu_${i}_${p.title}`,
        checked: false,
      })),
      done: 0,
      total: (pack || []).length,
    };
  });
  const hint = $("#icuCheckHint");
  if (hint) {
    hint.textContent = `已勾选 ${data.done || 0}/${data.total || 0} 项（勾选会保存并回显）。确认后再写入交割手册。`;
  }
  $("#icuPreview").innerHTML = (data.items || [])
    .map(
      (p) => `<div class="item">
      <label class="icu-check">
        <input type="checkbox" class="icuPackCheck" data-key="${esc(p.pack_key)}" ${p.checked ? "checked" : ""}/>
        <span>已完成此项准备</span>
      </label>
      <strong>${esc(p.title)}</strong>
      <div class="muted">${esc(p.category)} · ${esc(p.action)}</div>
      <div class="muted">${esc(p.notes || "")}</div>
    </div>`
    )
    .join("");
  $$(".icuPackCheck").forEach((cb) => {
    cb.onchange = async () => {
      try {
        const r = await api("/api/icu-checklist", {
          method: "POST",
          body: JSON.stringify({ pack_key: cb.dataset.key, checked: cb.checked }),
        });
        if (hint) {
          hint.textContent = `已勾选 ${r.done || 0}/${r.total || 0} 项（勾选会保存并回显）。确认后再写入交割手册。`;
        }
        toast(cb.checked ? "已记下完成" : "已取消勾选");
      } catch (e) {
        cb.checked = !cb.checked;
        toast(e.message);
      }
    };
  });
}

async function refreshAftercare() {
  const [{ items, playbook }, av] = await Promise.all([
    api("/api/aftercare"),
    api("/api/auth-video"),
  ]);
  const gate = playbook.auth_video_gate || {};
  const must = (gate.must_include || []).map((x) => `<li>${x}</li>`).join("");
  $("#aftercarePlaybook").innerHTML = `
    <h3>商业拆解（已钉进产品）</h3>
    <p class="muted">${playbook.story}</p>
    <div class="alert" style="margin-top:10px">
      <b>${gate.title || "授权说明视频"}</b>
      <div class="muted">${gate.from_frames || ""}</div>
      <ul class="muted" style="padding-left:1.1em;margin:0.4em 0">${must}</ul>
      <div>${av.ready ? "✅ 授权视频已就绪，可提交工单" : "⚠ 尚未完成授权视频 — "}
        <button class="btn ghost sm" data-go="authvideo" type="button">${av.ready ? "查看" : "去上传"}</button>
      </div>
    </div>
    <ul class="muted" style="padding-left:1.1em;margin:0.6em 0 0">
      ${playbook.frames.map((f) => `<li><b>${f.t}</b> → ${f.map}</li>`).join("")}
    </ul>`;
  $("#acList").innerHTML = items.length
    ? items
        .map(
          (it) => `<div class="item">
      <strong>${esc(it.title)}</strong>
      <div class="muted">${SERVICE_LABEL[it.service_type] || it.service_type}
        · ${esc(it.city || "未填城市")}
        · 差旅预算 ¥${fmtMoney(it.travel_budget)}
        · ${esc(it.coop_state)}
        · ${esc(it.status)}</div>
      <div class="muted">${[
        it.visit_pref ? `偏好：${it.visit_pref}` : "",
        it.contact_window ? `联系窗口：${it.contact_window}` : "",
        it.notes || "",
      ]
        .filter(Boolean)
        .map(esc)
        .join(" · ")}</div>
    </div>`
        )
        .join("")
    : `<div class="empty">暂无善后工单</div>`;
}

async function refreshAppAbout() {
  try {
    const h = await api("/api/health");
    $("#aboutAppVer").textContent = h.version || "—";
    $("#aboutSrvVer").textContent = h.server_version || "—";
    $("#aboutHealthResult").textContent = "可随时点一下，确认服务是否就绪。";
  } catch (e) {
    $("#aboutAppVer").textContent = "—";
    $("#aboutSrvVer").textContent = "—";
    $("#aboutHealthResult").textContent = "暂无法读取版本：" + e.message;
  }
}

async function refreshAuthVideo() {
  const st = await api("/api/auth-video");
  $("#authScript").innerHTML = (st.script || [])
    .map((s) => `<li><b>${s.title}</b><div class="muted">${s.hint}</div></li>`)
    .join("");
  $("#avStatus").textContent = st.ready
    ? "✅ 授权视频已通过门槛，可去提交善后工单"
    : st.gate || "请上传含三段内容的视频";
  $("#avList").innerHTML = (st.items || []).length
    ? st.items
        .map(
          (it) => `<div class="item">
      <span class="tag">${it.status}</span>
      <strong>${it.original_name || it.filename}</strong>
      <div class="muted">问候${it.has_greeting ? "✓" : "✗"} · 授权${it.has_authorize ? "✓" : "✗"} · 思路${it.has_plan ? "✓" : "✗"}
        · ${fmtTime(it.created_at)}</div>
      <div class="muted">${it.note || ""}</div>
    </div>`
        )
        .join("")
    : `<div class="empty">尚未上传授权视频</div>`;
}

$("#avUpload").onclick = async () => {
  try {
    const file = $("#avFile").files?.[0];
    if (!file) throw new Error("请先选择视频文件");
    if (!$("#avGreet").checked || !$("#avAuth").checked || !$("#avPlan").checked) {
      throw new Error("请勾选确认：问候、对我司授权、处置思路均已录进视频");
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("has_greeting", "1");
    fd.append("has_authorize", "1");
    fd.append("has_plan", "1");
    fd.append("note", $("#avNote").value || "");
    const url = API_BASE.replace(/\/$/, "") + "/api/auth-video";
    const res = await fetch(url, { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || res.statusText);
    toast(data.message || "已上传");
    $("#avFile").value = "";
    refreshAuthVideo();
  } catch (e) {
    toast(e.message);
  }
};

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
        contact_window: $("#acWindow")?.value || "",
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

$("#aboutHealthBtn")?.addEventListener("click", async () => {
  const out = $("#aboutHealthResult");
  if (out) out.textContent = "检查中…";
  try {
    const h = await api("/api/health");
    $("#aboutAppVer").textContent = h.version || "—";
    $("#aboutSrvVer").textContent = h.server_version || "—";
    if (out) {
      out.textContent = h.ok
        ? `服务正常 · ${h.app || "电子继承"} · ${h.domain || "einherit.cn"} · ${h.version || ""}`
        : "服务已响应，但状态未标记为就绪。";
    }
    toast("健康检查完成");
  } catch (e) {
    if (out) out.textContent = "健康检查未通过：" + e.message;
    toast(e.message);
  }
});

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
