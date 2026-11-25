/* 电子继承 · 第四十八批增量（叠在 round47…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round48SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页手册条目数一句 */
  async function paintHomeHandoverItems() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeHandoverItemsBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeHandoverItemsBar";
      bar.className = "home-handover-items-bar";
      bar.setAttribute("role", "status");
      const filled = $("#homeLegacyFilledBar");
      const ac = $("#homeAftercareCountBar");
      const company = $("#homeCompanyFilledBar");
      if (filled && filled.parentNode === home)
        filled.insertAdjacentElement("afterend", bar);
      else if (ac && ac.parentNode === home)
        ac.insertAdjacentElement("afterend", bar);
      else if (company && company.parentNode === home)
        company.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const data = await api("/api/counts-summary").catch(() => ({}));
      const counts = data.counts || {};
      const n = Number(
        counts.handover_items != null
          ? counts.handover_items
          : counts.legacy != null
            ? counts.legacy
            : 0
      );
      bar.hidden = false;
      if (!n) {
        bar.innerHTML = `<span class="home-handover-items-mark">手册条目</span>
          <span class="muted home-handover-items-sub">可先记一条 · 按自己节奏即可</span>
          <button type="button" class="btn ghost sm" id="homeHandoverItemsGo">去手册</button>`;
      } else {
        bar.innerHTML = `<span class="home-handover-items-mark">手册条目</span>
          <span class="muted home-handover-items-sub">手册约 ${n} 条 · 可随时回看</span>
          <button type="button" class="btn ghost sm" id="homeHandoverItemsGo">去手册</button>`;
      }
      const btn = $("#homeHandoverItemsGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    } catch (_) {
      bar.hidden = true;
    }
  }

  /* 2 · 交割标题+类别组合复制 */
  async function ensureLegacyTitleCatCopyButtons() {
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
      el.dataset.titleCat = line;
      if (!line || el.querySelector(".lg-copy-title-cat")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-cat";
      btn.textContent = "复制标题与类别";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCat || "");
        softBanner(ok ? "已复制标题与类别" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+标签组合复制 */
  async function ensureAssetVisTagCopyButtons() {
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
      const tag = String(it.tag || "").trim();
      const line = vis && tag ? vis + " · " + tag : vis || tag;
      el.dataset.visTag = line;
      if (!line || el.querySelector(".as-copy-vis-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-vis-tag";
      btn.textContent = "复制可见性与标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visTag || "");
        softBanner(ok ? "已复制可见性与标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时刻 */
  async function ensureCheckinNextSuggestedCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedCopyCard";
      card.className = "checkin-next-suggested-copy";
      const cd = $("#checkinCountdownLabelCopyCard");
      const rel = $("#checkinBackupRelationCopyCard");
      const phone = $("#checkinBackupPhoneCopyCard");
      if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else if (rel && rel.parentNode)
        rel.insertAdjacentElement("afterend", card);
      else if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label = String(
        (st.countdown || {}).next_suggested_label || ""
      ).trim();
      if (!label) {
        card.innerHTML = `<p class="muted">下次建议时刻暂不可用</p>`;
        return;
      }
      const line =
        "下次建议报备 · " + label + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedCopyBtn">复制下次建议时刻</button>`;
      const btn = $("#checkinNextSuggestedCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制下次建议时刻" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议时刻暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近断缴退款编号一键复制（只读，不改退款机） */
  async function ensureTravelLastRefundIdCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelLastRefundIdCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelLastRefundIdCopyCard";
      card.className = "travel-last-refund-id-copy";
      const meets = $("#travelMeetsThresholdCopyCard");
      const shortfall = $("#travelShortfallNumCopyCard");
      const bal = $("#travelBalanceNumCopyCard");
      if (meets && meets.parentNode)
        meets.insertAdjacentElement("afterend", card);
      else if (shortfall && shortfall.parentNode)
        shortfall.insertAdjacentElement("afterend", card);
      else if (bal && bal.parentNode)
        bal.insertAdjacentElement("afterend", card);
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
      if (!refund || refund.id == null) {
        card.innerHTML = `<p class="muted">暂无断缴退款编号 · 有记录时会出现（演示只读）</p>`;
        return;
      }
      const num = String(refund.id);
      const line =
        "最近断缴退款编号 · #" + num + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-last-refund-id-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelLastRefundIdCopyBtn">复制退款编号</button>`;
      const btn = $("#travelLastRefundIdCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(num);
          softBanner(ok ? "已复制退款编号" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款编号暂不可用</p>`;
    }
  }

  /* 6 · 善后预算标签+城市组合复制 */
  async function ensureAftercareBudgetCityCopyButtons() {
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
      const budget = String(
        it.travel_budget_label ||
          (it.travel_budget != null ? "¥" + it.travel_budget : "")
      ).trim();
      const city = String(it.city || "").trim();
      const line =
        budget && city ? budget + " · " + city : budget || city;
      el.dataset.budgetCity = line;
      if (!line || el.querySelector(".ac-copy-budget-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-city";
      btn.textContent = "复制预算与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetCity || "");
        softBanner(ok ? "已复制预算与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频第二段脚本提示一键复制 */
  async function ensureAuthScriptHint1Copy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avScriptHint1CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avScriptHint1CopyCard";
      card.className = "av-script-hint1-copy";
      const h0 = $("#avScriptHint0CopyCard");
      const status = $("#avStatusCopyCard");
      const thr = $("#avThresholdPassedCopyCard");
      if (h0 && h0.parentNode) h0.insertAdjacentElement("afterend", card);
      else if (status && status.parentNode)
        status.insertAdjacentElement("afterend", card);
      else if (thr && thr.parentNode)
        thr.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const script = data.script || [];
      const hint = String((script[1] && script[1].hint) || "").trim();
      if (!hint) {
        card.innerHTML = `<p class="muted">授权段脚本提示暂不可用</p>`;
        return;
      }
      const line = "授权视频授权段提示 · " + hint;
      card.innerHTML = `<p class="muted av-script-hint1-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avScriptHint1CopyBtn">复制授权段提示</button>`;
      const btn = $("#avScriptHint1CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hint);
          softBanner(ok ? "已复制授权段提示" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">授权段提示暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式组合复制 */
  async function ensureHeirIdContactCopyButtons() {
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
      const contact = String(it.contact || "").trim();
      const line = contact ? "#" + it.id + " · " + contact : "#" + it.id;
      el.dataset.idContact = line;
      if (el.querySelector(".bn-copy-id-contact")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact";
      btn.textContent = "复制编号与联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContact || "");
        softBanner(ok ? "已复制编号与联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出对齐说明一键复制 */
  async function ensureHandoverExportAlignCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportAlignCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportAlignCopyCard";
      card.className = "hand-export-align-copy";
      const itemN = $("#handItemCountNumCopyCard");
      const bn = $("#handBeneficiaryCountNumCopyCard");
      const byAction = $("#handByActionCopyCard");
      if (itemN && itemN.parentNode)
        itemN.insertAdjacentElement("afterend", card);
      else if (bn && bn.parentNode)
        bn.insertAdjacentElement("afterend", card);
      else if (byAction && byAction.parentNode)
        byAction.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const note = String(data.export_align_note || "").trim();
      if (!note) {
        card.innerHTML = `<p class="muted">导出对齐说明暂不可用</p>`;
        return;
      }
      card.innerHTML = `<p class="muted hand-export-align-copy-line">${esc(
        note
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportAlignCopyBtn">复制导出对齐说明</button>`;
      const btn = $("#handExportAlignCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(note);
          softBanner(ok ? "已复制导出对齐说明" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出对齐说明暂不可用</p>`;
    }
  }

  /* 10 · 设置·一键复制英文品牌+服务端版本 + round 层含 48 */
  async function paintEnServerVersionCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#enServerVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "enServerVersionCopyCard";
      card.className = "card en-server-version-copy-card";
      const appDom = $("#appServerDomainCopyCard");
      const ready = $("#readyDomainVersionCopyCard");
      const appSv = $("#appServerVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (ready && ready.parentNode)
        ready.insertAdjacentElement("beforebegin", card);
      else if (appSv && appSv.parentNode)
        appSv.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = h.brand_en || "E-Inherit";
      const sv = h.server_version || "EInherit/0.5";
      const line = en + " · " + sv;
      card.innerHTML = `<h3>英文品牌 · 服务端版本</h3>
        <p class="muted">一键复制英文品牌 + 服务端版本（演示级）。</p>
        <p class="en-server-version-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="enServerVersionCopyBtn">复制英文品牌与服务端版本</button>`;
      const btn = $("#enServerVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(
            ok ? "已复制英文品牌与服务端版本" : "复制未完成",
            "settings"
          );
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 服务端版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList48() {
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
    const to = uniq.length ? Math.max.apply(null, uniq) : 48;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 48); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round48 均已挂载。</p>`
      }`;
  }

  /* —— 挂接刷新 / 路由 —— */
  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeHandoverItems().catch(() => {}), 310);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(() => ensureLegacyTitleCatCopyButtons().catch(() => {}), 220);
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetVisTagCopyButtons().catch(() => {}), 220);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinNextSuggestedCopy().catch(() => {}), 210);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelLastRefundIdCopy().catch(() => {}), 230);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetCityCopyButtons().catch(() => {}),
      220
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthScriptHint1Copy().catch(() => {}), 190);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdContactCopyButtons().catch(() => {}), 220);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverExportAlignCopy().catch(() => {}), 230);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeHandoverItems().catch(() => {}), 310);
    if (id === "legacy")
      setTimeout(() => ensureLegacyTitleCatCopyButtons().catch(() => {}), 240);
    if (id === "assets")
      setTimeout(() => ensureAssetVisTagCopyButtons().catch(() => {}), 230);
    if (id === "checkin")
      setTimeout(() => ensureCheckinNextSuggestedCopy().catch(() => {}), 230);
    if (id === "travel")
      setTimeout(() => ensureTravelLastRefundIdCopy().catch(() => {}), 250);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetCityCopyButtons().catch(() => {}),
        240
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthScriptHint1Copy().catch(() => {}), 210);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdContactCopyButtons().catch(() => {}), 230);
    if (id === "handover")
      setTimeout(() => ensureHandoverExportAlignCopy().catch(() => {}), 240);
    if (id === "settings") {
      setTimeout(() => {
        paintEnServerVersionCopyCard().catch(() => {});
        paintRoundLayerList48();
      }, 280);
      setTimeout(() => {
        paintEnServerVersionCopyCard().catch(() => {});
        paintRoundLayerList48();
      }, 740);
    }
  };

  // Boot
  setTimeout(() => paintHomeHandoverItems().catch(() => {}), 370);
  setTimeout(() => ensureLegacyTitleCatCopyButtons().catch(() => {}), 390);
  setTimeout(() => ensureAssetVisTagCopyButtons().catch(() => {}), 410);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelLastRefundIdCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthScriptHint1Copy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportAlignCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintEnServerVersionCopyCard().catch(() => {});
      paintRoundLayerList48();
    }, 300);
  }
})();
