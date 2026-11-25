/* 电子继承 · 第一百一十三批增量（叠在 round112…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round113SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文版本就绪冷静条 */
  async function paintHomeBrandEnVersionOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionOkCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionOkCalmBar";
      bar.className = "home-brand-en-version-ok-calm-bar";
      bar.setAttribute("role", "status");
      const appOk = $("#homeAppOkDomainCalmBarR112");
      const domVer = $("#homeDomainVersionAppCalmBar");
      const okApp = $("#homeOkAppBrandEnCalmBar");
      if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + ver + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-ok-calm-mark">英文</span>
        <span class="muted home-brand-en-version-ok-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionOkCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnVersionOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-ok-calm-mark">英文</span>
        <span class="muted home-brand-en-version-ok-calm-sub">英文版本就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionOkCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnVersionOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+分类+编号组合复制 */
  async function ensureLegacyTitleCategoryIdCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const cat = String(it.category || "").trim() || "未填分类";
      const line = title + " · " + cat + " · #" + it.id;
      el.dataset.titleCategoryId = line;
      if (el.querySelector(".lg-copy-title-category-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-category-id";
      btn.textContent = "复制标题分类编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategoryId || "");
        softBanner(ok ? "已复制标题分类编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见度+提示组合复制 */
  async function ensureAssetTagVisibilityHintCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const vis = String(it.visibility || "").trim() || "未设可见度";
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const line = tag + " · " + vis + " · " + hint;
      el.dataset.tagVisibilityHint = line;
      if (el.querySelector(".as-copy-tag-visibility-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-hint";
      btn.textContent = "复制标签可见提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisibilityHint || "");
        softBanner(ok ? "已复制标签可见提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余秒数文案 */
  async function ensureCheckinSecondsLeftPlainR113Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSecondsLeftPlainR113CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSecondsLeftPlainR113CopyCard";
      card.className = "checkin-seconds-left-plain-r113-copy";
      const readable = $("#checkinReadableGracePlainR112CopyCard");
      const hoursLeft = $("#checkinHoursLeftDuePlainR111CopyCard");
      const lastAt = $("#checkinLastAtIntervalPlainR110CopyCard");
      if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (hoursLeft && hoursLeft.parentNode)
        hoursLeft.insertAdjacentElement("afterend", card);
      else if (lastAt && lastAt.parentNode)
        lastAt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const secRaw = cd.seconds_remaining;
      const plain =
        secRaw == null || secRaw === ""
          ? "—"
          : String(Math.round(Number(secRaw)));
      const line =
        "报备剩余秒数 · " +
        plain +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-seconds-left-plain-r113-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSecondsLeftPlainR113CopyBtn">复制剩余秒数文案R113</button>`;
      const btn = $("#checkinSecondsLeftPlainR113CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制剩余秒数文案R113" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余秒数文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+进度百分比+达标组合复制 */
  async function ensureTravelShortfallPctMetPlainR113Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallPctMetPlainR113CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallPctMetPlainR113CopyCard";
      card.className = "travel-shortfall-pct-met-plain-r113-copy";
      const pctBal = $("#travelPctBalanceThresholdPlainCopyCard");
      const thrBal = $("#travelThresholdBalanceMetPlainCopyCard");
      const balMet = $("#travelBalanceMetShortfallPlainCopyCard");
      if (pctBal && pctBal.parentNode)
        pctBal.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
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
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = short + " · " + pctStr + " · " + met;
      const line =
        "差旅缺口 · 进度 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-pct-met-plain-r113-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallPctMetPlainR113CopyBtn">复制缺口进度达标R113</button>`;
      const btn = $("#travelShortfallPctMetPlainR113CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口进度达标R113" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口进度达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+城市+标题组合复制 */
  async function ensureAftercareServiceCityTitleCopyButtons() {
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
      const svc = String(it.service_type || "").trim() || "未填服务";
      const city = String(it.city || "").trim() || "未填城市";
      const title = String(it.title || "").trim() || "未填标题";
      const line = svc + " · " + city + " · " + title;
      el.dataset.serviceCityTitle = line;
      if (el.querySelector(".ac-copy-service-city-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-city-title";
      btn.textContent = "复制服务城市标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceCityTitle || "");
        softBanner(ok ? "已复制服务城市标题" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+闸口+清单数组合复制 */
  async function ensureAuthCompleteGateChecklistCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteGateChecklistCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteGateChecklistCopyCard";
      card.className = "av-complete-gate-checklist-copy";
      const readyGate = $("#avReadyGateMissingCopyCard");
      const checklist = $("#avChecklistCountCompleteCopyCard");
      const miss = $("#avMissingChecklistReadyCopyCard");
      if (readyGate && readyGate.parentNode)
        readyGate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const gate = truthyFlag(data.gate) ? "闸口开" : "闸口关";
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const combo = doneFlag + " · " + gate + " · 清单 " + list.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-gate-checklist-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteGateChecklistCopyBtn">复制完成闸口清单</button>`;
      const btn = $("#avCompleteGateChecklistCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成闸口清单" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成闸口清单暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系+编号组合复制 */
  async function ensureHeirNameContactIdCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + contact + " · #" + it.id;
      if (el.querySelector(".bn-copy-name-contact-id")) return;
      el.dataset.nameContactId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-id";
      btn.textContent = "复制姓名联系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactId || "");
        softBanner(ok ? "已复制姓名联系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册待办数+导出路径+条目数组合复制 */
  async function ensureHandoverTodosExportItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handTodosExportItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handTodosExportItemCountCopyCard";
      card.className = "hand-todos-export-item-count-copy";
      const exportDom = $("#handExportDomainTodosCopyCard");
      const brandDom = $("#handBrandDomainItemCountCopyCard");
      const itemBrand = $("#handItemCountBrandTodosCopyCard");
      if (exportDom && exportDom.parentNode)
        exportDom.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const combo = tcount + " · " + exportPath + " · " + icount;
      const line = "手册待办 · 导出 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-todos-export-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handTodosExportItemCountCopyBtn">复制待办导出条目</button>`;
      const btn = $("#handTodosExportItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制待办导出条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">待办导出条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+就绪+域名+英文品牌组合复制 + round 层含 113 */
  async function paintVersionOkDomainBrandEnR113CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionOkDomainBrandEnR113CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionOkDomainBrandEnR113CopyCard";
      card.className = "card version-ok-domain-brand-en-r113-copy-card";
      const okBrand = $("#okBrandEnDomainAppR112CopyCard");
      const domApp = $("#domainAppVersionOkR111CopyCard");
      const appDom = $("#appDomainBrandEnOkR110CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (domApp && domApp.parentNode)
        domApp.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + ready + " · " + domain + " · " + en;
      card.innerHTML = `<h3>版本 · 就绪 · 域名 · 英文品牌</h3>
        <p class="muted">一键复制版本、就绪状态、域名与英文品牌（演示级）。</p>
        <p class="version-ok-domain-brand-en-r113-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionOkDomainBrandEnR113CopyBtn">复制版本就绪域名英文</button>`;
      const btn = $("#versionOkDomainBrandEnR113CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本就绪域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 就绪 · 域名 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList113() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 113;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 113); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round113 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleCategoryIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagVisibilityHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinSecondsLeftPlainR113Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelShortfallPctMetPlainR113Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceCityTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteGateChecklistCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverTodosExportItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleCategoryIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagVisibilityHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinSecondsLeftPlainR113Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelShortfallPctMetPlainR113Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceCityTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteGateChecklistCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverTodosExportItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkDomainBrandEnR113CopyCard().catch(() => {});
        paintRoundLayerList113();
      }, 710);
      setTimeout(() => {
        paintVersionOkDomainBrandEnR113CopyCard().catch(() => {});
        paintRoundLayerList113();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleCategoryIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetTagVisibilityHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSecondsLeftPlainR113Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallPctMetPlainR113Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceCityTitleCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteGateChecklistCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverTodosExportItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkDomainBrandEnR113CopyCard().catch(() => {});
      paintRoundLayerList113();
    }, 730);
  }
})();
