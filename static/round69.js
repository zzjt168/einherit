/* 电子继承 · 第六十九批增量（叠在 round68…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round69SoftBanner_" + (hostId || "home");
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

  function yn(v) {
    return truthyFlag(v) ? "是" : "否";
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

  /* 1 · 首页执行人姓名冷静条 */
  async function paintHomeExecutorName() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeExecutorNameBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeExecutorNameBar";
      bar.className = "home-executor-name-bar";
      bar.setAttribute("role", "status");
      const backup = $("#homeBackupCountBar");
      const overdue = $("#homeOverdueBar");
      const domain = $("#homeDomainBrandBar");
      if (backup && backup.parentNode === home)
        backup.insertAdjacentElement("afterend", bar);
      else if (overdue && overdue.parentNode === home)
        overdue.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const name = String((st.user || {}).executor_name || "").trim() || "未填执行人";
      const sub = "执行人 · " + name;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-executor-name-mark">执行人</span>
        <span class="muted home-executor-name-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeExecutorNameGo">去手册</button>`;
      const btn = $("#homeExecutorNameGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-executor-name-mark">执行人</span>
        <span class="muted home-executor-name-sub">执行人姓名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeExecutorNameGo">去手册</button>`;
      const btn = $("#homeExecutorNameGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("handover");
        };
      }
    }
  }

  /* 2 · 交割处置动作+出厂重置组合复制 */
  async function ensureLegacyActionFactoryCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const factory = truthyFlag(it.factory_reset)
        ? "已勾出厂重置"
        : "未勾出厂重置";
      const line = action + " · " + factory;
      el.dataset.actionFactory = line;
      if (el.querySelector(".lg-copy-action-factory")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-factory";
      btn.textContent = "复制处置与出厂";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionFactory || "");
        softBanner(ok ? "已复制处置与出厂" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+账号提示组合复制 */
  async function ensureAssetIdHintCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = "#" + it.id + " · " + hint;
      el.dataset.idHint = line;
      if (el.querySelector(".as-copy-id-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-hint";
      btn.textContent = "复制编号与账号提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idHint || "");
        softBanner(ok ? "已复制编号与账号提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制软逾期与硬逾期布尔 */
  async function ensureCheckinSoftHardDueCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSoftHardDueCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSoftHardDueCopyCard";
      card.className = "checkin-soft-hard-due-copy";
      const backup = $("#checkinBackupCountCopyCard");
      const until = $("#checkinMemberUntilDaysCopyCard");
      const due = $("#checkinDueSoonHoursCopyCard");
      if (backup && backup.parentNode)
        backup.insertAdjacentElement("afterend", card);
      else if (until && until.parentNode)
        until.insertAdjacentElement("afterend", card);
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
      const u = st.user || {};
      const soft = yn(u.checkin_soft_overdue);
      const hard = yn(u.checkin_overdue);
      const combo = "软逾期·" + soft + " · 硬逾期·" + hard;
      const line =
        "报备逾期状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-soft-hard-due-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSoftHardDueCopyBtn">复制软硬到期</button>`;
      const btn = $("#checkinSoftHardDueCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制软硬到期" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">软硬逾期状态暂不可用</p>`;
    }
  }

  /* 5 · 差旅最近退款种类+备注组合复制 */
  async function ensureTravelRefundKindNoteCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelRefundKindNoteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelRefundKindNoteCopyCard";
      card.className = "travel-refund-kind-note-copy";
      const kindAmt = $("#travelLedgerKindAmountCopyCard");
      const balMet = $("#travelBalanceMetCopyCard");
      const metShort = $("#travelMetShortfallCopyCard");
      if (kindAmt && kindAmt.parentNode)
        kindAmt.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
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
      const kind = String(refund.kind || "").trim();
      const note = String(refund.note || "").trim() || "无备注";
      if (!kind && !refund.note) {
        card.innerHTML = `<p class="muted">退款种类与备注暂不可用</p>`;
        return;
      }
      const combo = kind ? kind + " · " + note : note;
      const line = "差旅退款种类 · 备注 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-refund-kind-note-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelRefundKindNoteCopyBtn">复制退款种类与备注</button>`;
      const btn = $("#travelRefundKindNoteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制退款种类与备注" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">退款种类与备注暂不可用</p>`;
    }
  }

  /* 6 · 善后预算标签+城市组合复制 */
  async function ensureAftercareBudgetCityLabelCopyButtons() {
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
      const label =
        String(it.travel_budget_label || "").trim() ||
        (it.travel_budget != null
          ? "¥" + String(Math.round(Number(it.travel_budget)))
          : "未填预算");
      const city = String(it.city || "").trim();
      const line = city ? label + " · " + city : label;
      el.dataset.budgetCityLabel = line;
      if (el.querySelector(".ac-copy-budget-city-label")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-city-label";
      btn.textContent = "复制预算标签与城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetCityLabel || "");
        softBanner(ok ? "已复制预算标签与城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门槛通过与就绪布尔组合复制 */
  async function ensureAuthThresholdReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avThresholdReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avThresholdReadyCopyCard";
      card.className = "av-threshold-ready-copy";
      const filename = $("#avFilenameStatusCopyCard");
      const bools = $("#avCompleteReadyBoolCopyCard");
      const missing = $("#avMissingLabelsCopyCard");
      if (filename && filename.parentNode)
        filename.insertAdjacentElement("afterend", card);
      else if (bools && bools.parentNode)
        bools.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const active =
        data.current_active || data.latest || (data.items && data.items[0]) || {};
      const passed = truthyFlag(active.threshold_passed);
      const ready = truthyFlag(data.ready);
      const combo =
        "门槛·" +
        (passed ? "已过" : "未过") +
        " · 就绪·" +
        (ready ? "是" : "否");
      const line = "授权视频门槛 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-threshold-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avThresholdReadyCopyBtn">复制门槛与就绪</button>`;
      const btn = $("#avThresholdReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛与就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+角色组合复制 */
  async function ensureHeirIdNameRoleCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const role = String(it.role || "").trim() || "未填角色";
      const line = "#" + it.id + " · " + name + " · " + role;
      if (el.querySelector(".bn-copy-id-name-role")) return;
      el.dataset.idNameRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-role";
      btn.textContent = "复制编号姓名角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameRole || "");
        softBanner(ok ? "已复制编号姓名角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册分享提示与域名组合复制 */
  async function ensureHandoverShareDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handShareDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handShareDomainCopyCard";
      card.className = "hand-share-domain-copy";
      const genDom = $("#handGeneratedDomainCopyCard");
      const itemPct = $("#handItemPctCopyCard");
      const brand = $("#handBrandMemberCopyCard");
      if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else if (itemPct && itemPct.parentNode)
        itemPct.insertAdjacentElement("afterend", card);
      else if (brand && brand.parentNode)
        brand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const domain = String(data.domain || "").trim();
      const combo = domain ? hint + " · " + domain : hint;
      const line = "手册分享 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-share-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handShareDomainCopyBtn">复制分享提示与域名</button>`;
      const btn = $("#handShareDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制分享提示与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">分享提示与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+服务就绪组合复制 + round 层含 69 */
  async function paintBrandEnOkCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnOkR69CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnOkR69CopyCard";
      card.className = "card brand-en-ok-r69-copy-card";
      const verDom = $("#appVerDomainR68CopyCard");
      const enServer = $("#enServerCopyCard");
      const okVer = $("#okVersionCopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (enServer && enServer.parentNode)
        enServer.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · ok·" + okPart;
      card.innerHTML = `<h3>英文品牌与就绪</h3>
        <p class="muted">一键复制英文品牌与服务就绪（演示级）。</p>
        <p class="brand-en-ok-r69-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnOkR69CopyBtn">复制英文与就绪</button>`;
      const btn = $("#brandEnOkR69CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文与就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌与就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList69() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 69;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 69); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round69 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeExecutorName().catch(() => {}), 520);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionFactoryCopyButtons().catch(() => {}),
      350
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdHintCopyButtons().catch(() => {}), 350);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinSoftHardDueCopy().catch(() => {}), 340);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelRefundKindNoteCopy().catch(() => {}), 360);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetCityLabelCopyButtons().catch(() => {}),
      350
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthThresholdReadyCopy().catch(() => {}), 320);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirIdNameRoleCopyButtons().catch(() => {}), 350);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverShareDomainCopy().catch(() => {}), 360);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeExecutorName().catch(() => {}), 520);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionFactoryCopyButtons().catch(() => {}),
        370
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdHintCopyButtons().catch(() => {}), 360);
    if (id === "checkin")
      setTimeout(() => ensureCheckinSoftHardDueCopy().catch(() => {}), 360);
    if (id === "travel")
      setTimeout(() => ensureTravelRefundKindNoteCopy().catch(() => {}), 380);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetCityLabelCopyButtons().catch(() => {}),
        370
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthThresholdReadyCopy().catch(() => {}), 340);
    if (id === "heirs")
      setTimeout(() => ensureHeirIdNameRoleCopyButtons().catch(() => {}), 360);
    if (id === "handover")
      setTimeout(() => ensureHandoverShareDomainCopy().catch(() => {}), 370);
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkCopyCard().catch(() => {});
        paintRoundLayerList69();
      }, 410);
      setTimeout(() => {
        paintBrandEnOkCopyCard().catch(() => {});
        paintRoundLayerList69();
      }, 990);
    }
  };

  setTimeout(() => paintHomeExecutorName().catch(() => {}), 570);
  setTimeout(() => ensureLegacyActionFactoryCopyButtons().catch(() => {}), 590);
  setTimeout(() => ensureAssetIdHintCopyButtons().catch(() => {}), 610);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSoftHardDueCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelRefundKindNoteCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetCityLabelCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthThresholdReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverShareDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkCopyCard().catch(() => {});
      paintRoundLayerList69();
    }, 430);
  }
})();
