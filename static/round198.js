/* 电子继承 · 第一百九十八批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round198SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+域名+中文品牌冷静条 */
  async function paintHomeBrandEnDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainBrandCalmBarR198");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainBrandCalmBarR198";
      bar.className = "home-brand-en-domain-brand-calm-r198";
      bar.setAttribute("role", "status");
      const domainVer = $("#homeDomainVersionBrandCalmBarR197");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR196");
      const brandEnDom = $("#homeBrandEnBrandDomainCalmBarR195");
      if (domainVer && domainVer.parentNode === home)
        domainVer.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (brandEnDom && brandEnDom.parentNode === home)
        brandEnDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = en + " · " + domain + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-brand-calm-r198-mark">英文</span>
        <span class="muted home-brand-en-domain-brand-calm-r198-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainBrandCalmGoR198">去设置</button>`;
      const btn = $("#homeBrandEnDomainBrandCalmGoR198");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-brand-calm-r198-mark">英文</span>
        <span class="muted home-brand-en-domain-brand-calm-r198-sub">英文域名品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainBrandCalmGoR198">去设置</button>`;
      const btn = $("#homeBrandEnDomainBrandCalmGoR198");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+设备归属+处置意向组合复制（四进位） */
  async function ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const disposition =
        String(
          it.disposition || it.action || it.dispose || it.dispose_action || ""
        ).trim() || "未填处置";
      const line = beneficiary + " · " + deviceOwner + " · " + disposition;
      el.dataset.beneficiaryDeviceOwnerDispositionR198 = line;
      if (el.querySelector(".lg-copy-beneficiary-device-owner-disposition-r198")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-device-owner-disposition-r198";
      btn.textContent = "复制受益人归属处置R198";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryDeviceOwnerDispositionR198 || "");
        softBanner(ok ? "已复制受益人归属处置R198" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+分类组合复制（四进位） */
  async function ensureAssetSummaryTagCategoryCopyButtons() {
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
      const tag = String(it.tag || it.tags || "").trim() || "无标签";
      const category =
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const line = summary + " · " + tag + " · " + category;
      el.dataset.summaryTagCategoryR198 = line;
      if (el.querySelector(".as-copy-summary-tag-category-r198")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-category-r198";
      btn.textContent = "复制摘要标签分类R198";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryTagCategoryR198 || ""
        );
        softBanner(ok ? "已复制摘要标签分类R198" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+窗口截止+下次建议（四进位） */
  async function ensureCheckinStatusWindowEndsNextSuggestedPlainR198Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusWindowEndsNextSuggestedPlainR198CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusWindowEndsNextSuggestedPlainR198CopyCard";
      card.className =
        "checkin-status-window-ends-next-suggested-plain-r198-copy";
      const winNext = $(
        "#checkinWindowEndsNextSuggestedLastAgoPlainR197CopyCard"
      );
      const nextLast = $(
        "#checkinNextSuggestedLastAgoStatusPlainR196CopyCard"
      );
      const statusLast = $(
        "#checkinStatusLastAgoWindowEndsPlainR195CopyCard"
      );
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
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
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            st.window_end ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = status + " · " + windowEnds + " · " + nextAt;
      const line =
        "报备状态 · 窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-window-ends-next-suggested-plain-r198-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusWindowEndsNextSuggestedPlainR198CopyBtn">复制状态窗口下次R198</button>`;
      const btn = $("#checkinStatusWindowEndsNextSuggestedPlainR198CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态窗口下次R198" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态窗口下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅缺口+门槛+余额三元复制（四进位） */
  async function ensureTravelShortfallThresholdBalancePlainR198Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdBalancePlainR198CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdBalancePlainR198CopyCard";
      card.className = "travel-shortfall-threshold-balance-plain-r198-copy";
      const balDep = $(
        "#travelBalanceDepositedThresholdPlainR197CopyCard"
      );
      const depShort = $(
        "#travelDepositedShortfallBalancePlainR196CopyCard"
      );
      const thrBal = $(
        "#travelThresholdBalanceDepositedPlainR195CopyCard"
      );
      if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
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
      const combo = shortfall + " · " + threshold + " · " + balance;
      const line =
        "差旅缺口 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-balance-plain-r198-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdBalancePlainR198CopyBtn">复制缺口门槛余额R198</button>`;
      const btn = $("#travelShortfallThresholdBalancePlainR198CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺口门槛余额R198" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺口门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+医院+科室组合复制（四进位） */
  async function ensureAftercareCityHospitalDepartmentCopyButtonsR198() {
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
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = city + " · " + hospital + " · " + department;
      el.dataset.cityHospitalDepartmentR198 = line;
      if (el.querySelector(".ac-copy-city-hospital-department-r198"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-hospital-department-r198";
      btn.textContent = "复制城市医院科室R198";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityHospitalDepartmentR198 || ""
        );
        softBanner(ok ? "已复制城市医院科室R198" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成+缺失项+时长提示组合复制（四进位） */
  async function ensureAuthCompleteMissingDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteMissingDurationHintCopyR198Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteMissingDurationHintCopyR198Card";
      card.className = "av-complete-missing-duration-hint-copy-r198";
      const durReady = $("#avDurationHintReadyCompleteCopyR197Card");
      const readyDur = $("#avReadyDurationHintMissingCopyR196Card");
      const missComplete = $("#avMissingCompleteReadyCopyR195Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : latest.complete
      )
        ? "已完成"
        : "未完成";
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
      const combo = complete + " · " + missing + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-missing-duration-hint-copy-r198-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteMissingDurationHintCopyR198Btn">复制完成缺失时长R198</button>`;
      const btn = $("#avCompleteMissingDurationHintCopyR198Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成缺失时长R198" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成缺失时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+姓名+关系组合复制（四进位） */
  async function ensureHeirContactNameRelationCopyButtonsR198() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation-r198")) return;
      el.dataset.contactNameRelationR198 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation-r198";
      btn.textContent = "复制联系姓名关系R198";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelationR198 || "");
        softBanner(ok ? "已复制联系姓名关系R198" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+完成数组合复制（四进位） */
  async function ensureHandoverDomainSectionsDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsDoneCopyR198Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsDoneCopyR198Card";
      card.className = "hand-domain-sections-done-copy-r198";
      const donePct = $("#handDoneProgressPctSectionsCopyR197Card");
      const secDone = $("#handSectionsDoneDomainCopyR196Card");
      const pctDone = $("#handProgressPctDoneSectionsCopyR195Card");
      if (donePct && donePct.parentNode)
        donePct.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
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
      const combo = domain + " · " + sections + " · " + done;
      const line = "手册域名 · 章节 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-sections-done-copy-r198-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsDoneCopyR198Btn">复制域名章节完成R198</button>`;
      const btn = $("#handDomainSectionsDoneCopyR198Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节完成R198" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintOkBrandEnVersionBrandR198CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnVersionBrandR198CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnVersionBrandR198CopyCard";
      card.className = "card settings-ok-brand-en-version-brand-r198-copy-card";
      const verDom = $("#settingsVersionDomainBrandEnOkR197CopyCard");
      const brandOk = $("#settingsBrandOkBrandEnDomainR196CopyCard");
      const domVer = $("#settingsDomainVersionOkBrandEnR195CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + en + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>ok · 英文 · 版本 · 品牌</h3>
        <p class="muted">一键复制健康态、英文品牌、版本与中文品牌（演示级）。</p>
        <p class="settings-ok-brand-en-version-brand-r198-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnVersionBrandR198CopyBtn">复制就绪英文版本品牌R198</button>`;
      const btn = $("#settingsOkBrandEnVersionBrandR198CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文版本品牌R198" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>ok · 英文 · 版本 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList198() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 198); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round198 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetSummaryTagCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusWindowEndsNextSuggestedPlainR198Copy().catch(
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
        ensureTravelShortfallThresholdBalancePlainR198Copy().catch(
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
        ensureAftercareCityHospitalDepartmentCopyButtonsR198().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtonsR198().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainSectionsDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryTagCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusWindowEndsNextSuggestedPlainR198Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdBalancePlainR198Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityHospitalDepartmentCopyButtonsR198().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteMissingDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameRelationCopyButtonsR198().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnVersionBrandR198CopyCard().catch(() => {});
        paintRoundLayerList198();
      }, 890);
      setTimeout(() => {
        paintOkBrandEnVersionBrandR198CopyCard().catch(() => {});
        paintRoundLayerList198();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryTagCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusWindowEndsNextSuggestedPlainR198Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdBalancePlainR198Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalDepartmentCopyButtonsR198().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteMissingDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtonsR198().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnVersionBrandR198CopyCard().catch(() => {});
      paintRoundLayerList198();
    }, 910);
  }
})();
