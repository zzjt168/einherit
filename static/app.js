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
    medDetail: refreshMedDetail,
    member: refreshMember,
    travel: refreshTravel,
    company: refreshCompany,
    guard: refreshGuard,
    handover: refreshHandover,
    heirs: refreshHeirs,
    icu: refreshIcu,
    aftercare: refreshAftercare,
    settings: refreshSettings,
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

/** 统一空态：文案 + 主 CTA（低认知负荷） */
function emptyState(message, ctaLabel, ctaGo) {
  const btn = ctaLabel && ctaGo
    ? `<button class="btn sm" type="button" data-go="${esc(ctaGo)}">${esc(ctaLabel)}</button>`
    : "";
  return `<div class="empty-state">
    <p class="empty-title">${esc(message)}</p>
    <p class="empty-hint">慢慢来就好，需要时再补一条。</p>
    ${btn}
  </div>`;
}

function envLabel() {
  const host = location.hostname || "";
  if (host === "einherit.cn" || host.endsWith(".einherit.cn")) {
    return { kind: "prod", text: "正式环境 · einherit.cn" };
  }
  if (host === "127.0.0.1" || host === "localhost") {
    return { kind: "dev", text: "本机开发 · 127.0.0.1" };
  }
  return { kind: "other", text: `当前主机 · ${host || "未知"}` };
}

const ONBOARD_DISMISS_KEY = "einherit_onboard_dismissed";

function showLegacyCalmTip() {
  const tip = $("#legacyCalmTip");
  if (!tip) return;
  tip.hidden = false;
  tip.innerHTML = `<strong>已保存，可再改</strong><span>短时内随时回来调整处置方式或接收人，无需紧张。</span>
    <button class="btn ghost sm" type="button" id="legacyCalmDismiss">知道了</button>`;
  const btn = $("#legacyCalmDismiss");
  if (btn) btn.onclick = () => { tip.hidden = true; };
  clearTimeout(showLegacyCalmTip._t);
  showLegacyCalmTip._t = setTimeout(() => { tip.hidden = true; }, 8000);
}

