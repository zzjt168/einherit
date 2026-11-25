/* 电子继承 · 第一百九十五批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round195SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+中文品牌+域名冷静条 */
  async function paintHomeBrandEnBrandDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnBrandDomainCalmBarR195");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnBrandDomainCalmBarR195";
      bar.className = "home-brand-en-brand-domain-calm-r195";
      bar.setAttribute("role", "status");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR194");
      const domainEn = $("#homeDomainBrandEnVersionCalmBarR193");
      const brandDom = $("#homeBrandDomainVersionCalmBarR192");
      if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + brand + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-domain-calm-r195-mark">英文</span>
        <span class="muted home-brand-en-brand-domain-calm-r195-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandDomainCalmGoR195">去设置</button>`;
      const btn = $("#homeBrandEnBrandDomainCalmGoR195");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-domain-calm-r195-mark">英文</span>
        <span class="muted home-brand-en-brand-domain-calm-r195-sub">英文品牌域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandDomainCalmGoR195">去设置</button>`;
      const btn = $("#homeBrandEnBrandDomainCalmGoR195");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+受益人+设备归属组合复制（四进位） */
  async function ensureLegacyTitleBeneficiaryDeviceOwnerCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const line = title + " · " + beneficiary + " · " + deviceOwner;
      el.dataset.titleBeneficiaryDeviceOwnerR195 = line;
      if (el.querySelector(".lg-copy-title-beneficiary-device-owner-r195")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-beneficiary-device-owner-r195";
      btn.textContent = "复制标题受益人归属R195";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleBeneficiaryDeviceOwnerR195 || "");
        softBanner(ok ? "已复制标题受益人归属R195" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+分类+标签组合复制（四进位） */
  async function ensureAssetVisibilityCategoryTagCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const category =
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const tag = String(it.tag || it.tags || "").trim() || "无标签";
      const line = visibility + " · " + category + " · " + tag;
      el.dataset.visibilityCategoryTagR195 = line;
      if (el.querySelector(".as-copy-visibility-category-tag-r195")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-category-tag-r195";
      btn.textContent = "复制可见性分类标签R195";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilityCategoryTagR195 || ""
        );
        softBanner(ok ? "已复制可见性分类标签R195" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+上次距今+窗口截止（四进位） */
  async function ensureCheckinStatusLastAgoWindowEndsPlainR195Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLastAgoWindowEndsPlainR195CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLastAgoWindowEndsPlainR195CopyCard";
      card.className =
        "checkin-status-last-ago-window-ends-plain-r195-copy";
      const lastNext = $(
        "#checkinLastAgoNextSuggestedWindowEndsPlainR194CopyCard"
      );
      const nextStatus = $(
        "#checkinNextSuggestedStatusWindowEndsPlainR193CopyCard"
      );
      const winStatus = $(
        "#checkinWindowEndsStatusLastAgoPlainR192CopyCard"
      );
      if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
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
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
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
            st.window_end ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const combo = status + " · " + lastAgo + " · " + windowEnds;
      const line =
        "报备状态 · 上次距今 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-last-ago-window-ends-plain-r195-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLastAgoWindowEndsPlainR195CopyBtn">复制状态距今窗口R195</button>`;
      const btn = $("#checkinStatusLastAgoWindowEndsPlainR195CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距今窗口R195" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距今窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制（四进位） */
  async function ensureTravelThresholdBalanceDepositedPlainR195Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceDepositedPlainR195CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceDepositedPlainR195CopyCard";
      card.className = "travel-threshold-balance-deposited-plain-r195-copy";
      const shortBal = $(
        "#travelShortfallBalanceDepositedPlainR194CopyCard"
      );
      const depBal = $(
        "#travelDepositedBalanceShortfallPlainR193CopyCard"
      );
      const balThr = $(
        "#travelBalanceThresholdShortfallPlainR192CopyCard"
      );
      if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted travel-threshold-balance-deposited-plain-r195-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceDepositedPlainR195CopyBtn">复制门槛余额已存R195</button>`;
      const btn = $("#travelThresholdBalanceDepositedPlainR195CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额已存R195" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+服务类型+医院组合复制（四进位） */
  async function ensureAftercareCityServiceTypeHospitalCopyButtonsR195() {
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
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = city + " · " + serviceType + " · " + hospital;
      el.dataset.cityServiceTypeHospitalR195 = line;
      if (el.querySelector(".ac-copy-city-service-type-hospital-r195"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-service-type-hospital-r195";
      btn.textContent = "复制城市服务医院R195";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityServiceTypeHospitalR195 || ""
        );
        softBanner(ok ? "已复制城市服务医院R195" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+完成+就绪组合复制（四进位） */
  async function ensureAuthMissingCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCompleteReadyCopyR195Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCompleteReadyCopyR195Card";
      card.className = "av-missing-complete-ready-copy-r195";
      const completeReady = $("#avCompleteReadyDurationHintCopyR194Card");
      const durComplete = $("#avDurationHintCompleteMissingCopyR193Card");
      const readyMiss = $("#avReadyMissingCompleteCopyR192Card");
      if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
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
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete
      )
        ? "已完成"
        : "未完成";
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const combo = missing + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-complete-ready-copy-r195-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCompleteReadyCopyR195Btn">复制缺失完成就绪R195</button>`;
      const btn = $("#avMissingCompleteReadyCopyR195Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失完成就绪R195" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+编号+联系方式组合复制（四进位） */
  async function ensureHeirNameIdContactCopyButtonsR195() {
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
      const idLabel = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = name + " · " + idLabel + " · " + contact;
      if (el.querySelector(".bn-copy-name-id-contact-r195")) return;
      el.dataset.nameIdContactR195 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-id-contact-r195";
      btn.textContent = "复制姓名编号联系R195";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameIdContactR195 || "");
        softBanner(ok ? "已复制姓名编号联系R195" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+章节数组合复制（四进位） */
  async function ensureHandoverProgressPctDoneSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDoneSectionsCopyR195Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDoneSectionsCopyR195Card";
      card.className = "hand-progress-pct-done-sections-copy-r195";
      const domDone = $("#handDomainDoneProgressPctCopyR194Card");
      const secPct = $("#handSectionsProgressPctDomainCopyR193Card");
      const doneDom = $("#handDoneDomainSectionsCopyR192Card");
      if (domDone && domDone.parentNode)
        domDone.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
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
        pctRaw == null
          ? "—"
          : String(pctRaw) + (String(pctRaw).endsWith("%") ? "" : "%");
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
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
      const combo = pct + " · " + done + " · " + sections;
      const line = "手册进度 · 完成 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-done-sections-copy-r195-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDoneSectionsCopyR195Btn">复制进度完成章节R195</button>`;
      const btn = $("#handProgressPctDoneSectionsCopyR195Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成章节R195" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintDomainVersionOkBrandEnR195CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainVersionOkBrandEnR195CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainVersionOkBrandEnR195CopyCard";
      card.className = "card settings-domain-version-ok-brand-en-r195-copy-card";
      const brandEnOk2 = $("#settingsBrandEnOkBrandVersionR194CopyCard");
      const okVer = $("#settingsOkVersionBrandDomainR193CopyCard");
      const verBrand = $("#settingsVersionBrandDomainBrandEnR192CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEnOk2 && brandEnOk2.parentNode)
        brandEnOk2.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + ver + " · " + okLabel + " · " + en;
      card.innerHTML = `<h3>域名 · 版本 · ok · 英文</h3>
        <p class="muted">一键复制域名、版本、健康态与英文品牌（演示级）。</p>
        <p class="settings-domain-version-ok-brand-en-r195-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainVersionOkBrandEnR195CopyBtn">复制域名版本就绪英文R195</button>`;
      const btn = $("#settingsDomainVersionOkBrandEnR195CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名版本就绪英文R195" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 版本 · ok · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList195() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 195); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round195 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleBeneficiaryDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilityCategoryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusLastAgoWindowEndsPlainR195Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdBalanceDepositedPlainR195Copy().catch(
          () => {}
        ),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareCityServiceTypeHospitalCopyButtonsR195().catch(
          () => {}
        ),
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
      () => ensureHeirNameIdContactCopyButtonsR195().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDoneSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleBeneficiaryDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityCategoryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLastAgoWindowEndsPlainR195Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceDepositedPlainR195Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityServiceTypeHospitalCopyButtonsR195().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameIdContactCopyButtonsR195().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDoneSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainVersionOkBrandEnR195CopyCard().catch(() => {});
        paintRoundLayerList195();
      }, 890);
      setTimeout(() => {
        paintDomainVersionOkBrandEnR195CopyCard().catch(() => {});
        paintRoundLayerList195();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnBrandDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleBeneficiaryDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilityCategoryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLastAgoWindowEndsPlainR195Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceDepositedPlainR195Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityServiceTypeHospitalCopyButtonsR195().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameIdContactCopyButtonsR195().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDoneSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainVersionOkBrandEnR195CopyCard().catch(() => {});
      paintRoundLayerList195();
    }, 910);
  }
})();
