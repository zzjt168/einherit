/* 电子继承 · 第一百一十七批增量（叠在 round116…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round117SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用就绪版本冷静条 */
  async function paintHomeAppOkVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppOkVersionCalmBarR117");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppOkVersionCalmBarR117";
      bar.className = "home-app-ok-version-calm-bar-r117";
      bar.setAttribute("role", "status");
      const domOk = $("#homeDomainOkBrandEnCalmBarR116");
      const verEn = $("#homeVersionBrandEnAppCalmBarR115");
      const okDom = $("#homeOkDomainVersionCalmBarR114");
      if (domOk && domOk.parentNode === home)
        domOk.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = app + " · " + ready + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-version-calm-bar-r117-mark">应用</span>
        <span class="muted home-app-ok-version-calm-bar-r117-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppOkVersionCalmGoR117">去设置</button>`;
      const btn = $("#homeAppOkVersionCalmGoR117");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-ok-version-calm-bar-r117-mark">应用</span>
        <span class="muted home-app-ok-version-calm-bar-r117-sub">应用就绪版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppOkVersionCalmGoR117">去设置</button>`;
      const btn = $("#homeAppOkVersionCalmGoR117");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+分类+编号组合复制 */
  async function ensureLegacyBeneficiaryCategoryIdCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const cat = String(it.category || "").trim() || "未填分类";
      const line = ben + " · " + cat + " · #" + it.id;
      el.dataset.beneficiaryCategoryId = line;
      if (el.querySelector(".lg-copy-beneficiary-category-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-category-id";
      btn.textContent = "复制受益人分类编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryCategoryId || "");
        softBanner(ok ? "已复制受益人分类编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+标签+处置组合复制 */
  async function ensureAssetIdTagDisposeCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const line = "#" + it.id + " · " + tag + " · " + dispose;
      el.dataset.idTagDispose = line;
      if (el.querySelector(".as-copy-id-tag-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-tag-dispose";
      btn.textContent = "复制编号标签处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTagDispose || "");
        softBanner(ok ? "已复制编号标签处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制可读间隔文案 */
  async function ensureCheckinReadableIntervalPlainR117Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinReadableIntervalPlainR117CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinReadableIntervalPlainR117CopyCard";
      card.className = "checkin-readable-interval-plain-r117-copy";
      const agoGrace = $("#checkinAgoLabelGracePlainR116CopyCard");
      const lastLabel = $("#checkinLastLabelHoursPlainR115CopyCard");
      const labelInt = $("#checkinLabelIntervalPlainR114CopyCard");
      if (agoGrace && agoGrace.parentNode)
        agoGrace.insertAdjacentElement("afterend", card);
      else if (lastLabel && lastLabel.parentNode)
        lastLabel.insertAdjacentElement("afterend", card);
      else if (labelInt && labelInt.parentNode)
        labelInt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const readable = String(cd.readable || "").trim() || "—";
      const intRaw = cd.interval_hours;
      const hours =
        intRaw == null || intRaw === ""
          ? "—"
          : String(Math.round(Number(intRaw) * 100) / 100);
      const combo = readable + " · " + hours;
      const line =
        "报备可读 · 间隔 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-readable-interval-plain-r117-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinReadableIntervalPlainR117CopyBtn">复制可读间隔文案R117</button>`;
      const btn = $("#checkinReadableIntervalPlainR117CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制可读间隔文案R117" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">可读间隔文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+进度百分比+余额组合复制 */
  async function ensureTravelMetPctBalancePlainR117Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetPctBalancePlainR117CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetPctBalancePlainR117CopyCard";
      card.className = "travel-met-pct-balance-plain-r117-copy";
      const thrShort = $("#travelThresholdShortfallPctPlainCopyCard");
      const shortBal = $("#travelShortfallBalanceMetPlainR115CopyCard");
      const balThr = $("#travelBalanceThresholdPctPlainCopyCard");
      if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = met + " · " + pctStr + " · " + bal;
      const line =
        "差旅达标 · 进度 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-pct-balance-plain-r117-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetPctBalancePlainR117CopyBtn">复制达标进度余额R117</button>`;
      const btn = $("#travelMetPctBalancePlainR117CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标进度余额R117" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标进度余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+服务类型+备注组合复制 */
  async function ensureAftercareTitleServiceNotesCopyButtons() {
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
      const svc = String(it.service_type || "").trim() || "未填服务";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = title + " · " + svc + " · " + notes;
      el.dataset.titleServiceNotes = line;
      if (el.querySelector(".ac-copy-title-service-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-service-notes";
      btn.textContent = "复制标题服务备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleServiceNotes || "");
        softBanner(ok ? "已复制标题服务备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成+缺失数组合复制 */
  async function ensureAuthReadyCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCopyCard";
      card.className = "av-ready-complete-missing-copy";
      const checklist = $("#avChecklistMissingGateCopyCard");
      const gateReady = $("#avGateReadyChecklistCopyCard");
      const missReady = $("#avMissingReadyCompleteCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const combo = ready + " · " + doneFlag + " · 缺失 " + missing.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-missing-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCopyBtn">复制就绪完成缺失</button>`;
      const btn = $("#avReadyCompleteMissingCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系+口令提示组合复制 */
  async function ensureHeirRelationContactPassphraseCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const phrase =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const line = relation + " · " + contact + " · " + phrase;
      if (el.querySelector(".bn-copy-relation-contact-passphrase")) return;
      el.dataset.relationContactPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact-passphrase";
      btn.textContent = "复制关系联系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContactPassphrase || "");
        softBanner(ok ? "已复制关系联系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径+条目数+待办数组合复制 */
  async function ensureHandoverExportItemCountTodosCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportItemCountTodosCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportItemCountTodosCopyCard";
      card.className = "hand-export-item-count-todos-copy";
      const brandTodos = $("#handBrandTodosDomainCopyCard");
      const itemExp = $("#handItemCountExportBrandCopyCard");
      const domBrand = $("#handDomainBrandExportCopyCard");
      if (brandTodos && brandTodos.parentNode)
        brandTodos.insertAdjacentElement("afterend", card);
      else if (itemExp && itemExp.parentNode)
        itemExp.insertAdjacentElement("afterend", card);
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
      const exportPath = String(data.export_path || "").trim() || "无导出路径";
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const todos = data.todos;
      const tcount = Array.isArray(todos) ? todos.length : 0;
      const combo = exportPath + " · " + icount + " · " + tcount;
      const line = "手册导出 · 条目 · 待办 · " + combo;
      card.innerHTML = `<p class="muted hand-export-item-count-todos-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportItemCountTodosCopyBtn">复制导出条目待办</button>`;
      const btn = $("#handExportItemCountTodosCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出条目待办" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出条目待办暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+就绪+应用名+域名组合复制 + round 层含 117 */
  async function paintBrandEnOkAppDomainR117CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnOkAppDomainR117CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnOkAppDomainR117CopyCard";
      card.className = "card brand-en-ok-app-domain-r117-copy-card";
      const okApp = $("#okAppVersionDomainR116CopyCard");
      const domOk = $("#domainOkAppBrandEnR115CopyCard");
      const appVer = $("#appVersionBrandEnOkR114CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okApp && okApp.parentNode)
        okApp.insertAdjacentElement("beforebegin", card);
      else if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (appVer && appVer.parentNode)
        appVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + ready + " · " + app + " · " + domain;
      card.innerHTML = `<h3>英文品牌 · 就绪 · 应用 · 域名</h3>
        <p class="muted">一键复制英文品牌、就绪状态、应用名与域名（演示级）。</p>
        <p class="brand-en-ok-app-domain-r117-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnOkAppDomainR117CopyBtn">复制英文就绪应用域名</button>`;
      const btn = $("#brandEnOkAppDomainR117CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪应用域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 就绪 · 应用 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList117() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 117;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 117); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round117 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppOkVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryCategoryIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdTagDisposeCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinReadableIntervalPlainR117Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetPctBalancePlainR117Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleServiceNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteMissingCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactPassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportItemCountTodosCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppOkVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryCategoryIdCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdTagDisposeCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinReadableIntervalPlainR117Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetPctBalancePlainR117Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleServiceNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteMissingCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactPassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportItemCountTodosCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkAppDomainR117CopyCard().catch(() => {});
        paintRoundLayerList117();
      }, 710);
      setTimeout(() => {
        paintBrandEnOkAppDomainR117CopyCard().catch(() => {});
        paintRoundLayerList117();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeAppOkVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyBeneficiaryCategoryIdCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetIdTagDisposeCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinReadableIntervalPlainR117Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetPctBalancePlainR117Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleServiceNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportItemCountTodosCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkAppDomainR117CopyCard().catch(() => {});
      paintRoundLayerList117();
    }, 730);
  }
})();
