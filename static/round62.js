/* 电子继承 · 第六十二批增量（叠在 round61…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round62SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页会员温和提示条 */
  async function paintHomeMemberGentle() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberGentleBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberGentleBar";
      bar.className = "home-member-gentle-bar";
      bar.setAttribute("role", "status");
      const soft = $("#homeSoftOverdueBar");
      const r60 = $("#homeRound60ReadyBar");
      const pct = $("#homeTravelPctBar");
      if (soft && soft.parentNode === home)
        soft.insertAdjacentElement("afterend", bar);
      else if (r60 && r60.parentNode === home)
        r60.insertAdjacentElement("afterend", bar);
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
      const hint = String(
        (st.user || {}).member_gentle_hint || ""
      ).trim();
      const sub = hint || "会员节奏说明暂不可用";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-gentle-mark">会员</span>
        <span class="muted home-member-gentle-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeMemberGentleGo">去设置</button>`;
      const btn = $("#homeMemberGentleGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-gentle-mark">会员</span>
        <span class="muted home-member-gentle-sub">会员提示暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeMemberGentleGo">去设置</button>`;
      const btn = $("#homeMemberGentleGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+清除照片状态组合复制 */
  async function ensureLegacyIdClearPhotosCopyButtons() {
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
      const on = truthyFlag(it.clear_photos);
      const status = on ? "已勾清除照片" : "未勾清除照片";
      const line = "#" + it.id + " · " + status;
      el.dataset.idClearPhotos = line;
      if (el.querySelector(".lg-copy-id-clear-photos")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-clear-photos";
      btn.textContent = "复制编号与清除照片";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idClearPhotos || "");
        softBanner(ok ? "已复制编号与清除照片" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+账号提示组合复制 */
  async function ensureAssetPlatformHintCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = plat ? plat + " · " + hint : hint;
      el.dataset.platformHint = line;
      if (!line || el.querySelector(".as-copy-platform-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-hint";
      btn.textContent = "复制平台与账号提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformHint || "");
        softBanner(ok ? "已复制平台与账号提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时与冷静期小时 */
  async function ensureCheckinHoursGraceHoursCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursGraceHoursCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursGraceHoursCopyCard";
      card.className = "checkin-hours-grace-hours-copy";
      const hoursAgo = $("#checkinHoursAgoCopyCard");
      const lastNext = $("#checkinLastNextLabelCopyCard");
      const inGrace = $("#checkinInGraceStatusCopyCard");
      if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (inGrace && inGrace.parentNode)
        inGrace.insertAdjacentElement("afterend", card);
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
      const hours = cd.hours_remaining;
      let grace = cd.grace_hours;
      if (grace == null) grace = user.grace_hours;
      if (hours == null && grace == null) {
        card.innerHTML = `<p class="muted">剩余小时与冷静期暂不可用</p>`;
        return;
      }
      const hoursPart =
        hours == null ? "—" : String(Math.round(Number(hours) * 100) / 100);
      const gracePart =
        grace == null ? "—" : String(Math.round(Number(grace) * 100) / 100);
      const combo = hoursPart + " · " + gracePart;
      const line =
        "剩余小时 · 冷静期小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-grace-hours-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursGraceHoursCopyBtn">复制剩余小时与冷静小时</button>`;
      const btn = $("#checkinHoursGraceHoursCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余小时与冷静小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余小时与冷静期暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近流水编号+备注组合复制 */
  async function ensureTravelLedgerIdNoteCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLedgerIdNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLedgerIdNoteCopyCard";
      card.className = "travel-ledger-id-note-copy";
      const shortfall = $("#travelShortfallMeetsCopyCard");
      const thrPct = $("#travelThrPctCopyCard");
      const idKind = $("#travelLedgerIdKindCopyCard");
      if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (thrPct && thrPct.parentNode)
        thrPct.insertAdjacentElement("afterend", card);
      else if (idKind && idKind.parentNode)
        idKind.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const ledger = data.ledger || [];
      if (!ledger.length) {
        card.innerHTML = `<p class="muted">流水编号与备注暂不可用</p>`;
        return;
      }
      const row = ledger[0] || {};
      const id = row.id;
      const note = String(row.note || "").trim() || "无备注";
      if (id == null) {
        card.innerHTML = `<p class="muted">流水编号与备注暂不可用</p>`;
        return;
      }
      const combo = "#" + id + " · " + note;
      const line = "差旅流水 · " + combo;
      card.innerHTML = `<p class="muted travel-ledger-id-note-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLedgerIdNoteCopyBtn">复制流水编号与备注</button>`;
      const btn = $("#travelLedgerIdNoteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制流水编号与备注" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">流水编号与备注暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+协作状态组合复制 */
  async function ensureAftercareCityCoopCopyButtons() {
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
      const city = String(it.city || "").trim();
      const coop = String(it.coop_state || "").trim();
      const line = city && coop ? city + " · " + coop : city || coop;
      el.dataset.cityCoop = line;
      if (!line || el.querySelector(".ac-copy-city-coop")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-coop";
      btn.textContent = "复制城市与协作";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityCoop || "");
        softBanner(ok ? "已复制城市与协作" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪与齐备文案组合复制 */
  async function ensureAuthReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteCopyCard";
      card.className = "av-ready-complete-copy";
      const orig = $("#avOrigStatusCopyCard");
      const doneTotal = $("#avDoneTotalCopyCard");
      const fn = $("#avFilenamePlainCopyCard");
      if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else if (doneTotal && doneTotal.parentNode)
        doneTotal.insertAdjacentElement("afterend", card);
      else if (fn && fn.parentNode)
        fn.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = !!data.ready;
      const label = String(data.complete_label || "").trim();
      const readyPart = ready ? "已就绪" : "未就绪";
      const combo = label ? readyPart + " · " + label : readyPart;
      const line = "授权视频就绪 · 齐备 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteCopyBtn">复制就绪与齐备</button>`;
      const btn = $("#avReadyCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪与齐备" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪与齐备暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+备注组合复制 */
  async function ensureHeirContactNoteCopyButtons() {
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
      const contact = String(it.contact || "").trim();
      const note = String(it.note || "").trim() || "无备注";
      const line = contact ? contact + " · " + note : note;
      if (!line || el.querySelector(".bn-copy-contact-note")) return;
      el.dataset.contactNote = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-note";
      btn.textContent = "复制联系与备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNote || "");
        softBanner(ok ? "已复制联系与备注" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册转赠与清除条数组合复制 */
  async function ensureHandoverGiftClearCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGiftClearCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGiftClearCopyCard";
      card.className = "hand-gift-clear-copy";
      const filled = $("#handFilledTotalTypesCopyCard");
      const pctItems = $("#handPctTotalItemsCopyCard");
      const clear = $("#handClearCountNumCopyCard");
      if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else if (pctItems && pctItems.parentNode)
        pctItems.insertAdjacentElement("afterend", card);
      else if (clear && clear.parentNode)
        clear.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const counts = (data.progress || {}).action_counts || {};
      if (counts.gift == null && counts.clear == null) {
        card.innerHTML = `<p class="muted">转赠与清除条数暂不可用</p>`;
        return;
      }
      const gift =
        counts.gift == null ? "—" : String(Math.round(Number(counts.gift)));
      const clearN =
        counts.clear == null ? "—" : String(Math.round(Number(counts.clear)));
      const combo = gift + " · " + clearN;
      const line = "手册转赠 · 清除 · " + combo;
      card.innerHTML = `<p class="muted hand-gift-clear-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGiftClearCopyBtn">复制转赠与清除</button>`;
      const btn = $("#handGiftClearCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制转赠与清除" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">转赠与清除暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪状态+域名组合复制 + round 层含 62 */
  async function paintHealthOkDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#healthOkDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "healthOkDomainCopyCard";
      card.className = "card health-ok-domain-copy-card";
      const appBrand = $("#appBrandEnCopyCard");
      const r60 = $("#round60RangeCopyCard");
      const serverApp = $("#serverAppVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (r60 && r60.parentNode)
        r60.insertAdjacentElement("beforebegin", card);
      else if (serverApp && serverApp.parentNode)
        serverApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = h.ok === true ? "ok" : h.ok === false ? "not-ok" : "—";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = okPart + " · " + domain;
      card.innerHTML = `<h3>就绪与域名</h3>
        <p class="muted">一键复制就绪状态与域名（演示级）。</p>
        <p class="health-ok-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="healthOkDomainCopyBtn">复制就绪与域名</button>`;
      const btn = $("#healthOkDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList62() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 62;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 62); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round62 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMemberGentle().catch(() => {}), 450);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdClearPhotosCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformHintCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinHoursGraceHoursCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLedgerIdNoteCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityCoopCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthReadyCompleteCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirContactNoteCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverGiftClearCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeMemberGentle().catch(() => {}), 450);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdClearPhotosCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformHintCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinHoursGraceHoursCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelLedgerIdNoteCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityCoopCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthReadyCompleteCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirContactNoteCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(() => ensureHandoverGiftClearCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintHealthOkDomainCopyCard().catch(() => {});
        paintRoundLayerList62();
      }, 400);
      setTimeout(() => {
        paintHealthOkDomainCopyCard().catch(() => {});
        paintRoundLayerList62();
      }, 980);
    }
  };

  setTimeout(() => paintHomeMemberGentle().catch(() => {}), 500);
  setTimeout(() => ensureLegacyIdClearPhotosCopyButtons().catch(() => {}), 520);
  setTimeout(() => ensureAssetPlatformHintCopyButtons().catch(() => {}), 540);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursGraceHoursCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLedgerIdNoteCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityCoopCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNoteCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGiftClearCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintHealthOkDomainCopyCard().catch(() => {});
      paintRoundLayerList62();
    }, 420);
  }
})();
