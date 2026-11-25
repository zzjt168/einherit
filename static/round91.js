/* 电子继承 · 第九十一批增量（叠在 round90…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round91SoftBanner_" + (hostId || "home");
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

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
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

  /* 1 · 首页就绪英文品牌冷静条 */
  async function paintHomeOkBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnCalmBar";
      bar.className = "home-ok-brand-en-calm-bar";
      bar.setAttribute("role", "status");
      const appVer = $("#homeAppVersionCalmBar");
      const domainEn = $("#homeDomainBrandEnBar");
      const brandOk = $("#homeBrandEnOkBar");
      if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = okPart + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-calm-mark">状态</span>
        <span class="muted home-ok-brand-en-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-calm-mark">状态</span>
        <span class="muted home-ok-brand-en-calm-sub">就绪英文品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnCalmGo">去设置</button>`;
      const btn = $("#homeOkBrandEnCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+分类+处置组合复制 */
  async function ensureLegacyTitleCategoryActionCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const cat = String(it.category || "").trim() || "未填分类";
      const action = String(it.action || "").trim() || "未填处置";
      const line = title + " · " + cat + " · " + action;
      el.dataset.titleCategoryAction = line;
      if (el.querySelector(".lg-copy-title-category-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-category-action";
      btn.textContent = "复制标题分类处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategoryAction || "");
        softBanner(ok ? "已复制标题分类处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+可见性+部门组合复制 */
  async function ensureAssetIdVisDeptCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = "#" + it.id + " · " + vis + " · " + dept;
      el.dataset.idVisDept = line;
      if (el.querySelector(".as-copy-id-vis-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-vis-dept";
      btn.textContent = "复制编号可见部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisDept || "");
        softBanner(ok ? "已复制编号可见部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余小时文案 */
  async function ensureCheckinHoursRemainingPlainR91Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursRemainingPlainR91CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursRemainingPlainR91CopyCard";
      card.className = "checkin-hours-remaining-plain-r91-copy";
      const due = $("#checkinDueSoonPlainR90CopyCard");
      const grace = $("#checkinGraceHoursPlainR89CopyCard");
      const interval = $("#checkinIntervalHoursPlainR88CopyCard");
      if (due && due.parentNode) due.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else if (interval && interval.parentNode)
        interval.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).hours_remaining;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "报备剩余 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-remaining-plain-r91-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursRemainingPlainR91CopyBtn">复制剩余小时文案</button>`;
      const btn = $("#checkinHoursRemainingPlainR91CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制剩余小时文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余小时文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口与达标组合复制 */
  async function ensureTravelShortfallMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallMetPlainCopyCard";
      card.className = "travel-shortfall-met-plain-copy";
      const metPct = $("#travelMetProgressPctPlainCopyCard");
      const thrBal = $("#travelThresholdBalancePlainCopyCard");
      const metBal = $("#travelMetBalancePlainCopyCard");
      if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (metBal && metBal.parentNode)
        metBal.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = short + " · " + met;
      const line = "差旅缺口 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallMetPlainCopyBtn">复制缺口达标文案</button>`;
      const btn = $("#travelShortfallMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口达标文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+阶段+预算组合复制 */
  async function ensureAftercareCityPhaseBudgetCopyButtons() {
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
      const phase = String(it.phase || "").trim() || "未填阶段";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const line = city + " · " + phase + " · " + budget;
      el.dataset.cityPhaseBudget = line;
      if (el.querySelector(".ac-copy-city-phase-budget")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-phase-budget";
      btn.textContent = "复制城市阶段预算";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityPhaseBudget || "");
        softBanner(ok ? "已复制城市阶段预算" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失标签与完成组合复制 */
  async function ensureAuthMissingLabelsCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingLabelsCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingLabelsCompleteCopyCard";
      card.className = "av-missing-labels-complete-copy";
      const checklist = $("#avChecklistCompleteCopyCard");
      const script = $("#avScriptCountCompleteCopyCard");
      const ready = $("#avChecklistReadyCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (ready && ready.parentNode)
        ready.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const labels = Array.isArray(data.missing_labels)
        ? data.missing_labels
        : [];
      const miss = labels.length;
      const done = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = "缺失 " + miss + " · " + done;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-labels-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingLabelsCompleteCopyBtn">复制缺失标签完成</button>`;
      const btn = $("#avMissingLabelsCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失标签完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失标签与完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+口令提示+角色组合复制 */
  async function ensureHeirNamePassphraseRoleCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const line = name + " · " + phrase + " · " + role;
      if (el.querySelector(".bn-copy-name-passphrase-role")) return;
      el.dataset.namePassphraseRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-passphrase-role";
      btn.textContent = "复制姓名口令角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.namePassphraseRole || "");
        softBanner(ok ? "已复制姓名口令角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比与分享提示组合复制 */
  async function ensureHandoverProgressPctShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctShareHintCopyCard";
      card.className = "hand-progress-pct-share-hint-copy";
      const genBrand = $("#handGeneratedAtBrandCopyCard");
      const todoDom = $("#handTodoCountDomainCopyCard");
      const itemShare = $("#handItemCountShareHintCopyCard");
      if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else if (todoDom && todoDom.parentNode)
        todoDom.insertAdjacentElement("afterend", card);
      else if (itemShare && itemShare.parentNode)
        itemShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const pctRaw = (data.progress || {}).pct;
      const pct =
        pctRaw == null || pctRaw === ""
          ? "—"
          : String(Math.round(Number(pctRaw))) + "%";
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = pct + " · " + hint;
      const line = "手册进度 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-share-hint-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctShareHintCopyBtn">复制进度百分比分享</button>`;
      const btn = $("#handProgressPctShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度百分比分享" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度百分比与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+域名+英文品牌组合复制 + round 层含 91 */
  async function paintAppDomainBrandEnR91CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appDomainBrandEnR91CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appDomainBrandEnR91CopyCard";
      card.className = "card app-domain-brand-en-r91-copy-card";
      const domVer = $("#domainVersionOkR90CopyCard");
      const verOk = $("#versionOkBrandEnR89CopyCard");
      const domainOk = $("#domainOkBrandEnR88CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = app + " · " + domain + " · " + en;
      card.innerHTML = `<h3>应用 · 域名 · 英文品牌</h3>
        <p class="muted">一键复制应用名、域名与英文品牌（演示级）。</p>
        <p class="app-domain-brand-en-r91-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appDomainBrandEnR91CopyBtn">复制应用域名英文</button>`;
      const btn = $("#appDomainBrandEnR91CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 域名 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList91() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 91;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 91); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round91 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEn().catch(() => {}), 740);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleCategoryActionCopyButtons().catch(() => {}),
      570
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdVisDeptCopyButtons().catch(() => {}), 570);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursRemainingPlainR91Copy().catch(() => {}),
      560
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallMetPlainCopy().catch(() => {}), 580);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityPhaseBudgetCopyButtons().catch(() => {}),
      570
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingLabelsCompleteCopy().catch(() => {}),
      540
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNamePassphraseRoleCopyButtons().catch(() => {}),
      570
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctShareHintCopy().catch(() => {}),
      580
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEn().catch(() => {}), 740);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleCategoryActionCopyButtons().catch(() => {}),
        590
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdVisDeptCopyButtons().catch(() => {}), 580);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursRemainingPlainR91Copy().catch(() => {}),
        580
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallMetPlainCopy().catch(() => {}),
        600
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityPhaseBudgetCopyButtons().catch(() => {}),
        590
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingLabelsCompleteCopy().catch(() => {}),
        560
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNamePassphraseRoleCopyButtons().catch(() => {}),
        580
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctShareHintCopy().catch(() => {}),
        590
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainBrandEnR91CopyCard().catch(() => {});
        paintRoundLayerList91();
      }, 630);
      setTimeout(() => {
        paintAppDomainBrandEnR91CopyCard().catch(() => {});
        paintRoundLayerList91();
      }, 1310);
    }
  };

  setTimeout(() => paintHomeOkBrandEn().catch(() => {}), 790);
  setTimeout(
    () => ensureLegacyTitleCategoryActionCopyButtons().catch(() => {}),
    810
  );
  setTimeout(() => ensureAssetIdVisDeptCopyButtons().catch(() => {}), 830);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursRemainingPlainR91Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityPhaseBudgetCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingLabelsCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePassphraseRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainBrandEnR91CopyCard().catch(() => {});
      paintRoundLayerList91();
    }, 650);
  }
})();
