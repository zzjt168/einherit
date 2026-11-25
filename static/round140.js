/* 电子继承 · 第一百四十批增量（叠在 round139…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round140SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+域名+英文品牌冷静条 */
  async function paintHomeOkDomainBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkDomainBrandEnCalmBarR140");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkDomainBrandEnCalmBarR140";
      bar.className = "home-ok-domain-brand-en-calm-r140";
      bar.setAttribute("role", "status");
      const brandDom = $("#homeBrandDomainVersionCalmBarR139");
      const okEn = $("#homeOkBrandEnVersionCalmBarR138");
      const domVer = $("#homeDomainVersionBrandCalmBarR137");
      if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ready + " · " + domain + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-brand-en-calm-r140-mark">就绪</span>
        <span class="muted home-ok-domain-brand-en-calm-r140-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainBrandEnCalmGoR140">去设置</button>`;
      const btn = $("#homeOkDomainBrandEnCalmGoR140");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-domain-brand-en-calm-r140-mark">就绪</span>
        <span class="muted home-ok-domain-brand-en-calm-r140-sub">就绪域名英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkDomainBrandEnCalmGoR140">去设置</button>`;
      const btn = $("#homeOkDomainBrandEnCalmGoR140");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+处置+受益人组合复制 */
  async function ensureLegacyIdDispositionBeneficiaryCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const line = "#" + id + " · " + disposition + " · " + bene;
      el.dataset.idDispositionBeneficiary = line;
      if (el.querySelector(".lg-copy-id-disposition-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-disposition-beneficiary";
      btn.textContent = "复制编号处置受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDispositionBeneficiary || "");
        softBanner(ok ? "已复制编号处置受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+摘要+可见性组合复制 */
  async function ensureAssetTagSummaryVisibilityCopyButtons() {
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
      const summary = String(it.summary || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = tag + " · " + summary + " · " + visibility;
      el.dataset.tagSummaryVisibility = line;
      if (el.querySelector(".as-copy-tag-summary-visibility")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-summary-visibility";
      btn.textContent = "复制标签摘要可见";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagSummaryVisibility || "");
        softBanner(ok ? "已复制标签摘要可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态标签 */
  async function ensureCheckinNextAtStatusLabelPlainR140Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtStatusLabelPlainR140CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtStatusLabelPlainR140CopyCard";
      card.className = "checkin-next-at-status-label-plain-r140-copy";
      const winAgo = $("#checkinWindowEndsLastAgoPlainR139CopyCard");
      const statusAgo = $("#checkinStatusLabelLastAgoPlainR138CopyCard");
      const lastNext = $("#checkinLastAgoNextAtPlainR137CopyCard");
      if (winAgo && winAgo.parentNode)
        winAgo.insertAdjacentElement("afterend", card);
      else if (statusAgo && statusAgo.parentNode)
        statusAgo.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const combo = nextAt + " · " + statusLabel;
      const line =
        "下次建议 · 报备状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-status-label-plain-r140-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtStatusLabelPlainR140CopyBtn">复制下次状态R140</button>`;
      const btn = $("#checkinNextAtStatusLabelPlainR140CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次状态R140" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+进度百分比+短差三元复制 */
  async function ensureTravelBalanceProgressShortfallPlainR140Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceProgressShortfallPlainR140CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceProgressShortfallPlainR140CopyCard";
      card.className = "travel-balance-progress-shortfall-plain-r140-copy";
      const depShort = $("#travelDepositedShortfallMetPlainR139CopyCard");
      const thrProg = $("#travelThresholdProgressMetPlainR138CopyCard");
      const progDep = $("#travelProgressDepositedBalancePlainR137CopyCard");
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
      else if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
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
      const pct =
        fund.progress_pct != null
          ? String(Math.round(Number(fund.progress_pct)))
          : fund.progress != null
            ? String(Math.round(Number(fund.progress)))
            : "—";
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = bal + " · " + pct + "% · " + short;
      const line =
        "差旅余额 · 进度 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-progress-shortfall-plain-r140-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceProgressShortfallPlainR140CopyBtn">复制余额进度缺口</button>`;
      const btn = $("#travelBalanceProgressShortfallPlainR140CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额进度缺口" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额进度缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+状态+编号组合复制 */
  async function ensureAftercareHospitalStatusIdCopyButtons() {
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
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const id = String(it.id);
      const line = hospital + " · " + status + " · #" + id;
      el.dataset.hospitalStatusId = line;
      if (el.querySelector(".ac-copy-hospital-status-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-status-id";
      btn.textContent = "复制医院状态编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalStatusId || "");
        softBanner(ok ? "已复制医院状态编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+时长提示+完成态组合复制 */
  async function ensureAuthReadyDurationCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyDurationCompleteCopyR140Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyDurationCompleteCopyR140Card";
      card.className = "av-ready-duration-complete-copy-r140";
      const completeMiss = $("#avCompleteMissingTitleCopyR139Card");
      const missDur = $("#avMissingDurationReadyCopyR138Card");
      const titleReady = $("#avTitleReadyCompleteCopyR137Card");
      if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (titleReady && titleReady.parentNode)
        titleReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const duration =
        String(
          data.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            ""
        ).trim() || "无时长提示";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = ready + " · " + duration + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-duration-complete-copy-r140-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyDurationCompleteCopyR140Btn">复制就绪时长完成</button>`;
      const btn = $("#avReadyDurationCompleteCopyR140Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪时长完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪时长完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+联系方式组合复制 */
  async function ensureHeirIdRelationContactCopyButtons() {
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
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = "#" + id + " · " + relation + " · " + contact;
      if (el.querySelector(".bn-copy-id-relation-contact-r140")) return;
      el.dataset.idRelationContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-contact-r140";
      btn.textContent = "复制编号关系联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationContact || "");
        softBanner(ok ? "已复制编号关系联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+进度百分比组合复制 */
  async function ensureHandoverDoneDomainProgressCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainProgressCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainProgressCopyCard";
      card.className = "hand-done-domain-progress-copy";
      const brandProg = $("#handBrandProgressSectionsCopyCard");
      const progDom = $("#handProgressDomainSectionsCopyCard");
      const doneSec = $("#handDoneSectionsBrandCopyCard");
      if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
      else if (progDom && progDom.parentNode)
        progDom.insertAdjacentElement("afterend", card);
      else if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const combo = done + " · " + domain + " · " + pct + "%";
      const line = "手册完成 · 域名 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-progress-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainProgressCopyBtn">复制完成域名进度</button>`;
      const btn = $("#handDoneDomainProgressCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+就绪+中文品牌+英文品牌四元复制 + round 层含 140 */
  async function paintVersionOkBrandBrandEnR140CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionOkBrandBrandEnR140CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionOkBrandBrandEnR140CopyCard";
      card.className = "card settings-version-ok-brand-brand-en-r140-copy-card";
      const brandOk = $("#settingsBrandBrandEnDomainOkR139CopyCard");
      const okVer = $("#settingsOkVersionDomainBrandEnR138CopyCard");
      const domVer = $("#settingsDomainVersionBrandEnBrandR137CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ver + " · " + ready + " · " + brand + " · " + en;
      card.innerHTML = `<h3>版本 · 就绪 · 品牌 · 英文</h3>
        <p class="muted">一键复制版本、就绪状态、中文品牌与英文品牌（演示级）。</p>
        <p class="settings-version-ok-brand-brand-en-r140-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionOkBrandBrandEnR140CopyBtn">复制版本就绪品牌英文</button>`;
      const btn = $("#settingsVersionOkBrandBrandEnR140CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本就绪品牌英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 就绪 · 品牌 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList140() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 140;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 140); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round140 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkDomainBrandEn().catch(() => {}), 870);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdDispositionBeneficiaryCopyButtons().catch(() => {}),
      700
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
      700
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtStatusLabelPlainR140Copy().catch(() => {}),
      690
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceProgressShortfallPlainR140Copy().catch(() => {}),
      710
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareHospitalStatusIdCopyButtons().catch(() => {}),
      700
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyDurationCompleteCopy().catch(() => {}),
      670
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationContactCopyButtons().catch(() => {}),
      700
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainProgressCopy().catch(() => {}),
      710
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkDomainBrandEn().catch(() => {}), 870);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyIdDispositionBeneficiaryCopyButtons().catch(() => {}),
        720
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
        710
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtStatusLabelPlainR140Copy().catch(() => {}),
        710
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceProgressShortfallPlainR140Copy().catch(() => {}),
        730
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareHospitalStatusIdCopyButtons().catch(() => {}),
        720
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyDurationCompleteCopy().catch(() => {}),
        690
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationContactCopyButtons().catch(() => {}),
        710
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainProgressCopy().catch(() => {}),
        720
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkBrandBrandEnR140CopyCard().catch(() => {});
        paintRoundLayerList140();
      }, 760);
      setTimeout(() => {
        paintVersionOkBrandBrandEnR140CopyCard().catch(() => {});
        paintRoundLayerList140();
      }, 1440);
    }
  };

  setTimeout(() => paintHomeOkDomainBrandEn().catch(() => {}), 920);
  setTimeout(
    () => ensureLegacyIdDispositionBeneficiaryCopyButtons().catch(() => {}),
    940
  );
  setTimeout(
    () => ensureAssetTagSummaryVisibilityCopyButtons().catch(() => {}),
    960
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtStatusLabelPlainR140Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceProgressShortfallPlainR140Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalStatusIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyDurationCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainProgressCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkBrandBrandEnR140CopyCard().catch(() => {});
      paintRoundLayerList140();
    }, 780);
  }
})();
