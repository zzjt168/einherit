/* 电子继承 · 第一百二十六批增量（叠在 round125…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round126SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeDomainVersionAppCalmBarR126");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionAppCalmBarR126";
      bar.className = "home-domain-version-app-calm-bar-r126";
      bar.setAttribute("role", "status");
      const verDom = $("#homeVersionDomainOkCalmBarR125");
      const okVer = $("#homeOkVersionBrandEnCalmBarR124");
      const appDom = $("#homeAppDomainBrandEnCalmBarR123");
      if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (appDom && appDom.parentNode === home)
        appDom.insertAdjacentElement("afterend", bar);
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
      bar.innerHTML = `<span class="home-domain-version-app-calm-bar-r126-mark">域名</span>
        <span class="muted home-domain-version-app-calm-bar-r126-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionAppCalmGoR126">去设置</button>`;
      const btn = $("#homeDomainVersionAppCalmGoR126");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-app-calm-bar-r126-mark">域名</span>
        <span class="muted home-domain-version-app-calm-bar-r126-sub">域名版本应用暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionAppCalmGoR126">去设置</button>`;
      const btn = $("#homeDomainVersionAppCalmGoR126");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+分类+受益人组合复制 */
  async function ensureLegacyNotesCategoryBeneficiaryCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const category = String(it.category || "").trim() || "未填分类";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = notes + " · " + category + " · " + bene;
      el.dataset.notesCategoryBeneficiary = line;
      if (el.querySelector(".lg-copy-notes-category-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-category-beneficiary";
      btn.textContent = "复制备注分类受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesCategoryBeneficiary || "");
        softBanner(ok ? "已复制备注分类受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+平台+提示组合复制 */
  async function ensureAssetTagPlatformHintCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "无标签";
      const platform = String(it.platform || "").trim() || "未填平台";
      const hint =
        String(it.account_hint || it.hint || "").trim() || "无提示";
      const line = tag + " · " + platform + " · " + hint;
      el.dataset.tagPlatformHint = line;
      if (el.querySelector(".as-copy-tag-platform-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-platform-hint";
      btn.textContent = "复制标签平台提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagPlatformHint || "");
        softBanner(ok ? "已复制标签平台提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制间隔+下次标签文案 */
  async function ensureCheckinIntervalNextLabelPlainR126Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinIntervalNextLabelPlainR126CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinIntervalNextLabelPlainR126CopyCard";
      card.className = "checkin-interval-next-label-plain-r126-copy";
      const hrsGrace = $("#checkinHoursRemainingGracePlainR125CopyCard");
      const nextInt = $("#checkinNextLabelIntervalPlainR124CopyCard");
      const graceHrs = $("#checkinGraceHoursRemainingPlainR123CopyCard");
      if (hrsGrace && hrsGrace.parentNode)
        hrsGrace.insertAdjacentElement("afterend", card);
      else if (nextInt && nextInt.parentNode)
        nextInt.insertAdjacentElement("afterend", card);
      else if (graceHrs && graceHrs.parentNode)
        graceHrs.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const intervalRaw = cd.interval_hours;
      const interval =
        intervalRaw == null || intervalRaw === ""
          ? "—"
          : String(Number(intervalRaw));
      const nextLabel = String(cd.next_suggested_label || "").trim() || "—";
      const combo = interval + " · " + nextLabel;
      const line =
        "报备间隔小时 · 下次建议标签 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-interval-next-label-plain-r126-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinIntervalNextLabelPlainR126CopyBtn">复制间隔下次标签R126</button>`;
      const btn = $("#checkinIntervalNextLabelPlainR126CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制间隔下次标签R126" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">间隔下次标签文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+缺口+门槛组合复制 */
  async function ensureTravelMetShortfallThresholdPlainR126Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetShortfallThresholdPlainR126CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetShortfallThresholdPlainR126CopyCard";
      card.className = "travel-met-shortfall-threshold-plain-r126-copy";
      const pctBal = $("#travelPctBalanceMetPlainR125CopyCard");
      const shortBal = $("#travelShortfallBalanceThresholdPlainR124CopyCard");
      const balThr = $("#travelBalanceThresholdMetPlainR123CopyCard");
      if (pctBal && pctBal.parentNode)
        pctBal.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) || truthyFlag(fund.meets_threshold)
        ? "已达标"
        : "未达标";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + short + " · " + thr;
      const line =
        "差旅达标 · 缺口 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-shortfall-threshold-plain-r126-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetShortfallThresholdPlainR126CopyBtn">复制达标缺口门槛</button>`;
      const btn = $("#travelMetShortfallThresholdPlainR126CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标缺口门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标缺口门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+预算+拜访偏好组合复制 */
  async function ensureAftercareCityBudgetVisitCopyButtons() {
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
      const budgetRaw = it.travel_budget != null ? it.travel_budget : it.budget;
      const budget =
        budgetRaw == null || budgetRaw === ""
          ? "无预算"
          : String(Math.round(Number(budgetRaw)));
      const visit =
        String(it.visit_pref || it.visit || "").trim() || "未填拜访";
      const line = city + " · " + budget + " · " + visit;
      el.dataset.cityBudgetVisit = line;
      if (el.querySelector(".ac-copy-city-budget-visit")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-budget-visit";
      btn.textContent = "复制城市预算拜访";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityBudgetVisit || "");
        softBanner(ok ? "已复制城市预算拜访" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口+缺失+就绪组合复制 */
  async function ensureAuthGateMissingReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateMissingReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateMissingReadyCopyCard";
      card.className = "av-gate-missing-ready-copy";
      const checklist = $("#avChecklistCompleteGateCopyCard");
      const completeList = $("#avCompleteChecklistReadyCopyCard");
      const missComp = $("#avMissingCompleteReadyCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (completeList && completeList.parentNode)
        completeList.insertAdjacentElement("afterend", card);
      else if (missComp && missComp.parentNode)
        missComp.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = truthyFlag(data.ready) ? "闸口开" : "闸口关";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo =
        gate + " · 缺失 " + missing.length + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-missing-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateMissingReadyCopyBtn">复制闸口缺失就绪</button>`;
      const btn = $("#avGateMissingReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制闸口缺失就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">闸口缺失就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+口令提示+联系组合复制 */
  async function ensureHeirRelationPassphraseContactCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = relation + " · " + hint + " · " + contact;
      if (el.querySelector(".bn-copy-relation-passphrase-contact")) return;
      el.dataset.relationPassphraseContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-passphrase-contact";
      btn.textContent = "复制关系口令联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationPassphraseContact || "");
        softBanner(ok ? "已复制关系口令联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数+品牌+域名组合复制 */
  async function ensureHandoverItemCountBrandDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountBrandDomainCopyCard";
      card.className = "hand-item-count-brand-domain-copy";
      const domainBrand = $("#handDomainBrandItemCountCopyCard");
      const todosBrand = $("#handTodosBrandItemCountCopyCard");
      const brandDom = $("#handBrandDomainTodosCopyCard");
      if (domainBrand && domainBrand.parentNode)
        domainBrand.insertAdjacentElement("afterend", card);
      else if (todosBrand && todosBrand.parentNode)
        todosBrand.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const ic =
        data.item_count != null
          ? String(data.item_count)
          : Array.isArray(data.todos)
            ? String(data.todos.length)
            : "—";
      const brand = String(data.brand || "").trim() || "无品牌";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = ic + " · " + brand + " · " + domain;
      const line = "手册条目 · 品牌 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-brand-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountBrandDomainCopyBtn">复制条目品牌域名</button>`;
      const btn = $("#handItemCountBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目品牌域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目品牌域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+就绪+英文品牌组合复制 + round 层含 126 */
  async function paintVersionDomainOkBrandEnR126CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionDomainOkBrandEnR126CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionDomainOkBrandEnR126CopyCard";
      card.className = "card version-domain-ok-brand-en-r126-copy-card";
      const appOk = $("#appOkBrandEnVersionR125CopyCard");
      const brandEn = $("#brandEnVersionOkAppR124CopyCard");
      const okVer = $("#okVersionDomainAppR123CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + domain + " · " + ready + " · " + en;
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 英文</h3>
        <p class="muted">一键复制版本、域名、就绪状态与英文品牌（演示级）。</p>
        <p class="version-domain-ok-brand-en-r126-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionDomainOkBrandEnR126CopyBtn">复制版本域名就绪英文</button>`;
      const btn = $("#versionDomainOkBrandEnR126CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 就绪 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList126() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 126;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 126); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round126 均已挂载。</p>`
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
      () => ensureLegacyNotesCategoryBeneficiaryCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagPlatformHintCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinIntervalNextLabelPlainR126Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetShortfallThresholdPlainR126Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityBudgetVisitCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthGateMissingReadyCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationPassphraseContactCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountBrandDomainCopy().catch(() => {}),
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
        () => ensureLegacyNotesCategoryBeneficiaryCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagPlatformHintCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinIntervalNextLabelPlainR126Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetShortfallThresholdPlainR126Copy().catch(() => {}),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityBudgetVisitCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthGateMissingReadyCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationPassphraseContactCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountBrandDomainCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainOkBrandEnR126CopyCard().catch(() => {});
        paintRoundLayerList126();
      }, 710);
      setTimeout(() => {
        paintVersionDomainOkBrandEnR126CopyCard().catch(() => {});
        paintRoundLayerList126();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeDomainVersionApp().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyNotesCategoryBeneficiaryCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetTagPlatformHintCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinIntervalNextLabelPlainR126Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetShortfallThresholdPlainR126Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityBudgetVisitCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateMissingReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationPassphraseContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountBrandDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainOkBrandEnR126CopyCard().catch(() => {});
      paintRoundLayerList126();
    }, 730);
  }
})();
