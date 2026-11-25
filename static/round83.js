/* 电子继承 · 第八十三批增量（叠在 round82…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round83SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本冷静条 */
  async function paintHomeVersionCalm() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionCalmBar";
      bar.className = "home-version-calm-bar";
      bar.setAttribute("role", "status");
      const en = $("#homeEnglishBrandBar");
      const domain = $("#homeDomainOnlyBar");
      const uid = $("#homeUserIdCalmBar");
      if (en && en.parentNode === home)
        en.insertAdjacentElement("afterend", bar);
      else if (domain && domain.parentNode === home)
        domain.insertAdjacentElement("afterend", bar);
      else if (uid && uid.parentNode === home)
        uid.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = "版本 · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-calm-mark">版本</span>
        <span class="muted home-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionCalmGo">去设置</button>`;
      const btn = $("#homeVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-calm-mark">版本</span>
        <span class="muted home-version-calm-sub">版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionCalmGo">去设置</button>`;
      const btn = $("#homeVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+受益人+处置组合复制 */
  async function ensureLegacyIdBeneficiaryActionCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const line = "#" + it.id + " · " + ben + " · " + action;
      el.dataset.idBeneficiaryAction = line;
      if (el.querySelector(".lg-copy-id-beneficiary-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-beneficiary-action";
      btn.textContent = "复制编号受益人处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idBeneficiaryAction || "");
        softBanner(ok ? "已复制编号受益人处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+账号提示+处置组合复制 */
  async function ensureAssetIdHintDisposeCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const line = "#" + it.id + " · " + hint + " · " + dispose;
      el.dataset.idHintDispose = line;
      if (el.querySelector(".as-copy-id-hint-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-hint-dispose";
      btn.textContent = "复制编号提示处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idHintDispose || "");
        softBanner(ok ? "已复制编号提示处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次小时数 */
  async function ensureCheckinHoursSinceLastPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinHoursSinceLastPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinHoursSinceLastPlainCopyCard";
      card.className = "checkin-hours-since-last-plain-copy";
      const next = $("#checkinNextSuggestedPlainCopyCard");
      const last = $("#checkinLastAgoLabelPlainCopyCard");
      const cd = $("#checkinCountdownLabelPlainCopyCard");
      if (next && next.parentNode) next.insertAdjacentElement("afterend", card);
      else if (last && last.parentNode)
        last.insertAdjacentElement("afterend", card);
      else if (cd && cd.parentNode) cd.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).hours_since_last;
      const hours =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw) * 100) / 100);
      const line =
        "距上次报备 · " +
        hours +
        " 小时（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-hours-since-last-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinHoursSinceLastPlainCopyBtn">复制距上次小时数</button>`;
      const btn = $("#checkinHoursSinceLastPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(hours);
          softBanner(ok ? "已复制距上次小时数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次小时数暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与达标组合复制 */
  async function ensureTravelBalanceMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceMetPlainCopyCard";
      card.className = "travel-balance-met-plain-copy";
      const shortThr = $("#travelShortfallThresholdCopyCard");
      const metProg = $("#travelMetProgressLabelCopyCard");
      const pctMet = $("#travelProgressPctMetCopyCard");
      if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = bal + " · " + met;
      const line = "差旅余额 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceMetPlainCopyBtn">复制余额达标文案</button>`;
      const btn = $("#travelBalanceMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额达标文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+备注+城市组合复制 */
  async function ensureAftercareIdNotesCityCopyButtons() {
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
      if (!it || it.id == null) return;
      const notes = String(it.notes || "").trim() || "无备注";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + notes + " · " + city;
      el.dataset.idNotesCity = line;
      if (el.querySelector(".ac-copy-id-notes-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-notes-city";
      btn.textContent = "复制编号备注城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNotesCity || "");
        softBanner(ok ? "已复制编号备注城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失文案与就绪组合复制 */
  async function ensureAuthMissingTextReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingTextReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingTextReadyCopyCard";
      card.className = "av-missing-text-ready-copy";
      const readyComp = $("#avReadyCompleteLabelCopyCard");
      const gateReady = $("#avGateReadyComboCopyCard");
      const scriptReady = $("#avScriptCountReadyCopyCard");
      if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else if (gateReady && gateReady.parentNode)
        gateReady.insertAdjacentElement("afterend", card);
      else if (scriptReady && scriptReady.parentNode)
        scriptReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing =
        String(data.missing_text || "").trim() || "无缺失说明";
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = missing + " · " + ready;
      const line = "授权视频缺失 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-missing-text-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingTextReadyCopyBtn">复制缺失文案就绪</button>`;
      const btn = $("#avMissingTextReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失文案就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失文案与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+口令+联系组合复制 */
  async function ensureHeirNamePassphraseContactCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + phrase + " · " + contact;
      if (el.querySelector(".bn-copy-name-passphrase-contact")) return;
      el.dataset.namePassphraseContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-passphrase-contact";
      btn.textContent = "复制姓名口令联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.namePassphraseContact || "");
        softBanner(ok ? "已复制姓名口令联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名与品牌组合复制 */
  async function ensureHandoverDomainBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainBrandCopyCard";
      card.className = "hand-domain-brand-copy";
      const pctBrand = $("#handProgressPctBrandCopyCard");
      const exportBrand = $("#handExportPathBrandCopyCard");
      const shareDom = $("#handShareHintDomainCopyCard");
      if (pctBrand && pctBrand.parentNode)
        pctBrand.insertAdjacentElement("afterend", card);
      else if (exportBrand && exportBrand.parentNode)
        exportBrand.insertAdjacentElement("afterend", card);
      else if (shareDom && shareDom.parentNode)
        shareDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const domain = String(data.domain || "").trim() || "einherit.cn";
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = domain + " · " + brand;
      const line = "手册域名 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainBrandCopyBtn">复制域名与品牌</button>`;
      const btn = $("#handDomainBrandCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名与品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+英文品牌+域名组合复制 + round 层含 83 */
  async function paintVersionBrandEnDomainR83CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionBrandEnDomainR83CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionBrandEnDomainR83CopyCard";
      card.className = "card version-brand-en-domain-r83-copy-card";
      const brandEn = $("#brandEnVersionOkR82CopyCard");
      const appOk = $("#appOkDomainR81CopyCard");
      const server = $("#serverVersionOkDomainR80CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (appOk && appOk.parentNode)
        appOk.insertAdjacentElement("beforebegin", card);
      else if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · " + en + " · " + domain;
      card.innerHTML = `<h3>版本 · 英文品牌 · 域名</h3>
        <p class="muted">一键复制版本、英文品牌与域名（演示级）。</p>
        <p class="version-brand-en-domain-r83-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionBrandEnDomainR83CopyBtn">复制版本英文域名</button>`;
      const btn = $("#versionBrandEnDomainR83CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本英文域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 英文品牌 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList83() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 83;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 83); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round83 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionCalm().catch(() => {}), 660);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdBeneficiaryActionCopyButtons().catch(() => {}),
      490
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdHintDisposeCopyButtons().catch(() => {}),
      490
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinHoursSinceLastPlainCopy().catch(() => {}),
      480
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelBalanceMetPlainCopy().catch(() => {}), 500);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdNotesCityCopyButtons().catch(() => {}),
      490
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthMissingTextReadyCopy().catch(() => {}), 460);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNamePassphraseContactCopyButtons().catch(() => {}),
      490
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverDomainBrandCopy().catch(() => {}), 500);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionCalm().catch(() => {}), 660);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdBeneficiaryActionCopyButtons().catch(() => {}),
        510
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdHintDisposeCopyButtons().catch(() => {}),
        500
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinHoursSinceLastPlainCopy().catch(() => {}),
        500
      );
    if (id === "travel")
      setTimeout(() => ensureTravelBalanceMetPlainCopy().catch(() => {}), 520);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdNotesCityCopyButtons().catch(() => {}),
        510
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthMissingTextReadyCopy().catch(() => {}), 480);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNamePassphraseContactCopyButtons().catch(() => {}),
        500
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverDomainBrandCopy().catch(() => {}), 510);
    if (id === "settings") {
      setTimeout(() => {
        paintVersionBrandEnDomainR83CopyCard().catch(() => {});
        paintRoundLayerList83();
      }, 550);
      setTimeout(() => {
        paintVersionBrandEnDomainR83CopyCard().catch(() => {});
        paintRoundLayerList83();
      }, 1180);
    }
  };

  setTimeout(() => paintHomeVersionCalm().catch(() => {}), 710);
  setTimeout(
    () => ensureLegacyIdBeneficiaryActionCopyButtons().catch(() => {}),
    730
  );
  setTimeout(() => ensureAssetIdHintDisposeCopyButtons().catch(() => {}), 750);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinHoursSinceLastPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdNotesCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingTextReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNamePassphraseContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionBrandEnDomainR83CopyCard().catch(() => {});
      paintRoundLayerList83();
    }, 570);
  }
})();
