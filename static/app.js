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
    about: refreshAbout,
    executor: () => {},
  };
  if (loaders[id]) loaders[id]();
}

function exportUrl() {
  return API_BASE.replace(/\/$/, "") + "/export/handover.html";
}

function fillExportMeta(el, data) {
  if (!el || !data) return;
  const n = data.item_count != null ? data.item_count : (data.todos || []).length;
  const when = data.generated_at_iso || fmtTime(data.generated_at);
  el.textContent = `生成 ${when} · ${n} 条交割条目 · 可打印带走`;
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
    const [co, hand] = await Promise.all([api("/api/company"), api("/api/handover")]);
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
    fillExportMeta($("#exportMeta"), hand);
    const link = $("#exportHandLink");
    if (link) link.href = exportUrl();
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
  const [{ items }, hand, bene] = await Promise.all([
    api("/api/legacy"),
    api("/api/handover"),
    api("/api/beneficiaries").catch(() => ({ items: [] })),
  ]);
  fillExportMeta($("#legacyExportMeta"), hand);
  const lex = $("#legacyExportLink");
  if (lex) lex.href = exportUrl();
  const dl = $("#lgBeneList");
  if (dl) {
    dl.innerHTML = (bene.items || [])
      .map((b) => {
        const rel = b.relation ? `（${b.relation}）` : "";
        return `<option value="${esc(b.name)}${esc(rel)}"></option>`;
      })
      .join("");
  }
  $("#lgList").innerHTML =
    items
      .map((it) => {
        const who = it.beneficiary
          ? `<div class="device-row"><span class="muted">设备归谁</span><b>${esc(it.beneficiary)}</b></div>`
          : `<div class="device-row"><span class="muted">设备归谁</span><b class="soft">未指定</b></div>`;
        const flags = [
          ["出厂重置", !!it.factory_reset],
          ["清除照片", !!it.clear_photos],
          ["清除聊天", !!it.clear_chats],
        ]
          .map(
            ([label, on]) =>
              `<span class="tag ${on ? "flag-on" : "flag-off"}">${label}${on ? " · 是" : " · 否"}</span>`
          )
          .join("");
        return `<div class="item">
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || it.dept || ""}</span>
      <span class="tag">${esc(it.category)}</span>
      <span class="tag ${actionClass(it.action)}">${esc(it.action)}</span>
      <strong>${esc(it.title)}</strong>
      ${who}
      <div class="device-flags-row">${flags}</div>
      <div class="muted">${esc(it.notes || "")}</div>
    </div>`;
      })
      .join("") || "<p class='muted'>暂无条目。写清归谁与出厂/清除勾选即可。</p>";
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
      try {
        await api("/api/handover/snapshot", {
          method: "POST",
          body: JSON.stringify({ label: `公司盘点 · ${DEPT_SHORT[dept] || dept}` }),
        });
        toast("已写入部门盘点，并留了一份快照");
      } catch (_) {
        toast("已写入部门盘点");
      }
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
  const snaps = await api("/api/snapshots").catch(() => ({ items: [], latest: null }));
  const href = exportUrl();
  const heirsLine =
    (data.heirs || [])
      .map((h) => `${h.name}${h.relation ? "·" + h.relation : ""}`)
      .join("、") || "尚未登记受益人（可去「受益人」名册补齐）";
  const latest = snaps.latest;
  const latestHtml = latest
    ? `<div class="ok snap-tip">最近快照「${esc(latest.label)}」· ${fmtTime(latest.created_at)} · ${
        (latest.summary && latest.summary.item_count) || 0
      } 条
        <button class="btn ghost sm snapView" data-id="${latest.id}" type="button">查看摘要</button>
      </div>`
    : `<p class="muted">保存交割或公司盘点后，这里会提示「已留快照」。</p>`;
  $("#handoverBox").innerHTML = `
    <div class="card export-strip">
      <h3>${esc(data.brand)}</h3>
      <p class="muted">${esc(data.note)}</p>
      <div class="stat" style="margin-top:10px">
        <div class="box"><span class="muted">生成时间</span><b style="font-size:14px">${esc(
          data.generated_at_iso || "—"
        )}</b></div>
        <div class="box"><span class="muted">条目数</span><b style="font-size:14px">${
          data.item_count != null ? data.item_count : (data.todos || []).length
        }</b></div>
      </div>
      <p class="muted" style="margin-top:10px">给谁：${esc(heirsLine)}</p>
      <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">
        <a class="btn" href="${href}" target="_blank" rel="noopener">打开 /export/handover.html</a>
        <button class="btn ghost" id="snapHand">保存版本快照</button>
      </div>
    </div>
    <div class="card"><h3>快照提示</h3>${latestHtml}<div id="snapDetail"></div></div>
    <div class="list">${
      data.todos.length
        ? data.todos
            .map(
              (t, i) => `
        <div class="item">
          <span class="tag">待办 ${i + 1}</span>
          <span class="tag">${DEPT_SHORT[t.dept] || DEPT_NAME[t.dept] || t.dept || ""}</span>
          <strong>${esc(t.title)}</strong>
          <div class="muted">${esc((t.ops || []).join(" · "))}</div>
          <div class="muted">${t.beneficiary ? "给谁：" + esc(t.beneficiary) + " · " : ""}${esc(
                t.notes || ""
              )}</div>
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
                  `<div class="item"><strong>${esc(s.label)}</strong>
                  <div class="muted">${fmtTime(s.created_at)} · ${
                    (s.summary && s.summary.item_count) || 0
                  } 条</div>
                  <button class="btn ghost sm snapView" data-id="${s.id}" type="button">查看摘要</button></div>`
              )
              .join("")
          : "<p class='muted'>尚无快照</p>"
      }</div>
    </div>`;
  const btn = $("#snapHand");
  if (btn) {
    btn.onclick = async () => {
      await api("/api/handover/snapshot", { method: "POST", body: "{}" });
      toast("已留快照，可随时回看摘要");
      refreshHandover();
    };
  }
  $$(".snapView").forEach((b) => {
    b.onclick = async () => {
      const r = await api("/api/snapshot?id=" + b.dataset.id);
      const s = r.item || {};
      const sum = s.summary || {};
      const titles = (sum.titles || []).map((t) => `<li>${esc(t)}</li>`).join("") || "<li>无条目</li>";
      const box = $("#snapDetail");
      if (box) {
        box.innerHTML = `<div class="item" style="margin-top:10px">
          <strong>${esc(s.label)}</strong>
          <div class="muted">${fmtTime(s.created_at)} · 执行人 ${esc(sum.executor || "—")} · ${
          sum.item_count || 0
        } 条</div>
          <ul class="muted" style="padding-left:1.1em;margin:6px 0 0">${titles}</ul>
        </div>`;
      }
    };
  });
}

async function refreshHeirs() {
  const [bene, emer] = await Promise.all([api("/api/beneficiaries"), api("/api/emergency")]);
  const sel = $("#emBene");
  if (sel) {
    sel.innerHTML =
      (bene.items || [])
        .map(
          (b) =>
            `<option value="${b.id}">${esc(b.name)}（${esc(b.relation || b.role)}）</option>`
        )
        .join("") || `<option value="">请先添加受益人</option>`;
  }
  const statusLabel = {
    pending: "等待中",
    approved: "已批准",
    denied: "已拒绝",
    auto_granted: "到期自动放行",
  };
  $("#heirsBox").innerHTML = `
    <div class="card"><h3>名册（交割页可见「给谁」）</h3>
      <div class="list">${
        (bene.items || []).length
          ? bene.items
              .map(
                (b) =>
                  `<div class="item">
                    <span class="tag">${esc(b.role)}</span>
                    ${b.relation ? `<span class="tag">${esc(b.relation)}</span>` : ""}
                    <strong>${esc(b.name)}</strong>
                    <div class="muted">${esc(b.contact || "")}${b.note ? " · " + esc(b.note) : ""}</div>
                    <div class="muted">短码提示：${esc(b.passphrase_hint || "未登记（仅提示，不明文密码）")}</div>
                    <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
                      <button class="btn secondary sm bnEdit" type="button"
                        data-id="${b.id}" data-name="${esc(b.name)}" data-role="${esc(b.role)}"
                        data-relation="${esc(b.relation || "")}" data-contact="${esc(b.contact || "")}"
                        data-note="${esc(b.note || "")}" data-hint="${esc(b.passphrase_hint || "")}">编辑</button>
                      <button class="btn ghost sm bnDel" type="button" data-id="${b.id}">移除</button>
                    </div>
                  </div>`
              )
              .join("")
          : "<p class='muted'>暂无受益人。添加后，交割条目可写清「给谁」。</p>"
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
          <strong>${esc(e.beneficiary_name || "受益人#" + e.beneficiary_id)}</strong>
          <div class="muted">${esc(e.reason || "")} · 等待 ${e.wait_days} 天 · 截止 ${fmtTime(
                  e.decide_by
                )}</div>
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
  $$(".bnEdit").forEach((btn) => {
    btn.onclick = () => {
      $("#bnEditId").value = btn.dataset.id || "";
      $("#bnName").value = btn.dataset.name || "";
      $("#bnRole").value = btn.dataset.role || "heir";
      $("#bnRelation").value = btn.dataset.relation || "";
      $("#bnContact").value = btn.dataset.contact || "";
      $("#bnNote").value = btn.dataset.note || "";
      $("#bnHint").value = btn.dataset.hint || "";
      $("#bnAdd").textContent = "更新名册";
      const cancel = $("#bnCancelEdit");
      if (cancel) cancel.hidden = false;
      toast("正在编辑，改完点「更新名册」");
    };
  });
  $$(".bnDel").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api("/api/beneficiaries/delete", {
          method: "POST",
          body: JSON.stringify({ id: Number(btn.dataset.id) }),
        });
        toast("已从名册移除");
        refreshHeirs();
      } catch (e) {
        toast(e.message);
      }
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
      <strong>${it.platform}</strong>
      <div class="muted">${it.account_hint || ""} · ${it.summary || ""}</div>
      <div class="muted">处理：${it.dispose_note || "—"}</div>
    </div>`
      )
      .join("") || "<p class='muted'>暂无备忘</p>";
}

async function refreshMedIntents() {
  const box = $("#medIntentList");
  if (!box) return;
  const { items } = await api("/api/hospitals/intents").catch(() => ({ items: [] }));
  if (!(items || []).length) {
    box.innerHTML = `<div class="empty calm">还没有就医意向。慢慢筛选医院，想好再留一条即可。</div>`;
    return;
  }
  box.innerHTML = items
    .map((it) => {
      const st = it.status || "open";
      const tone = st === "cancelled" ? "flag-off" : "flag-on";
      return `<div class="item">
        <span class="tag ${tone}">${esc(it.status_label || st)}</span>
        <strong>${esc(it.hospital_name || "未指定医院")}</strong>
        <div class="muted">${esc(
          [it.hospital_country, it.hospital_city, it.hospital_dept].filter(Boolean).join(" · ")
        )}</div>
        <div class="muted">${esc(it.note || "")} · ${fmtTime(it.created_at)}</div>
        <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
          <button class="btn secondary sm medDetail" type="button" data-id="${it.id}">详情</button>
          ${
            st !== "cancelled"
              ? `<button class="btn ghost sm medCancel" type="button" data-id="${it.id}">撤回</button>`
              : ""
          }
        </div>
      </div>`;
    })
    .join("");
  $$(".medDetail").forEach((btn) => {
    btn.onclick = async () => {
      const r = await api("/api/hospitals/intent?id=" + btn.dataset.id);
      const it = r.item || {};
      const detail = $("#medIntentDetail");
      if (!detail) return;
      detail.hidden = false;
      detail.innerHTML = `<strong>${esc(it.hospital_name || "意向详情")}</strong>
        <div class="muted">${esc(it.status_label || it.status)} · ${fmtTime(it.created_at)}</div>
        <div class="muted">${esc(
          [it.hospital_country, it.hospital_city, it.hospital_dept].filter(Boolean).join(" · ")
        )}</div>
        <p>${esc(it.note || "无补充说明")}</p>
        <p class="muted">${esc(it.hospital_tags || "")}</p>`;
    };
  });
  $$(".medCancel").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api("/api/hospitals/intent/cancel", {
          method: "POST",
          body: JSON.stringify({ id: Number(btn.dataset.id) }),
        });
        toast("意向已撤回");
        const detail = $("#medIntentDetail");
        if (detail) detail.hidden = true;
        refreshMedIntents();
      } catch (e) {
        toast(e.message);
      }
    };
  });
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
      refreshMedIntents();
    };
  });
  await refreshMedIntents();
}

async function refreshMember() {
  const { user, ledger } = await api("/api/me");
  const nudge = user.is_member
    ? `<div class="ok">会员有效 · 报备频率与冷静期如下，可按需微调。</div>`
    : `<div class="calm-nudge">尚未开通会员时，仍可盘点交割；开通 ¥365 后，我们按您设定的频率温和守望报备。</div>`;
  $("#memberBox").innerHTML = `
    <div class="card">
      <h3>会员与报备 · 同屏</h3>
      <p class="muted">¥365/年 · 一天一块钱。会员是否有效、报备频率、冷静期 hours 一眼看清。</p>
      ${nudge}
      <div class="stat" style="margin-top:12px">
        <div class="box"><span class="muted">会员</span><b>${user.is_member ? "有效" : "未开通"}</b></div>
        <div class="box"><span class="muted">有效期</span><b style="font-size:16px">${
          user.member_until_iso || "—"
        }</b></div>
        <div class="box"><span class="muted">报备频率</span><b style="font-size:16px">${
          user.checkin_interval_hours || 24
        }h</b></div>
        <div class="box"><span class="muted">冷静期</span><b style="font-size:16px">${
          user.grace_hours || 72
        }h</b></div>
      </div>
      <label class="field" style="margin-top:12px">报备间隔（小时）
        <input type="number" id="memInterval" min="1" step="1" value="${
          user.checkin_interval_hours || 24
        }"/>
      </label>
      <label class="field">冷静期（小时）
        <input type="number" id="memGrace" min="1" step="1" value="${user.grace_hours || 72}"/>
      </label>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn secondary" id="saveMemFreq">保存频率</button>
        <button class="btn" id="payMember">${user.is_member ? "续费一年" : "开通 ¥365"}</button>
        <button class="btn ghost" id="lapseMember">演示：断缴</button>
      </div>
    </div>
    <div class="card calm-note">
      <h3>隐私边界</h3>
      <p class="muted">旁路托管、不恐吓。查看完整说明与数据边界。</p>
      <button class="btn ghost" data-go="about" type="button">隐私与审计时间线</button>
    </div>
    <div class="card">
      <h3>账单流水</h3>
      <div class="list">${
        ledger
          .map(
            (l) =>
              `<div class="item"><span class="tag">${esc(l.kind)}</span><strong>${esc(
                l.note || l.kind
              )}</strong><div class="muted">${fmtMoney(l.amount)} · ${fmtTime(
                l.created_at
              )}</div></div>`
          )
          .join("") || "<p class='muted'>暂无</p>"
      }</div>
    </div>`;
  $("#saveMemFreq").onclick = async () => {
    try {
      await api("/api/me", {
        method: "POST",
        body: JSON.stringify({
          checkin_interval_hours: Number($("#memInterval").value || 24),
          grace_hours: Number($("#memGrace").value || 72),
        }),
      });
      toast("报备频率已保存");
      refreshMember();
      refreshHome();
    } catch (e) {
      toast(e.message);
    }
  };
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
  try {
    await api("/api/handover/snapshot", {
      method: "POST",
      body: JSON.stringify({ label: "交割变更快照" }),
    });
    toast("已写入交割手册，并留了一份快照");
  } catch (_) {
    toast("已写入交割手册");
  }
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
  const toneClass = {
    wait: "status-wait",
    ready: "status-ready",
    queued: "status-queued",
    done: "status-done",
  };
  $("#acList").innerHTML = items.length
    ? items
        .map((it) => {
          const tone = toneClass[it.status_tone] || "status-queued";
          const budget =
            it.travel_budget_label || "¥" + Number(it.travel_budget || 0).toFixed(0);
          return `<div class="item">
      <span class="tag ${tone}">${esc(it.status_label || it.status || "已提交")}</span>
      <strong>${esc(it.title)}</strong>
      <div class="muted">${esc(SERVICE_LABEL[it.service_type] || it.service_type)}
        · ${esc(it.city || "未填城市")}
        · 差旅预算 ${esc(budget)}
        · ${esc(it.coop_state || "")}</div>
      <div class="muted">${esc(it.visit_pref || "")} ${esc(it.notes || "")}</div>
    </div>`;
        })
        .join("")
    : `<div class="empty calm">暂无善后工单。授权视频齐备后，可温和提交。</div>`;
}

async function refreshAbout() {
  const { items } = await api("/api/audit").catch(() => ({ items: [] }));
  const box = $("#auditTimeline");
  if (!box) return;
  if (!(items || []).length) {
    box.innerHTML = `<div class="empty calm">暂无关键操作。报备、交割变更、工单与授权视频会出现在这里。</div>`;
    return;
  }
  box.innerHTML = `<ol class="timeline-list">${items
    .map(
      (a) => `<li>
      <div class="tl-dot"></div>
      <div class="tl-body">
        <strong>${esc(a.label || a.action)}</strong>
        <div class="muted">${esc(a.detail || "")}</div>
        <div class="muted">${esc(a.created_at_iso || fmtTime(a.created_at))}</div>
      </div>
    </li>`
    )
    .join("")}</ol>`;
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

function resetBeneForm() {
  $("#bnEditId").value = "";
  $("#bnName").value = "";
  $("#bnRelation").value = "";
  $("#bnContact").value = "";
  $("#bnNote").value = "";
  $("#bnHint").value = "";
  $("#bnRole").value = "heir";
  $("#bnAdd").textContent = "保存到名册";
  const cancel = $("#bnCancelEdit");
  if (cancel) cancel.hidden = true;
}

$("#bnAdd").onclick = async () => {
  try {
    const editId = Number($("#bnEditId").value || 0);
    const payload = {
      name: $("#bnName").value,
      role: $("#bnRole").value,
      relation: $("#bnRelation").value,
      contact: $("#bnContact").value,
      note: $("#bnNote").value,
      passphrase_hint: $("#bnHint").value,
    };
    if (editId) {
      await api("/api/beneficiaries/update", {
        method: "POST",
        body: JSON.stringify({ id: editId, ...payload }),
      });
      toast("名册已更新");
    } else {
      await api("/api/beneficiaries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast("受益人已保存到名册");
    }
    resetBeneForm();
    refreshHeirs();
  } catch (e) {
    toast(e.message);
  }
};

const bnCancel = $("#bnCancelEdit");
if (bnCancel) {
  bnCancel.onclick = () => {
    resetBeneForm();
    toast("已取消编辑");
  };
}

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
