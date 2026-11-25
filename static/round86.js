/* 电子继承 · 第八十六批增量（叠在 round85…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round86SoftBanner_" + (hostId || "home");
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

  function formatEpoch(raw) {
    if (raw == null || raw === "") return "—";
    const n = Number(raw);
    if (!isFinite(n)) return String(raw);
    const ms = n > 1e12 ? n : n * 1000;
    try {
      const d = new Date(ms);
      if (isNaN(d.getTime())) return String(raw);
      const p = (x) => (x < 10 ? "0" + x : "" + x);
      return (
        d.getFullYear() +
        "-" +
        p(d.getMonth() + 1) +
        "-" +
        p(d.getDate()) +
        " " +
        p(d.getHours()) +
        ":" +
        p(d.getMinutes())
      );
    } catch (_) {
      return String(raw);
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

  /* 1 · 首页应用就绪冷静条 */
  async function paintHomeAppOkCalm() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppOkCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppOkCalmBar";
      bar.className = "home-app-ok-calm-bar";
      bar.setAttribute("role", "status");
      const server = $("#homeServerVersionCalmBar");
      const ok = $("#homeOkStatusBar");
      const ver = $("#homeVersionCalmBar");
      if (server && server.parentNode === home)
        server.insertAdjacentElement("afterend", bar);
      else if (ok && ok.parentNode === home)
        ok.insertAdjacentElement("afterend", bar);
      else if (ver && ver.parentNode === home)
        ver.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = app + " · " + okPart;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-calm-mark">应用</span>
        <span class="muted home-app-ok-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppOkCalmGo">去设置</button>`;
      const btn = $("#homeAppOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-calm-mark">应用</span>
        <span class="muted home-app-ok-calm-sub">应用就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppOkCalmGo">去设置</button>`;
      const btn = $("#homeAppOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置+部门+备注组合复制 */
  async function ensureLegacyActionDeptNotesCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = action + " · " + dept + " · " + notes;
      el.dataset.actionDeptNotes = line;
      if (el.querySelector(".lg-copy-action-dept-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-dept-notes";
      btn.textContent = "复制处置部门备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionDeptNotes || "");
        softBanner(ok ? "已复制处置部门备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+账号提示+摘要组合复制 */
  async function ensureAssetPlatformHintSummaryCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const summary = String(it.summary || "").trim() || "未填摘要";
      const line = platform + " · " + hint + " · " + summary;
      el.dataset.platformHintSummary = line;
      if (el.querySelector(".as-copy-platform-hint-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-hint-summary";
      btn.textContent = "复制平台提示摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformHintSummary || "");
        softBanner(ok ? "已复制平台提示摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次报备标签 */
  async function ensureCheckinLastCheckinLabelPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastCheckinLabelPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastCheckinLabelPlainCopyCard";
      card.className = "checkin-last-checkin-label-plain-copy";
      const nextAt = $("#checkinNextSuggestedAtPlainCopyCard");
      const readable = $("#checkinReadableCountdownPlainCopyCard");
      const hours = $("#checkinHoursSinceLastPlainCopyCard");
      if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const label =
        String((st.countdown || {}).last_checkin_label || "").trim() ||
        "暂无上次报备标签";
      const line =
        "上次报备标签 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-checkin-label-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastCheckinLabelPlainCopyBtn">复制上次报备标签</button>`;
      const btn = $("#checkinLastCheckinLabelPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制上次报备标签" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次报备标签暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差与进度百分比组合复制 */
  async function ensureTravelShortfallProgressPctCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallProgressPctCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallProgressPctCopyCard";
      card.className = "travel-shortfall-progress-pct-copy";
      const thrMet = $("#travelThresholdMetPlainCopyCard");
      const kindAmt = $("#travelKindAmountLatestCopyCard");
      const balMet = $("#travelBalanceMetPlainCopyCard");
      if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
      else if (kindAmt && kindAmt.parentNode)
        kindAmt.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct))) + "%";
      const combo = short + " · " + pct;
      const line = "差旅短差 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-progress-pct-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallProgressPctCopyBtn">复制短差进度百分比</button>`;
      const btn = $("#travelShortfallProgressPctCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差进度百分比" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差进度百分比暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+状态+预算组合复制 */
  async function ensureAftercareTitleStatusBudgetCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const status = String(it.status || "").trim() || "未填状态";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = title + " · " + status + " · " + budget;
      el.dataset.titleStatusBudget = line;
      if (el.querySelector(".ac-copy-title-status-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-status-budget";
      btn.textContent = "复制标题状态预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleStatusBudget || "");
        softBanner(ok ? "已复制标题状态预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频齐备文案与就绪组合复制 */
  async function ensureAuthCompleteLabelReadyComboCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteLabelReadyComboCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteLabelReadyComboCopyCard";
      card.className = "av-complete-label-ready-combo-copy";
      const gateMiss = $("#avGateMissingTextCopyCard");
      const progReady = $("#avProgressReadyCopyCard");
      const missing = $("#avMissingTextReadyCopyCard");
      if (gateMiss && gateMiss.parentNode)
        gateMiss.insertAdjacentElement("afterend", card);
      else if (progReady && progReady.parentNode)
        progReady.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const complete =
        String(data.complete_label || "").trim() || "无齐备说明";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = complete + " · " + ready;
      const line = "授权视频齐备 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-complete-label-ready-combo-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteLabelReadyComboCopyBtn">复制齐备就绪组合</button>`;
      const btn = $("#avCompleteLabelReadyComboCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制齐备就绪组合" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">齐备就绪组合暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+关系组合复制 */
  async function ensureHeirIdNameRelationCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = "#" + it.id + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-id-name-relation")) return;
      el.dataset.idNameRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-relation";
      btn.textContent = "复制编号姓名关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameRelation || "");
        softBanner(ok ? "已复制编号姓名关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间与域名组合复制 */
  async function ensureHandoverGeneratedAtDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedAtDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedAtDomainCopyCard";
      card.className = "hand-generated-at-domain-copy";
      const itemBrand = $("#handItemCountBrandR85CopyCard");
      const shareBrand = $("#handShareHintBrandCopyCard");
      const domBrand = $("#handDomainBrandCopyCard");
      if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const when = formatEpoch(data.generated_at);
      const domain = String(data.domain || "").trim() || "einherit.cn";
      const combo = when + " · " + domain;
      const line = "手册生成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-generated-at-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedAtDomainCopyBtn">复制生成时间域名</button>`;
      const btn = $("#handGeneratedAtDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生成时间域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生成时间与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·服务版本+就绪+英文品牌组合复制 + round 层含 86 */
  async function paintServerOkBrandEnR86CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverOkBrandEnR86CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverOkBrandEnR86CopyCard";
      card.className = "card server-ok-brand-en-r86-copy-card";
      const okDom = $("#okDomainVersionR85CopyCard");
      const appEn = $("#appBrandEnOkR84CopyCard");
      const verEn = $("#versionBrandEnDomainR83CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (appEn && appEn.parentNode)
        appEn.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const server =
        String(h.server_version || h.version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = server + " · ok·" + okPart + " · " + en;
      card.innerHTML = `<h3>服务版本 · 就绪 · 英文品牌</h3>
        <p class="muted">一键复制服务版本、就绪状态与英文品牌（演示级）。</p>
        <p class="server-ok-brand-en-r86-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverOkBrandEnR86CopyBtn">复制服务就绪英文</button>`;
      const btn = $("#serverOkBrandEnR86CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务版本 · 就绪 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList86() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 86;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 86); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round86 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppOkCalm().catch(() => {}), 690);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionDeptNotesCopyButtons().catch(() => {}),
      520
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformHintSummaryCopyButtons().catch(() => {}),
      520
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastCheckinLabelPlainCopy().catch(() => {}),
      510
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallProgressPctCopy().catch(() => {}),
      530
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleStatusBudgetCopyButtons().catch(() => {}),
      520
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteLabelReadyComboCopy().catch(() => {}),
      490
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNameRelationCopyButtons().catch(() => {}),
      520
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverGeneratedAtDomainCopy().catch(() => {}),
      530
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppOkCalm().catch(() => {}), 690);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionDeptNotesCopyButtons().catch(() => {}),
        540
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformHintSummaryCopyButtons().catch(() => {}),
        530
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastCheckinLabelPlainCopy().catch(() => {}),
        530
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallProgressPctCopy().catch(() => {}),
        550
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleStatusBudgetCopyButtons().catch(() => {}),
        540
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteLabelReadyComboCopy().catch(() => {}),
        510
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNameRelationCopyButtons().catch(() => {}),
        530
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverGeneratedAtDomainCopy().catch(() => {}),
        540
      );
    if (id === "settings") {
      setTimeout(() => {
        paintServerOkBrandEnR86CopyCard().catch(() => {});
        paintRoundLayerList86();
      }, 580);
      setTimeout(() => {
        paintServerOkBrandEnR86CopyCard().catch(() => {});
        paintRoundLayerList86();
      }, 1240);
    }
  };

  setTimeout(() => paintHomeAppOkCalm().catch(() => {}), 740);
  setTimeout(
    () => ensureLegacyActionDeptNotesCopyButtons().catch(() => {}),
    760
  );
  setTimeout(
    () => ensureAssetPlatformHintSummaryCopyButtons().catch(() => {}),
    780
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastCheckinLabelPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallProgressPctCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleStatusBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteLabelReadyComboCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedAtDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerOkBrandEnR86CopyCard().catch(() => {});
      paintRoundLayerList86();
    }, 600);
  }
})();
