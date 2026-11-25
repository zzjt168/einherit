/* 电子继承 · 第六十四批增量（叠在 round63…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round64SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页会员剩余天数冷静条 */
  async function paintHomeMemberDaysLeft() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeMemberDaysLeftBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeMemberDaysLeftBar";
      bar.className = "home-member-days-left-bar";
      bar.setAttribute("role", "status");
      const escBar = $("#homeEscalationBar");
      const gentle = $("#homeMemberGentleBar");
      const soft = $("#homeSoftOverdueBar");
      if (escBar && escBar.parentNode === home)
        escBar.insertAdjacentElement("afterend", bar);
      else if (gentle && gentle.parentNode === home)
        gentle.insertAdjacentElement("afterend", bar);
      else if (soft && soft.parentNode === home)
        soft.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const days = (st.user || {}).member_days_left;
      const sub =
        days == null
          ? "会员天数暂不可用"
          : "会员 · 还剩 " + String(Math.round(Number(days))) + " 天";
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-days-left-mark">会员</span>
        <span class="muted home-member-days-left-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeMemberDaysLeftGo">去设置</button>`;
      const btn = $("#homeMemberDaysLeftGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-member-days-left-mark">会员</span>
        <span class="muted home-member-days-left-sub">会员天数暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeMemberDaysLeftGo">去设置</button>`;
      const btn = $("#homeMemberDaysLeftGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割类别+出厂重置状态组合复制 */
  async function ensureLegacyCategoryFactoryCopyButtons() {
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
      const on = truthyFlag(it.factory_reset);
      const status = on ? "已勾出厂重置" : "未勾出厂重置";
      const line = cat ? cat + " · " + status : status;
      el.dataset.categoryFactory = line;
      if (!line || el.querySelector(".lg-copy-category-factory")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-factory";
      btn.textContent = "复制类别与出厂";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryFactory || "");
        softBanner(ok ? "已复制类别与出厂" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置备注+标签组合复制 */
  async function ensureAssetDisposeTagCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const tag = String(it.tag || "").trim();
      const line = tag ? dispose + " · " + tag : dispose;
      el.dataset.disposeTag = line;
      if (el.querySelector(".as-copy-dispose-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-tag";
      btn.textContent = "复制处置备注与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeTag || "");
        softBanner(ok ? "已复制处置备注与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔小时与冷静期小时（配置） */
  async function ensureCheckinIntervalGraceNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalGraceNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalGraceNumCopyCard";
      card.className = "checkin-interval-grace-num-copy";
      const dual = $("#checkinDualSecondsCopyCard");
      const hoursGrace = $("#checkinHoursGraceHoursCopyCard");
      const hoursAgo = $("#checkinHoursAgoCopyCard");
      if (dual && dual.parentNode)
        dual.insertAdjacentElement("afterend", card);
      else if (hoursGrace && hoursGrace.parentNode)
        hoursGrace.insertAdjacentElement("afterend", card);
      else if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
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
      let interval = cd.interval_hours;
      if (interval == null) interval = user.checkin_interval_hours;
      let grace = cd.grace_hours;
      if (grace == null) grace = user.grace_hours;
      if (interval == null && grace == null) {
        card.innerHTML = `<p class="muted">间隔与冷静期小时暂不可用</p>`;
        return;
      }
      const iPart =
        interval == null
          ? "—"
          : String(Math.round(Number(interval) * 100) / 100);
      const gPart =
        grace == null ? "—" : String(Math.round(Number(grace) * 100) / 100);
      const combo = iPart + " · " + gPart;
      const line =
        "报备间隔小时 · 冷静期小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-grace-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalGraceNumCopyBtn">复制间隔小时与冷静小时</button>`;
      const btn = $("#checkinIntervalGraceNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制间隔小时与冷静小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔与冷静期小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近退款编号+金额组合复制 */
  async function ensureTravelRefundIdAmountCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundIdAmountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundIdAmountCopyCard";
      card.className = "travel-refund-id-amount-copy";
      const balShort = $("#travelBalanceShortfallCopyCard");
      const idNote = $("#travelLedgerIdNoteCopyCard");
      const shortfall = $("#travelShortfallMeetsCopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (idNote && idNote.parentNode)
        idNote.insertAdjacentElement("afterend", card);
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
      const refund = fund.last_refund || {};
      if (refund.id == null && refund.amount == null) {
        card.innerHTML = `<p class="muted">退款编号与金额暂不可用</p>`;
        return;
      }
      const idPart =
        refund.id == null ? "—" : "#" + String(refund.id);
      const amtPart =
        refund.amount == null
          ? "—"
          : String(Math.round(Number(refund.amount)));
      const combo = idPart + " · " + amtPart;
      const line = "差旅最近退款 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-refund-id-amount-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundIdAmountCopyBtn">复制退款编号与金额</button>`;
      const btn = $("#travelRefundIdAmountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制退款编号与金额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款编号与金额暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段文案+城市组合复制 */
  async function ensureAftercarePhaseCityCopyButtons() {
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
      const phase = String(it.phase_label || it.phase_key || "").trim();
      const city = String(it.city || "").trim();
      const line = phase && city ? phase + " · " + city : phase || city;
      el.dataset.phaseCity = line;
      if (!line || el.querySelector(".ac-copy-phase-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-city";
      btn.textContent = "复制阶段与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseCity || "");
        softBanner(ok ? "已复制阶段与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单已完成键摘要复制 */
  async function ensureAuthChecklistDoneKeysCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistDoneKeysCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistDoneKeysCopyCard";
      card.className = "av-checklist-done-keys-copy";
      const active = $("#avActiveLabelStatusCopyCard");
      const ready = $("#avReadyCompleteCopyCard");
      const orig = $("#avOrigStatusCopyCard");
      if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (ready && ready.parentNode)
        ready.insertAdjacentElement("afterend", card);
      else if (orig && orig.parentNode)
        orig.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = data.checklist || [];
      const doneKeys = list
        .filter((x) => x && (x.done === true || x.demo_checked === true))
        .map((x) => String(x.key || "").trim())
        .filter(Boolean);
      if (!doneKeys.length) {
        card.innerHTML = `<p class="muted">清单已完成键暂不可用</p>`;
        return;
      }
      const combo = doneKeys.join(" · ");
      const line = "授权视频已完成键 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-done-keys-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistDoneKeysCopyBtn">复制清单键摘要</button>`;
      const btn = $("#avChecklistDoneKeysCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单键摘要" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单键摘要暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+备注组合复制 */
  async function ensureHeirRelationNoteCopyButtons() {
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
      const note = String(it.note || "").trim() || "无备注";
      const line = relation ? relation + " · " + note : note;
      if (!line || el.querySelector(".bn-copy-relation-note")) return;
      el.dataset.relationNote = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-note";
      btn.textContent = "复制关系与备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNote || "");
        softBanner(ok ? "已复制关系与备注" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册受益人数与条目总数组合复制 */
  async function ensureHandoverBeneCountItemCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBeneCountItemCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBeneCountItemCopyCard";
      card.className = "hand-bene-count-item-copy";
      const destroy = $("#handDestroySaleCopyCard");
      const gift = $("#handGiftClearCopyCard");
      const filled = $("#handFilledTotalTypesCopyCard");
      if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else if (gift && gift.parentNode)
        gift.insertAdjacentElement("afterend", card);
      else if (filled && filled.parentNode)
        filled.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      let bene = data.beneficiary_count;
      if (bene == null && Array.isArray(data.heirs)) bene = data.heirs.length;
      let items = data.item_count;
      if (items == null) items = (data.progress || {}).total_items;
      if (bene == null && items == null) {
        card.innerHTML = `<p class="muted">受益人数与条目暂不可用</p>`;
        return;
      }
      const benePart =
        bene == null ? "—" : String(Math.round(Number(bene)));
      const itemPart =
        items == null ? "—" : String(Math.round(Number(items)));
      const combo = benePart + " · " + itemPart;
      const line = "手册受益人 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-bene-count-item-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBeneCountItemCopyBtn">复制受益人数与条目</button>`;
      const btn = $("#handBeneCountItemCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制受益人数与条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">受益人数与条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用中文名+域名组合复制 + round 层含 64 */
  async function paintAppDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainCopyCard";
      card.className = "card app-domain-copy-card";
      const verBrand = $("#versionBrandEnCopyCard");
      const okDomain = $("#healthOkDomainCopyCard");
      const appBrand = $("#appBrandEnCopyCard");
      const roundList = $("#roundLayerListCard");
      if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (okDomain && okDomain.parentNode)
        okDomain.insertAdjacentElement("beforebegin", card);
      else if (appBrand && appBrand.parentNode)
        appBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = app + " · " + domain;
      card.innerHTML = `<h3>应用名与域名</h3>
        <p class="muted">一键复制应用中文名与域名（演示级）。</p>
        <p class="app-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainCopyBtn">复制应用与域名</button>`;
      const btn = $("#appDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用名与域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList64() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 64;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 64); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round64 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeMemberDaysLeft().catch(() => {}), 470);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyCategoryFactoryCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposeTagCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinIntervalGraceNumCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundIdAmountCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseCityCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthChecklistDoneKeysCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRelationNoteCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBeneCountItemCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeMemberDaysLeft().catch(() => {}), 470);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyCategoryFactoryCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposeTagCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinIntervalGraceNumCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelRefundIdAmountCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseCityCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthChecklistDoneKeysCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirRelationNoteCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(() => ensureHandoverBeneCountItemCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainCopyCard().catch(() => {});
        paintRoundLayerList64();
      }, 400);
      setTimeout(() => {
        paintAppDomainCopyCard().catch(() => {});
        paintRoundLayerList64();
      }, 980);
    }
  };

  setTimeout(() => paintHomeMemberDaysLeft().catch(() => {}), 520);
  setTimeout(() => ensureLegacyCategoryFactoryCopyButtons().catch(() => {}), 540);
  setTimeout(() => ensureAssetDisposeTagCopyButtons().catch(() => {}), 560);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalGraceNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundIdAmountCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistDoneKeysCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNoteCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBeneCountItemCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainCopyCard().catch(() => {});
      paintRoundLayerList64();
    }, 420);
  }
})();
