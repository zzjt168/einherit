/* 电子继承 · 第一百八十三批增量（叠在 round182…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round183SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+域名+中文品牌冷静条 */
  async function paintHomeVersionDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionDomainBrandCalmBarR183");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionDomainBrandCalmBarR183";
      bar.className = "home-version-domain-brand-calm-r183";
      bar.setAttribute("role", "status");
      const brandBrandEn = $("#homeBrandBrandEnDomainCalmBarR182");
      const brandEnVer = $("#homeBrandEnVersionDomainCalmBarR181");
      const brandDom = $("#homeBrandDomainBrandEnCalmBarR180");
      if (brandBrandEn && brandBrandEn.parentNode === home)
        brandBrandEn.insertAdjacentElement("afterend", bar);
      else if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = ver + " · " + domain + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-calm-r183-mark">版本</span>
        <span class="muted home-version-domain-brand-calm-r183-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandCalmGoR183">去设置</button>`;
      const btn = $("#homeVersionDomainBrandCalmGoR183");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-domain-brand-calm-r183-mark">版本</span>
        <span class="muted home-version-domain-brand-calm-r183-sub">版本域名品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionDomainBrandCalmGoR183">去设置</button>`;
      const btn = $("#homeVersionDomainBrandCalmGoR183");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+处置意向组合复制（三进位） */
  async function ensureLegacyDeviceOwnerTitleDispositionCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const title = String(it.title || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const line = deviceOwner + " · " + title + " · " + disposition;
      el.dataset.deviceOwnerTitleDispositionR183 = line;
      if (el.querySelector(".lg-copy-device-owner-title-disposition-r183"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-device-owner-title-disposition-r183";
      btn.textContent = "复制归属标题处置R183";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.deviceOwnerTitleDispositionR183 || ""
        );
        softBanner(ok ? "已复制归属标题处置R183" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+摘要+标签组合复制（三进位） */
  async function ensureAssetCategorySummaryTagCopyButtons() {
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
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const tag = String(it.tag || it.label || "").trim() || "未填标签";
      const line = category + " · " + summary + " · " + tag;
      el.dataset.categorySummaryTagR183 = line;
      if (el.querySelector(".as-copy-category-summary-tag-r183")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-summary-tag-r183";
      btn.textContent = "复制分类摘要标签R183";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categorySummaryTagR183 || "");
        softBanner(ok ? "已复制分类摘要标签R183" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今+窗口截止（三进位） */
  async function ensureCheckinLastAgoWindowEndsPlainR183Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoWindowEndsPlainR183CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoWindowEndsPlainR183CopyCard";
      card.className = "checkin-last-ago-window-ends-plain-r183-copy";
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR182CopyCard");
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR181CopyCard");
      const statusLast = $("#checkinStatusLabelLastAgoPlainR180CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const combo = lastAgo + " · " + windowEnds;
      const line =
        "报备上次距今 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-window-ends-plain-r183-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoWindowEndsPlainR183CopyBtn">复制上次距今窗口截止R183</button>`;
      const btn = $("#checkinLastAgoWindowEndsPlainR183CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制上次距今窗口截止R183" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次距今窗口截止文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制（三进位） */
  async function ensureTravelThresholdBalanceDepositedPlainR183Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceDepositedPlainR183CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceDepositedPlainR183CopyCard";
      card.className = "travel-threshold-balance-deposited-plain-r183-copy";
      const balDep = $("#travelBalanceDepositedShortfallPlainR182CopyCard");
      const depShort = $("#travelDepositedShortfallThresholdPlainR181CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR180CopyCard");
      if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
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
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const combo = threshold + " · " + balance + " · " + deposited;
      const line =
        "差旅门槛 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-deposited-plain-r183-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceDepositedPlainR183CopyBtn">复制门槛余额已存R183</button>`;
      const btn = $("#travelThresholdBalanceDepositedPlainR183CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额已存R183" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+服务类型组合复制（三进位） */
  async function ensureAftercareCityHospitalServiceTypeCopyButtonsR183() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const line = city + " · " + hospital + " · " + serviceType;
      el.dataset.cityHospitalServiceTypeR183 = line;
      if (el.querySelector(".ac-copy-city-hospital-service-type-r183")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-hospital-service-type-r183";
      btn.textContent = "复制城市医院服务R183";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityHospitalServiceTypeR183 || "");
        softBanner(ok ? "已复制城市医院服务R183" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+时长提示+就绪组合复制（三进位） */
  async function ensureAuthMissingDurationHintReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingDurationHintReadyCopyR183Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingDurationHintReadyCopyR183Card";
      card.className = "av-missing-duration-hint-ready-copy-r183";
      const durReady = $("#avDurationHintReadyCompleteCopyR182Card");
      const readyComplete = $("#avReadyCompleteMissingCopyR181Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR180Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      let missingRaw =
        data.missing != null
          ? data.missing
          : prog.missing != null
            ? prog.missing
            : latest.missing;
      let missing;
      if (missingRaw == null || missingRaw === "") missing = "无缺失项";
      else if (Array.isArray(missingRaw))
        missing = missingRaw.length
          ? missingRaw.map(String).join("、")
          : "无缺失项";
      else missing = String(missingRaw);
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const combo = missing + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-duration-hint-ready-copy-r183-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingDurationHintReadyCopyR183Btn">复制缺失时长就绪R183</button>`;
      const btn = $("#avMissingDurationHintReadyCopyR183Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失时长就绪R183" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+关系+编号组合复制（三进位） */
  async function ensureHeirNameRelationIdCopyButtonsR183() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const idLabel = String(it.id);
      const line = name + " · " + relation + " · " + idLabel;
      if (el.querySelector(".bn-copy-name-relation-id-r183")) return;
      el.dataset.nameRelationIdR183 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-relation-id-r183";
      btn.textContent = "复制姓名关系编号R183";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameRelationIdR183 || "");
        softBanner(ok ? "已复制姓名关系编号R183" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+域名组合复制（三进位） */
  async function ensureHandoverProgressPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneDomainCopyR183Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneDomainCopyR183Card";
      card.className = "hand-progress-pct-done-domain-copy-r183";
      const doneDom = $("#handDoneDomainSectionsCopyR182Card");
      const domSec = $("#handDomainSectionsProgressPctCopyR181Card");
      const secPct = $("#handSectionsProgressPctDoneCopyR180Card");
      if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pctRaw =
        prog.pct != null
          ? prog.pct
          : prog.percent != null
            ? prog.percent
            : data.progress_pct;
      const pct =
        pctRaw == null ? "—" : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let domain = "einherit.cn";
      try {
        const h = await api("/api/health");
        domain = String(h.domain || data.domain || "einherit.cn").trim();
      } catch (_) {
        domain = String(data.domain || "einherit.cn").trim();
      }
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-domain-copy-r183-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneDomainCopyR183Btn">复制进度完成域名R183</button>`;
      const btn = $("#handProgressPctDoneDomainCopyR183Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成域名R183" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·ok+版本+英文品牌+中文品牌四元复制（再进位） + round 层含 183 */
  async function paintOkVersionBrandEnBrandR183CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandEnBrandR183CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandEnBrandR183CopyCard";
      card.className = "card settings-ok-version-brand-en-brand-r183-copy-card";
      const verBrand = $("#settingsVersionBrandEnBrandDomainR182CopyCard");
      const brandEn = $("#settingsBrandEnBrandDomainOkR181CopyCard");
      const brandDom = $("#settingsBrandDomainOkVersionR180CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + ver + " · " + en + " · " + brand;
      card.innerHTML = `<h3>ok · 版本 · 英文 · 品牌</h3>
        <p class="muted">一键复制健康态、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-ok-version-brand-en-brand-r183-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandEnBrandR183CopyBtn">复制ok版本英文品牌R183</button>`;
      const btn = $("#settingsOkVersionBrandEnBrandR183CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制ok版本英文品牌R183" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>ok · 版本 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList183() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 183;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 183); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round183 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoWindowEndsPlainR183Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdBalanceDepositedPlainR183Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityHospitalServiceTypeCopyButtonsR183().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingDurationHintReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameRelationIdCopyButtonsR183().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoWindowEndsPlainR183Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceDepositedPlainR183Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalServiceTypeCopyButtonsR183().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingDurationHintReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameRelationIdCopyButtonsR183().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandEnBrandR183CopyCard().catch(() => {});
        paintRoundLayerList183();
      }, 890);
      setTimeout(() => {
        paintOkVersionBrandEnBrandR183CopyCard().catch(() => {});
        paintRoundLayerList183();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeVersionDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDeviceOwnerTitleDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategorySummaryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoWindowEndsPlainR183Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceDepositedPlainR183Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalServiceTypeCopyButtonsR183().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingDurationHintReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameRelationIdCopyButtonsR183().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandEnBrandR183CopyCard().catch(() => {});
      paintRoundLayerList183();
    }, 910);
  }
})();
