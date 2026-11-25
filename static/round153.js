/* 电子继承 · 第一百五十三批增量（叠在 round152…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round153SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+中文品牌+英文品牌冷静条 */
  async function paintHomeVersionBrandBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandBrandEnCalmBarR153");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandBrandEnCalmBarR153";
      bar.className = "home-version-brand-brand-en-calm-r153";
      bar.setAttribute("role", "status");
      const enOk = $("#homeBrandEnOkDomainCalmBarR152");
      const brandDom = $("#homeBrandDomainOkCalmBarR151");
      const okVer = $("#homeOkVersionBrandEnCalmBarR150");
      if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = ver + " · " + brand + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-brand-en-calm-r153-mark">版本</span>
        <span class="muted home-version-brand-brand-en-calm-r153-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandBrandEnCalmGoR153">去设置</button>`;
      const btn = $("#homeVersionBrandBrandEnCalmGoR153");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-brand-en-calm-r153-mark">版本</span>
        <span class="muted home-version-brand-brand-en-calm-r153-sub">版本中英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandBrandEnCalmGoR153">去设置</button>`;
      const btn = $("#homeVersionBrandBrandEnCalmGoR153");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置方式+标题+设备归属组合复制 */
  async function ensureLegacyDispositionTitleDeviceOwnerCopyButtons() {
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
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const owner =
        String(it.device_owner || it.dept || it.beneficiary || "").trim() ||
        "未填归属";
      const line = disposition + " · " + title + " · " + owner;
      el.dataset.dispositionTitleDeviceOwner = line;
      if (el.querySelector(".lg-copy-disposition-title-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-disposition-title-device-owner";
      btn.textContent = "复制处置标题归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.dispositionTitleDeviceOwner || "");
        softBanner(ok ? "已复制处置标题归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性+平台组合复制 */
  async function ensureAssetSummaryVisibilityPlatformCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const line = summary + " · " + visibility + " · " + platform;
      el.dataset.summaryVisibilityPlatform = line;
      if (el.querySelector(".as-copy-summary-visibility-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-visibility-platform";
      btn.textContent = "复制摘要可见平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryVisibilityPlatform || "");
        softBanner(ok ? "已复制摘要可见平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+距上次标签 */
  async function ensureCheckinNextAtLastAgoPlainR153Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtLastAgoPlainR153CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtLastAgoPlainR153CopyCard";
      card.className = "checkin-next-at-last-ago-plain-r153-copy";
      const winLast = $("#checkinWindowEndsLastAgoPlainR152CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR151CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR150CopyCard");
      if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = nextAt + " · " + lastAgo;
      const line =
        "报备下次建议 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-last-ago-plain-r153-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtLastAgoPlainR153CopyBtn">复制下次距上次R153</button>`;
      const btn = $("#checkinNextAtLastAgoPlainR153CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距上次R153" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+门槛+进度百分比三元复制 */
  async function ensureTravelBalanceThresholdProgressPlainR153Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceThresholdProgressPlainR153CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceThresholdProgressPlainR153CopyCard";
      card.className = "travel-balance-threshold-progress-plain-r153-copy";
      const progShort = $("#travelProgressShortfallDepositedPlainR152CopyCard");
      const depThr = $("#travelDepositedThresholdShortfallPlainR151CopyCard");
      const thrProg = $("#travelThresholdProgressBalancePlainR150CopyCard");
      if (progShort && progShort.parentNode)
        progShort.insertAdjacentElement("afterend", card);
      else if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
      else if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const combo = bal + " · " + thr + " · " + pct;
      const line =
        "差旅余额 · 门槛 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-threshold-progress-plain-r153-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceThresholdProgressPlainR153CopyBtn">复制余额门槛进度</button>`;
      const btn = $("#travelBalanceThresholdProgressPlainR153CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额门槛进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额门槛进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+医院+状态组合复制 */
  async function ensureAftercareServiceHospitalStatusCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const status =
        String(it.status_label || it.status || it.status_key || it.title || "").trim() ||
        "未填状态";
      const line = service + " · " + hospital + " · " + status;
      el.dataset.serviceHospitalStatus = line;
      if (el.querySelector(".ac-copy-service-hospital-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-hospital-status";
      btn.textContent = "复制服务医院状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceHospitalStatus || "");
        softBanner(ok ? "已复制服务医院状态" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+就绪+完成态组合复制 */
  async function ensureAuthMissingReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingReadyCompleteCopyR153Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingReadyCompleteCopyR153Card";
      card.className = "av-missing-ready-complete-copy-r153";
      const readyComplete = $("#avReadyCompleteDurationCopyR152Card");
      const missDur = $("#avMissingDurationCompleteCopyR151Card");
      const durComplete = $("#avDurationCompleteReadyCopyR150Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
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
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = missLabel + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-ready-complete-copy-r153-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingReadyCompleteCopyR153Btn">复制缺失就绪完成</button>`;
      const btn = $("#avMissingReadyCompleteCopyR153Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+联系方式组合复制 */
  async function ensureHeirRelationNameContactCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = relation + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-relation-name-contact-r153")) return;
      el.dataset.relationNameContactR153 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-contact-r153";
      btn.textContent = "复制关系姓名联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNameContactR153 || "");
        softBanner(ok ? "已复制关系姓名联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌+章节数+完成数组合复制 */
  async function ensureHandoverBrandSectionsDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandSectionsDoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandSectionsDoneCopyCard";
      card.className = "hand-brand-sections-done-copy";
      const secDone = $("#handSectionsDonePctCopyCard");
      const doneBrand = $("#handDoneBrandDomainCopyCard");
      const domainPct = $("#handDomainPctBrandCopyCard");
      if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else if (domainPct && domainPct.parentNode)
        domainPct.insertAdjacentElement("afterend", card);
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
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = brand + " · " + sectionsCount + " · " + done;
      const line = "手册品牌 · 章节 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-sections-done-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandSectionsDoneCopyBtn">复制品牌章节完成</button>`;
      const btn = $("#handBrandSectionsDoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制品牌章节完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">品牌章节完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+中文品牌+版本+域名四元复制 + round 层含 153 */
  async function paintBrandEnBrandVersionDomainR153CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnBrandVersionDomainR153CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnBrandVersionDomainR153CopyCard";
      card.className = "card settings-brand-en-brand-version-domain-r153-copy-card";
      const brandDom = $("#settingsBrandDomainVersionOkR152CopyCard");
      const domainOk = $("#settingsDomainOkVersionBrandEnR151CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR150CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (domainOk && domainOk.parentNode)
        domainOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = en + " · " + brand + " · " + ver + " · " + domain;
      card.innerHTML = `<h3>英文 · 品牌 · 版本 · 域名</h3>
        <p class="muted">一键复制英文品牌、中文品牌、版本与域名（演示级）。</p>
        <p class="settings-brand-en-brand-version-domain-r153-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnBrandVersionDomainR153CopyBtn">复制英文品牌版本域名</button>`;
      const btn = $("#settingsBrandEnBrandVersionDomainR153CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌版本域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 品牌 · 版本 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList153() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 153;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 153); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round153 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryVisibilityPlatformCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtLastAgoPlainR153Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceThresholdProgressPlainR153Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceHospitalStatusCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNameContactCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverBrandSectionsDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryVisibilityPlatformCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtLastAgoPlainR153Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceThresholdProgressPlainR153Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceHospitalStatusCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNameContactCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverBrandSectionsDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnBrandVersionDomainR153CopyCard().catch(() => {});
        paintRoundLayerList153();
      }, 890);
      setTimeout(() => {
        paintBrandEnBrandVersionDomainR153CopyCard().catch(() => {});
        paintRoundLayerList153();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionBrandBrandEn().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDispositionTitleDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryVisibilityPlatformCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtLastAgoPlainR153Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceThresholdProgressPlainR153Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceHospitalStatusCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNameContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandSectionsDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnBrandVersionDomainR153CopyCard().catch(() => {});
      paintRoundLayerList153();
    }, 910);
  }
})();