async function refreshOnboarding() {
  const box = $("#onboardGuide");
  if (!box) return;
  try {
    const data = await api("/api/onboarding");
    const dismissed = localStorage.getItem(ONBOARD_DISMISS_KEY) === "1";
    if (data.complete && dismissed) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    const steps = (data.steps || [])
      .map(
        (s, i) => `<li class="${s.done ? "done" : ""}">
          <button type="button" data-go="${esc(s.go)}">
            <span class="ob-n">${s.done ? "✓" : i + 1}</span>
            <span><strong>${esc(s.title)}</strong><em>${esc(s.hint)}</em></span>
          </button>
        </li>`
      )
      .join("");
    box.innerHTML = `
      <div class="onboard-head">
        <div>
          <div class="onboard-label">首次引导</div>
          <strong>${data.complete ? "三步已齐，随时可再改" : `温和起步 ${data.done}/${data.total}`}</strong>
        </div>
        <button class="btn ghost sm" type="button" id="onboardDismiss">${data.complete ? "收起" : "稍后再说"}</button>
      </div>
      <ol class="onboard-steps">${steps}</ol>`;
    const d = $("#onboardDismiss");
    if (d) {
      d.onclick = () => {
        localStorage.setItem(ONBOARD_DISMISS_KEY, "1");
        box.hidden = true;
      };
    }
  } catch {
    box.hidden = true;
  }
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
    const env = envLabel();
    $("#homeHint").innerHTML = overdue
      ? `报备稍有延迟，打个卡即可。盘点进度 ${co.progress.pct}%。`
      : grace
        ? `仍在冷静窗口（${user.grace_hours}h）。盘点进度 ${co.progress.pct}%。`
        : `盘点进度 ${co.progress.pct}%（${co.progress.filled}/5 部门）· 下次报备 ${fmtTime(user.checkin_due_at)} · <span class="env-chip env-${env.kind}">${env.text}</span>`;
    await refreshOnboarding();
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
  const [{ user, calls }, hist] = await Promise.all([
    api("/api/checkin/status"),
    api("/api/checkin/history?limit=12"),
  ]);
  const statusHtml = user.checkin_overdue
    ? `<div class="alert">报备稍有延迟。系统会先联系您本人，再联系备用联系人——不擅自下结论。</div>`
    : user.checkin_in_grace
      ? `<div class="alert">已过报备点，仍在冷静期（${user.grace_hours} 小时）。打个卡就回到日常节奏。</div>`
      : `<div class="ok">报备正常。最近一次：${fmtTime(user.last_checkin_at)}</div>`;
  const contacts = (user.backup_contacts || [])
    .map((c) => `<li>${c.name}（${c.relation}）· ${c.phone}</li>`)
    .join("");
  const historyHtml = (hist.items || []).length
    ? hist.items
        .map(
          (h, i) =>
            `<div class="item checkin-hist"><span class="tag">#${(hist.items || []).length - i}</span>
            <strong>${fmtTime(h.at)}</strong>
            <div class="muted">${esc(h.note || "报备")}</div></div>`
        )
        .join("")
    : emptyState("还没有报备记录", "完成一次报备", "checkin");

  box.innerHTML = `
    ${statusHtml}
    <div class="card">
      <h3>一键报备</h3>
      <p class="muted">确认「我还安全」。漏报先进入冷静期；过期后才联系本人，再按序联系备用联系人。</p>
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
      <h3>报备历史</h3>
      <p class="muted">最近 ${Math.min(12, (hist.items || []).length || 0)} 次报备时间（只读）。</p>
      <div class="list">${historyHtml}</div>
    </div>
    <div class="card">
      <h3>报备频率 / 冷静期 / 执行人</h3>
      <p class="muted">完整编辑也可在「设置总控」。</p>
      <label class="field">间隔（小时）<input type="number" id="intervalHours" value="${user.checkin_interval_hours}" min="1"/></label>
      <label class="field">冷静期（小时）<input type="number" id="graceHours" value="${user.grace_hours || 72}" min="0"/></label>
      <label class="field">遗产执行人<input id="executorName" value="${user.executor_name || ""}" placeholder="董事会指定 CEO"/></label>
      <button class="btn ghost" id="saveInterval">保存</button>
      <h3 style="margin-top:16px">备用联系人</h3>
      <ul class="muted">${contacts || "<li>暂无 · 可在设置中添加</li>"}</ul>
      <button class="btn ghost sm" type="button" data-go="settings">去设置编辑</button>
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
          : emptyState("暂无外呼记录", "查看报备说明", "checkin")
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
    localStorage.removeItem(ONBOARD_DISMISS_KEY);
    toast("已保存");
    refreshCheckin();
    refreshHome();
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
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || it.dept || ""}</span>
      <span class="tag">${it.category}</span>
      <span class="tag ${actionClass(it.action)}">${it.action}</span>
      ${flags}
      <strong>${it.title}</strong>
      <div class="muted">${it.beneficiary ? "接收人：" + it.beneficiary + " · " : ""}${it.notes || ""}</div>
    </div>`;
      })
      .join("") || emptyState("还没有交割安排", "写第一条交割", "legacy");
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
          (d.notes || []).length
            ? (d.notes || [])
                .map(
                  (n, idx, arr) =>
                    `<div class="item note-row">
                      <strong>${esc(n.title)}</strong>
                      <div class="muted">${esc(n.body || "")}</div>
                      <div class="note-sort">
                        <button class="btn ghost sm coMove" data-id="${n.id}" data-dir="up" ${idx === 0 ? "disabled" : ""} type="button">上移</button>
                        <button class="btn ghost sm coMove" data-id="${n.id}" data-dir="down" ${idx === arr.length - 1 ? "disabled" : ""} type="button">下移</button>
                      </div>
                    </div>`
                )
                .join("")
            : emptyState("尚无盘点草稿", "去写交割", "legacy")
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
  $$(".coMove").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api("/api/company/note/reorder", {
          method: "POST",
          body: JSON.stringify({ id: Number(btn.dataset.id), direction: btn.dataset.dir }),
        });
        refreshCompany();
      } catch (e) {
        toast(e.message);
      }
    };
  });
}

