/* 电子继承 · 第八十五批增量（叠在 round84…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round85SoftBanner_" + (hostId || "home");
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

  function formatEpoch(raw) {
    if (raw == null || raw === "") return "—";
    const n = Number(raw);
    if (!isFinite(n)) return String(raw);
    const ms = n > 1e12 ? n : n * 1000;
    try {
      const d = new Date(ms);
      if (isNaN(d.getTime())) return String(raw);
      const p = (x) => (x < 10 ? "0" + x : "" + x);
      return (
        d.getFullYear() +
        "-" +
        p(d.getMonth() + 1) +
        "-" +
        p(d.getDate()) +
        " " +
        p(d.getHours()) +
        ":" +
        p(d.getMinutes())
      );
    } catch (_) {
      return String(raw);
    }
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

  /* 1 · 首页服务版本冷静条 */
  async function paintHomeServerVersionCalm() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeServerVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeServerVersionCalmBar";
      bar.className = "home-server-version-calm-bar";
      bar.setAttribute("role", "status");
      const ok = $("#homeOkStatusBar");
      const ver = $("#homeVersionCalmBar");
      const en = $("#homeEnglishBrandBar");
      if (ok && ok.parentNode === home)
        ok.insertAdjacentElement("afterend", bar);
      else if (ver && ver.parentNode === home)
        ver.insertAdjacentElement("afterend", bar);
      else if (en && en.parentNode === home)
        en.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const server =
        String(h.server_version || h.version || "").trim() || "—";
      const sub = "服务版本 · " + server;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-server-version-calm-mark">服务</span>
        <span class="muted home-server-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeServerVersionCalmGo">去设置</button>`;
      const btn = $("#homeServerVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-server-version-calm-mark">服务</span>
        <span class="muted home-server-version-calm-sub">服务版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeServerVersionCalmGo">去设置</button>`;
      const btn = $("#homeServerVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+部门+备注组合复制 */
  async function ensureLegacyIdDeptNotesCopyButtons() {
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
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + dept + " · " + notes;
      el.dataset.idDeptNotes = line;
      if (el.querySelector(".lg-copy-id-dept-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-dept-notes";
      btn.textContent = "复制编号部门备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDeptNotes || "");
        softBanner(ok ? "已复制编号部门备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+可见性+摘要组合复制 */
  async function ensureAssetIdVisSummaryCopyButtons() {
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
      const vis = visibilityLabel(it.visibility);
      const summary = String(it.summary || "").trim() || "未填摘要";
      const line = "#" + it.id + " · " + vis + " · " + summary;
      el.dataset.idVisSummary = line;
      if (el.querySelector(".as-copy-id-vis-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-vis-summary";
      btn.textContent = "复制编号可见摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idVisSummary || "");
        softBanner(ok ? "已复制编号可见摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时间点 */
  async function ensureCheckinNextSuggestedAtPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedAtPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedAtPlainCopyCard";
      card.className = "checkin-next-suggested-at-plain-copy";
      const readable = $("#checkinReadableCountdownPlainCopyCard");
      const hours = $("#checkinHoursSinceLastPlainCopyCard");
      const next = $("#checkinNextSuggestedPlainCopyCard");
      if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (hours && hours.parentNode)
        hours.insertAdjacentElement("afterend", card);
      else if (next && next.parentNode)
        next.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const at = formatEpoch((st.countdown || {}).next_suggested_at);
      const line =
        "下次建议时间点 · " +
        at +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-at-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedAtPlainCopyBtn">复制下次建议时间点</button>`;
      const btn = $("#checkinNextSuggestedAtPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(at);
          softBanner(ok ? "已复制下次建议时间点" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议时间点暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛与达标组合复制 */
  async function ensureTravelThresholdMetPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdMetPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdMetPlainCopyCard";
      card.className = "travel-threshold-met-plain-copy";
      const kindAmt = $("#travelKindAmountLatestCopyCard");
      const balMet = $("#travelBalanceMetPlainCopyCard");
      const shortThr = $("#travelShortfallThresholdCopyCard");
      if (kindAmt && kindAmt.parentNode)
        kindAmt.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = thr + " · " + met;
      const line = "差旅门槛 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-met-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdMetPlainCopyBtn">复制门槛与达标</button>`;
      const btn = $("#travelThresholdMetPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛与达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛与达标暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+阶段+状态组合复制 */
  async function ensureAftercareIdPhaseStatusCopyButtons() {
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
      const phase = String(it.phase_label || "").trim() || "未填阶段";
      const status = String(it.status || "").trim() || "未填状态";
      const line = "#" + it.id + " · " + phase + " · " + status;
      el.dataset.idPhaseStatus = line;
      if (el.querySelector(".ac-copy-id-phase-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-phase-status";
      btn.textContent = "复制编号阶段状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPhaseStatus || "");
        softBanner(ok ? "已复制编号阶段状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频门闩与缺失文案组合复制 */
  async function ensureAuthGateMissingTextCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avGateMissingTextCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avGateMissingTextCopyCard";
      card.className = "av-gate-missing-text-copy";
      const progReady = $("#avProgressReadyCopyCard");
      const missing = $("#avMissingTextReadyCopyCard");
      const readyComp = $("#avReadyCompleteLabelCopyCard");
      if (progReady && progReady.parentNode)
        progReady.insertAdjacentElement("afterend", card);
      else if (missing && missing.parentNode)
        missing.insertAdjacentElement("afterend", card);
      else if (readyComp && readyComp.parentNode)
        readyComp.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const gate = String(data.gate || "").trim() || "无门闩说明";
      const missing =
        String(data.missing_text || "").trim() || "无缺失说明";
      const combo = gate + " · " + missing;
      const line = "授权视频门闩 · 缺失 · " + combo;
      card.innerHTML = `<p class="muted av-gate-missing-text-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avGateMissingTextCopyBtn">复制门闩缺失文案</button>`;
      const btn = $("#avGateMissingTextCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门闩缺失文案" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门闩缺失文案暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+联系组合复制 */
  async function ensureHeirNameRelationContactCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = name + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-name-relation-contact")) return;
      el.dataset.nameRelationContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-contact";
      btn.textContent = "复制姓名关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationContact || "");
        softBanner(ok ? "已复制姓名关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册条目数与品牌组合复制 */
  async function ensureHandoverItemCountBrandR85Copy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handItemCountBrandR85CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handItemCountBrandR85CopyCard";
      card.className = "hand-item-count-brand-r85-copy";
      const shareBrand = $("#handShareHintBrandCopyCard");
      const domBrand = $("#handDomainBrandCopyCard");
      const pctBrand = $("#handProgressPctBrandCopyCard");
      if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("afterend", card);
      else if (pctBrand && pctBrand.parentNode)
        pctBrand.insertAdjacentElement("afterend", card);
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
      const brand = String(data.brand || "").trim() || "电子继承";
      const combo = count + " · " + brand;
      const line = "手册条目 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-item-count-brand-r85-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handItemCountBrandR85CopyBtn">复制条目数品牌</button>`;
      const btn = $("#handItemCountBrandR85CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制条目数品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">条目数与品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+域名+版本组合复制 + round 层含 85 */
  async function paintOkDomainVersionR85CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#okDomainVersionR85CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "okDomainVersionR85CopyCard";
      card.className = "card ok-domain-version-r85-copy-card";
      const appEn = $("#appBrandEnOkR84CopyCard");
      const verEn = $("#versionBrandEnDomainR83CopyCard");
      const brandEn = $("#brandEnVersionOkR82CopyCard");
      const roundList = $("#roundLayerListCard");
      if (appEn && appEn.parentNode)
        appEn.insertAdjacentElement("beforebegin", card);
      else if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const line = "ok·" + okPart + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>就绪 · 域名 · 版本</h3>
        <p class="muted">一键复制就绪状态、域名与版本（演示级）。</p>
        <p class="ok-domain-version-r85-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="okDomainVersionR85CopyBtn">复制就绪域名版本</button>`;
      const btn = $("#okDomainVersionR85CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList85() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 85;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 85); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round85 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeServerVersionCalm().catch(() => {}), 680);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdDeptNotesCopyButtons().catch(() => {}),
      510
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdVisSummaryCopyButtons().catch(() => {}),
      510
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextSuggestedAtPlainCopy().catch(() => {}),
      500
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelThresholdMetPlainCopy().catch(() => {}), 520);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdPhaseStatusCopyButtons().catch(() => {}),
      510
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthGateMissingTextCopy().catch(() => {}), 480);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
      510
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverItemCountBrandR85Copy().catch(() => {}),
      520
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeServerVersionCalm().catch(() => {}), 680);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdDeptNotesCopyButtons().catch(() => {}),
        530
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdVisSummaryCopyButtons().catch(() => {}),
        520
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextSuggestedAtPlainCopy().catch(() => {}),
        520
      );
    if (id === "travel")
      setTimeout(() => ensureTravelThresholdMetPlainCopy().catch(() => {}), 540);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdPhaseStatusCopyButtons().catch(() => {}),
        530
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthGateMissingTextCopy().catch(() => {}), 500);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationContactCopyButtons().catch(() => {}),
        520
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverItemCountBrandR85Copy().catch(() => {}),
        530
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainVersionR85CopyCard().catch(() => {});
        paintRoundLayerList85();
      }, 570);
      setTimeout(() => {
        paintOkDomainVersionR85CopyCard().catch(() => {});
        paintRoundLayerList85();
      }, 1220);
    }
  };

  setTimeout(() => paintHomeServerVersionCalm().catch(() => {}), 730);
  setTimeout(() => ensureLegacyIdDeptNotesCopyButtons().catch(() => {}), 750);
  setTimeout(() => ensureAssetIdVisSummaryCopyButtons().catch(() => {}), 770);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedAtPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdMetPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdPhaseStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthGateMissingTextCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverItemCountBrandR85Copy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainVersionR85CopyCard().catch(() => {});
      paintRoundLayerList85();
    }, 590);
  }
})();
