/* 电子继承 · 第一百六十五批增量（叠在 round164…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round165SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+中文品牌+就绪冷静条 */
  async function paintHomeVersionBrandOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandOkCalmBarR165");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandOkCalmBarR165";
      bar.className = "home-version-brand-ok-calm-r165";
      bar.setAttribute("role", "status");
      const brandDom = $("#homeBrandDomainBrandEnCalmBarR164");
      const okEn = $("#homeOkBrandEnVersionCalmBarR163");
      const domainVer = $("#homeDomainVersionBrandCalmBarR162");
      if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (domainVer && domainVer.parentNode === home)
        domainVer.insertAdjacentElement("afterend", bar);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = ver + " · " + brand + " · " + okLabel;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-ok-calm-r165-mark">版本</span>
        <span class="muted home-version-brand-ok-calm-r165-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandOkCalmGoR165">去设置</button>`;
      const btn = $("#homeVersionBrandOkCalmGoR165");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-ok-calm-r165-mark">版本</span>
        <span class="muted home-version-brand-ok-calm-r165-sub">版本品牌就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandOkCalmGoR165">去设置</button>`;
      const btn = $("#homeVersionBrandOkCalmGoR165");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置方式+受益人+标题组合复制 */
  async function ensureLegacyDispositionBeneficiaryTitleCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const title = String(it.title || "").trim() || "无标题";
      const line = disposition + " · " + beneficiary + " · " + title;
      el.dataset.dispositionBeneficiaryTitleR165 = line;
      if (el.querySelector(".lg-copy-disposition-beneficiary-title-r165"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-beneficiary-title-r165";
      btn.textContent = "复制处置受益人标题";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryTitleR165 || ""
        );
        softBanner(ok ? "已复制处置受益人标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+摘要+平台组合复制 */
  async function ensureAssetTagSummaryPlatformCopyButtons() {
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
      const tag = String(it.tag || it.category || "").trim() || "未填标签";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const line = tag + " · " + summary + " · " + platform;
      el.dataset.tagSummaryPlatformR165 = line;
      if (el.querySelector(".as-copy-tag-summary-platform-r165")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-summary-platform-r165";
      btn.textContent = "复制标签摘要平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagSummaryPlatformR165 || "");
        softBanner(ok ? "已复制标签摘要平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+状态标签 */
  async function ensureCheckinLastAgoStatusLabelPlainR165Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoStatusLabelPlainR165CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoStatusLabelPlainR165CopyCard";
      card.className = "checkin-last-ago-status-label-plain-r165-copy";
      const statusNext = $("#checkinStatusLabelNextSuggestedPlainR164CopyCard");
      const nextWin = $("#checkinNextSuggestedWindowEndsPlainR163CopyCard");
      const winLast = $("#checkinWindowEndsLastAgoPlainR162CopyCard");
      if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "暂无状态";
      const combo = lastAgo + " · " + statusLabel;
      const line =
        "报备距上次 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-status-label-plain-r165-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoStatusLabelPlainR165CopyBtn">复制距上次状态</button>`;
      const btn = $("#checkinLastAgoStatusLabelPlainR165CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次状态" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+短差三元复制 */
  async function ensureTravelThresholdBalanceShortfallPlainR165Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceShortfallPlainR165CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceShortfallPlainR165CopyCard";
      card.className = "travel-threshold-balance-shortfall-plain-r165-copy";
      const shortDep = $("#travelShortfallDepositedBalancePlainR164CopyCard");
      const balThr = $("#travelBalanceThresholdProgressPlainR163CopyCard");
      const progDep = $("#travelProgressDepositedThresholdPlainR162CopyCard");
      if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = thr + " · " + balance + " · " + shortfall;
      const line =
        "差旅门槛 · 余额 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-shortfall-plain-r165-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceShortfallPlainR165CopyBtn">复制门槛余额短差</button>`;
      const btn = $("#travelThresholdBalanceShortfallPlainR165CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额短差文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+状态+服务类型组合复制 */
  async function ensureAftercareHospitalStatusServiceTypeCopyButtons() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const status =
        String(it.status || it.state || it.visit_pref || "").trim() ||
        "未填状态";
      const serviceType =
        String(it.service_type || it.service || it.department || "").trim() ||
        "未填服务类型";
      const line = hospital + " · " + status + " · " + serviceType;
      el.dataset.hospitalStatusServiceTypeR165 = line;
      if (el.querySelector(".ac-copy-hospital-status-service-type-r165")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-status-service-type-r165";
      btn.textContent = "复制医院状态类型";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalStatusServiceTypeR165 || ""
        );
        softBanner(ok ? "已复制医院状态类型" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+时长提示组合复制 */
  async function ensureAuthReadyCompleteDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteDurationHintCopyR165Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteDurationHintCopyR165Card";
      card.className = "av-ready-complete-duration-hint-copy-r165";
      const durMiss = $("#avDurationHintMissingCompleteCopyR164Card");
      const completeReady = $("#avCompleteReadyMissingCopyR163Card");
      const readyMiss = $("#avReadyMissingDurationHintCopyR162Card");
      if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const combo = ready + " · " + complete + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-duration-hint-copy-r165-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteDurationHintCopyR165Btn">复制就绪完成时长</button>`;
      const btn = $("#avReadyCompleteDurationHintCopyR165Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系方式+编号组合复制 */
  async function ensureHeirRelationContactIdCopyButtons() {
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
      const relation = String(it.relation || "").trim() || "未填关系";
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const id = String(it.id);
      const line = relation + " · " + contact + " · " + id;
      if (el.querySelector(".bn-copy-relation-contact-id-r165")) return;
      el.dataset.relationContactIdR165 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact-id-r165";
      btn.textContent = "复制关系联系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContactIdR165 || "");
        softBanner(ok ? "已复制关系联系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+进度百分比组合复制 */
  async function ensureHandoverSectionsDoneProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDoneProgressPctCopyR165Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDoneProgressPctCopyR165Card";
      card.className = "hand-sections-done-progress-pct-copy-r165";
      const pctDone = $("#handProgressPctDoneDomainCopyR164Card");
      const domSec = $("#handDomainSectionsBrandCopyR163Card");
      const doneBrand = $("#handDoneBrandProgressPctCopyR162Card");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const sections =
        data.sections != null
          ? String(data.sections)
          : prog.sections != null
            ? String(prog.sections)
            : prog.total_types != null
              ? String(prog.total_types)
              : data.total != null
                ? String(data.total)
                : "—";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const combo = sections + " · " + done + " · " + pct;
      const line = "手册章节 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-progress-pct-copy-r165-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDoneProgressPctCopyR165Btn">复制章节完成进度</button>`;
      const btn = $("#handSectionsDoneProgressPctCopyR165Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节完成进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+域名+就绪+英文品牌四元复制 + round 层含 165 */
  async function paintBrandDomainOkBrandEnR165CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandDomainOkBrandEnR165CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandDomainOkBrandEnR165CopyCard";
      card.className = "card settings-brand-domain-ok-brand-en-r165-copy-card";
      const brandEn = $("#settingsBrandEnVersionOkDomainR164CopyCard");
      const domainOk = $("#settingsDomainOkVersionBrandR163CopyCard");
      const okBrand = $("#settingsOkBrandBrandEnVersionR162CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = brand + " · " + domain + " · " + okLabel + " · " + en;
      card.innerHTML = `<h3>品牌 · 域名 · 就绪 · 英文</h3>
        <p class="muted">一键复制中文品牌、域名、就绪态与英文品牌（演示级）。</p>
        <p class="settings-brand-domain-ok-brand-en-r165-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandDomainOkBrandEnR165CopyBtn">复制品牌域名就绪英文</button>`;
      const btn = $("#settingsBrandDomainOkBrandEnR165CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名就绪英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · 就绪 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList165() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 165;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 165); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round165 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDispositionBeneficiaryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagSummaryPlatformCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoStatusLabelPlainR165Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdBalanceShortfallPlainR165Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalStatusServiceTypeCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactIdCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDoneProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionBeneficiaryTitleCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagSummaryPlatformCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoStatusLabelPlainR165Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceShortfallPlainR165Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalStatusServiceTypeCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactIdCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDoneProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandDomainOkBrandEnR165CopyCard().catch(() => {});
        paintRoundLayerList165();
      }, 890);
      setTimeout(() => {
        paintBrandDomainOkBrandEnR165CopyCard().catch(() => {});
        paintRoundLayerList165();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDispositionBeneficiaryTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagSummaryPlatformCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoStatusLabelPlainR165Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceShortfallPlainR165Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalStatusServiceTypeCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDoneProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandDomainOkBrandEnR165CopyCard().catch(() => {});
      paintRoundLayerList165();
    }, 910);
  }
})();
