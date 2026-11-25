/* 电子继承 · 第一百二十九批增量（叠在 round128…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round129SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌+版本冷静条 */
  async function paintHomeDomainBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnVersionCalmBarR129");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnVersionCalmBarR129";
      bar.className = "home-domain-brand-en-version-calm-r129";
      bar.setAttribute("role", "status");
      const okApp = $("#homeOkAppDomainCalmBarR128");
      const brandEn = $("#homeBrandEnDomainOkCalmBarR127");
      const domVer = $("#homeDomainVersionAppCalmBarR126");
      if (okApp && okApp.parentNode === home)
        okApp.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r129-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r129-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR129">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR129");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r129-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r129-sub">域名英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR129">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR129");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割部门+处置动作+备注组合复制 */
  async function ensureLegacyDeptActionNotesCopyButtons() {
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
      const dept = String(it.dept || "").trim() || "未填部门";
      const action = String(it.action || "").trim() || "未填处置";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = dept + " · " + action + " · " + notes;
      el.dataset.deptActionNotes = line;
      if (el.querySelector(".lg-copy-dept-action-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-dept-action-notes";
      btn.textContent = "复制部门处置备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deptActionNotes || "");
        softBanner(ok ? "已复制部门处置备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置说明+平台+草稿组合复制 */
  async function ensureAssetDisposePlatformDraftCopyButtons() {
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
      const dispose = String(it.dispose_note || "").trim() || "无处置说明";
      const platform = String(it.platform || "").trim() || "未填平台";
      const draft = truthyFlag(it.draft) ? "草稿" : "已定稿";
      const line = dispose + " · " + platform + " · " + draft;
      el.dataset.disposePlatformDraft = line;
      if (el.querySelector(".as-copy-dispose-platform-draft")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-platform-draft";
      btn.textContent = "复制处置平台草稿";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposePlatformDraft || "");
        softBanner(ok ? "已复制处置平台草稿" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制宽限小时+剩余小时文案 */
  async function ensureCheckinGraceHoursRemainingPlainR129Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinGraceHoursRemainingPlainR129CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinGraceHoursRemainingPlainR129CopyCard";
      card.className = "checkin-grace-hours-remaining-plain-r129-copy";
      const hrsInt = $("#checkinHoursRemainingIntervalPlainR128CopyCard");
      const lastOk = $("#checkinLastOkNextDuePlainR127CopyCard");
      const intNext = $("#checkinIntervalNextLabelPlainR126CopyCard");
      if (hrsInt && hrsInt.parentNode)
        hrsInt.insertAdjacentElement("afterend", card);
      else if (lastOk && lastOk.parentNode)
        lastOk.insertAdjacentElement("afterend", card);
      else if (intNext && intNext.parentNode)
        intNext.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const graceRaw = cd.grace_hours;
      const grace =
        graceRaw == null || graceRaw === ""
          ? "—"
          : String(Number(graceRaw));
      const hrsRaw = cd.hours_remaining;
      const hrs =
        hrsRaw == null || hrsRaw === ""
          ? "—"
          : String(Math.round(Number(hrsRaw) * 100) / 100);
      const combo = grace + " · " + hrs;
      const line =
        "宽限小时 · 剩余小时 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-grace-hours-remaining-plain-r129-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinGraceHoursRemainingPlainR129CopyBtn">复制宽限剩余R129</button>`;
      const btn = $("#checkinGraceHoursRemainingPlainR129CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制宽限剩余R129" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">宽限剩余文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+达标+进度组合复制 */
  async function ensureTravelBalanceMetProgressPlainR129Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetProgressPlainR129CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetProgressPlainR129CopyCard";
      card.className = "travel-balance-met-progress-plain-r129-copy";
      const shortProg = $("#travelShortfallProgressThresholdPlainR128CopyCard");
      const curBal = $("#travelCurrencyBalanceMetPlainR127CopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainR126CopyCard");
      if (shortProg && shortProg.parentNode)
        shortProg.insertAdjacentElement("afterend", card);
      else if (curBal && curBal.parentNode)
        curBal.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const combo = bal + " · " + met + " · " + pct + "%";
      const line =
        "差旅余额 · 达标 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-met-progress-plain-r129-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetProgressPlainR129CopyBtn">复制余额达标进度</button>`;
      const btn = $("#travelBalanceMetProgressPlainR129CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额达标进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额达标进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后预算+城市+标题组合复制 */
  async function ensureAftercareBudgetCityTitleCopyButtons() {
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
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const city = String(it.city || "").trim() || "未填城市";
      const title = String(it.title || "").trim() || "无标题";
      const line = budget + " · " + city + " · " + title;
      el.dataset.budgetCityTitle = line;
      if (el.querySelector(".ac-copy-budget-city-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-city-title";
      btn.textContent = "复制预算城市标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetCityTitle || "");
        softBanner(ok ? "已复制预算城市标题" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完整+缺失数+闸口组合复制 */
  async function ensureAuthCompleteMissingGateCountCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingGateCountR129CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingGateCountR129CopyCard";
      card.className = "av-complete-missing-gate-count-r129";
      const gateReady = $("#avGateReadyChecklistCountR128CopyCard");
      const readyMiss = $("#avReadyCompleteMissingCountR127CopyCard");
      const gate = $("#avGateMissingReadyCopyCard");
      if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
      const gateOpen = truthyFlag(data.ready) ? "闸口开" : "闸口关";
      const combo =
        complete + " · 缺失 " + missing.length + " · " + gateOpen;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-gate-count-r129-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingGateCountR129CopyBtn">复制完整缺失闸口</button>`;
      const btn = $("#avCompleteMissingGateCountR129CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完整缺失闸口" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完整缺失闸口暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+角色组合复制 */
  async function ensureHeirRelationNameRoleCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const role = String(it.role || "").trim() || "未填角色";
      const line = relation + " · " + name + " · " + role;
      if (el.querySelector(".bn-copy-relation-name-role")) return;
      el.dataset.relationNameRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-role";
      btn.textContent = "复制关系姓名角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNameRole || "");
        softBanner(ok ? "已复制关系姓名角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+条目数+版本组合复制 */
  async function ensureHandoverDomainItemCountVersionCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainItemCountVersionCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainItemCountVersionCopyCard";
      card.className = "hand-domain-item-count-version-copy";
      const todosDom = $("#handTodosDomainBrandCopyCard");
      const brandVer = $("#handBrandVersionItemCountCopyCard");
      const itemBrand = $("#handItemCountBrandDomainCopyCard");
      if (todosDom && todosDom.parentNode)
        todosDom.insertAdjacentElement("afterend", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("afterend", card);
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
      const domain = String(data.domain || "").trim() || "无域名";
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const ver =
        String(data.version || data.server_version || "").trim() || "—";
      const combo = domain + " · " + ic + " · " + ver;
      const line = "手册域名 · 条目 · 版本 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-item-count-version-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainItemCountVersionCopyBtn">复制域名条目版本</button>`;
      const btn = $("#handDomainItemCountVersionCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名条目版本" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名条目版本暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+应用+英文品牌+就绪组合复制 + round 层含 129 */
  async function paintVersionAppBrandEnOkR129CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionAppBrandEnOkR129CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionAppBrandEnOkR129CopyCard";
      card.className = "card settings-version-app-brand-en-ok-r129-copy-card";
      const okBrand = $("#settingsOkBrandEnDomainAppR128CopyCard");
      const appDom = $("#settingsAppDomainVersionOkR127CopyCard");
      const verDom = $("#versionDomainOkBrandEnR126CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const app = String(h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · " + app + " · " + en + " · " + ready;
      card.innerHTML = `<h3>版本 · 应用 · 英文 · 就绪</h3>
        <p class="muted">一键复制版本、应用名、英文品牌与就绪状态（演示级）。</p>
        <p class="settings-version-app-brand-en-ok-r129-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionAppBrandEnOkR129CopyBtn">复制版本应用英文就绪</button>`;
      const btn = $("#settingsVersionAppBrandEnOkR129CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本应用英文就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 应用 · 英文 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList129() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 129;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 129); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round129 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeptActionNotesCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposePlatformDraftCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinGraceHoursRemainingPlainR129Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceMetProgressPlainR129Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetCityTitleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingGateCountCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNameRoleCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainItemCountVersionCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeptActionNotesCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposePlatformDraftCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinGraceHoursRemainingPlainR129Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceMetProgressPlainR129Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetCityTitleCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingGateCountCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNameRoleCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainItemCountVersionCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionAppBrandEnOkR129CopyCard().catch(() => {});
        paintRoundLayerList129();
      }, 710);
      setTimeout(() => {
        paintVersionAppBrandEnOkR129CopyCard().catch(() => {});
        paintRoundLayerList129();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyDeptActionNotesCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetDisposePlatformDraftCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinGraceHoursRemainingPlainR129Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetProgressPlainR129Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetCityTitleCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingGateCountCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNameRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainItemCountVersionCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionAppBrandEnOkR129CopyCard().catch(() => {});
      paintRoundLayerList129();
    }, 730);
  }
})();
