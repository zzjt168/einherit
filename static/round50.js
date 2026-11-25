/* 电子继承 · 第五十批增量（里程碑；叠在 round49…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round50SoftBanner_" + (hostId || "home");
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

  function collectRoundLayers() {
    const scripts = Array.from(document.querySelectorAll("script[src]"));
    const found = [];
    scripts.forEach((s) => {
      const src = s.getAttribute("src") || "";
      const m = src.match(/round(\d+)\.js/i);
      if (m) found.push(Number(m[1]));
    });
    return Array.from(new Set(found)).sort((a, b) => a - b);
  }

  /* 1 · 首页五十批体验层就绪一句 */
  function paintHomeRound50Ready() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeRound50ReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeRound50ReadyBar";
      bar.className = "home-round50-ready-bar";
      bar.setAttribute("role", "status");
      const health = $("#homeHealthReadyBar");
      const items = $("#homeHandoverItemsBar");
      const filled = $("#homeLegacyFilledBar");
      if (health && health.parentNode === home)
        health.insertAdjacentElement("afterend", bar);
      else if (items && items.parentNode === home)
        items.insertAdjacentElement("afterend", bar);
      else if (filled && filled.parentNode === home)
        filled.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    const layers = collectRoundLayers();
    const has50 = layers.indexOf(50) >= 0;
    bar.hidden = false;
    if (has50) {
      bar.innerHTML = `<span class="home-round50-ready-mark">体验层</span>
        <span class="muted home-round50-ready-sub">round6…round50 已就绪 · 五十批里程碑</span>
        <button type="button" class="btn ghost sm" id="homeRound50ReadyGo">去设置</button>`;
    } else {
      bar.innerHTML = `<span class="home-round50-ready-mark">体验层</span>
        <span class="muted home-round50-ready-sub">五十批脚本待挂载 · 可去设置查看</span>
        <button type="button" class="btn ghost sm" id="homeRound50ReadyGo">去设置</button>`;
    }
    const btn = $("#homeRound50ReadyGo");
    if (btn) {
      btn.onclick = () => {
        if (typeof show === "function") show("settings");
      };
    }
  }

  /* 2 · 交割编号+类别组合复制 */
  async function ensureLegacyIdCategoryCopyButtons() {
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
      if (!it || it.id == null) return;
      const cat = String(it.category || "").trim();
      const line = cat ? "#" + it.id + " · " + cat : "#" + it.id;
      el.dataset.idCategory = line;
      if (el.querySelector(".lg-copy-id-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-category";
      btn.textContent = "复制编号与类别";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idCategory || "");
        softBanner(ok ? "已复制编号与类别" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+部门组合复制 */
  async function ensureAssetPlatformDeptCopyButtons() {
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
      const platform = String(it.platform || "").trim();
      const dept = deptLabel(it.dept);
      const line =
        platform && dept ? platform + " · " + dept : platform || dept;
      el.dataset.platformDept = line;
      if (!line || el.querySelector(".as-copy-platform-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-dept";
      btn.textContent = "复制平台与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformDept || "");
        softBanner(ok ? "已复制平台与部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制冷静期小时纯数字 */
  async function ensureCheckinGraceHoursNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursNumCopyCard";
      card.className = "checkin-grace-hours-num-copy";
      const hoursRem = $("#checkinHoursRemainingNumCopyCard");
      const next = $("#checkinNextSuggestedCopyCard");
      const cd = $("#checkinCountdownLabelCopyCard");
      if (hoursRem && hoursRem.parentNode)
        hoursRem.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const user = st.user || {};
      const cd = st.countdown || {};
      const raw =
        user.grace_hours != null
          ? user.grace_hours
          : cd.grace_hours != null
            ? cd.grace_hours
            : null;
      if (raw == null) {
        card.innerHTML = `<p class="muted">冷静期小时暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(raw)));
      const line =
        "报备冷静期小时数字 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursNumCopyBtn">复制冷静期小时</button>`;
      const btn = $("#checkinGraceHoursNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制冷静期小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">冷静期小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度文案一键复制 */
  async function ensureTravelProgressLabelCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressLabelCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressLabelCopyCard";
      card.className = "travel-progress-label-copy";
      const amt = $("#travelLastRefundAmountNumCopyCard");
      const rid = $("#travelLastRefundIdCopyCard");
      const meets = $("#travelMeetsThresholdCopyCard");
      if (amt && amt.parentNode) amt.insertAdjacentElement("afterend", card);
      else if (rid && rid.parentNode)
        rid.insertAdjacentElement("afterend", card);
      else if (meets && meets.parentNode)
        meets.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const label = String(fund.progress_label || "").trim();
      if (!label) {
        card.innerHTML = `<p class="muted">差旅进度文案暂不可用</p>`;
        return;
      }
      const line = "差旅进度 · " + label;
      card.innerHTML = `<p class="muted travel-progress-label-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressLabelCopyBtn">复制进度文案</button>`;
      const btn = $("#travelProgressLabelCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制进度文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+阶段组合复制 */
  async function ensureAftercareTitlePhaseCopyButtons() {
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
      const title = String(it.title || "").trim();
      const phase = String(it.phase_label || "").trim();
      const line =
        title && phase ? title + " · " + phase : title || phase;
      el.dataset.titlePhase = line;
      if (!line || el.querySelector(".ac-copy-title-phase")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-phase";
      btn.textContent = "复制标题与阶段";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titlePhase || "");
        softBanner(ok ? "已复制标题与阶段" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频三勾已完成数纯数字一键复制 */
  async function ensureAuthProgressDoneNumCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressDoneNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressDoneNumCopyCard";
      card.className = "av-progress-done-num-copy";
      const h2 = $("#avScriptHint2CopyCard");
      const h1 = $("#avScriptHint1CopyCard");
      const h0 = $("#avScriptHint0CopyCard");
      if (h2 && h2.parentNode) h2.insertAdjacentElement("afterend", card);
      else if (h1 && h1.parentNode)
        h1.insertAdjacentElement("afterend", card);
      else if (h0 && h0.parentNode)
        h0.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      let done = prog.done;
      if (done == null && data.complete) done = 3;
      if (done == null) {
        card.innerHTML = `<p class="muted">三勾完成数暂不可用</p>`;
        return;
      }
      const num = String(Math.round(Number(done)));
      const line = "授权视频三勾已完成数 · " + num;
      card.innerHTML = `<p class="muted av-progress-done-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressDoneNumCopyBtn">复制已完成数</button>`;
      const btn = $("#avProgressDoneNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制已完成数" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已完成数暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+角色组合复制 */
  async function ensureHeirRelationRoleCopyButtons() {
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
      const relation = String(it.relation || "").trim();
      const role = roleLabel(it.role);
      const line =
        relation && role ? relation + " · " + role : relation || role;
      el.dataset.relationRole = line;
      if (!line || el.querySelector(".bn-copy-relation-role")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-role";
      btn.textContent = "复制关系与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationRole || "");
        softBanner(ok ? "已复制关系与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+执行人组合复制 */
  async function ensureHandoverBrandExecutorCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandExecutorCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandExecutorCopyCard";
      card.className = "hand-brand-executor-copy";
      const heirs = $("#handHeirsNamesCopyCard");
      const align = $("#handExportAlignCopyCard");
      const itemN = $("#handItemCountNumCopyCard");
      if (heirs && heirs.parentNode)
        heirs.insertAdjacentElement("afterend", card);
      else if (align && align.parentNode)
        align.insertAdjacentElement("afterend", card);
      else if (itemN && itemN.parentNode)
        itemN.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "E-Inherit 交割手册").trim();
      const executor = String(data.executor || "").trim();
      const line = executor ? brand + " · " + executor : brand;
      card.innerHTML = `<p class="muted hand-brand-executor-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandExecutorCopyBtn">复制品牌与执行人</button>`;
      const btn = $("#handBrandExecutorCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌与执行人" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌与执行人暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制五十批体验层范围 + round 层含 50 */
  function paintRound50RangeCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#round50RangeCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "round50RangeCopyCard";
      card.className = "card round50-range-copy-card";
      const verDom = $("#versionDomainCopyCard");
      const enSv = $("#enServerVersionCopyCard");
      const appDom = $("#appServerDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (enSv && enSv.parentNode)
        enSv.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 50;
    const lo = Math.max(6, from);
    const hi = Math.max(to, 50);
    const expected = [];
    for (let i = lo; i <= hi; i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const line =
      "round" +
      (loaded.length ? loaded[0] : 6) +
      "…round" +
      (loaded.length ? loaded[loaded.length - 1] : 50) +
      " · 共 " +
      loaded.length +
      " 层";
    card.innerHTML = `<h3>五十批体验层范围</h3>
      <p class="muted">一键复制已挂载 round 体验层范围（五十批里程碑 · 演示级）。</p>
      <p class="round50-range-copy-preview">${esc(line)}</p>
      <button type="button" class="btn ghost sm" id="round50RangeCopyBtn">复制体验层范围</button>`;
    const btn = $("#round50RangeCopyBtn");
    if (btn) {
      btn.onclick = async () => {
        const ok = await copyText(line);
        softBanner(ok ? "已复制体验层范围" : "复制未完成", "settings");
        toast(ok ? "已复制" : "未能复制");
      };
    }
  }

  function paintRoundLayerList50() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 50;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 50); i++) expected.push(i);
    const loaded = expected.filter((n) => uniq.indexOf(n) >= 0);
    const missing = expected.filter((n) => uniq.indexOf(n) < 0);
    card.innerHTML = `<h3>版本与体验层</h3>
      <p class="muted">演示诊断：已加载的 round 增量脚本（五十批里程碑 · 只读）。</p>
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
          : `<p class="muted" style="margin-top:8px">round6…round50 均已挂载 · 五十批里程碑。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => {
      try {
        paintHomeRound50Ready();
      } catch (_) {}
    }, 330);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdCategoryCopyButtons().catch(() => {}), 240);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformDeptCopyButtons().catch(() => {}),
      240
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinGraceHoursNumCopy().catch(() => {}), 230);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressLabelCopy().catch(() => {}), 250);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitlePhaseCopyButtons().catch(() => {}),
      240
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressDoneNumCopy().catch(() => {}), 210);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRelationRoleCopyButtons().catch(() => {}), 240);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBrandExecutorCopy().catch(() => {}), 250);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => {
        try {
          paintHomeRound50Ready();
        } catch (_) {}
      }, 330);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdCategoryCopyButtons().catch(() => {}), 260);
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformDeptCopyButtons().catch(() => {}),
        250
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinGraceHoursNumCopy().catch(() => {}), 250);
    if (id === "travel")
      setTimeout(() => ensureTravelProgressLabelCopy().catch(() => {}), 270);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitlePhaseCopyButtons().catch(() => {}),
        260
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthProgressDoneNumCopy().catch(() => {}), 230);
    if (id === "heirs")
      setTimeout(() => ensureHeirRelationRoleCopyButtons().catch(() => {}), 250);
    if (id === "handover")
      setTimeout(() => ensureHandoverBrandExecutorCopy().catch(() => {}), 260);
    if (id === "settings") {
      setTimeout(() => {
        paintRound50RangeCopyCard();
        paintRoundLayerList50();
      }, 300);
      setTimeout(() => {
        paintRound50RangeCopyCard();
        paintRoundLayerList50();
      }, 780);
    }
  };

  // Boot
  setTimeout(() => {
    try {
      paintHomeRound50Ready();
    } catch (_) {}
  }, 390);
  setTimeout(() => ensureLegacyIdCategoryCopyButtons().catch(() => {}), 410);
  setTimeout(() => ensureAssetPlatformDeptCopyButtons().catch(() => {}), 430);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressLabelCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitlePhaseCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressDoneNumCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandExecutorCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintRound50RangeCopyCard();
      paintRoundLayerList50();
    }, 320);
  }
})();
