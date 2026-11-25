/* 电子继承 · 第四十四批增量（叠在 round43…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round44SoftBanner_" + (hostId || "home");
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

  function deptLabel(dept) {
    const shortMap = typeof DEPT_SHORT === "object" ? DEPT_SHORT : {};
    const nameMap = typeof DEPT_NAME === "object" ? DEPT_NAME : {};
    const fallback = {
      production: "生产部",
      finance: "财务部",
      ip: "知识产权部",
      admin: "行政部",
      hr: "人事部",
    };
    return (
      shortMap[dept] || nameMap[dept] || fallback[dept] || String(dept || "")
    );
  }

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
  }

  function overdueCalmLine(user) {
    const u = user || {};
    if (u.checkin_overdue) return "报备节奏 · 可留意补报一次";
    if (u.checkin_soft_overdue) return "报备节奏 · 可留意一下时间";
    if (u.checkin_in_grace) return "报备节奏 · 宽限期内按自己节奏即可";
    return "报备节奏 · 正常";
  }

  /* 1 · 首页手册处置种类覆盖一句 */
  async function paintHomeHandoverActionCover() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHandoverActionCoverBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHandoverActionCoverBar";
      bar.className = "home-handover-action-cover-bar";
      bar.setAttribute("role", "status");
      const counts = $("#homeCountsSummaryBar");
      const audit = $("#homeAuditCountBar");
      const ex = $("#homeExecutorLeadsBar");
      if (counts && counts.parentNode === home)
        counts.insertAdjacentElement("afterend", bar);
      else if (audit && audit.parentNode === home)
        audit.insertAdjacentElement("afterend", bar);
      else if (ex && ex.parentNode === home)
        ex.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/handover").catch(() => ({}));
      const prog = data.progress || {};
      const filled = Number(prog.filled_types != null ? prog.filled_types : 0);
      const total = Number(prog.total_types != null ? prog.total_types : 4) || 4;
      bar.hidden = false;
      if (!filled) {
        bar.innerHTML = `<span class="home-handover-action-mark">手册处置</span>
          <span class="muted home-handover-action-sub">处置种类还可慢慢补 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeHandoverActionGo">去手册</button>`;
      } else {
        bar.innerHTML = `<span class="home-handover-action-mark">手册处置</span>
          <span class="muted home-handover-action-sub">处置种类已覆盖 ${filled}/${total} · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeHandoverActionGo">去手册</button>`;
      }
      const btn = $("#homeHandoverActionGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割类别+部门组合复制 */
  async function ensureLegacyCatDeptCopyButtons() {
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
      if (!it) return;
      const cat = String(it.category || "").trim();
      const dept = deptLabel(it.dept);
      const line = cat && dept ? cat + " · " + dept : cat || dept;
      el.dataset.catDept = line;
      if (!line || el.querySelector(".lg-copy-cat-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-cat-dept";
      btn.textContent = "复制类别与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.catDept || "");
        softBanner(ok ? "已复制类别与部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+平台组合复制 */
  async function ensureAssetVisPlatformCopyButtons() {
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
      if (!it) return;
      const vis = visibilityLabel(it.visibility);
      const platform = String(it.platform || "").trim();
      const line =
        vis && platform ? vis + " · " + platform : vis || platform;
      el.dataset.visPlatform = line;
      if (!line || el.querySelector(".as-copy-vis-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-vis-platform";
      btn.textContent = "复制可见性与平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visPlatform || "");
        softBanner(ok ? "已复制可见性与平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制逾时冷静句 */
  async function ensureCheckinOverdueCalmCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinOverdueCalmCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinOverdueCalmCopyCard";
      card.className = "checkin-overdue-calm-copy";
      const backup = $("#checkinBackupFirstCopyCard");
      const escCard = $("#checkinEscalationCopyCard");
      const until = $("#checkinMemberUntilCopyCard");
      if (backup && backup.parentNode)
        backup.insertAdjacentElement("afterend", card);
      else if (escCard && escCard.parentNode)
        escCard.insertAdjacentElement("afterend", card);
      else if (until && until.parentNode)
        until.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const line =
        overdueCalmLine(st.user) + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-overdue-calm-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinOverdueCalmCopyBtn">复制逾时说明</button>`;
      const btn = $("#checkinOverdueCalmCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制逾时说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">逾时说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比纯数字一键复制 */
  async function ensureTravelProgressPctNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctNumCopyCard";
      card.className = "travel-progress-pct-num-copy";
      const ref = $("#travelAftercareRefCopyCard");
      const thr = $("#travelThresholdNumCopyCard");
      const lid = $("#travelLatestIdCopyCard");
      if (ref && ref.parentNode) ref.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode)
        thr.insertAdjacentElement("afterend", card);
      else if (lid && lid.parentNode)
        lid.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct = Number(
        fund.progress_pct != null ? fund.progress_pct : fund.met ? 100 : 0
      );
      const num = String(Math.round(pct));
      const line = "差旅进度百分比数字 · " + num;
      card.innerHTML = `<p class="muted travel-progress-pct-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctNumCopyBtn">复制进度数字</button>`;
      const btn = $("#travelProgressPctNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制进度数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度数字暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段+状态组合复制 */
  async function ensureAftercarePhaseStatusCopyButtons() {
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
      if (!it) return;
      const phase = String(it.phase_label || "").trim();
      const status = String(it.status_label || "").trim();
      const line =
        phase && status ? phase + " · " + status : phase || status;
      el.dataset.phaseStatus = line;
      if (!line || el.querySelector(".ac-copy-phase-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-status";
      btn.textContent = "复制阶段与状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseStatus || "");
        softBanner(ok ? "已复制阶段与状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效标签一键复制 */
  async function ensureAuthActiveLabelCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveLabelCopyCard";
      card.className = "av-active-label-copy";
      const orig = $("#avOriginalNameCopyCard");
      const fnId = $("#avFilenameIdCopyCard");
      const miss = $("#avMissingTextCopyCard");
      if (orig && orig.parentNode) orig.insertAdjacentElement("afterend", card);
      else if (fnId && fnId.parentNode)
        fnId.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const items = data.items || [];
      const active =
        (typeof data.current_active === "object" && data.current_active) ||
        data.latest ||
        items.find((it) => it.current_active) ||
        items[0] ||
        null;
      const label = active
        ? String(active.active_label || (active.current_active ? "当前生效" : ""))
            .trim()
        : "";
      if (!label) {
        card.innerHTML = `<p class="muted">暂无生效标签</p>`;
        return;
      }
      const line = "授权视频生效标签 · " + label;
      card.innerHTML = `<p class="muted av-active-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avActiveLabelCopyBtn">复制生效标签</button>`;
      const btn = $("#avActiveLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制生效标签" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效标签暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+关系组合复制 */
  async function ensureHeirRoleRelationCopyButtons() {
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
      const role = roleLabel(it.role);
      const relation = String(it.relation || "").trim();
      const line =
        role && relation ? role + " · " + relation : role || relation;
      el.dataset.roleRelation = line;
      if (!line || el.querySelector(".bn-copy-role-relation")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-relation";
      btn.textContent = "复制角色与关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleRelation || "");
        softBanner(ok ? "已复制角色与关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册各部门条数摘要一键复制 */
  async function ensureHandoverByDeptCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handByDeptCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handByDeptCopyCard";
      card.className = "hand-by-dept-copy";
      const member = $("#handMemberStatusCopyCard");
      const exportDom = $("#handExportDomainCopyCard");
      const domain = $("#handDomainOnlyCopyCard");
      if (member && member.parentNode)
        member.insertAdjacentElement("afterend", card);
      else if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (domain && domain.parentNode)
        domain.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const depts = data.by_dept || [];
      const parts = depts.map((d) => {
        const short = String(d.short || d.name || d.id || "").trim();
        const n = Number(d.count != null ? d.count : 0);
        return short + " " + n;
      });
      const line = parts.length
        ? parts.join(" · ")
        : "各部门条数暂无数据";
      card.innerHTML = `<p class="muted hand-by-dept-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handByDeptCopyBtn"${
          parts.length ? "" : " disabled"
        }>复制各部门条数</button>`;
      const btn = $("#handByDeptCopyBtn");
      if (btn && parts.length) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制各部门条数" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">各部门条数暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制中文品牌+英文品牌+域名 + round 层含 44 */
  async function paintCnEnDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#cnEnDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "cnEnDomainCopyCard";
      card.className = "card cn-en-domain-copy-card";
      const enDom = $("#enDomainServerCopyCard");
      const serverApp = $("#serverAppCopyCard");
      const adv = $("#appDomainVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (adv && adv.parentNode)
        adv.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = h.app || "电子继承 App";
      const en = h.brand_en || "E-Inherit";
      const domain = h.domain || "einherit.cn";
      const line = app + " · " + en + " · " + domain;
      card.innerHTML = `<h3>中文品牌 · 英文品牌 · 域名</h3>
        <p class="muted">一键复制中英品牌 + 域名（演示级）。</p>
        <p class="cn-en-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="cnEnDomainCopyBtn">复制中英品牌与域名</button>`;
      const btn = $("#cnEnDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制中英品牌与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 英文品牌 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList44() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 44;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 44); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round44 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeHandoverActionCover().catch(() => {}), 270);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyCatDeptCopyButtons().catch(() => {}), 180);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetVisPlatformCopyButtons().catch(() => {}), 180);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinOverdueCalmCopy().catch(() => {}), 170);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressPctNumCopy().catch(() => {}), 190);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseStatusCopyButtons().catch(() => {}),
      180
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveLabelCopy().catch(() => {}), 150);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleRelationCopyButtons().catch(() => {}), 180);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverByDeptCopy().catch(() => {}), 190);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeHandoverActionCover().catch(() => {}), 270);
    if (id === "legacy")
      setTimeout(() => ensureLegacyCatDeptCopyButtons().catch(() => {}), 200);
    if (id === "assets")
      setTimeout(() => ensureAssetVisPlatformCopyButtons().catch(() => {}), 190);
    if (id === "checkin")
      setTimeout(() => ensureCheckinOverdueCalmCopy().catch(() => {}), 190);
    if (id === "travel")
      setTimeout(() => ensureTravelProgressPctNumCopy().catch(() => {}), 210);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseStatusCopyButtons().catch(() => {}),
        200
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveLabelCopy().catch(() => {}), 170);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleRelationCopyButtons().catch(() => {}), 190);
    if (id === "handover")
      setTimeout(() => ensureHandoverByDeptCopy().catch(() => {}), 200);
    if (id === "settings") {
      setTimeout(() => {
        paintCnEnDomainCopyCard().catch(() => {});
        paintRoundLayerList44();
      }, 240);
      setTimeout(() => {
        paintCnEnDomainCopyCard().catch(() => {});
        paintRoundLayerList44();
      }, 660);
    }
  };

  // Boot
  setTimeout(() => paintHomeHandoverActionCover().catch(() => {}), 330);
  setTimeout(() => ensureLegacyCatDeptCopyButtons().catch(() => {}), 350);
  setTimeout(() => ensureAssetVisPlatformCopyButtons().catch(() => {}), 370);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinOverdueCalmCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveLabelCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverByDeptCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintCnEnDomainCopyCard().catch(() => {});
      paintRoundLayerList44();
    }, 260);
  }
})();
