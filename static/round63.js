/* 电子继承 · 第六十三批增量（叠在 round62…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round63SoftBanner_" + (hostId || "home");
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

  function escalationCalm(raw) {
    const k = String(raw || "").toLowerCase();
    if (k === "ok" || k === "normal" || !k) return "报备节奏 · 目前平稳";
    if (k === "calling" || k === "call") return "报备节奏 · 联络进行中";
    if (k === "backup" || k === "escalated") return "报备节奏 · 已联系备用";
    return "报备节奏 · " + String(raw);
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

  /* 1 · 首页报备升级冷静状态条 */
  async function paintHomeEscalation() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeEscalationBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeEscalationBar";
      bar.className = "home-escalation-bar";
      bar.setAttribute("role", "status");
      const gentle = $("#homeMemberGentleBar");
      const soft = $("#homeSoftOverdueBar");
      const pct = $("#homeTravelPctBar");
      if (gentle && gentle.parentNode === home)
        gentle.insertAdjacentElement("afterend", bar);
      else if (soft && soft.parentNode === home)
        soft.insertAdjacentElement("afterend", bar);
      else if (pct && pct.parentNode === home)
        pct.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.user || {}).escalation_state;
      const sub = escalationCalm(raw);
      bar.hidden = false;
      bar.innerHTML = `<span class="home-escalation-mark">报备</span>
        <span class="muted home-escalation-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeEscalationGo">去报备</button>`;
      const btn = $("#homeEscalationGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-escalation-mark">报备</span>
        <span class="muted home-escalation-sub">报备节奏暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeEscalationGo">去报备</button>`;
      const btn = $("#homeEscalationGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+受益人组合复制 */
  async function ensureLegacyIdBeneficiaryCopyButtons() {
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
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = "#" + it.id + " · " + bene;
      el.dataset.idBeneficiary = line;
      if (el.querySelector(".lg-copy-id-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-beneficiary";
      btn.textContent = "复制编号与受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idBeneficiary || "");
        softBanner(ok ? "已复制编号与受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签组合复制 */
  async function ensureAssetPlatformTagCopyButtons() {
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
      const plat = String(it.platform || "").trim();
      const tag = String(it.tag || "").trim();
      const line = plat && tag ? plat + " · " + tag : plat || tag;
      el.dataset.platformTag = line;
      if (!line || el.querySelector(".as-copy-platform-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag";
      btn.textContent = "复制平台与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTag || "");
        softBanner(ok ? "已复制平台与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制双剩余秒 */
  async function ensureCheckinDualSecondsCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDualSecondsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDualSecondsCopyCard";
      card.className = "checkin-dual-seconds-copy";
      const hoursGrace = $("#checkinHoursGraceHoursCopyCard");
      const hoursAgo = $("#checkinHoursAgoCopyCard");
      const lastNext = $("#checkinLastNextLabelCopyCard");
      if (hoursGrace && hoursGrace.parentNode)
        hoursGrace.insertAdjacentElement("afterend", card);
      else if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const user = st.user || {};
      const sec = cd.seconds_remaining;
      let graceSec = user.grace_remaining_seconds;
      if (graceSec == null) graceSec = cd.grace_remaining_seconds;
      if (sec == null && graceSec == null) {
        card.innerHTML = `<p class="muted">双剩余秒暂不可用</p>`;
        return;
      }
      const secPart =
        sec == null ? "—" : String(Math.round(Number(sec)));
      const gracePart =
        graceSec == null ? "—" : String(Math.round(Number(graceSec)));
      const combo = secPart + " · " + gracePart;
      const line =
        "距建议剩余秒 · 冷静期剩余秒 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-dual-seconds-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDualSecondsCopyBtn">复制双剩余秒</button>`;
      const btn = $("#checkinDualSecondsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制双剩余秒" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">双剩余秒暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与缺口组合复制 */
  async function ensureTravelBalanceShortfallCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallCopyCard";
      card.className = "travel-balance-shortfall-copy";
      const idNote = $("#travelLedgerIdNoteCopyCard");
      const shortfall = $("#travelShortfallMeetsCopyCard");
      const thrPct = $("#travelThrPctCopyCard");
      if (idNote && idNote.parentNode)
        idNote.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
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
      const bal = fund.balance;
      let shortfall = fund.shortfall;
      if (shortfall == null && fund.threshold != null) {
        const b = Number(fund.balance || 0);
        const thr = Number(fund.threshold) || 0;
        shortfall = Math.max(0, thr - b);
      }
      if (bal == null && shortfall == null) {
        card.innerHTML = `<p class="muted">余额与缺口暂不可用</p>`;
        return;
      }
      const balPart =
        bal == null ? "—" : String(Math.round(Number(bal)));
      const shortPart =
        shortfall == null ? "—" : String(Math.round(Number(shortfall)));
      const combo = balPart + " · " + shortPart;
      const line = "差旅余额 · 缺口 · " + combo;
      card.innerHTML = `<p class="muted travel-balance-shortfall-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallCopyBtn">复制余额与缺口</button>`;
      const btn = $("#travelBalanceShortfallCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额与缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额与缺口暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+状态文案组合复制 */
  async function ensureAftercareTitleStatusCopyButtons() {
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
      const status = String(it.status_label || it.status || "").trim();
      const line = title && status ? title + " · " + status : title || status;
      el.dataset.titleStatus = line;
      if (!line || el.querySelector(".ac-copy-title-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-status";
      btn.textContent = "复制标题与状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleStatus || "");
        softBanner(ok ? "已复制标题与状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效标签+状态组合复制 */
  async function ensureAuthActiveLabelStatusCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveLabelStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveLabelStatusCopyCard";
      card.className = "av-active-label-status-copy";
      const ready = $("#avReadyCompleteCopyCard");
      const orig = $("#avOrigStatusCopyCard");
      const done = $("#avDoneTotalCopyCard");
      if (ready && ready.parentNode)
        ready.insertAdjacentElement("afterend", card);
      else if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else if (done && done.parentNode)
        done.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const label = String(
        active.active_label ||
          (active.current_active ? "当前生效" : "")
      ).trim();
      const status = String(active.status || "").trim();
      if (!label && !status) {
        card.innerHTML = `<p class="muted">生效标签与状态暂不可用</p>`;
        return;
      }
      const combo =
        label && status ? label + " · " + status : label || status;
      const line = "授权视频生效 · 状态 · " + combo;
      card.innerHTML = `<p class="muted av-active-label-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avActiveLabelStatusCopyBtn">复制生效标签与状态</button>`;
      const btn = $("#avActiveLabelStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生效标签与状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效标签与状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+口令提示组合复制 */
  async function ensureHeirIdPassphraseCopyButtons() {
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
      if (!it || it.id == null) return;
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = "#" + it.id + " · " + hint;
      if (el.querySelector(".bn-copy-id-passphrase")) return;
      el.dataset.idPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-passphrase";
      btn.textContent = "复制编号与口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPassphrase || "");
        softBanner(ok ? "已复制编号与口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册销毁与变现条数组合复制 */
  async function ensureHandoverDestroySaleCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDestroySaleCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDestroySaleCopyCard";
      card.className = "hand-destroy-sale-copy";
      const gift = $("#handGiftClearCopyCard");
      const filled = $("#handFilledTotalTypesCopyCard");
      const pct = $("#handPctTotalItemsCopyCard");
      if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else if (pct && pct.parentNode)
        pct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const counts = (data.progress || {}).action_counts || {};
      if (counts.destroy == null && counts.sale == null) {
        card.innerHTML = `<p class="muted">销毁与变现条数暂不可用</p>`;
        return;
      }
      const destroy =
        counts.destroy == null
          ? "—"
          : String(Math.round(Number(counts.destroy)));
      const sale =
        counts.sale == null
          ? "—"
          : String(Math.round(Number(counts.sale)));
      const combo = destroy + " · " + sale;
      const line = "手册销毁 · 变现 · " + combo;
      card.innerHTML = `<p class="muted hand-destroy-sale-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDestroySaleCopyBtn">复制销毁与变现</button>`;
      const btn = $("#handDestroySaleCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制销毁与变现" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">销毁与变现暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用版本+英文品牌组合复制 + round 层含 63 */
  async function paintVersionBrandEnCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionBrandEnCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionBrandEnCopyCard";
      card.className = "card version-brand-en-copy-card";
      const okDomain = $("#healthOkDomainCopyCard");
      const appBrand = $("#appBrandEnCopyCard");
      const r60 = $("#round60RangeCopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDomain && okDomain.parentNode)
        okDomain.insertAdjacentElement("beforebegin", card);
      else if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (r60 && r60.parentNode)
        r60.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + en;
      card.innerHTML = `<h3>版本与英文品牌</h3>
        <p class="muted">一键复制应用版本与英文品牌（演示级）。</p>
        <p class="version-brand-en-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionBrandEnCopyBtn">复制版本与英文品牌</button>`;
      const btn = $("#versionBrandEnCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本与英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本与英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList63() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 63;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 63); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round63 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeEscalation().catch(() => {}), 460);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdBeneficiaryCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinDualSecondsCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceShortfallCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleStatusCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveLabelStatusCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdPassphraseCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverDestroySaleCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeEscalation().catch(() => {}), 460);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdBeneficiaryCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinDualSecondsCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelBalanceShortfallCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleStatusCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveLabelStatusCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdPassphraseCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(() => ensureHandoverDestroySaleCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandEnCopyCard().catch(() => {});
        paintRoundLayerList63();
      }, 400);
      setTimeout(() => {
        paintVersionBrandEnCopyCard().catch(() => {});
        paintRoundLayerList63();
      }, 980);
    }
  };

  setTimeout(() => paintHomeEscalation().catch(() => {}), 510);
  setTimeout(() => ensureLegacyIdBeneficiaryCopyButtons().catch(() => {}), 530);
  setTimeout(() => ensureAssetPlatformTagCopyButtons().catch(() => {}), 550);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDualSecondsCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveLabelStatusCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDestroySaleCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandEnCopyCard().catch(() => {});
      paintRoundLayerList63();
    }, 420);
  }
})();
