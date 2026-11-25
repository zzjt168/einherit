/* 电子继承 · 第三十五批增量（叠在 round34…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round35SoftBanner_" + (hostId || "home");
    let el = document.getElementById(eid);
    if (!el) {
      el = document.createElement("div");
      el.id = eid;
      el.className = "ok soft-banner soft-banner-cta";
      el.hidden = true;
    }
    if (!el.parentNode || el.parentNode !== host) {
      host.insertBefore(el, host.firstChild);
    }
    el.innerHTML = "";
    const text = document.createElement("span");
    text.textContent = msg;
    el.appendChild(text);
    (actions || []).forEach((a) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm";
      btn.textContent = a.label;
      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof a.onClick === "function") a.onClick();
      };
      el.appendChild(btn);
    });
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(() => {
      el.hidden = true;
    }, 9000);
    return el;
  }

  async function copyText(str) {
    const text = String(str || "");
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return !!ok;
    } catch (_) {
      return false;
    }
  }

  function parseTs(raw) {
    if (raw == null || raw === "") return 0;
    if (typeof raw === "number") return raw > 1e12 ? raw / 1000 : raw;
    const n = Number(raw);
    if (!Number.isNaN(n) && n > 0) return n > 1e12 ? n / 1000 : n;
    const d = Date.parse(String(raw));
    return Number.isNaN(d) ? 0 : d / 1000;
  }

  function formatTs(ts) {
    const t = parseTs(ts);
    if (!t) return "";
    if (typeof fmtTime === "function") return fmtTime(t);
    try {
      return new Date(t * 1000).toLocaleString();
    } catch (_) {
      return String(ts);
    }
  }

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    return shortMap[dept] || nameMap[dept] || String(dept || "");
  }

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  /* 1 · 首页手册完成度一句 */
  async function paintHomeHandProgress() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHandProgressBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHandProgressBar";
      bar.className = "home-hand-progress-bar";
      bar.setAttribute("role", "status");
      const tf = $("#homeTravelThresholdBar");
      const mb = $("#homeMemberStatusBar");
      const av = $("#homeAuthGateBar");
      if (tf && tf.parentNode === home) tf.insertAdjacentElement("afterend", bar);
      else if (mb && mb.parentNode === home) mb.insertAdjacentElement("afterend", bar);
      else if (av && av.parentNode === home) av.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home) todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct = Number(prog.pct != null ? prog.pct : 0);
      bar.hidden = false;
      bar.innerHTML = `<span class="home-hand-mark">交割手册</span>
        <span class="muted home-hand-sub">完成度约 ${pct}% · 按自己节奏补齐即可</span>
        <button type="button" class="btn ghost sm" id="homeHandGo">去手册</button>`;
      const btn = $("#homeHandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题+处置组合复制 */
  async function ensureLegacyTitleActionCopyButtons() {
    const list = $("#lgList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/legacy");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#lgList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const title = it ? String(it.title || "").trim() : "";
      const action = it ? String(it.action || "").trim() : "";
      const line = title && action ? title + " · " + action : title || action;
      if (it) el.dataset.titleAction = line;
      if (!line || el.querySelector(".lg-copy-title-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-action";
      btn.textContent = "复制标题与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleAction || "");
        softBanner(ok ? "已复制标题与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘部门一键复制 */
  async function ensureAssetDeptCopyButtons() {
    const list = $("#asList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/assets");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#asList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const label = it ? deptLabel(it.dept) || String(it.dept || "") : "";
      if (it) el.dataset.deptLabel = label;
      if (!label || el.querySelector(".as-copy-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dept";
      btn.textContent = "复制部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptLabel || "");
        softBanner(ok ? "已复制备忘部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制会员剩余天数 */
  async function ensureCheckinMemberDaysCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinMemberDaysCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinMemberDaysCopyCard";
      card.className = "checkin-member-days-copy";
      const lastNext = $("#checkinLastNextCopyCard");
      const due = $("#checkinDueCopyCard");
      const combo = $("#checkinComboCopyCard");
      if (lastNext && lastNext.parentNode) lastNext.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode) due.insertAdjacentElement("afterend", card);
      else if (combo && combo.parentNode) combo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const u = st.user || {};
      const days =
        u.member_days_left != null
          ? Number(u.member_days_left)
          : u.is_member
            ? null
            : 0;
      let line;
      if (!u.is_member) line = "会员未开通（演示说明，不改外呼流程）";
      else if (days == null || Number.isNaN(days))
        line = "会员已开通 · 剩余天数暂不可用（演示）";
      else line = "会员还剩 " + Math.max(0, Math.floor(days)) + " 天（电子继承 · 演示）";
      card.innerHTML = `<p class="muted checkin-member-days-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="checkinMemberDaysCopyBtn">复制会员剩余天数</button>`;
      const btn = $("#checkinMemberDaysCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制会员剩余天数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">会员剩余天数暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比一键复制 */
  async function ensureTravelProgressCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressCopyCard";
      card.className = "travel-progress-copy";
      const balNum = $("#travelBalanceNumCopyCard");
      const amt = $("#travelThresholdAmtCopyCard");
      const thr = $("#travelThresholdCopyCard");
      if (balNum && balNum.parentNode) balNum.insertAdjacentElement("afterend", card);
      else if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode) thr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct = Number(fund.progress_pct != null ? fund.progress_pct : 0);
      const label =
        fund.progress_label ||
        (fund.meets_threshold || fund.met ? "已达建议门槛" : "按自己节奏预存即可");
      const line = "差旅进度 " + pct + "% · " + label;
      card.innerHTML = `<p class="muted travel-progress-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="travelProgressCopyBtn">复制差旅进度</button>`;
      const btn = $("#travelProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制差旅进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">差旅进度暂不可用</p>`;
    }
  }

  /* 6 · 善后状态标签一键复制 */
  async function ensureAftercareStatusCopyButtons() {
    const list = $("#acList");
    if (!list) return;
    let items = [];
    try {
      const data = await api("/api/aftercare");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const byId = {};
    items.forEach((it) => {
      byId[String(it.id)] = it;
    });
    $$("#acList .item").forEach((el, i) => {
      const it = (el.dataset.id && byId[el.dataset.id]) || items[i];
      if (it && it.id != null) el.dataset.id = String(it.id);
      const label = it
        ? String(it.status_label || it.status || "").trim()
        : "";
      if (it) el.dataset.statusLabel = label;
      if (!label || el.querySelector(".ac-copy-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status";
      btn.textContent = "复制状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusLabel || "");
        softBanner(ok ? "已复制善后状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频脚本段标题列表复制 */
  async function ensureAuthScriptTitlesCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptTitlesCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptTitlesCopyCard";
      card.className = "av-script-titles-copy";
      const ready = $("#avReadyCopyCard");
      const miss = $("#avMissingCopyCard");
      const seg = $("#avScriptSegCount");
      if (ready && ready.parentNode) ready.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode) miss.insertAdjacentElement("afterend", card);
      else if (seg && seg.parentNode) seg.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const st = await api("/api/auth-video");
      const script = st.script || [];
      const titles = script
        .map((s) => String(s.title || s.label || s.key || "").trim())
        .filter(Boolean);
      const line = titles.length
        ? titles.join(" · ")
        : "问候 · 授权 · 思路";
      card.innerHTML = `<p class="muted av-script-titles-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="avScriptTitlesCopyBtn">复制脚本段标题</button>`;
      const btn = $("#avScriptTitlesCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制脚本段标题" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">脚本段标题暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+角色组合复制 */
  async function ensureHeirNameRoleCopyButtons() {
    const box = $("#heirsBox");
    if (!box) return;
    let items = [];
    try {
      const data = await api("/api/beneficiaries");
      items = data.items || [];
    } catch (_) {
      items = [];
    }
    const nodes = $$("#heirsBox .item").filter((el) => el.querySelector("strong"));
    nodes.forEach((el, i) => {
      const it = items[i];
      if (!it) return;
      const name = String(it.name || "").trim();
      const role = roleLabel(it.role);
      const line = name && role ? name + " · " + role : name || role;
      el.dataset.nameRole = line;
      if (!line || el.querySelector(".bn-copy-name-role")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-role";
      btn.textContent = "复制姓名与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRole || "");
        softBanner(ok ? "已复制姓名与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间一键复制 */
  async function ensureHandoverGeneratedAtCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedAtCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedAtCopyCard";
      card.className = "hand-generated-at-copy";
      const execDom = $("#handExecutorDomainCopyCard");
      const exportPath = $("#handExportPathCopyCard");
      const prog = $("#handProgressPctBar");
      if (execDom && execDom.parentNode) execDom.insertAdjacentElement("afterend", card);
      else if (exportPath && exportPath.parentNode)
        exportPath.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode) prog.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const iso = String(data.generated_at_iso || "").trim();
      const raw = data.generated_at;
      const pretty = iso || formatTs(raw) || "尚未生成";
      const line = "手册生成时间 · " + pretty;
      card.innerHTML = `<p class="muted hand-generated-at-copy-line">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedAtCopyBtn">复制生成时间</button>`;
      const btn = $("#handGeneratedAtCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制手册生成时间" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册生成时间暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制运营主体行 + round 层含 35 */
  async function paintLegalEntityCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#legalEntityCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "legalEntityCopyCard";
      card.className = "card legal-entity-copy-card";
      const sv = $("#serverVersionCopyCard");
      const zhEn = $("#zhEnBrandCopyCard");
      const en = $("#enBrandCopyCard");
      const roundList = $("#roundLayerListCard");
      if (sv && sv.parentNode) sv.insertAdjacentElement("beforebegin", card);
      else if (zhEn && zhEn.parentNode) zhEn.insertAdjacentElement("beforebegin", card);
      else if (en && en.parentNode) en.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode) {
        roundList.insertAdjacentElement("beforebegin", card);
      } else {
        box.appendChild(card);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = h.domain || "einherit.cn";
      const line = "海南润邦电子有限公司 · " + domain;
      card.innerHTML = `<h3>运营主体</h3>
        <p class="muted">一键复制运营主体与域名（演示级）。</p>
        <p class="legal-entity-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="legalEntityCopyBtn">复制运营主体行</button>`;
      const btn = $("#legalEntityCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制运营主体行" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>运营主体</h3><p class="muted">主体信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList35() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    const uniq = Array.from(new Set(found)).sort((a, b) => a - b);
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 35;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 35); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（只读）。</p>
      <p class="round-layer-summary"><strong>已加载</strong> round${
        loaded.length ? loaded[0] : "—"
      }…round${loaded.length ? loaded[loaded.length - 1] : "—"}
        · 共 ${loaded.length} 层</p>
      <div class="round-layer-chips" role="list">${loaded
        .map(
          (n) =>
            `<span class="tag round-layer-chip" role="listitem">round${n}</span>`
        )
        .join("")}</div>
      ${
        missing.length
          ? `<p class="muted" style="margin-top:8px">未检测到：${missing
              .map((n) => "round" + n)
              .join("、")}</p>`
          : `<p class="muted" style="margin-top:8px">round6…round35 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeHandProgress().catch(() => {}), 180);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 90);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetDeptCopyButtons().catch(() => {}), 90);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinMemberDaysCopy().catch(() => {}), 80);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressCopy().catch(() => {}), 100);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(() => ensureAftercareStatusCopyButtons().catch(() => {}), 90);
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptTitlesCopy().catch(() => {}), 60);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNameRoleCopyButtons().catch(() => {}), 90);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverGeneratedAtCopy().catch(() => {}), 100);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home") setTimeout(() => paintHomeHandProgress().catch(() => {}), 180);
    if (id === "legacy")
      setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 110);
    if (id === "assets") setTimeout(() => ensureAssetDeptCopyButtons().catch(() => {}), 100);
    if (id === "checkin") setTimeout(() => ensureCheckinMemberDaysCopy().catch(() => {}), 100);
    if (id === "travel") setTimeout(() => ensureTravelProgressCopy().catch(() => {}), 120);
    if (id === "aftercare")
      setTimeout(() => ensureAftercareStatusCopyButtons().catch(() => {}), 110);
    if (id === "authvideo") setTimeout(() => ensureAuthScriptTitlesCopy().catch(() => {}), 80);
    if (id === "heirs") setTimeout(() => ensureHeirNameRoleCopyButtons().catch(() => {}), 100);
    if (id === "handover")
      setTimeout(() => ensureHandoverGeneratedAtCopy().catch(() => {}), 110);
    if (id === "settings") {
      setTimeout(() => {
        paintLegalEntityCopyCard().catch(() => {});
        paintRoundLayerList35();
      }, 150);
      setTimeout(() => {
        paintLegalEntityCopyCard().catch(() => {});
        paintRoundLayerList35();
      }, 480);
    }
  };

  // Boot
  setTimeout(() => paintHomeHandProgress().catch(() => {}), 240);
  setTimeout(() => ensureLegacyTitleActionCopyButtons().catch(() => {}), 260);
  setTimeout(() => ensureAssetDeptCopyButtons().catch(() => {}), 280);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinMemberDaysCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptTitlesCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedAtCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintLegalEntityCopyCard().catch(() => {});
      paintRoundLayerList35();
    }, 170);
  }
})();
