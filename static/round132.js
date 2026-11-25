/* 电子继承 · 第一百三十二批增量（叠在 round131…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round132SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+版本+就绪冷静条 */
  async function paintHomeBrandVersionOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandVersionOkCalmBarR132");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandVersionOkCalmBarR132";
      bar.className = "home-brand-version-ok-calm-r132";
      bar.setAttribute("role", "status");
      const okVer = $("#homeOkVersionDomainCalmBarR131");
      const brandOk = $("#homeBrandBrandEnOkCalmBarR130");
      const domEn = $("#homeDomainBrandEnVersionCalmBarR129");
      if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (domEn && domEn.parentNode === home)
        domEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = brand + " · " + ver + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-ok-calm-r132-mark">品牌</span>
        <span class="muted home-brand-version-ok-calm-r132-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionOkCalmGoR132">去设置</button>`;
      const btn = $("#homeBrandVersionOkCalmGoR132");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-ok-calm-r132-mark">品牌</span>
        <span class="muted home-brand-version-ok-calm-r132-sub">品牌版本就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionOkCalmGoR132">去设置</button>`;
      const btn = $("#homeBrandVersionOkCalmGoR132");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+状态+设备归属组合复制 */
  async function ensureLegacyIdStatusDeviceOwnerCopyButtons() {
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
      const id = String(it.id);
      const status =
        String(it.status || it.category || "").trim() || "未填状态";
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const line = "#" + id + " · " + status + " · " + owner;
      el.dataset.idStatusDeviceOwner = line;
      if (el.querySelector(".lg-copy-id-status-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-status-device-owner";
      btn.textContent = "复制编号状态归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idStatusDeviceOwner || "");
        softBanner(ok ? "已复制编号状态归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+可见性组合复制 */
  async function ensureAssetSummaryTagVisibilityCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "无标签";
      const vis = String(it.visibility || "").trim() || "未填可见性";
      const line = summary + " · " + tag + " · " + vis;
      el.dataset.summaryTagVisibility = line;
      if (el.querySelector(".as-copy-summary-tag-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-visibility";
      btn.textContent = "复制摘要标签可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagVisibility || "");
        softBanner(ok ? "已复制摘要标签可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止 */
  async function ensureCheckinNextWindowEndsPlainR132Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextWindowEndsPlainR132CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextWindowEndsPlainR132CopyCard";
      card.className = "checkin-next-window-ends-plain-r132-copy";
      const winStat = $("#checkinWindowEndsStatusLabelPlainR131CopyCard");
      const nextAgo = $("#checkinNextAtLastAgoPlainR130CopyCard");
      const graceHrs = $("#checkinGraceHoursRemainingPlainR129CopyCard");
      if (winStat && winStat.parentNode)
        winStat.insertAdjacentElement("afterend", card);
      else if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
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
      const user = st.user || {};
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const combo = nextAt + " · " + windowEnds;
      const line =
        "下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-window-ends-plain-r132-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextWindowEndsPlainR132CopyBtn">复制下次窗口R132</button>`;
      const btn = $("#checkinNextWindowEndsPlainR132CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口R132" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+门槛+短差三元复制 */
  async function ensureTravelProgressThresholdShortfallPlainR132Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressThresholdShortfallPlainR132CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressThresholdShortfallPlainR132CopyCard";
      card.className = "travel-progress-threshold-shortfall-plain-r132-copy";
      const shortDep = $("#travelShortfallThresholdDepositedPlainR131CopyCard");
      const metProg = $("#travelMetProgressBalancePlainR130CopyCard");
      const balMet = $("#travelBalanceMetProgressPlainR129CopyCard");
      if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else if (metProg && metProg.parentNode)
        metProg.insertAdjacentElement("afterend", card);
      else if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct =
        fund.progress_pct == null
          ? "—"
          : String(Math.round(Number(fund.progress_pct)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = pct + "% · " + thr + " · " + short;
      const line =
        "差旅进度 · 门槛 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-threshold-shortfall-plain-r132-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressThresholdShortfallPlainR132CopyBtn">复制进度门槛缺口</button>`;
      const btn = $("#travelProgressThresholdShortfallPlainR132CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度门槛缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度门槛缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+服务类型+状态组合复制 */
  async function ensureAftercareCityServiceStatusCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const line = city + " · " + service + " · " + status;
      el.dataset.cityServiceStatus = line;
      if (el.querySelector(".ac-copy-city-service-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-service-status";
      btn.textContent = "复制城市服务状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityServiceStatus || "");
        softBanner(ok ? "已复制城市服务状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+缺失项+完成态组合复制 */
  async function ensureAuthReadyMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyMissingCompleteCopyR132Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyMissingCompleteCopyR132Card";
      card.className = "av-ready-missing-complete-copy-r132";
      const titleDur = $("#avTitleDurationReadyCopyR131Card");
      const completeReady = $("#avCompleteReadyMissingCopyR130Card");
      const completeGate = $("#avCompleteMissingGateCountR129CopyCard");
      if (titleDur && titleDur.parentNode)
        titleDur.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (completeGate && completeGate.parentNode)
        completeGate.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const complete =
        truthyFlag(data.complete) ||
        (missing.length === 0 && truthyFlag(data.ready))
          ? "完整"
          : "未完整";
      const combo = ready + " · " + missLabel + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-missing-complete-copy-r132-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyMissingCompleteCopyR132Btn">复制就绪缺失完成</button>`;
      const btn = $("#avReadyMissingCompleteCopyR132Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪缺失完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+姓名+编号组合复制 */
  async function ensureHeirPassphraseNameIdCopyButtons() {
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
      const hint =
        String(it.passphrase_hint || it.passphrase || "").trim() || "无口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const id = String(it.id);
      const line = hint + " · " + name + " · #" + id;
      if (el.querySelector(".bn-copy-passphrase-name-id")) return;
      el.dataset.passphraseNameId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-name-id";
      btn.textContent = "复制口令姓名编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseNameId || "");
        softBanner(ok ? "已复制口令姓名编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+品牌+完成数组合复制 */
  async function ensureHandoverDomainBrandDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainBrandDoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainBrandDoneCopyCard";
      card.className = "hand-domain-brand-done-copy";
      const secDone = $("#handSectionsDoneProgressCopyCard");
      const brandProg = $("#handBrandProgressDomainCopyCard");
      const domItem = $("#handDomainItemCountVersionCopyCard");
      if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
      else if (domItem && domItem.parentNode)
        domItem.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain = String(data.domain || "").trim() || "无域名";
      const brand = String(data.brand || "").trim() || "无品牌";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = domain + " · " + brand + " · " + done;
      const line = "手册域名 · 品牌 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-brand-done-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainBrandDoneCopyBtn">复制域名品牌完成</button>`;
      const btn = $("#handDomainBrandDoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名品牌完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名品牌完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+版本+中文品牌四元复制 + round 层含 132 */
  async function paintOkBrandEnVersionBrandR132CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnVersionBrandR132CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnVersionBrandR132CopyCard";
      card.className = "card settings-ok-brand-en-version-brand-r132-copy-card";
      const enVer = $("#settingsBrandEnVersionDomainOkR131CopyCard");
      const okBrand = $("#settingsOkBrandVersionDomainR130CopyCard");
      const verApp = $("#settingsVersionAppBrandEnOkR129CopyCard");
      const roundList = $("#roundLayerListCard");
      if (enVer && enVer.parentNode)
        enVer.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (verApp && verApp.parentNode)
        verApp.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = ready + " · " + en + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 品牌</h3>
        <p class="muted">一键复制就绪状态、英文品牌、版本与中文品牌（演示级）。</p>
        <p class="settings-ok-brand-en-version-brand-r132-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnVersionBrandR132CopyBtn">复制就绪英文版本品牌</button>`;
      const btn = $("#settingsOkBrandEnVersionBrandR132CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文版本品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList132() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 132;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 132); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round132 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandVersionOk().catch(() => {}), 820);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdStatusDeviceOwnerCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextWindowEndsPlainR132Copy().catch(() => {}),
      640
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressThresholdShortfallPlainR132Copy().catch(() => {}),
      660
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityServiceStatusCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
      620
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseNameIdCopyButtons().catch(() => {}),
      650
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainBrandDoneCopy().catch(() => {}),
      660
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandVersionOk().catch(() => {}), 820);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdStatusDeviceOwnerCopyButtons().catch(() => {}),
        670
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
        660
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextWindowEndsPlainR132Copy().catch(() => {}),
        660
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressThresholdShortfallPlainR132Copy().catch(
            () => {}
          ),
        680
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityServiceStatusCopyButtons().catch(() => {}),
        670
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyMissingCompleteCopy().catch(() => {}),
        640
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseNameIdCopyButtons().catch(() => {}),
        660
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainBrandDoneCopy().catch(() => {}),
        670
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnVersionBrandR132CopyCard().catch(() => {});
        paintRoundLayerList132();
      }, 710);
      setTimeout(() => {
        paintOkBrandEnVersionBrandR132CopyCard().catch(() => {});
        paintRoundLayerList132();
      }, 1390);
    }
  };

  setTimeout(() => paintHomeBrandVersionOk().catch(() => {}), 870);
  setTimeout(
    () => ensureLegacyIdStatusDeviceOwnerCopyButtons().catch(() => {}),
    890
  );
  setTimeout(
    () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
    910
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextWindowEndsPlainR132Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressThresholdShortfallPlainR132Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityServiceStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseNameIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainBrandDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnVersionBrandR132CopyCard().catch(() => {});
      paintRoundLayerList132();
    }, 730);
  }
})();
