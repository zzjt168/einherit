/* 电子继承 · 第六十一批增量（叠在 round60…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round61SoftBanner_" + (hostId || "home");
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

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
  }

  function truthyFlag(v) {
    return v === true || v === 1 || v === "1";
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

  /* 1 · 首页报备软逾期冷静状态条 */
  async function paintHomeSoftOverdue() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeSoftOverdueBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeSoftOverdueBar";
      bar.className = "home-soft-overdue-bar";
      bar.setAttribute("role", "status");
      const r60 = $("#homeRound60ReadyBar");
      const pct = $("#homeTravelPctBar");
      const bal = $("#homeTravelBalanceBar");
      if (r60 && r60.parentNode === home)
        r60.insertAdjacentElement("afterend", bar);
      else if (pct && pct.parentNode === home)
        pct.insertAdjacentElement("afterend", bar);
      else if (bal && bal.parentNode === home)
        bal.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const soft = !!(st.user || {}).checkin_soft_overdue;
      const sub = soft
        ? "报备节奏 · 可留意一下时间"
        : "报备节奏 · 目前从容";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-soft-overdue-mark">报备</span>
        <span class="muted home-soft-overdue-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeSoftOverdueGo">去报备</button>`;
      const btn = $("#homeSoftOverdueGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-soft-overdue-mark">报备</span>
        <span class="muted home-soft-overdue-sub">报备节奏暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeSoftOverdueGo">去报备</button>`;
      const btn = $("#homeSoftOverdueGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+清除聊天状态组合复制 */
  async function ensureLegacyIdClearChatsCopyButtons() {
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
      const on = truthyFlag(it.clear_chats);
      const status = on ? "已勾清除聊天" : "未勾清除聊天";
      const line = "#" + it.id + " · " + status;
      el.dataset.idClearChats = line;
      if (el.querySelector(".lg-copy-id-clear-chats")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-clear-chats";
      btn.textContent = "复制编号与清除聊天";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idClearChats || "");
        softBanner(ok ? "已复制编号与清除聊天" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+可见性组合复制 */
  async function ensureAssetPlatformVisCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const line = plat && vis ? plat + " · " + vis : plat || vis;
      el.dataset.platformVis = line;
      if (!line || el.querySelector(".as-copy-platform-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-vis";
      btn.textContent = "复制平台与可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformVis || "");
        softBanner(ok ? "已复制平台与可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时与距今文案 */
  async function ensureCheckinHoursAgoCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursAgoCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursAgoCopyCard";
      card.className = "checkin-hours-ago-copy";
      const lastNext = $("#checkinLastNextLabelCopyCard");
      const inGrace = $("#checkinInGraceStatusCopyCard");
      const due = $("#checkinDueSoonCopyCard");
      if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const hours = cd.hours_remaining;
      const ago = String(cd.last_ago_label || "").trim();
      if (hours == null && !ago) {
        card.innerHTML = `<p class="muted">剩余与距今暂不可用</p>`;
        return;
      }
      const hoursPart =
        hours == null ? "—" : String(Math.round(Number(hours) * 100) / 100);
      const combo = ago ? hoursPart + " · " + ago : hoursPart;
      const line =
        "剩余小时与距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-ago-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursAgoCopyBtn">复制剩余与距今</button>`;
      const btn = $("#checkinHoursAgoCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余与距今" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余与距今暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口与达标状态组合复制 */
  async function ensureTravelShortfallMeetsCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallMeetsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallMeetsCopyCard";
      card.className = "travel-shortfall-meets-copy";
      const thrPct = $("#travelThrPctCopyCard");
      const meets = $("#travelMeetsThresholdCopyCard");
      const shortfall = $("#travelShortfallNumCopyCard");
      if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
      else if (meets && meets.parentNode)
        meets.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      let shortfall = fund.shortfall;
      const meets = !!(fund.meets_threshold || fund.met);
      if (shortfall == null && fund.threshold != null) {
        const bal = Number(fund.balance || 0);
        const thr = Number(fund.threshold) || 0;
        shortfall = Math.max(0, thr - bal);
      }
      if (shortfall == null) {
        card.innerHTML = `<p class="muted">缺口与达标暂不可用</p>`;
        return;
      }
      const status = meets ? "已达标" : "未达标";
      const combo =
        String(Math.round(Number(shortfall))) + " · " + status;
      const line = "差旅缺口 · 达标 · " + combo;
      card.innerHTML = `<p class="muted travel-shortfall-meets-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallMeetsCopyBtn">复制缺口与达标</button>`;
      const btn = $("#travelShortfallMeetsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口与达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口与达标暂不可用</p>`;
    }
  }

  /* 6 · 善后状态键+阶段键组合复制 */
  async function ensureAftercareStatusPhaseKeyCopyButtons() {
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
      const sk = String(it.status_key || "").trim();
      const pk = String(it.phase_key || "").trim();
      const line = sk && pk ? sk + " · " + pk : sk || pk;
      el.dataset.statusPhaseKey = line;
      if (!line || el.querySelector(".ac-copy-status-phase-key")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-phase-key";
      btn.textContent = "复制状态键与阶段键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusPhaseKey || "");
        softBanner(ok ? "已复制状态键与阶段键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频原文件名+状态组合复制 */
  async function ensureAuthOrigStatusCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avOrigStatusCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avOrigStatusCopyCard";
      card.className = "av-orig-status-copy";
      const doneTotal = $("#avDoneTotalCopyCard");
      const fnPlain = $("#avFilenamePlainCopyCard");
      const orig = $("#avOriginalNameCopyCard");
      if (doneTotal && doneTotal.parentNode)
        doneTotal.insertAdjacentElement("afterend", card);
      else if (fnPlain && fnPlain.parentNode)
        fnPlain.insertAdjacentElement("afterend", card);
      else if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const name = String(
        active.original_name || active.filename || ""
      ).trim();
      const status = String(active.status || "").trim();
      if (!name && !status) {
        card.innerHTML = `<p class="muted">原文件名与状态暂不可用</p>`;
        return;
      }
      const combo = name && status ? name + " · " + status : name || status;
      const line = "授权视频原名 · 状态 · " + combo;
      card.innerHTML = `<p class="muted av-orig-status-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avOrigStatusCopyBtn">复制原名与状态</button>`;
      const btn = $("#avOrigStatusCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制原名与状态" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">原名与状态暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+备注组合复制 */
  async function ensureHeirIdNoteCopyButtons() {
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
      const note = String(it.note || "").trim() || "无备注";
      const line = "#" + it.id + " · " + note;
      if (el.querySelector(".bn-copy-id-note")) return;
      el.dataset.idNote = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-note";
      btn.textContent = "复制编号与备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNote || "");
        softBanner(ok ? "已复制编号与备注" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册已填类型与种类总数组合复制 */
  async function ensureHandoverFilledTotalTypesCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handFilledTotalTypesCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handFilledTotalTypesCopyCard";
      card.className = "hand-filled-total-types-copy";
      const pctItems = $("#handPctTotalItemsCopyCard");
      const filled = $("#handFilledTypesNumCopyCard");
      const total = $("#handTotalTypesNumCopyCard");
      if (pctItems && pctItems.parentNode)
        pctItems.insertAdjacentElement("afterend", card);
      else if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else if (total && total.parentNode)
        total.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const filled = prog.filled_types;
      const total = prog.total_types;
      if (filled == null || total == null) {
        card.innerHTML = `<p class="muted">已填与种类总数暂不可用</p>`;
        return;
      }
      const combo =
        String(Math.round(Number(filled))) +
        " · " +
        String(Math.round(Number(total)));
      const line = "手册已填类型 · 种类 · " + combo;
      card.innerHTML = `<p class="muted hand-filled-total-types-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handFilledTotalTypesCopyBtn">复制已填与种类</button>`;
      const btn = $("#handFilledTotalTypesCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已填与种类" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已填与种类暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用中文名+英文品牌组合复制 + round 层含 61 */
  async function paintAppBrandEnCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appBrandEnCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appBrandEnCopyCard";
      card.className = "card app-brand-en-copy-card";
      const r60 = $("#round60RangeCopyCard");
      const serverApp = $("#serverAppVersionCopyCard");
      const domainEn = $("#domainBrandEnCopyCard");
      const roundList = $("#roundLayerListCard");
      if (r60 && r60.parentNode)
        r60.insertAdjacentElement("beforebegin", card);
      else if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (domainEn && domainEn.parentNode)
        domainEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = app + " · " + en;
      card.innerHTML = `<h3>应用名与英文品牌</h3>
        <p class="muted">一键复制应用中文名与英文品牌（演示级）。</p>
        <p class="app-brand-en-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appBrandEnCopyBtn">复制应用名与英文品牌</button>`;
      const btn = $("#appBrandEnCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用名与英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用名与英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList61() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 61;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 61); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round61 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeSoftOverdue().catch(() => {}), 440);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdClearChatsCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformVisCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinHoursAgoCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallMeetsCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusPhaseKeyCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthOrigStatusCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdNoteCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverFilledTotalTypesCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeSoftOverdue().catch(() => {}), 440);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdClearChatsCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformVisCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinHoursAgoCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelShortfallMeetsCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusPhaseKeyCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthOrigStatusCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdNoteCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(
        () => ensureHandoverFilledTotalTypesCopy().catch(() => {}),
        360
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppBrandEnCopyCard().catch(() => {});
        paintRoundLayerList61();
      }, 400);
      setTimeout(() => {
        paintAppBrandEnCopyCard().catch(() => {});
        paintRoundLayerList61();
      }, 980);
    }
  };

  setTimeout(() => paintHomeSoftOverdue().catch(() => {}), 490);
  setTimeout(() => ensureLegacyIdClearChatsCopyButtons().catch(() => {}), 510);
  setTimeout(() => ensureAssetPlatformVisCopyButtons().catch(() => {}), 530);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursAgoCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallMeetsCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusPhaseKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthOrigStatusCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNoteCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverFilledTotalTypesCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppBrandEnCopyCard().catch(() => {});
      paintRoundLayerList61();
    }, 420);
  }
})();
