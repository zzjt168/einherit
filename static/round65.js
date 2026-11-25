/* 电子继承 · 第六十五批增量（叠在 round64…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round65SoftBanner_" + (hostId || "home");
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

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
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

  /* 1 · 首页会员有效冷静条 */
  async function paintHomeIsMember() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeIsMemberBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeIsMemberBar";
      bar.className = "home-is-member-bar";
      bar.setAttribute("role", "status");
      const days = $("#homeMemberDaysLeftBar");
      const escBar = $("#homeEscalationBar");
      const gentle = $("#homeMemberGentleBar");
      if (days && days.parentNode === home)
        days.insertAdjacentElement("afterend", bar);
      else if (escBar && escBar.parentNode === home)
        escBar.insertAdjacentElement("afterend", bar);
      else if (gentle && gentle.parentNode === home)
        gentle.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const member = !!(st.user || {}).is_member;
      const sub = member ? "会员 · 目前有效" : "会员 · 演示未开通";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-is-member-mark">会员</span>
        <span class="muted home-is-member-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeIsMemberGo">去设置</button>`;
      const btn = $("#homeIsMemberGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-is-member-mark">会员</span>
        <span class="muted home-is-member-sub">会员状态暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeIsMemberGo">去设置</button>`;
      const btn = $("#homeIsMemberGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+部门组合复制 */
  async function ensureLegacyNotesDeptCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const dept = deptLabel(it.dept);
      const line = dept ? notes + " · " + dept : notes;
      el.dataset.notesDept = line;
      if (el.querySelector(".lg-copy-notes-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-dept";
      btn.textContent = "复制交割备注与部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesDept || "");
        softBanner(ok ? "已复制交割备注与部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性组合复制 */
  async function ensureAssetSummaryVisCopyButtons() {
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
      const summary = String(it.summary || "").trim();
      const vis = visibilityLabel(it.visibility);
      const line = summary && vis ? summary + " · " + vis : summary || vis;
      el.dataset.summaryVis = line;
      if (!line || el.querySelector(".as-copy-summary-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-vis";
      btn.textContent = "复制摘要与可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryVis || "");
        softBanner(ok ? "已复制摘要与可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距今文案与已过小时 */
  async function ensureCheckinLastAgoHoursSinceCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoHoursSinceCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoHoursSinceCopyCard";
      card.className = "checkin-last-ago-hours-since-copy";
      const interval = $("#checkinIntervalGraceNumCopyCard");
      const dual = $("#checkinDualSecondsCopyCard");
      const hoursGrace = $("#checkinHoursGraceHoursCopyCard");
      if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (dual && dual.parentNode)
        dual.insertAdjacentElement("afterend", card);
      else if (hoursGrace && hoursGrace.parentNode)
        hoursGrace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const ago = String(cd.last_ago_label || "").trim();
      const since = cd.hours_since_last;
      if (!ago && since == null) {
        card.innerHTML = `<p class="muted">距今与已过小时暂不可用</p>`;
        return;
      }
      const sincePart =
        since == null
          ? "—"
          : String(Math.round(Number(since) * 100) / 100);
      const combo = ago ? ago + " · " + sincePart : sincePart;
      const line =
        "距今 · 已过小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-hours-since-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoHoursSinceCopyBtn">复制距今与已过小时</button>`;
      const btn = $("#checkinLastAgoHoursSinceCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距今与已过小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距今与已过小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度文案与百分比组合复制 */
  async function ensureTravelProgressLabelPctCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressLabelPctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressLabelPctCopyCard";
      card.className = "travel-progress-label-pct-copy";
      const refund = $("#travelRefundIdAmountCopyCard");
      const balShort = $("#travelBalanceShortfallCopyCard");
      const thrPct = $("#travelThrPctCopyCard");
      if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
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
      let pct = fund.progress_pct;
      if (pct == null && fund.threshold) {
        const bal = Number(fund.balance || 0);
        const thr = Number(fund.threshold) || 1;
        pct = Math.min(100, Math.round((bal / thr) * 100));
      }
      if (!label && pct == null) {
        card.innerHTML = `<p class="muted">进度文案与百分比暂不可用</p>`;
        return;
      }
      const pctPart =
        pct == null ? "—" : String(Math.round(Number(pct)));
      const combo = label ? label + " · " + pctPart : pctPart;
      const line = "差旅进度 · " + combo;
      card.innerHTML = `<p class="muted travel-progress-label-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressLabelPctCopyBtn">复制进度文案与百分比</button>`;
      const btn = $("#travelProgressLabelPctCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度文案与百分比" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度文案与百分比暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+阶段文案组合复制 */
  async function ensureAftercareServicePhaseCopyButtons() {
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
      const svc = String(it.service_type || "").trim();
      const phase = String(it.phase_label || it.phase_key || "").trim();
      const line = svc && phase ? svc + " · " + phase : svc || phase;
      el.dataset.servicePhase = line;
      if (!line || el.querySelector(".ac-copy-service-phase")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-phase";
      btn.textContent = "复制服务类型与阶段";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.servicePhase || "");
        softBanner(ok ? "已复制服务类型与阶段" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频准入提示复制 */
  async function ensureAuthGateCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateCopyCard";
      card.className = "av-gate-copy";
      const keys = $("#avChecklistDoneKeysCopyCard");
      const active = $("#avActiveLabelStatusCopyCard");
      const ready = $("#avReadyCompleteCopyCard");
      if (keys && keys.parentNode)
        keys.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (ready && ready.parentNode)
        ready.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim();
      if (!gate) {
        card.innerHTML = `<p class="muted">准入提示暂不可用</p>`;
        return;
      }
      card.innerHTML = `<p class="muted av-gate-copy-line">${esc(gate)}</p>
        <button type="button" class="btn ghost sm" id="avGateCopyBtn">复制准入提示</button>`;
      const btn = $("#avGateCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(gate);
          softBanner(ok ? "已复制准入提示" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">准入提示暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+口令提示组合复制 */
  async function ensureHeirNamePassphraseCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = name ? name + " · " + hint : hint;
      if (!line || el.querySelector(".bn-copy-name-passphrase")) return;
      el.dataset.namePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-passphrase";
      btn.textContent = "复制姓名与口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.namePassphrase || "");
        softBanner(ok ? "已复制姓名与口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+执行人组合复制 */
  async function ensureHandoverDomainExecutorCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainExecutorCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainExecutorCopyCard";
      card.className = "hand-domain-executor-copy";
      const bene = $("#handBeneCountItemCopyCard");
      const destroy = $("#handDestroySaleCopyCard");
      const gift = $("#handGiftClearCopyCard");
      if (bene && bene.parentNode)
        bene.insertAdjacentElement("afterend", card);
      else if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "").trim();
      const executor = String(data.executor || "").trim();
      if (!domain && !executor) {
        card.innerHTML = `<p class="muted">域名与执行人暂不可用</p>`;
        return;
      }
      const combo =
        domain && executor ? domain + " · " + executor : domain || executor;
      const line = "手册域名 · 执行人 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-executor-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainExecutorCopyBtn">复制域名与执行人</button>`;
      const btn = $("#handDomainExecutorCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名与执行人" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名与执行人暂不可用</p>`;
    }
  }

  /* 10 · 设置·服务端版本+域名组合复制 + round 层含 65 */
  async function paintServerVersionDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverVersionDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverVersionDomainCopyCard";
      card.className = "card server-version-domain-copy-card";
      const appDomain = $("#appDomainCopyCard");
      const verBrand = $("#versionBrandEnCopyCard");
      const okDomain = $("#healthOkDomainCopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDomain && appDomain.parentNode)
        appDomain.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (okDomain && okDomain.parentNode)
        okDomain.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const sv = String(h.server_version || "EInherit/0.5").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = sv + " · " + domain;
      card.innerHTML = `<h3>服务端与域名</h3>
        <p class="muted">一键复制服务端版本与域名（演示级）。</p>
        <p class="server-version-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverVersionDomainCopyBtn">复制服务端与域名</button>`;
      const btn = $("#serverVersionDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务端与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList65() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 65;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 65); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round65 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeIsMember().catch(() => {}), 480);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesDeptCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryVisCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoHoursSinceCopy().catch(() => {}),
      330
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelProgressLabelPctCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServicePhaseCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNamePassphraseCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverDomainExecutorCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeIsMember().catch(() => {}), 480);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyNotesDeptCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryVisCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoHoursSinceCopy().catch(() => {}),
        350
      );
    if (id === "travel")
      setTimeout(() => ensureTravelProgressLabelPctCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServicePhaseCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNamePassphraseCopyButtons().catch(() => {}),
        350
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverDomainExecutorCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintServerVersionDomainCopyCard().catch(() => {});
        paintRoundLayerList65();
      }, 400);
      setTimeout(() => {
        paintServerVersionDomainCopyCard().catch(() => {});
        paintRoundLayerList65();
      }, 980);
    }
  };

  setTimeout(() => paintHomeIsMember().catch(() => {}), 530);
  setTimeout(() => ensureLegacyNotesDeptCopyButtons().catch(() => {}), 550);
  setTimeout(() => ensureAssetSummaryVisCopyButtons().catch(() => {}), 570);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoHoursSinceCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressLabelPctCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServicePhaseCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainExecutorCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerVersionDomainCopyCard().catch(() => {});
      paintRoundLayerList65();
    }, 420);
  }
})();