async function refreshGuard() {
  const data = await api("/api/self-guard");
  const checked = (data.items || []).filter((it) => it.checked);
  const sum = $("#guardSummary");
  if (sum) {
    sum.innerHTML = checked.length
      ? `<h3>已纳入的自保动作 · ${checked.length}/7</h3>
        <p class="muted">一页汇总，可随时取消勾选。</p>
        <div class="list">${checked
          .map(
            (it) => `<div class="item">
              <span class="sin-rank">${it.rank}</span>
              <strong>${esc(it.sin)}</strong>
              <div class="muted">${esc(it.advice)}</div>
              <button class="btn ghost sm guardUncheck" data-rank="${it.rank}" type="button">取消纳入</button>
            </div>`
          )
          .join("")}</div>`
      : `<h3>自保动作提醒摘要</h3>
        <p class="muted">勾选下方条目后，会汇总在这里，方便复习。</p>
        ${emptyState("尚未勾选自保动作", "去七宗罪列表", "guard")}`;
  }
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
  const sync = async (rank, checkedFlag) => {
    await api("/api/self-guard", {
      method: "POST",
      body: JSON.stringify({ sin_rank: Number(rank), checked: checkedFlag }),
    });
    toast(checkedFlag ? "已勾选自保" : "已取消");
    refreshGuard();
  };
  $$(".sinCheck").forEach((cb) => {
    cb.onchange = () => sync(cb.dataset.rank, cb.checked).catch((e) => toast(e.message));
  });
  $$(".guardUncheck").forEach((btn) => {
    btn.onclick = () => sync(btn.dataset.rank, false).catch((e) => toast(e.message));
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
          <span class="tag">${DEPT_SHORT[t.dept] || DEPT_NAME[t.dept] || t.dept || ""}</span>
          <strong>${t.title}</strong>
          <div class="muted">${(t.ops || []).join(" · ")}</div>
          <div class="muted">${t.notes || ""}</div>
        </div>`
            )
            .join("")
        : emptyState("尚无交割条目", "去写交割安排", "legacy")
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
          : emptyState("尚无快照", "先写交割", "legacy")
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
          : emptyState("暂无受益人", "添加受益人", "heirs")
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
          : emptyState("暂无紧急取用申请", "添加受益人", "heirs")
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
          : emptyState("暂无审计记录", "回首页", "home")
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
      <span class="tag">${DEPT_SHORT[it.dept] || DEPT_NAME[it.dept] || ""}</span>
      <span class="tag">${it.visibility}</span>
      <strong>${it.platform}</strong>
      <div class="muted">${it.account_hint || ""} · ${it.summary || ""}</div>
      <div class="muted">处理：${it.dispose_note || "—"}</div>
    </div>`
      )
      .join("") || emptyState("暂无资产备忘", "记一笔备忘", "assets");
}

let _medDetailId = null;

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
      <strong>${esc(h.name)}</strong>
      <div class="muted">${esc(h.city)} · ${esc(h.dept)}<br/>${esc(h.tags || "")}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn secondary medOpen" data-hid="${h.id}" type="button">查看详情</button>
      </div>
    </div>`
      )
      .join("") || emptyState("无匹配医院", "清空关键词再筛", "med");

  $$("#medList .medOpen").forEach((btn) => {
    btn.onclick = () => {
      _medDetailId = Number(btn.dataset.hid);
      show("medDetail");
    };
  });
}

async function refreshMedDetail() {
  const box = $("#medDetailBox");
  if (!box) return;
  if (!_medDetailId) {
    box.innerHTML = emptyState("请先从列表选择医院", "返回医旅", "med");
    return;
  }
  box.innerHTML = "<div class='card muted'>加载中…</div>";
  try {
    const { item: h } = await api("/api/hospitals?id=" + _medDetailId);
    box.innerHTML = `
      <div class="card">
        <span class="tag">${esc(h.country)}</span>
        ${h.intl ? '<span class="tag">国际患者</span>' : ""}
        <h3 style="margin-top:8px">${esc(h.name)}</h3>
        <p class="muted">${esc(h.city)} · 科室：${esc(h.dept)}</p>
        <label class="field">地址<div class="detail-block">${esc(h.address || "暂无地址（演示可后续补全）")}</div></label>
        <label class="field">备注<div class="detail-block">${esc(h.remark || h.tags || "信息中介，不做疗效承诺。")}</div></label>
        <label class="field">意向说明
          <textarea id="medIntentNote" rows="2" placeholder="希望顾问协助评估就医路径（可选）"></textarea>
        </label>
        <button class="btn block" id="medIntentSubmit" type="button">提交就医意向</button>
      </div>`;
    $("#medIntentSubmit").onclick = async () => {
      try {
        await api("/api/hospitals/intent", {
          method: "POST",
          body: JSON.stringify({
            hospital_id: h.id,
            note: ($("#medIntentNote").value || "").trim() || "希望顾问协助评估就医路径",
          }),
        });
        toast("意向已提交");
      } catch (e) {
        toast(e.message);
      }
    };
  } catch (e) {
    box.innerHTML = emptyState(e.message || "加载失败", "返回医旅", "med");
  }
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
  toast("已写入交割手册");
  showLegacyCalmTip();
  localStorage.removeItem(ONBOARD_DISMISS_KEY);
  refreshLegacy();
  refreshHome();
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

function renderAcBudgetTip(balance, budget) {
  const tip = $("#acBudgetTip");
  if (!tip) return;
  const bal = Number(balance || 0);
  const bud = Number(budget || 0);
  if (!bud) {
    tip.className = "budget-tip tone-soft";
    tip.innerHTML = `当前差旅余额 <b>${fmtMoney(bal)}</b>。填写预算后，会提示是否够用。
      <button class="btn ghost sm" type="button" data-go="travel">去预存</button>`;
    return;
  }
  if (bal >= bud) {
    tip.className = "budget-tip tone-ok";
    tip.innerHTML = `差旅余额 <b>${fmtMoney(bal)}</b> ≥ 本单预算 <b>${fmtMoney(bud)}</b>，预存看起来够用。`;
  } else {
    tip.className = "budget-tip tone-care";
    tip.innerHTML = `差旅余额 <b>${fmtMoney(bal)}</b> 低于本单预算 <b>${fmtMoney(bud)}</b>。可先补预存，或调低预算。
      <button class="btn ghost sm" type="button" data-go="travel">去预存</button>`;
  }
}

async function refreshAftercare() {
  const [{ items, playbook }, av, travel] = await Promise.all([
    api("/api/aftercare"),
    api("/api/auth-video"),
    api("/api/travel-fund"),
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
      <div>${av.ready ? "授权视频已就绪，可提交工单" : "尚未完成授权视频 — "}
        <button class="btn ghost sm" data-go="authvideo" type="button">${av.ready ? "查看" : "去上传"}</button>
      </div>
    </div>
    <ul class="muted" style="padding-left:1.1em;margin:0.6em 0 0">
      ${playbook.frames.map((f) => `<li><b>${f.t}</b> → ${f.map}</li>`).join("")}
    </ul>`;
  const bal = travel.fund?.balance || 0;
  window._acTravelBalance = bal;
  renderAcBudgetTip(bal, Number($("#acTravel")?.value || 0));
  const travelInput = $("#acTravel");
  if (travelInput) {
    travelInput.oninput = () =>
      renderAcBudgetTip(window._acTravelBalance || 0, Number(travelInput.value || 0));
  }
  $("#acList").innerHTML = items.length
    ? items
        .map(
          (it) => `<div class="item">
      <strong>${it.title}</strong>
      <div class="muted">${SERVICE_LABEL[it.service_type] || it.service_type}
        · ${it.city || "未填城市"}
        · 差旅预算 ${fmtMoney(it.travel_budget)}
        · ${it.coop_state}
        · ${it.status}</div>
      <div class="muted">${it.visit_pref || ""} ${it.notes || ""}</div>
    </div>`
        )
        .join("")
    : emptyState("暂无善后工单", "先上传授权视频", "authvideo");
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
    : emptyState("尚未上传授权视频", "了解善后门槛", "aftercare");
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

async function refreshSettings() {
  const box = $("#settingsBox");
  if (!box) return;
  box.innerHTML = "<div class='card muted'>加载中…</div>";
  try {
    const { user } = await api("/api/me");
    const env = envLabel();
    const privacyHref = API_BASE.replace(/\/$/, "") + "/privacy.html";
    const exportHref = API_BASE.replace(/\/$/, "") + "/export/pack.json";
    const contacts = user.backup_contacts || [];
    while (contacts.length < 2) contacts.push({ name: "", relation: "", phone: "" });
    box.innerHTML = `
      <div class="card">
        <h3>环境指示</h3>
        <p class="env-chip env-${env.kind}">${esc(env.text)}</p>
        <p class="muted">开发请用本机；对外演示请确认已切到 einherit.cn，避免混用数据。</p>
      </div>
      <div class="card">
        <h3>报备频率与冷静期</h3>
        <label class="field">间隔（小时）<input type="number" id="setInterval" value="${user.checkin_interval_hours}" min="1"/></label>
        <label class="field">冷静期（小时）<input type="number" id="setGrace" value="${user.grace_hours || 72}" min="0"/></label>
        <label class="field">遗产执行人<input id="setExecutor" value="${esc(user.executor_name || "")}" placeholder="董事会指定"/></label>
      </div>
      <div class="card">
        <h3>备用联系人</h3>
        <p class="muted">姓名 + 电话即可；关系可选。</p>
        ${[0, 1]
          .map(
            (i) => `
          <div class="contact-edit">
            <label class="field">姓名<input id="setBkName${i}" value="${esc(contacts[i]?.name || "")}"/></label>
            <label class="field">关系<input id="setBkRel${i}" value="${esc(contacts[i]?.relation || "")}" placeholder="配偶 / 子女"/></label>
            <label class="field">电话<input id="setBkPhone${i}" value="${esc(contacts[i]?.phone || "")}"/></label>
          </div>`
          )
          .join("")}
        <button class="btn block" id="setSave" type="button">保存设置</button>
      </div>
      <div class="card">
        <h3>隐私与导出</h3>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <a class="btn ghost" href="${privacyHref}" target="_blank" rel="noopener">隐私政策</a>
          <button class="btn" id="setExport" type="button">导出数据包（JSON）</button>
          <a class="btn ghost" href="${exportHref}" target="_blank" rel="noopener">新窗口打开 JSON</a>
        </div>
        <p class="muted" style="margin-top:8px">导出含交割、备忘与脱敏受益人；演示用途，不含完整密码。</p>
      </div>
      <div class="card">
        <h3>引导</h3>
        <button class="btn ghost" id="setShowOnboard" type="button">重新显示首次引导</button>
      </div>`;
    $("#setSave").onclick = async () => {
      try {
        const backup_contacts = [0, 1]
          .map((i) => ({
            name: ($("#setBkName" + i).value || "").trim(),
            relation: ($("#setBkRel" + i).value || "").trim(),
            phone: ($("#setBkPhone" + i).value || "").trim(),
          }))
          .filter((c) => c.name || c.phone);
        for (const c of backup_contacts) {
          if (!c.name || !c.phone) {
            toast("备用联系人请同时填写姓名与电话");
            return;
          }
        }
        await api("/api/me", {
          method: "POST",
          body: JSON.stringify({
            checkin_interval_hours: Number($("#setInterval").value || 24),
            grace_hours: Number($("#setGrace").value || 72),
            executor_name: $("#setExecutor").value,
            backup_contacts,
          }),
        });
        localStorage.removeItem(ONBOARD_DISMISS_KEY);
        toast("设置已保存");
        refreshSettings();
        refreshHome();
      } catch (e) {
        toast(e.message);
      }
    };
    $("#setExport").onclick = async () => {
      try {
        const pack = await api("/api/export/pack");
        const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `einherit-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast("已下载脱敏 JSON 演示包");
      } catch (e) {
        toast(e.message);
      }
    };
    $("#setShowOnboard").onclick = () => {
      localStorage.removeItem(ONBOARD_DISMISS_KEY);
      toast("已恢复首次引导");
      show("home");
    };
  } catch (e) {
    box.innerHTML = `<div class="card"><p class="muted">${esc(e.message)}</p></div>`;
  }
}

refreshHome();
