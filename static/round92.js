/* 电子继承 · 第九十二批增量（叠在 round91…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round92SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名版本冷静条 */
  async function paintHomeDomainVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionCalmBar";
      bar.className = "home-domain-version-calm-bar";
      bar.setAttribute("role", "status");
      const okEn = $("#homeOkBrandEnCalmBar");
      const appVer = $("#homeAppVersionCalmBar");
      const domainEn = $("#homeDomainBrandEnBar");
      if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (appVer && appVer.parentNode === home)
        appVer.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = domain + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-calm-mark">站点</span>
        <span class="muted home-domain-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-calm-mark">站点</span>
        <span class="muted home-domain-version-calm-sub">域名版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionCalmGo">去设置</button>`;
      const btn = $("#homeDomainVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+受益人+备注组合复制 */
  async function ensureLegacyIdBeneficiaryNotesCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + ben + " · " + notes;
      el.dataset.idBeneficiaryNotes = line;
      if (el.querySelector(".lg-copy-id-beneficiary-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-beneficiary-notes";
      btn.textContent = "复制编号受益人备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idBeneficiaryNotes || "");
        softBanner(ok ? "已复制编号受益人备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要+可见性组合复制 */
  async function ensureAssetPlatformSummaryVisCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const vis = visibilityLabel(it.visibility);
      const line = platform + " · " + summary + " · " + vis;
      el.dataset.platformSummaryVis = line;
      if (el.querySelector(".as-copy-platform-summary-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary-vis";
      btn.textContent = "复制平台摘要可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformSummaryVis || "");
        softBanner(ok ? "已复制平台摘要可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今文案 */
  async function ensureCheckinLastAgoPlainR92Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoPlainR92CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoPlainR92CopyCard";
      card.className = "checkin-last-ago-plain-r92-copy";
      const hours = $("#checkinHoursRemainingPlainR91CopyCard");
      const due = $("#checkinDueSoonPlainR90CopyCard");
      const grace = $("#checkinGraceHoursPlainR89CopyCard");
      if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (due && due.parentNode)
        due.insertAdjacentElement("afterend", card);
      else if (grace && grace.parentNode)
        grace.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const plain =
        String((st.countdown || {}).last_ago_label || "").trim() || "—";
      const line =
        "报备上次 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-plain-r92-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoPlainR92CopyBtn">复制上次距今文案</button>`;
      const btn = $("#checkinLastAgoPlainR92CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制上次距今文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比与门槛组合复制 */
  async function ensureTravelProgressPctThresholdPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctThresholdPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctThresholdPlainCopyCard";
      card.className = "travel-progress-pct-threshold-plain-copy";
      const shortMet = $("#travelShortfallMetPlainCopyCard");
      const metPct = $("#travelMetProgressPctPlainCopyCard");
      const thrBal = $("#travelThresholdBalancePlainCopyCard");
      if (shortMet && shortMet.parentNode)
        shortMet.insertAdjacentElement("afterend", card);
      else if (metPct && metPct.parentNode)
        metPct.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      let pct = fund.progress_pct;
      if (pct == null && fund.progress != null) pct = fund.progress;
      const pctStr =
        pct == null || pct === ""
          ? "—"
          : String(Math.round(Number(pct))) + "%";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = pctStr + " · " + thr;
      const line = "差旅进度 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-pct-threshold-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctThresholdPlainCopyBtn">复制进度百分比门槛</button>`;
      const btn = $("#travelProgressPctThresholdPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度百分比门槛" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度百分比门槛暂不可用</p>`;
    }
  }

  /* 6 · 善后标题+状态+城市组合复制 */
  async function ensureAftercareTitleStatusCityCopyButtons() {
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
      const status = String(it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = title + " · " + status + " · " + city;
      el.dataset.titleStatusCity = line;
      if (el.querySelector(".ac-copy-title-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-title-status-city";
      btn.textContent = "复制标题状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleStatusCity || "");
        softBanner(ok ? "已复制标题状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频闸口与完成文案组合复制 */
  async function ensureAuthGateCompleteComboCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateCompleteComboCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateCompleteComboCopyCard";
      card.className = "av-gate-complete-combo-copy";
      const miss = $("#avMissingLabelsCompleteCopyCard");
      const checklist = $("#avChecklistCompleteCopyCard");
      const script = $("#avScriptCountCompleteCopyCard");
      if (miss && miss.parentNode)
        miss.insertAdjacentElement("afterend", card);
      else if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (script && script.parentNode)
        script.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无闸口说明";
      const label =
        String(data.complete_label || "").trim() ||
        (truthyFlag(data.complete) ? "已完成" : "未完成");
      const combo = gate + " · " + label;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-gate-complete-combo-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateCompleteComboCopyBtn">复制闸口完成组合</button>`;
      const btn = $("#avGateCompleteComboCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制闸口完成组合" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">闸口与完成文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系+口令提示+角色组合复制 */
  async function ensureHeirContactPassphraseRoleCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const line = contact + " · " + phrase + " · " + role;
      if (el.querySelector(".bn-copy-contact-passphrase-role")) return;
      el.dataset.contactPassphraseRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-passphrase-role";
      btn.textContent = "复制联系口令角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactPassphraseRole || "");
        softBanner(ok ? "已复制联系口令角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数与域名组合复制 */
  async function ensureHandoverItemCountDomainR92Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountDomainR92CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountDomainR92CopyCard";
      card.className = "hand-item-count-domain-r92-copy";
      const pctShare = $("#handProgressPctShareHintCopyCard");
      const genBrand = $("#handGeneratedAtBrandCopyCard");
      const todoDom = $("#handTodoCountDomainCopyCard");
      if (pctShare && pctShare.parentNode)
        pctShare.insertAdjacentElement("afterend", card);
      else if (genBrand && genBrand.parentNode)
        genBrand.insertAdjacentElement("afterend", card);
      else if (todoDom && todoDom.parentNode)
        todoDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const count =
        data.item_count == null ? "—" : String(data.item_count);
      const domain = String(data.domain || "einherit.cn").trim();
      const combo = count + " · " + domain;
      const line = "手册条目 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-domain-r92-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountDomainR92CopyBtn">复制手册条目域名</button>`;
      const btn = $("#handItemCountDomainR92CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册条目域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目数与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+域名+英文品牌组合复制 + round 层含 92 */
  async function paintVersionDomainBrandEnR92CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#versionDomainBrandEnR92CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "versionDomainBrandEnR92CopyCard";
      card.className = "card version-domain-brand-en-r92-copy-card";
      const appDom = $("#appDomainBrandEnR91CopyCard");
      const domVer = $("#domainVersionOkR90CopyCard");
      const verOk = $("#versionOkBrandEnR89CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appDom && appDom.parentNode)
        appDom.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + domain + " · " + en;
      card.innerHTML = `<h3>版本 · 域名 · 英文品牌</h3>
        <p class="muted">一键复制版本、域名与英文品牌（演示级）。</p>
        <p class="version-domain-brand-en-r92-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="versionDomainBrandEnR92CopyBtn">复制版本域名英文</button>`;
      const btn = $("#versionDomainBrandEnR92CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 域名 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList92() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 92;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 92); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round92 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersion().catch(() => {}), 750);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdBeneficiaryNotesCopyButtons().catch(() => {}),
      580
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformSummaryVisCopyButtons().catch(() => {}),
      580
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoPlainR92Copy().catch(() => {}),
      570
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelProgressPctThresholdPlainCopy().catch(() => {}),
      590
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareTitleStatusCityCopyButtons().catch(() => {}),
      580
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthGateCompleteComboCopy().catch(() => {}),
      550
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactPassphraseRoleCopyButtons().catch(() => {}),
      580
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountDomainR92Copy().catch(() => {}),
      590
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersion().catch(() => {}), 750);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdBeneficiaryNotesCopyButtons().catch(() => {}),
        600
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformSummaryVisCopyButtons().catch(() => {}),
        590
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoPlainR92Copy().catch(() => {}),
        590
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelProgressPctThresholdPlainCopy().catch(() => {}),
        610
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareTitleStatusCityCopyButtons().catch(() => {}),
        600
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthGateCompleteComboCopy().catch(() => {}),
        570
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactPassphraseRoleCopyButtons().catch(() => {}),
        590
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountDomainR92Copy().catch(() => {}),
        600
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionDomainBrandEnR92CopyCard().catch(() => {});
        paintRoundLayerList92();
      }, 640);
      setTimeout(() => {
        paintVersionDomainBrandEnR92CopyCard().catch(() => {});
        paintRoundLayerList92();
      }, 1320);
    }
  };

  setTimeout(() => paintHomeDomainVersion().catch(() => {}), 800);
  setTimeout(
    () => ensureLegacyIdBeneficiaryNotesCopyButtons().catch(() => {}),
    820
  );
  setTimeout(
    () => ensureAssetPlatformSummaryVisCopyButtons().catch(() => {}),
    840
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoPlainR92Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctThresholdPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareTitleStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateCompleteComboCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactPassphraseRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountDomainR92Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionDomainBrandEnR92CopyCard().catch(() => {});
      paintRoundLayerList92();
    }, 660);
  }
})();
