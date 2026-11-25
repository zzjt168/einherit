/* 电子继承 · 第一百二十七批增量（叠在 round126…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round127SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+域名+就绪冷静条 */
  async function paintHomeBrandEnDomainOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainOkCalmBarR127");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainOkCalmBarR127";
      bar.className = "home-brand-en-domain-ok-calm-r127";
      bar.setAttribute("role", "status");
      const domVer = $("#homeDomainVersionAppCalmBarR126");
      const verDom = $("#homeVersionDomainOkCalmBarR125");
      const okVer = $("#homeOkVersionBrandEnCalmBarR124");
      if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + domain + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-r127-mark">英文</span>
        <span class="muted home-brand-en-domain-ok-calm-r127-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGoR127">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGoR127");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-r127-mark">英文</span>
        <span class="muted home-brand-en-domain-ok-calm-r127-sub">英文域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGoR127">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGoR127");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置动作+出厂重置+清照片组合复制 */
  async function ensureLegacyActionFactoryClearPhotosCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const factory = truthyFlag(it.factory_reset) ? "出厂重置" : "不出厂重置";
      const photos = truthyFlag(it.clear_photos) ? "清照片" : "保留照片";
      const line = action + " · " + factory + " · " + photos;
      el.dataset.actionFactoryClearPhotos = line;
      if (el.querySelector(".lg-copy-action-factory-clear-photos")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-action-factory-clear-photos";
      btn.textContent = "复制处置重置照片";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.actionFactoryClearPhotos || "");
        softBanner(ok ? "已复制处置重置照片" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+处置说明+部门组合复制 */
  async function ensureAssetSummaryDisposeDeptCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = summary + " · " + dispose + " · " + dept;
      el.dataset.summaryDisposeDept = line;
      if (el.querySelector(".as-copy-summary-dispose-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-dispose-dept";
      btn.textContent = "复制摘要处置部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryDisposeDept || "");
        softBanner(ok ? "已复制摘要处置部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近标签+下次到期文案 */
  async function ensureCheckinLastOkNextDuePlainR127Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastOkNextDuePlainR127CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastOkNextDuePlainR127CopyCard";
      card.className = "checkin-last-ok-next-due-plain-r127-copy";
      const intNext = $("#checkinIntervalNextLabelPlainR126CopyCard");
      const hrsGrace = $("#checkinHoursRemainingGracePlainR125CopyCard");
      const nextInt = $("#checkinNextLabelIntervalPlainR124CopyCard");
      if (intNext && intNext.parentNode)
        intNext.insertAdjacentElement("afterend", card);
      else if (hrsGrace && hrsGrace.parentNode)
        hrsGrace.insertAdjacentElement("afterend", card);
      else if (nextInt && nextInt.parentNode)
        nextInt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const lastOk = String(cd.last_checkin_label || "").trim() || "—";
      const nextDue = String(cd.next_suggested_label || "").trim() || "—";
      const combo = lastOk + " · " + nextDue;
      const line =
        "最近报备标签 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ok-next-due-plain-r127-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastOkNextDuePlainR127CopyBtn">复制最近下次R127</button>`;
      const btn = $("#checkinLastOkNextDuePlainR127CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制最近下次R127" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅币种+余额+达标组合复制 */
  async function ensureTravelCurrencyBalanceMetPlainR127Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelCurrencyBalanceMetPlainR127CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelCurrencyBalanceMetPlainR127CopyCard";
      card.className = "travel-currency-balance-met-plain-r127-copy";
      const metShort = $("#travelMetShortfallThresholdPlainR126CopyCard");
      const pctBal = $("#travelPctBalanceMetPlainR125CopyCard");
      const shortBal = $("#travelShortfallBalanceThresholdPlainR124CopyCard");
      if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (pctBal && pctBal.parentNode)
        pctBal.insertAdjacentElement("afterend", card);
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
      const currency = String(fund.currency || "¥").trim() || "¥";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const combo = currency + " · " + bal + " · " + met;
      const line =
        "差旅币种 · 余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-currency-balance-met-plain-r127-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelCurrencyBalanceMetPlainR127CopyBtn">复制币种余额达标</button>`;
      const btn = $("#travelCurrencyBalanceMetPlainR127CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制币种余额达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">币种余额达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+城市+备注组合复制 */
  async function ensureAftercareServiceCityNotesCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const city = String(it.city || "").trim() || "未填城市";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = service + " · " + city + " · " + notes;
      el.dataset.serviceCityNotes = line;
      if (el.querySelector(".ac-copy-service-city-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-city-notes";
      btn.textContent = "复制服务城市备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceCityNotes || "");
        softBanner(ok ? "已复制服务城市备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+清单完整+缺失数组合复制 */
  async function ensureAuthReadyCompleteMissingCountCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCountR127CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCountR127CopyCard";
      card.className = "av-ready-complete-missing-count-r127";
      const gate = $("#avGateMissingReadyCopyCard");
      const checklist = $("#avChecklistCompleteGateCopyCard");
      const completeList = $("#avCompleteChecklistReadyCopyCard");
      if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (completeList && completeList.parentNode)
        completeList.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
      const combo =
        ready + " · " + complete + " · 缺失 " + missing.length;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-missing-count-r127-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCountR127CopyBtn">复制就绪完整缺失</button>`;
      const btn = $("#avReadyCompleteMissingCountR127CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完整缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完整缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+角色+关系组合复制 */
  async function ensureHeirNameRoleRelationCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = name + " · " + role + " · " + relation;
      if (el.querySelector(".bn-copy-name-role-relation")) return;
      el.dataset.nameRoleRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-role-relation";
      btn.textContent = "复制姓名角色关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRoleRelation || "");
        softBanner(ok ? "已复制姓名角色关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+版本+条目数组合复制 */
  async function ensureHandoverBrandVersionItemCountCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandVersionItemCountCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandVersionItemCountCopyCard";
      card.className = "hand-brand-version-item-count-copy";
      const itemBrand = $("#handItemCountBrandDomainCopyCard");
      const domainBrand = $("#handDomainBrandItemCountCopyCard");
      const todosBrand = $("#handTodosBrandItemCountCopyCard");
      if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (domainBrand && domainBrand.parentNode)
        domainBrand.insertAdjacentElement("afterend", card);
      else if (todosBrand && todosBrand.parentNode)
        todosBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "无品牌";
      const ver =
        String(data.version || data.server_version || "").trim() || "—";
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const combo = brand + " · " + ver + " · " + ic;
      const line = "手册品牌 · 版本 · 条目 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-version-item-count-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandVersionItemCountCopyBtn">复制品牌版本条目</button>`;
      const btn = $("#handBrandVersionItemCountCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌版本条目" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌版本条目暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用+域名+版本+就绪组合复制 + round 层含 127 */
  async function paintAppDomainVersionOkR127CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsAppDomainVersionOkR127CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsAppDomainVersionOkR127CopyCard";
      card.className = "card settings-app-domain-version-ok-r127-copy-card";
      const verDom = $("#versionDomainOkBrandEnR126CopyCard");
      const appOk = $("#appOkBrandEnVersionR125CopyCard");
      const brandEn = $("#brandEnVersionOkAppR124CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = app + " · " + domain + " · " + ver + " · " + ready;
      card.innerHTML = `<h3>应用 · 域名 · 版本 · 就绪</h3>
        <p class="muted">一键复制应用名、域名、版本与就绪状态（演示级）。</p>
        <p class="settings-app-domain-version-ok-r127-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsAppDomainVersionOkR127CopyBtn">复制应用域名版本就绪</button>`;
      const btn = $("#settingsAppDomainVersionOkR127CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用域名版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 域名 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList127() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 127;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 127); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round127 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyActionFactoryClearPhotosCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryDisposeDeptCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastOkNextDuePlainR127Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelCurrencyBalanceMetPlainR127Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceCityNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteMissingCountCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRoleRelationCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandVersionItemCountCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyActionFactoryClearPhotosCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryDisposeDeptCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastOkNextDuePlainR127Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelCurrencyBalanceMetPlainR127Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceCityNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteMissingCountCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRoleRelationCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandVersionItemCountCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppDomainVersionOkR127CopyCard().catch(() => {});
        paintRoundLayerList127();
      }, 710);
      setTimeout(() => {
        paintAppDomainVersionOkR127CopyCard().catch(() => {});
        paintRoundLayerList127();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyActionFactoryClearPhotosCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetSummaryDisposeDeptCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastOkNextDuePlainR127Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelCurrencyBalanceMetPlainR127Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceCityNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCountCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRoleRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandVersionItemCountCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppDomainVersionOkR127CopyCard().catch(() => {});
      paintRoundLayerList127();
    }, 730);
  }
})();
