/* 电子继承 · 第九十七批增量（叠在 round96…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round97SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪域名版本冷静条 */
  async function paintHomeOkDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkDomainVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkDomainVersionCalmBar";
      bar.className = "home-ok-domain-version-calm-bar";
      bar.setAttribute("role", "status");
      const appEn = $("#homeAppBrandEnDomainCalmBar");
      const okVer = $("#homeOkVersionCalmBar");
      const brandVer = $("#homeBrandEnVersionCalmBar");
      if (appEn && appEn.parentNode === home)
        appEn.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = okPart + " · " + domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-version-calm-mark">概览</span>
        <span class="muted home-ok-domain-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-version-calm-mark">概览</span>
        <span class="muted home-ok-domain-version-calm-sub">就绪域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+备注+部门组合复制 */
  async function ensureLegacyActionNotesDeptCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = action + " · " + notes + " · " + dept;
      el.dataset.actionNotesDept = line;
      if (el.querySelector(".lg-copy-action-notes-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-notes-dept";
      btn.textContent = "复制处置备注部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionNotesDept || "");
        softBanner(ok ? "已复制处置备注部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘提示+平台+标签组合复制 */
  async function ensureAssetHintPlatformTagCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const platform = String(it.platform || "").trim() || "未填平台";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = hint + " · " + platform + " · " + tag;
      el.dataset.hintPlatformTag = line;
      if (el.querySelector(".as-copy-hint-platform-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-hint-platform-tag";
      btn.textContent = "复制提示平台标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hintPlatformTag || "");
        softBanner(ok ? "已复制提示平台标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制报备剩余秒数 */
  async function ensureCheckinSecondsRemainingPlainR97Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSecondsRemainingPlainR97CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSecondsRemainingPlainR97CopyCard";
      card.className = "checkin-seconds-remaining-plain-r97-copy";
      const since = $("#checkinHoursSinceLastPlainR96CopyCard");
      const countdown = $("#checkinCountdownLabelPlainR95CopyCard");
      const nextAt = $("#checkinNextSuggestedAtPlainR94CopyCard");
      if (since && since.parentNode)
        since.insertAdjacentElement("afterend", card);
      else if (countdown && countdown.parentNode)
        countdown.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).seconds_remaining;
      const secs =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw)));
      const line =
        "报备剩余 · " +
        secs +
        " 秒（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-seconds-remaining-plain-r97-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSecondsRemainingPlainR97CopyBtn">复制报备剩余秒数</button>`;
      const btn = $("#checkinSecondsRemainingPlainR97CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(secs);
          softBanner(ok ? "已复制报备剩余秒数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">报备剩余秒数暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛与缺口组合复制 */
  async function ensureTravelThresholdShortfallPlainR97Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdShortfallPlainR97CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdShortfallPlainR97CopyCard";
      card.className = "travel-threshold-shortfall-plain-r97-copy";
      const balMet = $("#travelBalanceMetPlainR96CopyCard");
      const pctMet = $("#travelProgressPctMetPlainR95CopyCard");
      const shortBal = $("#travelShortfallBalancePlainR94CopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = thr + " · " + short;
      const line = "差旅门槛 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-shortfall-plain-r97-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdShortfallPlainR97CopyBtn">复制门槛缺口文案</button>`;
      const btn = $("#travelThresholdShortfallPlainR97CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛缺口文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+备注+预算组合复制 */
  async function ensureAftercareCityNotesBudgetCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const notes = String(it.notes || "").trim() || "无备注";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = city + " · " + notes + " · " + budget;
      el.dataset.cityNotesBudget = line;
      if (el.querySelector(".ac-copy-city-notes-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-notes-budget";
      btn.textContent = "复制城市备注预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityNotesBudget || "");
        softBanner(ok ? "已复制城市备注预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪与缺失数组合复制 */
  async function ensureAuthReadyMissingCountCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingCountCopyCard";
      card.className = "av-ready-missing-count-copy";
      const script = $("#avScriptGateReadyCopyCard");
      const miss = $("#avMissingTextCompleteCopyCard");
      const checklist = $("#avChecklistGateCopyCard");
      if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const labels = Array.isArray(data.missing_labels)
        ? data.missing_labels
        : [];
      const miss = labels.length;
      const combo = ready + " · 缺失 " + miss;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingCountCopyBtn">复制就绪缺失数</button>`;
      const btn = $("#avReadyMissingCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪缺失数" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪与缺失数暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+角色+联系组合复制 */
  async function ensureHeirRelationRoleContactCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const role = String(it.role || "").trim() || "未填角色";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = relation + " · " + role + " · " + contact;
      if (el.querySelector(".bn-copy-relation-role-contact")) return;
      el.dataset.relationRoleContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-role-contact";
      btn.textContent = "复制关系角色联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationRoleContact || "");
        softBanner(ok ? "已复制关系角色联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数与品牌组合复制 */
  async function ensureHandoverItemCountBrandR97Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountBrandR97CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountBrandR97CopyCard";
      card.className = "hand-item-count-brand-r97-copy";
      const pctExport = $("#handProgressPctExportPathCopyCard");
      const genShare = $("#handGeneratedAtShareHintCopyCard");
      const todoShare = $("#handTodoCountShareHintCopyCard");
      if (pctExport && pctExport.parentNode)
        pctExport.insertAdjacentElement("afterend", card);
      else if (genShare && genShare.parentNode)
        genShare.insertAdjacentElement("afterend", card);
      else if (todoShare && todoShare.parentNode)
        todoShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = count + " · " + brand;
      const line = "手册条目 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-brand-r97-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountBrandR97CopyBtn">复制手册条目品牌</button>`;
      const btn = $("#handItemCountBrandR97CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册条目品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目数与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+版本组合复制 + round 层含 97 */
  async function paintOkBrandEnVersionR97CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okBrandEnVersionR97CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okBrandEnVersionR97CopyCard";
      card.className = "card ok-brand-en-version-r97-copy-card";
      const domApp = $("#domainAppVersionR96CopyCard");
      const brandOk = $("#brandEnAppOkR95CopyCard");
      const verApp = $("#versionAppDomainR94CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domApp && domApp.parentNode)
        domApp.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = "ok·" + okPart + " · " + en + " · " + ver;
      card.innerHTML = `<h3>就绪 · 英文品牌 · 版本</h3>
        <p class="muted">一键复制就绪状态、英文品牌与版本（演示级）。</p>
        <p class="ok-brand-en-version-r97-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okBrandEnVersionR97CopyBtn">复制就绪英文版本</button>`;
      const btn = $("#okBrandEnVersionR97CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文品牌 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList97() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 97;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 97); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round97 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 800);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionNotesDeptCopyButtons().catch(() => {}),
      630
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetHintPlatformTagCopyButtons().catch(() => {}),
      630
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinSecondsRemainingPlainR97Copy().catch(() => {}),
      620
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdShortfallPlainR97Copy().catch(() => {}),
      640
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityNotesBudgetCopyButtons().catch(() => {}),
      630
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingCountCopy().catch(() => {}),
      600
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationRoleContactCopyButtons().catch(() => {}),
      630
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountBrandR97Copy().catch(() => {}),
      640
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 800);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionNotesDeptCopyButtons().catch(() => {}),
        650
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetHintPlatformTagCopyButtons().catch(() => {}),
        640
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinSecondsRemainingPlainR97Copy().catch(() => {}),
        640
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdShortfallPlainR97Copy().catch(() => {}),
        660
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityNotesBudgetCopyButtons().catch(() => {}),
        650
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingCountCopy().catch(() => {}),
        620
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationRoleContactCopyButtons().catch(() => {}),
        640
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountBrandR97Copy().catch(() => {}),
        650
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnVersionR97CopyCard().catch(() => {});
        paintRoundLayerList97();
      }, 690);
      setTimeout(() => {
        paintOkBrandEnVersionR97CopyCard().catch(() => {});
        paintRoundLayerList97();
      }, 1370);
    }
  };

  setTimeout(() => paintHomeOkDomainVersion().catch(() => {}), 850);
  setTimeout(
    () => ensureLegacyActionNotesDeptCopyButtons().catch(() => {}),
    870
  );
  setTimeout(
    () => ensureAssetHintPlatformTagCopyButtons().catch(() => {}),
    890
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSecondsRemainingPlainR97Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdShortfallPlainR97Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityNotesBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingCountCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationRoleContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountBrandR97Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnVersionR97CopyCard().catch(() => {});
      paintRoundLayerList97();
    }, 710);
  }
})();
