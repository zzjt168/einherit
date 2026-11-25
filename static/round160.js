/* 电子继承 · 第一百六十批增量（叠在 round159…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round160SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+就绪+域名冷静条 */
  async function paintHomeVersionOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionOkDomainCalmBarR160");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionOkDomainCalmBarR160";
      bar.className = "home-version-ok-domain-calm-r160";
      bar.setAttribute("role", "status");
      const domainEn = $("#homeDomainBrandEnBrandCalmBarR159");
      const brandOk = $("#homeBrandOkVersionCalmBarR158");
      const okEn = $("#homeOkBrandEnDomainCalmBarR157");
      if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (brandOk && brandOk.parentNode === home)
        brandOk.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = ver + " · " + okLabel + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-domain-calm-r160-mark">版本</span>
        <span class="muted home-version-ok-domain-calm-r160-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkDomainCalmGoR160">去设置</button>`;
      const btn = $("#homeVersionOkDomainCalmGoR160");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-ok-domain-calm-r160-mark">版本</span>
        <span class="muted home-version-ok-domain-calm-r160-sub">版本就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionOkDomainCalmGoR160">去设置</button>`;
      const btn = $("#homeVersionOkDomainCalmGoR160");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+处置方式组合复制 */
  async function ensureLegacyTitleBeneficiaryDispositionCopyButtons() {
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
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = title + " · " + beneficiary + " · " + disposition;
      el.dataset.titleBeneficiaryDisposition = line;
      if (el.querySelector(".lg-copy-title-beneficiary-disposition")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-disposition";
      btn.textContent = "复制标题受益人处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryDisposition || "");
        softBanner(ok ? "已复制标题受益人处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+摘要+可见性组合复制 */
  async function ensureAssetPlatformSummaryVisibilityCopyButtons() {
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
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const line = platform + " · " + summary + " · " + visibility;
      el.dataset.platformSummaryVisibilityR160 = line;
      if (el.querySelector(".as-copy-platform-summary-visibility-r160")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-summary-visibility-r160";
      btn.textContent = "复制平台摘要可见";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.platformSummaryVisibilityR160 || ""
        );
        softBanner(ok ? "已复制平台摘要可见" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+距上次标签 */
  async function ensureCheckinStatusLabelLastAgoPlainR160Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelLastAgoPlainR160CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelLastAgoPlainR160CopyCard";
      card.className = "checkin-status-label-last-ago-plain-r160-copy";
      const winNext = $("#checkinWindowEndsNextAtPlainR159CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR158CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR157CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            cd.status ||
            ""
        ).trim() || "暂无状态";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = statusLabel + " · " + lastAgo;
      const line =
        "报备状态 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-last-ago-plain-r160-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelLastAgoPlainR160CopyBtn">复制状态距上次R160</button>`;
      const btn = $("#checkinStatusLabelLastAgoPlainR160CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距上次R160" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+余额+短差三元复制 */
  async function ensureTravelDepositedBalanceShortfallPlainR160Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedBalanceShortfallPlainR160CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedBalanceShortfallPlainR160CopyCard";
      card.className = "travel-deposited-balance-shortfall-plain-r160-copy";
      const shortThr = $("#travelShortfallThresholdBalancePlainR159CopyCard");
      const balProg = $("#travelBalanceProgressThresholdPlainR158CopyCard");
      const depShort = $("#travelDepositedShortfallProgressPlainR157CopyCard");
      if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = deposited + " · " + bal + " · " + shortfall;
      const line =
        "差旅已存 · 余额 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-balance-shortfall-plain-r160-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedBalanceShortfallPlainR160CopyBtn">复制已存余额短差</button>`;
      const btn = $("#travelDepositedBalanceShortfallPlainR160CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存余额短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存余额短差文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+科室+医院组合复制 */
  async function ensureAftercareCityDepartmentHospitalCopyButtons() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = city + " · " + department + " · " + hospital;
      el.dataset.cityDepartmentHospitalR160 = line;
      if (el.querySelector(".ac-copy-city-department-hospital-r160")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-department-hospital-r160";
      btn.textContent = "复制城市科室医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityDepartmentHospitalR160 || "");
        softBanner(ok ? "已复制城市科室医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+完成态+就绪组合复制 */
  async function ensureAuthMissingCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCompleteReadyCopyR160Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCompleteReadyCopyR160Card";
      card.className = "av-missing-complete-ready-copy-r160";
      const readyDur = $("#avReadyDurationHintMissingCopyR159Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR158Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR157Card");
      if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = missLabel + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-complete-ready-copy-r160-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCompleteReadyCopyR160Btn">复制缺失完成就绪</button>`;
      const btn = $("#avMissingCompleteReadyCopyR160Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+联系方式+关系组合复制 */
  async function ensureHeirPassphraseHintContactRelationCopyButtons() {
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
      const phrase =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = phrase + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-passphrase-hint-contact-relation-r160"))
        return;
      el.dataset.passphraseHintContactRelationR160 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm bn-copy-passphrase-hint-contact-relation-r160";
      btn.textContent = "复制口令联系关系";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.passphraseHintContactRelationR160 || ""
        );
        softBanner(ok ? "已复制口令联系关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+进度百分比+域名组合复制 */
  async function ensureHandoverBrandProgressPctDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandProgressPctDomainCopyR160Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandProgressPctDomainCopyR160Card";
      card.className = "hand-brand-progress-pct-domain-copy-r160";
      const pctSec = $("#handProgressPctSectionsDoneCopyR159Card");
      const doneDom = $("#handDoneDomainSectionsCopyR158Card");
      const secBrand = $("#handSectionsBrandProgressPctCopyR157Card");
      if (pctSec && pctSec.parentNode)
        pctSec.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      const combo = brand + " · " + pct + " · " + domain;
      const line = "手册品牌 · 进度 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-progress-pct-domain-copy-r160-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandProgressPctDomainCopyR160Btn">复制品牌进度域名</button>`;
      const btn = $("#handBrandProgressPctDomainCopyR160Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌进度域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌进度域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·版本+就绪+英文品牌+域名四元复制 + round 层含 160 */
  async function paintVersionOkBrandEnDomainR160CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsVersionOkBrandEnDomainR160CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsVersionOkBrandEnDomainR160CopyCard";
      card.className = "card settings-version-ok-brand-en-domain-r160-copy-card";
      const brandEn = $("#settingsBrandEnDomainBrandOkR159CopyCard");
      const brandOk = $("#settingsBrandOkVersionDomainR158CopyCard");
      const okDom = $("#settingsOkDomainBrandEnVersionR157CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = ver + " · " + okLabel + " · " + en + " · " + domain;
      card.innerHTML = `<h3>版本 · 就绪 · 英文 · 域名</h3>
        <p class="muted">一键复制版本、就绪态、英文品牌与域名（演示级）。</p>
        <p class="settings-version-ok-brand-en-domain-r160-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsVersionOkBrandEnDomainR160CopyBtn">复制版本就绪英文域名</button>`;
      const btn = $("#settingsVersionOkBrandEnDomainR160CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制版本就绪英文域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>版本 · 就绪 · 英文 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList160() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 160;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 160); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round160 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleBeneficiaryDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelLastAgoPlainR160Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedBalanceShortfallPlainR160Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirPassphraseHintContactRelationCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandProgressPctDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleBeneficiaryDispositionCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelLastAgoPlainR160Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedBalanceShortfallPlainR160Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirPassphraseHintContactRelationCopyButtons().catch(
            () => {}
          ),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandProgressPctDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintVersionOkBrandEnDomainR160CopyCard().catch(() => {});
        paintRoundLayerList160();
      }, 890);
      setTimeout(() => {
        paintVersionOkBrandEnDomainR160CopyCard().catch(() => {});
        paintRoundLayerList160();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionOkDomain().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyTitleBeneficiaryDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetPlatformSummaryVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelLastAgoPlainR160Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedBalanceShortfallPlainR160Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseHintContactRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandProgressPctDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintVersionOkBrandEnDomainR160CopyCard().catch(() => {});
      paintRoundLayerList160();
    }, 910);
  }
})();
