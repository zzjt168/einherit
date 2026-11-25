/* 电子继承 · 第一百一十一批增量（叠在 round110…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round111SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名版本应用冷静条 */
  async function paintHomeDomainVersionApp() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionAppCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionAppCalmBar";
      bar.className = "home-domain-version-app-calm-bar";
      bar.setAttribute("role", "status");
      const okApp = $("#homeOkAppBrandEnCalmBar");
      const verOk = $("#homeVersionOkAppCalmBar");
      const brandEn = $("#homeBrandEnOkDomainCalmBar");
      if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else if (verOk && verOk.parentNode === home)
        verOk.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const app = String(h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-app-calm-mark">站点</span>
        <span class="muted home-domain-version-app-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionAppCalmGo">去设置</button>`;
      const btn = $("#homeDomainVersionAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-app-calm-mark">站点</span>
        <span class="muted home-domain-version-app-calm-sub">域名版本应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionAppCalmGo">去设置</button>`;
      const btn = $("#homeDomainVersionAppCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割部门+标题+受益人组合复制 */
  async function ensureLegacyDeptTitleBeneficiaryCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const title = String(it.title || "").trim() || "未填标题";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = dept + " · " + title + " · " + ben;
      el.dataset.deptTitleBeneficiary = line;
      if (el.querySelector(".lg-copy-dept-title-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-title-beneficiary";
      btn.textContent = "复制部门标题受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptTitleBeneficiary || "");
        softBanner(ok ? "已复制部门标题受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标签+处置组合复制 */
  async function ensureAssetPlatformTagDisposeCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "未填标签";
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const line = platform + " · " + tag + " · " + dispose;
      el.dataset.platformTagDispose = line;
      if (el.querySelector(".as-copy-platform-tag-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-tag-dispose";
      btn.textContent = "复制平台标签处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTagDispose || "");
        softBanner(ok ? "已复制平台标签处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余到期文案 */
  async function ensureCheckinHoursLeftDuePlainR111Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursLeftDuePlainR111CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursLeftDuePlainR111CopyCard";
      card.className = "checkin-hours-left-due-plain-r111-copy";
      const lastAt = $("#checkinLastAtIntervalPlainR110CopyCard");
      const nextAt = $("#checkinNextAtPlainR109CopyCard");
      const hoursAgo = $("#checkinHoursAgoIntervalPlainR108CopyCard");
      if (lastAt && lastAt.parentNode)
        lastAt.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else if (hoursAgo && hoursAgo.parentNode)
        hoursAgo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const remRaw = cd.hours_remaining;
      const rem =
        remRaw == null || remRaw === ""
          ? "—"
          : String(Math.round(Number(remRaw) * 100) / 100);
      const due = truthyFlag(cd.due_soon) ? "即将到期" : "未临期";
      const combo = rem + " · " + due;
      const line =
        "报备剩余 · 到期 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-left-due-plain-r111-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursLeftDuePlainR111CopyBtn">复制剩余到期文案R111</button>`;
      const btn = $("#checkinHoursLeftDuePlainR111CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制剩余到期文案R111" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余到期文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+达标组合复制 */
  async function ensureTravelThresholdBalanceMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceMetPlainCopyCard";
      card.className = "travel-threshold-balance-met-plain-copy";
      const balMet = $("#travelBalanceMetShortfallPlainCopyCard");
      const metPct = $("#travelMetPctThresholdPlainCopyCard");
      const pctShort = $("#travelPctShortfallBalancePlainCopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (pctShort && pctShort.parentNode)
        pctShort.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = thr + " · " + bal + " · " + met;
      const line =
        "差旅门槛 · 余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceMetPlainCopyBtn">复制门槛余额达标</button>`;
      const btn = $("#travelThresholdBalanceMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+备注+状态组合复制 */
  async function ensureAftercareCityNotesStatusCopyButtons() {
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
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const line = city + " · " + notes + " · " + status;
      el.dataset.cityNotesStatus = line;
      if (el.querySelector(".ac-copy-city-notes-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-notes-status";
      btn.textContent = "复制城市备注状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityNotesStatus || "");
        softBanner(ok ? "已复制城市备注状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频清单数+完成组合复制 */
  async function ensureAuthChecklistCountCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avChecklistCountCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avChecklistCountCompleteCopyCard";
      card.className = "av-checklist-count-complete-copy";
      const miss = $("#avMissingChecklistReadyCopyCard");
      const gate = $("#avGateCompleteReadyCopyCard");
      const readyList = $("#avReadyChecklistCompleteCopyCard");
      if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (readyList && readyList.parentNode)
        readyList.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      const doneFlag = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = "清单 " + list.length + " · " + doneFlag;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-checklist-count-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avChecklistCountCompleteCopyBtn">复制清单数完成</button>`;
      const btn = $("#avChecklistCountCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制清单数完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">清单数完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+角色+编号组合复制 */
  async function ensureHeirNameRoleIdCopyButtons() {
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
      const line = name + " · " + role + " · #" + it.id;
      if (el.querySelector(".bn-copy-name-role-id")) return;
      el.dataset.nameRoleId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-role-id";
      btn.textContent = "复制姓名角色编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRoleId || "");
        softBanner(ok ? "已复制姓名角色编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+域名+条目数组合复制 */
  async function ensureHandoverBrandDomainItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainItemCountCopyCard";
      card.className = "hand-brand-domain-item-count-copy";
      const itemBrand = $("#handItemCountBrandTodosCopyCard");
      const exportBrand = $("#handExportTodosBrandCopyCard");
      const domainTodos = $("#handDomainTodosItemCountCopyCard");
      if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (exportBrand && exportBrand.parentNode)
        exportBrand.insertAdjacentElement("afterend", card);
      else if (domainTodos && domainTodos.parentNode)
        domainTodos.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "无品牌";
      const domain = String(data.domain || "").trim() || "无域名";
      const icount =
        data.item_count == null ? "—" : String(data.item_count);
      const combo = brand + " · " + domain + " · " + icount;
      const line = "手册品牌 · 域名 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainItemCountCopyBtn">复制品牌域名条目</button>`;
      const btn = $("#handBrandDomainItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌域名条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌域名条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+应用名+版本+就绪组合复制 + round 层含 111 */
  async function paintDomainAppVersionOkR111CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#domainAppVersionOkR111CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "domainAppVersionOkR111CopyCard";
      card.className = "card domain-app-version-ok-r111-copy-card";
      const appDom = $("#appDomainBrandEnOkR110CopyCard");
      const okDom = $("#okDomainAppVersionR109CopyCard");
      const brandEn = $("#brandEnAppOkDomainR108CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = domain + " · " + app + " · " + ver + " · " + ready;
      card.innerHTML = `<h3>域名 · 应用 · 版本 · 就绪</h3>
        <p class="muted">一键复制域名、应用名、版本与就绪状态（演示级）。</p>
        <p class="domain-app-version-ok-r111-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="domainAppVersionOkR111CopyBtn">复制域名应用版本就绪</button>`;
      const btn = $("#domainAppVersionOkR111CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名应用版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 应用 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList111() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 111;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 111); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round111 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionApp().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeptTitleBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTagDisposeCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursLeftDuePlainR111Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelThresholdBalanceMetPlainCopy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityNotesStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthChecklistCountCompleteCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(() => ensureHeirNameRoleIdCopyButtons().catch(() => {}), 650);
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandDomainItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersionApp().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeptTitleBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTagDisposeCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursLeftDuePlainR111Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelThresholdBalanceMetPlainCopy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityNotesStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthChecklistCountCompleteCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(() => ensureHeirNameRoleIdCopyButtons().catch(() => {}), 660);
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandDomainItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainAppVersionOkR111CopyCard().catch(() => {});
        paintRoundLayerList111();
      }, 710);
      setTimeout(() => {
        paintDomainAppVersionOkR111CopyCard().catch(() => {});
        paintRoundLayerList111();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainVersionApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyDeptTitleBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetPlatformTagDisposeCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursLeftDuePlainR111Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityNotesStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthChecklistCountCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRoleIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainAppVersionOkR111CopyCard().catch(() => {});
      paintRoundLayerList111();
    }, 730);
  }
})();
