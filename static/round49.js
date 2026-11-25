/* 电子继承 · 第四十九批增量（叠在 round48…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round49SoftBanner_" + (hostId || "home");
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

  function roleLabel(role) {
    const r = String(role || "").toLowerCase();
    if (r === "heir") return "继承人";
    if (r === "family") return "家人";
    if (r === "executor") return "执行人";
    return String(role || "");
  }

  function coopLabel(raw) {
    const s = String(raw || "").toLowerCase();
    if (!s || s === "pending") return "协作待开始";
    if (s === "open" || s === "active") return "协作进行中";
    if (s === "done" || s === "closed") return "协作已结束";
    return "协作 · " + String(raw);
  }

  /* 1 · 首页服务健康就绪一句 */
  async function paintHomeHealthReady() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHealthReadyBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHealthReadyBar";
      bar.className = "home-health-ready-bar";
      bar.setAttribute("role", "status");
      const items = $("#homeHandoverItemsBar");
      const filled = $("#homeLegacyFilledBar");
      const ac = $("#homeAftercareCountBar");
      if (items && items.parentNode === home)
        items.insertAdjacentElement("afterend", bar);
      else if (filled && filled.parentNode === home)
        filled.insertAdjacentElement("afterend", bar);
      else if (ac && ac.parentNode === home)
        ac.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health").catch(() => ({}));
      const ok = !!h.ok;
      const domain = String(h.domain || "einherit.cn").trim();
      bar.hidden = false;
      if (ok) {
        bar.innerHTML = `<span class="home-health-ready-mark">服务状态</span>
          <span class="muted home-health-ready-sub">就绪 · ${esc(
            domain
          )} · 可按自己节奏使用</span>
          <button type="button" class="btn ghost sm" id="homeHealthReadyGo">去设置</button>`;
      } else {
        bar.innerHTML = `<span class="home-health-ready-mark">服务状态</span>
          <span class="muted home-health-ready-sub">暂不可用 · 稍后再看即可</span>
          <button type="button" class="btn ghost sm" id="homeHealthReadyGo">去设置</button>`;
      }
      const btn = $("#homeHealthReadyGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割编号+处置组合复制 */
  async function ensureLegacyIdActionCopyButtons() {
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
      const action = String(it.action || "").trim();
      const line = action ? "#" + it.id + " · " + action : "#" + it.id;
      el.dataset.idAction = line;
      if (el.querySelector(".lg-copy-id-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-action";
      btn.textContent = "复制编号与处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idAction || "");
        softBanner(ok ? "已复制编号与处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+摘要组合复制 */
  async function ensureAssetIdSummaryCopyButtons() {
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
      const summary = String(it.summary || "").trim();
      const line = summary ? "#" + it.id + " · " + summary : "#" + it.id;
      el.dataset.idSummary = line;
      if (el.querySelector(".as-copy-id-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-summary";
      btn.textContent = "复制编号与摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idSummary || "");
        softBanner(ok ? "已复制编号与摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时纯数字 */
  async function ensureCheckinHoursRemainingNumCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingNumCopyCard";
      card.className = "checkin-hours-remaining-num-copy";
      const next = $("#checkinNextSuggestedCopyCard");
      const cd = $("#checkinCountdownLabelCopyCard");
      const rel = $("#checkinBackupRelationCopyCard");
      if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else if (rel && rel.parentNode)
        rel.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      let hours = cd.hours_remaining;
      if (hours == null && cd.seconds_remaining != null)
        hours = Number(cd.seconds_remaining) / 3600;
      if (hours == null) {
        card.innerHTML = `<p class="muted">剩余小时暂不可用</p>`;
        return;
      }
      const num = String(Math.max(0, Math.round(Number(hours))));
      const line =
        "报备剩余小时数字 · " +
        num +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingNumCopyBtn">复制剩余小时</button>`;
      const btn = $("#checkinHoursRemainingNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制剩余小时" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余小时暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近断缴退款金额纯数字（只读，不改退款机） */
  async function ensureTravelLastRefundAmountNumCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLastRefundAmountNumCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLastRefundAmountNumCopyCard";
      card.className = "travel-last-refund-amount-num-copy";
      const rid = $("#travelLastRefundIdCopyCard");
      const meets = $("#travelMeetsThresholdCopyCard");
      const shortfall = $("#travelShortfallNumCopyCard");
      if (rid && rid.parentNode) rid.insertAdjacentElement("afterend", card);
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
      const refund = fund.last_refund || null;
      if (!refund || refund.amount == null) {
        card.innerHTML = `<p class="muted">暂无断缴退款金额 · 有记录时会出现（演示只读）</p>`;
        return;
      }
      const num = String(Math.round(Math.abs(Number(refund.amount))));
      const line =
        "最近断缴退款金额数字 · " + num + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-last-refund-amount-num-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLastRefundAmountNumCopyBtn">复制退款金额数字</button>`;
      const btn = $("#travelLastRefundAmountNumCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制退款金额数字" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款金额暂不可用</p>`;
    }
  }

  /* 6 · 善后协作状态+城市组合复制 */
  async function ensureAftercareCoopCityCopyButtons() {
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
      const coop = coopLabel(it.coop_state);
      const city = String(it.city || "").trim();
      const line = city ? coop + " · " + city : coop;
      el.dataset.coopCity = line;
      if (!line || el.querySelector(".ac-copy-coop-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-coop-city";
      btn.textContent = "复制协作与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.coopCity || "");
        softBanner(ok ? "已复制协作与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第三段脚本提示一键复制 */
  async function ensureAuthScriptHint2Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptHint2CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptHint2CopyCard";
      card.className = "av-script-hint2-copy";
      const h1 = $("#avScriptHint1CopyCard");
      const h0 = $("#avScriptHint0CopyCard");
      const status = $("#avStatusCopyCard");
      if (h1 && h1.parentNode) h1.insertAdjacentElement("afterend", card);
      else if (h0 && h0.parentNode)
        h0.insertAdjacentElement("afterend", card);
      else if (status && status.parentNode)
        status.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const hint = String((script[2] && script[2].hint) || "").trim();
      if (!hint) {
        card.innerHTML = `<p class="muted">处置思路段提示暂不可用</p>`;
        return;
      }
      const line = "授权视频处置思路提示 · " + hint;
      card.innerHTML = `<p class="muted av-script-hint2-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptHint2CopyBtn">复制处置思路提示</button>`;
      const btn = $("#avScriptHint2CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制处置思路提示" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">处置思路提示暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+联系方式组合复制 */
  async function ensureHeirRoleContactCopyButtons() {
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
      const contact = String(it.contact || "").trim();
      const line =
        role && contact ? role + " · " + contact : role || contact;
      el.dataset.roleContact = line;
      if (!line || el.querySelector(".bn-copy-role-contact")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-contact";
      btn.textContent = "复制角色与联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.roleContact || "");
        softBanner(ok ? "已复制角色与联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册继承人名单摘要一键复制 */
  async function ensureHandoverHeirsNamesCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handHeirsNamesCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handHeirsNamesCopyCard";
      card.className = "hand-heirs-names-copy";
      const align = $("#handExportAlignCopyCard");
      const itemN = $("#handItemCountNumCopyCard");
      const bn = $("#handBeneficiaryCountNumCopyCard");
      if (align && align.parentNode)
        align.insertAdjacentElement("afterend", card);
      else if (itemN && itemN.parentNode)
        itemN.insertAdjacentElement("afterend", card);
      else if (bn && bn.parentNode)
        bn.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const heirs = data.heirs || [];
      const names = heirs
        .map((h) => String((h && h.name) || "").trim())
        .filter(Boolean);
      if (!names.length) {
        card.innerHTML = `<p class="muted">暂无继承人名单 · 可先在受益人页补充</p>`;
        return;
      }
      const line = names.join(" · ");
      card.innerHTML = `<p class="muted hand-heirs-names-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handHeirsNamesCopyBtn">复制继承人名单</button>`;
      const btn = $("#handHeirsNamesCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制继承人名单" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">继承人名单暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制应用版本+域名 + round 层含 49 */
  async function paintVersionDomainCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionDomainCopyCard";
      card.className = "card version-domain-copy-card";
      const enSv = $("#enServerVersionCopyCard");
      const appDom = $("#appServerDomainCopyCard");
      const ready = $("#readyDomainVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (enSv && enSv.parentNode)
        enSv.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (ready && ready.parentNode)
        ready.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || "0.5.0").replace(/^v/i, "");
      const domain = h.domain || "einherit.cn";
      const line = "v" + ver + " · " + domain;
      card.innerHTML = `<h3>应用版本 · 域名</h3>
        <p class="muted">一键复制应用版本号 + 域名（演示级）。</p>
        <p class="version-domain-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionDomainCopyBtn">复制应用版本与域名</button>`;
      const btn = $("#versionDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用版本与域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList49() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 49;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 49); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round49 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeHealthReady().catch(() => {}), 320);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyIdActionCopyButtons().catch(() => {}), 230);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdSummaryCopyButtons().catch(() => {}), 230);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingNumCopy().catch(() => {}),
      220
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelLastRefundAmountNumCopy().catch(() => {}),
      240
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCoopCityCopyButtons().catch(() => {}),
      230
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptHint2Copy().catch(() => {}), 200);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirRoleContactCopyButtons().catch(() => {}), 230);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverHeirsNamesCopy().catch(() => {}), 240);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeHealthReady().catch(() => {}), 320);
    if (id === "legacy")
      setTimeout(() => ensureLegacyIdActionCopyButtons().catch(() => {}), 250);
    if (id === "assets")
      setTimeout(() => ensureAssetIdSummaryCopyButtons().catch(() => {}), 240);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingNumCopy().catch(() => {}),
        240
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelLastRefundAmountNumCopy().catch(() => {}),
        260
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCoopCityCopyButtons().catch(() => {}),
        250
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptHint2Copy().catch(() => {}), 220);
    if (id === "heirs")
      setTimeout(() => ensureHeirRoleContactCopyButtons().catch(() => {}), 240);
    if (id === "handover")
      setTimeout(() => ensureHandoverHeirsNamesCopy().catch(() => {}), 250);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainCopyCard().catch(() => {});
        paintRoundLayerList49();
      }, 290);
      setTimeout(() => {
        paintVersionDomainCopyCard().catch(() => {});
        paintRoundLayerList49();
      }, 760);
    }
  };

  // Boot
  setTimeout(() => paintHomeHealthReady().catch(() => {}), 380);
  setTimeout(() => ensureLegacyIdActionCopyButtons().catch(() => {}), 400);
  setTimeout(() => ensureAssetIdSummaryCopyButtons().catch(() => {}), 420);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingNumCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLastRefundAmountNumCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCoopCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptHint2Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRoleContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverHeirsNamesCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainCopyCard().catch(() => {});
      paintRoundLayerList49();
    }, 310);
  }
})();
