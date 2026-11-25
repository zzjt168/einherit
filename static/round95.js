/* 电子继承 · 第九十五批增量（叠在 round94…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round95SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪版本冷静条 */
  async function paintHomeOkVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkVersionCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkVersionCalmBar";
      bar.className = "home-ok-version-calm-bar";
      bar.setAttribute("role", "status");
      const brandVer = $("#homeBrandEnVersionCalmBar");
      const appOk = $("#homeAppOkDomainCalmBar");
      const domVer = $("#homeDomainVersionCalmBar");
      if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
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
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const sub = okPart + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-calm-mark">状态</span>
        <span class="muted home-ok-version-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-version-calm-mark">状态</span>
        <span class="muted home-ok-version-calm-sub">就绪版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkVersionCalmGo">去设置</button>`;
      const btn = $("#homeOkVersionCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+部门+备注组合复制 */
  async function ensureLegacyBeneficiaryDeptNotesCopyButtons() {
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
      const ben = String(it.beneficiary || "").trim() || "未填受益人";
      const dept = String(it.dept || "").trim() || "未填部门";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = ben + " · " + dept + " · " + notes;
      el.dataset.beneficiaryDeptNotes = line;
      if (el.querySelector(".lg-copy-beneficiary-dept-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-dept-notes";
      btn.textContent = "复制受益人部门备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryDeptNotes || "");
        softBanner(ok ? "已复制受益人部门备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+标签+提示组合复制 */
  async function ensureAssetIdTagHintCopyButtons() {
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
      const hint = String(it.account_hint || "").trim() || "无账号提示";
      const line = "#" + it.id + " · " + tag + " · " + hint;
      el.dataset.idTagHint = line;
      if (el.querySelector(".as-copy-id-tag-hint")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-tag-hint";
      btn.textContent = "复制编号标签提示";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTagHint || "");
        softBanner(ok ? "已复制编号标签提示" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制倒计时标签文案 */
  async function ensureCheckinCountdownLabelPlainR95Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinCountdownLabelPlainR95CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinCountdownLabelPlainR95CopyCard";
      card.className = "checkin-countdown-label-plain-r95-copy";
      const nextAt = $("#checkinNextSuggestedAtPlainR94CopyCard");
      const readable = $("#checkinReadablePlainR93CopyCard");
      const lastAgo = $("#checkinLastAgoPlainR92CopyCard");
      if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else if (lastAgo && lastAgo.parentNode)
        lastAgo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const plain =
        String((st.countdown || {}).countdown_label || "").trim() || "—";
      const line =
        "报备倒计时 · " + plain + "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-countdown-label-plain-r95-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinCountdownLabelPlainR95CopyBtn">复制倒计时标签文案</button>`;
      const btn = $("#checkinCountdownLabelPlainR95CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(plain);
          softBanner(ok ? "已复制倒计时标签文案" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">倒计时标签文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比与达标组合复制 */
  async function ensureTravelProgressPctMetPlainR95Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressPctMetPlainR95CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressPctMetPlainR95CopyCard";
      card.className = "travel-progress-pct-met-plain-r95-copy";
      const shortBal = $("#travelShortfallBalancePlainR94CopyCard");
      const metThr = $("#travelMetThresholdPlainR93CopyCard");
      const pctThr = $("#travelProgressPctThresholdPlainCopyCard");
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (metThr && metThr.parentNode)
        metThr.insertAdjacentElement("afterend", card);
      else if (pctThr && pctThr.parentNode)
        pctThr.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "达标" : "未达标";
      const combo = pctStr + " · " + met;
      const line = "差旅进度 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-pct-met-plain-r95-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressPctMetPlainR95CopyBtn">复制进度达标文案</button>`;
      const btn = $("#travelProgressPctMetPlainR95CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度达标文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后阶段+预算+状态组合复制 */
  async function ensureAftercarePhaseBudgetStatusCopyButtons() {
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
      const phase = String(it.phase || "").trim() || "未填阶段";
      const budget =
        it.travel_budget == null
          ? "—"
          : String(Math.round(Number(it.travel_budget)));
      const status = String(it.status || "").trim() || "未填状态";
      const line = phase + " · " + budget + " · " + status;
      el.dataset.phaseBudgetStatus = line;
      if (el.querySelector(".ac-copy-phase-budget-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-phase-budget-status";
      btn.textContent = "复制阶段预算状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.phaseBudgetStatus || "");
        softBanner(ok ? "已复制阶段预算状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失文案与完成组合复制 */
  async function ensureAuthMissingTextCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingTextCompleteCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingTextCompleteCopyCard";
      card.className = "av-missing-text-complete-copy";
      const checklist = $("#avChecklistGateCopyCard");
      const prog = $("#avProgressCompleteLabelCopyCard");
      const gate = $("#avGateCompleteComboCopyCard");
      if (checklist && checklist.parentNode)
        checklist.insertAdjacentElement("afterend", card);
      else if (prog && prog.parentNode)
        prog.insertAdjacentElement("afterend", card);
      else if (gate && gate.parentNode)
        gate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const miss =
        String(data.missing_text || "").trim() || "无缺失说明";
      const done = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = miss + " · " + done;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-text-complete-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingTextCompleteCopyBtn">复制缺失文案完成</button>`;
      const btn = $("#avMissingTextCompleteCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失文案完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失文案与完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系+口令提示组合复制 */
  async function ensureHeirNameContactPassphraseCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const line = name + " · " + contact + " · " + phrase;
      if (el.querySelector(".bn-copy-name-contact-passphrase")) return;
      el.dataset.nameContactPassphrase = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-passphrase";
      btn.textContent = "复制姓名联系口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactPassphrase || "");
        softBanner(ok ? "已复制姓名联系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册生成时间与分享提示组合复制 */
  async function ensureHandoverGeneratedAtShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handGeneratedAtShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handGeneratedAtShareHintCopyCard";
      card.className = "hand-generated-at-share-hint-copy";
      const todoShare = $("#handTodoCountShareHintCopyCard");
      const exportShare = $("#handExportPathShareHintR93CopyCard");
      const itemDom = $("#handItemCountDomainR92CopyCard");
      if (todoShare && todoShare.parentNode)
        todoShare.insertAdjacentElement("afterend", card);
      else if (exportShare && exportShare.parentNode)
        exportShare.insertAdjacentElement("afterend", card);
      else if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const raw = data.generated_at;
      let when = "—";
      if (raw != null && raw !== "") {
        const n = Number(raw);
        if (!isNaN(n) && n > 0) {
          const d = new Date(n > 1e12 ? n : n * 1000);
          when = isNaN(d.getTime())
            ? String(raw)
            : d.toISOString().slice(0, 19).replace("T", " ");
        } else {
          when = String(raw);
        }
      }
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = when + " · " + hint;
      const line = "手册生成 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-generated-at-share-hint-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handGeneratedAtShareHintCopyBtn">复制生成时间分享</button>`;
      const btn = $("#handGeneratedAtShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生成时间分享" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生成时间与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+应用名+就绪组合复制 + round 层含 95 */
  async function paintBrandEnAppOkR95CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#brandEnAppOkR95CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "brandEnAppOkR95CopyCard";
      card.className = "card brand-en-app-ok-r95-copy-card";
      const verApp = $("#versionAppDomainR94CopyCard");
      const okDom = $("#okDomainBrandEnR93CopyCard");
      const verDom = $("#versionDomainBrandEnR92CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const app = String(h.app || "电子继承 App").trim();
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + app + " · ok·" + okPart;
      card.innerHTML = `<h3>英文品牌 · 应用 · 就绪</h3>
        <p class="muted">一键复制英文品牌、应用名与就绪状态（演示级）。</p>
        <p class="brand-en-app-ok-r95-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="brandEnAppOkR95CopyBtn">复制英文应用就绪</button>`;
      const btn = $("#brandEnAppOkR95CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文应用就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文品牌 · 应用 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList95() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 95;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 95); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round95 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkVersion().catch(() => {}), 780);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryDeptNotesCopyButtons().catch(() => {}),
      610
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetIdTagHintCopyButtons().catch(() => {}), 610);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinCountdownLabelPlainR95Copy().catch(() => {}),
      600
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelProgressPctMetPlainR95Copy().catch(() => {}),
      620
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercarePhaseBudgetStatusCopyButtons().catch(() => {}),
      610
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingTextCompleteCopy().catch(() => {}),
      580
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactPassphraseCopyButtons().catch(() => {}),
      610
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverGeneratedAtShareHintCopy().catch(() => {}),
      620
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkVersion().catch(() => {}), 780);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryDeptNotesCopyButtons().catch(() => {}),
        630
      );
    if (id === "assets")
      setTimeout(() => ensureAssetIdTagHintCopyButtons().catch(() => {}), 620);
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinCountdownLabelPlainR95Copy().catch(() => {}),
        620
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelProgressPctMetPlainR95Copy().catch(() => {}),
        640
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercarePhaseBudgetStatusCopyButtons().catch(() => {}),
        630
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingTextCompleteCopy().catch(() => {}),
        600
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactPassphraseCopyButtons().catch(() => {}),
        620
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverGeneratedAtShareHintCopy().catch(() => {}),
        630
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnAppOkR95CopyCard().catch(() => {});
        paintRoundLayerList95();
      }, 670);
      setTimeout(() => {
        paintBrandEnAppOkR95CopyCard().catch(() => {});
        paintRoundLayerList95();
      }, 1350);
    }
  };

  setTimeout(() => paintHomeOkVersion().catch(() => {}), 830);
  setTimeout(
    () => ensureLegacyBeneficiaryDeptNotesCopyButtons().catch(() => {}),
    850
  );
  setTimeout(() => ensureAssetIdTagHintCopyButtons().catch(() => {}), 870);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinCountdownLabelPlainR95Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressPctMetPlainR95Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercarePhaseBudgetStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingTextCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactPassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverGeneratedAtShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnAppOkR95CopyCard().catch(() => {});
      paintRoundLayerList95();
    }, 690);
  }
})();
