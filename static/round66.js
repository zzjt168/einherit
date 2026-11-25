/* 电子继承 · 第六十六批增量（叠在 round65…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round66SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌冷静条 */
  async function paintHomeDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandBar";
      bar.className = "home-domain-brand-bar";
      bar.setAttribute("role", "status");
      const member = $("#homeIsMemberBar");
      const days = $("#homeMemberDaysLeftBar");
      const escBar = $("#homeEscalationBar");
      if (member && member.parentNode === home)
        member.insertAdjacentElement("afterend", bar);
      else if (days && days.parentNode === home)
        days.insertAdjacentElement("afterend", bar);
      else if (escBar && escBar.parentNode === home)
        escBar.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-mark">品牌</span>
        <span class="muted home-domain-brand-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandGo">去设置</button>`;
      const btn = $("#homeDomainBrandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-mark">品牌</span>
        <span class="muted home-domain-brand-sub">域名与英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandGo">去设置</button>`;
      const btn = $("#homeDomainBrandGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+类别组合复制 */
  async function ensureLegacyTitleCategoryCopyButtons() {
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
      const title = String(it.title || "").trim();
      const cat = String(it.category || "").trim();
      const line = title && cat ? title + " · " + cat : title || cat;
      el.dataset.titleCategory = line;
      if (!line || el.querySelector(".lg-copy-title-category")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-category";
      btn.textContent = "复制交割标题与类别";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategory || "");
        softBanner(ok ? "已复制交割标题与类别" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+处置备注组合复制 */
  async function ensureAssetIdDisposeCopyButtons() {
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
      if (!it || it.id == null) return;
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const line = "#" + it.id + " · " + dispose;
      el.dataset.idDispose = line;
      if (el.querySelector(".as-copy-id-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-dispose";
      btn.textContent = "复制编号与处置备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDispose || "");
        softBanner(ok ? "已复制编号与处置备注" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制即将到期与剩余小时 */
  async function ensureCheckinDueSoonHoursCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinDueSoonHoursCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinDueSoonHoursCopyCard";
      card.className = "checkin-due-soon-hours-copy";
      const ago = $("#checkinLastAgoHoursSinceCopyCard");
      const interval = $("#checkinIntervalGraceNumCopyCard");
      const dual = $("#checkinDualSecondsCopyCard");
      if (ago && ago.parentNode)
        ago.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else if (dual && dual.parentNode)
        dual.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const due = !!cd.due_soon;
      const hours = cd.hours_remaining;
      const duePart = due ? "即将到期" : "节奏从容";
      const hoursPart =
        hours == null
          ? "—"
          : String(Math.round(Number(hours) * 100) / 100);
      const combo = duePart + " · " + hoursPart;
      const line =
        "即将到期 · 剩余小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-due-soon-hours-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinDueSoonHoursCopyBtn">复制即将到期与剩余小时</button>`;
      const btn = $("#checkinDueSoonHoursCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制即将到期与剩余小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">即将到期与剩余小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标与缺口组合复制 */
  async function ensureTravelMetShortfallCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetShortfallCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetShortfallCopyCard";
      card.className = "travel-met-shortfall-copy";
      const prog = $("#travelProgressLabelPctCopyCard");
      const refund = $("#travelRefundIdAmountCopyCard");
      const balShort = $("#travelBalanceShortfallCopyCard");
      if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const meets = !!(fund.meets_threshold || fund.met);
      let shortfall = fund.shortfall;
      if (shortfall == null && fund.threshold != null) {
        const bal = Number(fund.balance || 0);
        const thr = Number(fund.threshold) || 0;
        shortfall = Math.max(0, thr - bal);
      }
      const status = meets ? "已达标" : "未达标";
      const shortPart =
        shortfall == null ? "—" : String(Math.round(Number(shortfall)));
      const combo = status + " · " + shortPart;
      const line = "差旅达标 · 缺口 · " + combo;
      card.innerHTML = `<p class="muted travel-met-shortfall-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetShortfallCopyBtn">复制达标与缺口</button>`;
      const btn = $("#travelMetShortfallCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标与缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标与缺口暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+阶段键组合复制 */
  async function ensureAftercareIdPhaseKeyCopyButtons() {
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
      if (!it || it.id == null) return;
      const phase = String(it.phase_key || "").trim();
      const line = phase ? "#" + it.id + " · " + phase : "#" + it.id;
      el.dataset.idPhaseKey = line;
      if (el.querySelector(".ac-copy-id-phase-key")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-phase-key";
      btn.textContent = "复制编号与阶段键";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPhaseKey || "");
        softBanner(ok ? "已复制编号与阶段键" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项标签摘要复制 */
  async function ensureAuthMissingLabelsCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingLabelsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingLabelsCopyCard";
      card.className = "av-missing-labels-copy";
      const gate = $("#avGateCopyCard");
      const keys = $("#avChecklistDoneKeysCopyCard");
      const active = $("#avActiveLabelStatusCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (keys && keys.parentNode)
        keys.insertAdjacentElement("afterend", card);
      else if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const labels = data.missing_labels || [];
      const combo = labels.length
        ? labels.map((x) => String(x || "").trim()).filter(Boolean).join(" · ")
        : "无缺失项";
      const line = "授权视频缺失项 · " + combo;
      card.innerHTML = `<p class="muted av-missing-labels-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingLabelsCopyBtn">复制缺失项标签</button>`;
      const btn = $("#avMissingLabelsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失项标签" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失项标签暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色键+备注组合复制 */
  async function ensureHeirRoleNoteCopyButtons() {
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
      const role = String(it.role || "").trim().toLowerCase();
      const note = String(it.note || "").trim() || "无备注";
      const line = role ? role + " · " + note : note;
      if (!line || el.querySelector(".bn-copy-role-note")) return;
      el.dataset.roleNote = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-note";
      btn.textContent = "复制角色与备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleNote || "");
        softBanner(ok ? "已复制角色与备注" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+会员状态组合复制 */
  async function ensureHandoverBrandMemberCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandMemberCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandMemberCopyCard";
      card.className = "hand-brand-member-copy";
      const domainExec = $("#handDomainExecutorCopyCard");
      const bene = $("#handBeneCountItemCopyCard");
      const destroy = $("#handDestroySaleCopyCard");
      if (domainExec && domainExec.parentNode)
        domainExec.insertAdjacentElement("afterend", card);
      else if (bene && bene.parentNode)
        bene.insertAdjacentElement("afterend", card);
      else if (destroy && destroy.parentNode)
        destroy.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim();
      const member = !!data.member;
      const memberPart = member ? "会员有效" : "未开通";
      if (!brand) {
        card.innerHTML = `<p class="muted">品牌与会员暂不可用</p>`;
        return;
      }
      const combo = brand + " · " + memberPart;
      const line = "手册品牌 · 会员 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-member-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandMemberCopyBtn">复制品牌与会员</button>`;
      const btn = $("#handBrandMemberCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌与会员" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌与会员暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪状态+应用版本组合复制 + round 层含 66 */
  async function paintOkVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okVersionCopyCard";
      card.className = "card ok-version-copy-card";
      const serverDomain = $("#serverVersionDomainCopyCard");
      const appDomain = $("#appDomainCopyCard");
      const verBrand = $("#versionBrandEnCopyCard");
      const roundList = $("#roundLayerListCard");
      if (serverDomain && serverDomain.parentNode)
        serverDomain.insertAdjacentElement("beforebegin", card);
      else if (appDomain && appDomain.parentNode)
        appDomain.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = h.ok === true ? "ok" : h.ok === false ? "not-ok" : "—";
      const ver = String(h.version || "0.5.0").trim().replace(/^v/i, "");
      const line = okPart + " · " + ver;
      card.innerHTML = `<h3>就绪与版本</h3>
        <p class="muted">一键复制就绪状态与应用版本（演示级）。</p>
        <p class="ok-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okVersionCopyBtn">复制就绪与版本</button>`;
      const btn = $("#okVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪与版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪与版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList66() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 66;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 66); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round66 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrand().catch(() => {}), 490);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleCategoryCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdDisposeCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinDueSoonHoursCopy().catch(() => {}), 330);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelMetShortfallCopy().catch(() => {}), 350);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdPhaseKeyCopyButtons().catch(() => {}),
      340
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthMissingLabelsCopy().catch(() => {}), 310);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleNoteCopyButtons().catch(() => {}), 340);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBrandMemberCopy().catch(() => {}), 350);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrand().catch(() => {}), 490);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleCategoryCopyButtons().catch(() => {}),
        360
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdDisposeCopyButtons().catch(() => {}),
        350
      );
    if (id === "checkin")
      setTimeout(() => ensureCheckinDueSoonHoursCopy().catch(() => {}), 350);
    if (id === "travel")
      setTimeout(() => ensureTravelMetShortfallCopy().catch(() => {}), 370);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdPhaseKeyCopyButtons().catch(() => {}),
        360
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthMissingLabelsCopy().catch(() => {}), 330);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleNoteCopyButtons().catch(() => {}), 350);
    if (id === "handover")
      setTimeout(() => ensureHandoverBrandMemberCopy().catch(() => {}), 360);
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionCopyCard().catch(() => {});
        paintRoundLayerList66();
      }, 400);
      setTimeout(() => {
        paintOkVersionCopyCard().catch(() => {});
        paintRoundLayerList66();
      }, 980);
    }
  };

  setTimeout(() => paintHomeDomainBrand().catch(() => {}), 540);
  setTimeout(() => ensureLegacyTitleCategoryCopyButtons().catch(() => {}), 560);
  setTimeout(() => ensureAssetIdDisposeCopyButtons().catch(() => {}), 580);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinDueSoonHoursCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetShortfallCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdPhaseKeyCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingLabelsCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleNoteCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandMemberCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionCopyCard().catch(() => {});
      paintRoundLayerList66();
    }, 420);
  }
})();
