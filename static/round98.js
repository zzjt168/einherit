/* 电子继承 · 第九十八批增量（叠在 round97…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round98SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文域名就绪冷静条 */
  async function paintHomeBrandEnDomainOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainOkCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainOkCalmBar";
      bar.className = "home-brand-en-domain-ok-calm-bar";
      bar.setAttribute("role", "status");
      const okDom = $("#homeOkDomainVersionCalmBar");
      const appEn = $("#homeAppBrandEnDomainCalmBar");
      const okVer = $("#homeOkVersionCalmBar");
      if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (appEn && appEn.parentNode === home)
        appEn.insertAdjacentElement("afterend", bar);
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
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = en + " · " + domain + " · " + okPart;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-mark">品牌</span>
        <span class="muted home-brand-en-domain-ok-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-ok-calm-mark">品牌</span>
        <span class="muted home-brand-en-domain-ok-calm-sub">英文域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainOkCalmGo">去设置</button>`;
      const btn = $("#homeBrandEnDomainOkCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割分类+备注+受益人组合复制 */
  async function ensureLegacyCategoryNotesBeneficiaryCopyButtons() {
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
      const cat = String(it.category || "").trim() || "未填分类";
      const notes = String(it.notes || "").trim() || "无备注";
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const line = cat + " · " + notes + " · " + ben;
      el.dataset.categoryNotesBeneficiary = line;
      if (el.querySelector(".lg-copy-category-notes-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-category-notes-beneficiary";
      btn.textContent = "复制分类备注受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryNotesBeneficiary || "");
        softBanner(ok ? "已复制分类备注受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+摘要+部门组合复制 */
  async function ensureAssetVisSummaryDeptCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const summary = String(it.summary || "").trim() || "无摘要";
      const dept = String(it.dept || "").trim() || "未填部门";
      const line = vis + " · " + summary + " · " + dept;
      el.dataset.visSummaryDept = line;
      if (el.querySelector(".as-copy-vis-summary-dept")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-vis-summary-dept";
      btn.textContent = "复制可见摘要部门";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visSummaryDept || "");
        softBanner(ok ? "已复制可见摘要部门" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制最近报备时刻 */
  async function ensureCheckinLastCheckinAtPlainR98Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastCheckinAtPlainR98CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastCheckinAtPlainR98CopyCard";
      card.className = "checkin-last-checkin-at-plain-r98-copy";
      const secs = $("#checkinSecondsRemainingPlainR97CopyCard");
      const since = $("#checkinHoursSinceLastPlainR96CopyCard");
      const countdown = $("#checkinCountdownLabelPlainR95CopyCard");
      if (secs && secs.parentNode)
        secs.insertAdjacentElement("afterend", card);
      else if (since && since.parentNode)
        since.insertAdjacentElement("afterend", card);
      else if (countdown && countdown.parentNode)
        countdown.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const plain =
        String((st.countdown || {}).last_checkin_label || "").trim() || "—";
      const line =
        "报备最近 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-checkin-at-plain-r98-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastCheckinAtPlainR98CopyBtn">复制最近报备时刻</button>`;
      const btn = $("#checkinLastCheckinAtPlainR98CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制最近报备时刻" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">最近报备时刻暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+余额+门槛组合复制 */
  async function ensureTravelMetBalanceThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetBalanceThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetBalanceThresholdPlainCopyCard";
      card.className = "travel-met-balance-threshold-plain-copy";
      const thrShort = $("#travelThresholdShortfallPlainR97CopyCard");
      const balMet = $("#travelBalanceMetPlainR96CopyCard");
      const pctMet = $("#travelProgressPctMetPlainR95CopyCard");
      if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (pctMet && pctMet.parentNode)
        pctMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = met + " · " + bal + " · " + thr;
      const line = "差旅达标 · 余额 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-balance-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetBalanceThresholdPlainCopyBtn">复制达标余额门槛</button>`;
      const btn = $("#travelMetBalanceThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标余额门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标余额门槛暂不可用</p>`;
    }
  }

  /* 6 · 善后预算+状态+城市组合复制 */
  async function ensureAftercareBudgetStatusCityCopyButtons() {
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
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const status = String(it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = budget + " · " + status + " · " + city;
      el.dataset.budgetStatusCity = line;
      if (el.querySelector(".ac-copy-budget-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-budget-status-city";
      btn.textContent = "复制预算状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.budgetStatusCity || "");
        softBanner(ok ? "已复制预算状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+闸口+就绪组合复制 */
  async function ensureAuthCompleteGateReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteGateReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteGateReadyCopyCard";
      card.className = "av-complete-gate-ready-copy";
      const readyMiss = $("#avReadyMissingCountCopyCard");
      const script = $("#avScriptGateReadyCopyCard");
      const miss = $("#avMissingTextCompleteCopyCard");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const done = truthyFlag(data.complete) ? "已完成" : "未完成";
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = done + " · " + gate + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-gate-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteGateReadyCopyBtn">复制完成闸口就绪</button>`;
      const btn = $("#avCompleteGateReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成闸口就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成闸口就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+姓名+角色组合复制 */
  async function ensureHeirPassphraseNameRoleCopyButtons() {
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
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const role = String(it.role || "").trim() || "未填角色";
      const line = phrase + " · " + name + " · " + role;
      if (el.querySelector(".bn-copy-passphrase-name-role")) return;
      el.dataset.passphraseNameRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-name-role";
      btn.textContent = "复制口令姓名角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseNameRole || "");
        softBanner(ok ? "已复制口令姓名角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名与品牌组合复制 */
  async function ensureHandoverDomainBrandR98Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainBrandR98CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainBrandR98CopyCard";
      card.className = "hand-domain-brand-r98-copy";
      const itemBrand = $("#handItemCountBrandR97CopyCard");
      const pctExport = $("#handProgressPctExportPathCopyCard");
      const genShare = $("#handGeneratedAtShareHintCopyCard");
      if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (pctExport && pctExport.parentNode)
        pctExport.insertAdjacentElement("afterend", card);
      else if (genShare && genShare.parentNode)
        genShare.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "einherit.cn").trim();
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = domain + " · " + brand;
      const line = "手册域名 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-brand-r98-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainBrandR98CopyBtn">复制手册域名品牌</button>`;
      const btn = $("#handDomainBrandR98CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册域名品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·应用名+就绪+版本组合复制 + round 层含 98 */
  async function paintAppOkVersionR98CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appOkVersionR98CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appOkVersionR98CopyCard";
      card.className = "card app-ok-version-r98-copy-card";
      const okBrand = $("#okBrandEnVersionR97CopyCard");
      const domApp = $("#domainAppVersionR96CopyCard");
      const brandOk = $("#brandEnAppOkR95CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (domApp && domApp.parentNode)
        domApp.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = app + " · ok·" + okPart + " · " + ver;
      card.innerHTML = `<h3>应用 · 就绪 · 版本</h3>
        <p class="muted">一键复制应用名、就绪状态与版本（演示级）。</p>
        <p class="app-ok-version-r98-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appOkVersionR98CopyBtn">复制应用就绪版本</button>`;
      const btn = $("#appOkVersionR98CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>应用 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList98() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 98;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 98); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round98 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 810);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyCategoryNotesBeneficiaryCopyButtons().catch(() => {}),
      640
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetVisSummaryDeptCopyButtons().catch(() => {}),
      640
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastCheckinAtPlainR98Copy().catch(() => {}),
      630
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelMetBalanceThresholdPlainCopy().catch(() => {}),
      650
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareBudgetStatusCityCopyButtons().catch(() => {}),
      640
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteGateReadyCopy().catch(() => {}),
      610
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseNameRoleCopyButtons().catch(() => {}),
      640
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainBrandR98Copy().catch(() => {}),
      650
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 810);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyCategoryNotesBeneficiaryCopyButtons().catch(() => {}),
        660
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetVisSummaryDeptCopyButtons().catch(() => {}),
        650
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastCheckinAtPlainR98Copy().catch(() => {}),
        650
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelMetBalanceThresholdPlainCopy().catch(() => {}),
        670
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareBudgetStatusCityCopyButtons().catch(() => {}),
        660
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteGateReadyCopy().catch(() => {}),
        630
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseNameRoleCopyButtons().catch(() => {}),
        650
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainBrandR98Copy().catch(() => {}),
        660
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppOkVersionR98CopyCard().catch(() => {});
        paintRoundLayerList98();
      }, 700);
      setTimeout(() => {
        paintAppOkVersionR98CopyCard().catch(() => {});
        paintRoundLayerList98();
      }, 1380);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainOk().catch(() => {}), 860);
  setTimeout(
    () => ensureLegacyCategoryNotesBeneficiaryCopyButtons().catch(() => {}),
    880
  );
  setTimeout(
    () => ensureAssetVisSummaryDeptCopyButtons().catch(() => {}),
    900
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastCheckinAtPlainR98Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetBalanceThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareBudgetStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteGateReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseNameRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainBrandR98Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppOkVersionR98CopyCard().catch(() => {});
      paintRoundLayerList98();
    }, 720);
  }
})();
