/* 电子继承 · 第一百零一批增量（叠在 round100…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round101SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名英文就绪冷静条 */
  async function paintHomeDomainBrandEnOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnOkCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnOkCalmBar";
      bar.className = "home-domain-brand-en-ok-calm-bar";
      bar.setAttribute("role", "status");
      const okBrand = $("#homeOkBrandEnVersionCalmBar");
      const appDom = $("#homeAppDomainVersionCalmBar");
      const brandOk = $("#homeBrandEnDomainOkCalmBar");
      if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = domain + " · " + en + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-ok-calm-mark">站点</span>
        <span class="muted home-domain-brand-en-ok-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnOkCalmGo">去设置</button>`;
      const btn = $("#homeDomainBrandEnOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-ok-calm-mark">站点</span>
        <span class="muted home-domain-brand-en-ok-calm-sub">域名英文就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnOkCalmGo">去设置</button>`;
      const btn = $("#homeDomainBrandEnOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+分类+部门组合复制 */
  async function ensureLegacyTitleCategoryDeptCopyButtons() {
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
      const category = String(it.category || "").trim() || "未填分类";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = title + " · " + category + " · " + dept;
      el.dataset.titleCategoryDept = line;
      if (el.querySelector(".lg-copy-title-category-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-category-dept";
      btn.textContent = "复制标题分类部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleCategoryDept || "");
        softBanner(ok ? "已复制标题分类部门" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+部门+标签组合复制 */
  async function ensureAssetPlatformDeptTagCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = platform + " · " + dept + " · " + tag;
      el.dataset.platformDeptTag = line;
      if (el.querySelector(".as-copy-platform-dept-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-dept-tag";
      btn.textContent = "复制平台部门标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformDeptTag || "");
        softBanner(ok ? "已复制平台部门标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近距今说明 */
  async function ensureCheckinLastAgoLabelPlainR101Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoLabelPlainR101CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoLabelPlainR101CopyCard";
      card.className = "checkin-last-ago-label-plain-r101-copy";
      const next = $("#checkinNextSuggestedLabelPlainR100CopyCard");
      const hours = $("#checkinIntervalHoursPlainR99CopyCard");
      const lastAt = $("#checkinLastCheckinAtPlainR98CopyCard");
      if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
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
      const label =
        String((st.countdown || {}).last_ago_label || "").trim() || "—";
      const line =
        "最近报备 · " +
        label +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-label-plain-r101-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoLabelPlainR101CopyBtn">复制最近距今说明</button>`;
      const btn = $("#checkinLastAgoLabelPlainR101CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(label);
          softBanner(ok ? "已复制最近距今说明" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近距今说明暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+缺口+达标组合复制 */
  async function ensureTravelBalanceShortfallMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallMetPlainCopyCard";
      card.className = "travel-balance-shortfall-met-plain-copy";
      const shortMet = $("#travelShortfallThresholdMetPlainCopyCard");
      const pctShort = $("#travelProgressPctShortfallPlainCopyCard");
      const metBal = $("#travelMetBalanceThresholdPlainCopyCard");
      if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = bal + " · " + short + " · " + met;
      const line =
        "差旅余额 · 缺口 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallMetPlainCopyBtn">复制余额缺口达标</button>`;
      const btn = $("#travelBalanceShortfallMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额缺口达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额缺口达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+城市+备注组合复制 */
  async function ensureAftercareStatusCityNotesCopyButtons() {
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
      const status = String(it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = status + " · " + city + " · " + notes;
      el.dataset.statusCityNotes = line;
      if (el.querySelector(".ac-copy-status-city-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-city-notes";
      btn.textContent = "复制状态城市备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusCityNotes || "");
        softBanner(ok ? "已复制状态城市备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+进度+就绪组合复制 */
  async function ensureAuthCompleteProgressReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteProgressReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteProgressReadyCopyCard";
      card.className = "av-complete-progress-ready-copy";
      const gate = $("#avGateProgressReadyCopyCard");
      const checklist = $("#avChecklistProgressReadyCopyCard");
      const complete = $("#avCompleteGateReadyCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const prog = data.progress || {};
      const done = prog.done == null ? "—" : String(prog.done);
      const total = prog.total == null ? "—" : String(prog.total);
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = doneFlag + " · " + done + "/" + total + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-progress-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteProgressReadyCopyBtn">复制完成进度就绪</button>`;
      const btn = $("#avCompleteProgressReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成进度就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成进度就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+角色+口令提示组合复制 */
  async function ensureHeirNameRolePassphraseCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = name + " · " + role + " · " + phrase;
      if (el.querySelector(".bn-copy-name-role-passphrase")) return;
      el.dataset.nameRolePassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-role-passphrase";
      btn.textContent = "复制姓名角色口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRolePassphrase || "");
        softBanner(ok ? "已复制姓名角色口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+条目数+导出路径组合复制 */
  async function ensureHandoverDomainItemCountExportCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainItemCountExportCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainItemCountExportCopyCard";
      card.className = "hand-domain-item-count-export-copy";
      const brandItem = $("#handBrandItemCountExportCopyCard");
      const todos = $("#handTodoCountExportPathCopyCard");
      const domBrand = $("#handDomainBrandR98CopyCard");
      if (brandItem && brandItem.parentNode)
        brandItem.insertAdjacentElement("afterend", card);
      else if (todos && todos.parentNode)
        todos.insertAdjacentElement("afterend", card);
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
      const domain = String(data.domain || "").trim() || "无域名";
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const path = String(data.export_path || "").trim() || "无导出路径";
      const combo = domain + " · " + count + " · " + path;
      const line = "手册域名 · 条目 · 导出 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-item-count-export-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainItemCountExportCopyBtn">复制域名条目导出</button>`;
      const btn = $("#handDomainItemCountExportCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名条目导出" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名条目导出暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+就绪+版本组合复制 + round 层含 101 */
  async function paintBrandEnOkVersionR101CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnOkVersionR101CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnOkVersionR101CopyCard";
      card.className = "card brand-en-ok-version-r101-copy-card";
      const appDom = $("#appDomainOkVersionR100CopyCard");
      const brandEn = $("#brandEnDomainVersionR99CopyCard");
      const appOk = $("#appOkVersionR98CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = en + " · " + ready + " · " + ver;
      card.innerHTML = `<h3>英文品牌 · 就绪 · 版本</h3>
        <p class="muted">一键复制英文品牌、就绪状态与版本（演示级）。</p>
        <p class="brand-en-ok-version-r101-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnOkVersionR101CopyBtn">复制英文就绪版本</button>`;
      const btn = $("#brandEnOkVersionR101CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList101() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 101;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 101); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round101 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleCategoryDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformDeptTagCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoLabelPlainR101Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceShortfallMetPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusCityNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteProgressReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRolePassphraseCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainItemCountExportCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleCategoryDeptCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformDeptTagCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoLabelPlainR101Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceShortfallMetPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareStatusCityNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteProgressReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRolePassphraseCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainItemCountExportCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnOkVersionR101CopyCard().catch(() => {});
        paintRoundLayerList101();
      }, 710);
      setTimeout(() => {
        paintBrandEnOkVersionR101CopyCard().catch(() => {});
        paintRoundLayerList101();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyTitleCategoryDeptCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformDeptTagCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoLabelPlainR101Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusCityNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteProgressReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRolePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainItemCountExportCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnOkVersionR101CopyCard().catch(() => {});
      paintRoundLayerList101();
    }, 730);
  }
})();
