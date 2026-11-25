/* 电子继承 · 第一百八十九批增量（叠在 round188…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round189SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+中文品牌+英文品牌冷静条 */
  async function paintHomeDomainBrandBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandBrandEnCalmBarR189");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandBrandEnCalmBarR189";
      bar.className = "home-domain-brand-brand-en-calm-r189";
      bar.setAttribute("role", "status");
      const brandBrandEn = $("#homeBrandBrandEnVersionCalmBarR188");
      const brandEnDom = $("#homeBrandEnDomainVersionCalmBarR187");
      const brandVer = $("#homeBrandVersionDomainCalmBarR186");
      if (brandBrandEn && brandBrandEn.parentNode === home)
        brandBrandEn.insertAdjacentElement("afterend", bar);
      else if (brandEnDom && brandEnDom.parentNode === home)
        brandEnDom.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = domain + " · " + brand + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-brand-en-calm-r189-mark">域名</span>
        <span class="muted home-domain-brand-brand-en-calm-r189-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandBrandEnCalmGoR189">去设置</button>`;
      const btn = $("#homeDomainBrandBrandEnCalmGoR189");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-brand-en-calm-r189-mark">域名</span>
        <span class="muted home-domain-brand-brand-en-calm-r189-sub">域名品牌英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandBrandEnCalmGoR189">去设置</button>`;
      const btn = $("#homeDomainBrandBrandEnCalmGoR189");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+受益人+标题组合复制（四进位） */
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
      el.dataset.dispositionBeneficiaryTitleR189 = line;
      if (el.querySelector(".lg-copy-disposition-beneficiary-title-r189"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-disposition-beneficiary-title-r189";
      btn.textContent = "复制处置受益人标题R189";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryTitleR189 || ""
        );
        softBanner(ok ? "已复制处置受益人标题R189" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+分类+摘要组合复制（四进位） */
  async function ensureAssetTagCategorySummaryCopyButtons() {
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
      const tag = String(it.tag || it.label || "").trim() || "未填标签";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = tag + " · " + category + " · " + summary;
      el.dataset.tagCategorySummaryR189 = line;
      if (el.querySelector(".as-copy-tag-category-summary-r189")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-category-summary-r189";
      btn.textContent = "复制标签分类摘要R189";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagCategorySummaryR189 || "");
        softBanner(ok ? "已复制标签分类摘要R189" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止+上次距今（四进位） */
  async function ensureCheckinNextSuggestedWindowEndsLastAgoPlainR189Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedWindowEndsLastAgoPlainR189CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedWindowEndsLastAgoPlainR189CopyCard";
      card.className =
        "checkin-next-suggested-window-ends-last-ago-plain-r189-copy";
      const winLast = $("#checkinWindowEndsLastAgoStatusPlainR188CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR187CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR186CopyCard");
      if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
      else if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const windowEnds =
        String(
          st.window_ends_at ||
            cd.window_ends_at ||
            user.window_ends_at ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = nextAt + " · " + windowEnds + " · " + lastAgo;
      const line =
        "报备下次建议 · 窗口截止 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-window-ends-last-ago-plain-r189-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedWindowEndsLastAgoPlainR189CopyBtn">复制下次窗口上次R189</button>`;
      const btn = $("#checkinNextSuggestedWindowEndsLastAgoPlainR189CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口上次R189" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+门槛+余额三元复制（四进位） */
  async function ensureTravelDepositedThresholdBalancePlainR189Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedThresholdBalancePlainR189CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedThresholdBalancePlainR189CopyCard";
      card.className = "travel-deposited-threshold-balance-plain-r189-copy";
      const balShort = $("#travelBalanceShortfallThresholdPlainR188CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR187CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR186CopyCard");
      if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
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
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
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
      const combo = deposited + " · " + threshold + " · " + balance;
      const line =
        "差旅已存 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-threshold-balance-plain-r189-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedThresholdBalancePlainR189CopyBtn">复制已存门槛余额R189</button>`;
      const btn = $("#travelDepositedThresholdBalancePlainR189CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存门槛余额R189" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+城市+科室组合复制（四进位） */
  async function ensureAftercareServiceTypeCityDepartmentCopyButtonsR189() {
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
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const line = serviceType + " · " + city + " · " + department;
      el.dataset.serviceTypeCityDepartmentR189 = line;
      if (el.querySelector(".ac-copy-service-type-city-department-r189"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-service-type-city-department-r189";
      btn.textContent = "复制服务城市科室R189";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeCityDepartmentR189 || ""
        );
        softBanner(ok ? "已复制服务城市科室R189" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+缺失项+完成组合复制（四进位） */
  async function ensureAuthDurationHintMissingCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintMissingCompleteCopyR189Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintMissingCompleteCopyR189Card";
      card.className = "av-duration-hint-missing-complete-copy-r189";
      const readyComplete = $("#avReadyCompleteMissingCopyR188Card");
      const missDur = $("#avMissingDurationHintReadyCopyR187Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR186Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const duration =
        String(
          data.duration_hint ||
            latest.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "无时长提示";
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
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + missing + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-missing-complete-copy-r189-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintMissingCompleteCopyR189Btn">复制时长缺失完成R189</button>`;
      const btn = $("#avDurationHintMissingCompleteCopyR189Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长缺失完成R189" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长缺失完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+关系组合复制（四进位） */
  async function ensureHeirIdNameRelationCopyButtonsR189() {
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
      const idLabel = String(it.id);
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = idLabel + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-id-name-relation-r189")) return;
      el.dataset.idNameRelationR189 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-relation-r189";
      btn.textContent = "复制编号姓名关系R189";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameRelationR189 || "");
        softBanner(ok ? "已复制编号姓名关系R189" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+进度百分比+完成数组合复制（四进位） */
  async function ensureHandoverDomainProgressPctDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainProgressPctDoneCopyR189Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainProgressPctDoneCopyR189Card";
      card.className = "hand-domain-progress-pct-done-copy-r189";
      const doneSec = $("#handDoneSectionsProgressPctCopyR188Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR187Card");
      const doneDom = $("#handDoneDomainSectionsCopyR186Card");
      if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
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
      let domain = "einherit.cn";
      try {
        const h = await api("/api/health");
        domain = String(h.domain || data.domain || "einherit.cn").trim();
      } catch (_) {
        domain = String(data.domain || "einherit.cn").trim();
      }
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
      const combo = domain + " · " + pct + " · " + done;
      const line = "手册域名 · 进度 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-progress-pct-done-copy-r189-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainProgressPctDoneCopyR189Btn">复制域名进度完成R189</button>`;
      const btn = $("#handDomainProgressPctDoneCopyR189Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名进度完成R189" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名进度完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+版本+域名+中文品牌四元复制（再进位） + round 层含 189 */
  async function paintBrandEnVersionDomainBrandR189CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnVersionDomainBrandR189CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnVersionDomainBrandR189CopyCard";
      card.className =
        "card settings-brand-en-version-domain-brand-r189-copy-card";
      const brandDom = $("#settingsBrandDomainVersionOkR188CopyCard");
      const verBrand = $("#settingsVersionBrandEnBrandDomainR187CopyCard");
      const brandEnOk = $("#settingsBrandEnBrandDomainOkR186CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk && brandEnOk.parentNode)
        brandEnOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = en + " · " + ver + " · " + domain + " · " + brand;
      card.innerHTML = `<h3>英文 · 版本 · 域名 · 品牌</h3>
        <p class="muted">一键复制英文品牌、版本、域名与中文品牌（演示级）。</p>
        <p class="settings-brand-en-version-domain-brand-r189-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnVersionDomainBrandR189CopyBtn">复制英文版本域名品牌R189</button>`;
      const btn = $("#settingsBrandEnVersionDomainBrandR189CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文版本域名品牌R189" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 版本 · 域名 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList189() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 189;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 189); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round189 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandBrandEn().catch(() => {}), 1000);
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
      () => ensureAssetTagCategorySummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedWindowEndsLastAgoPlainR189Copy().catch(
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
        ensureTravelDepositedThresholdBalancePlainR189Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareServiceTypeCityDepartmentCopyButtonsR189().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintMissingCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNameRelationCopyButtonsR189().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandBrandEn().catch(() => {}), 1000);
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
        () => ensureAssetTagCategorySummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedWindowEndsLastAgoPlainR189Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedThresholdBalancePlainR189Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeCityDepartmentCopyButtonsR189().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintMissingCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNameRelationCopyButtonsR189().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainProgressPctDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnVersionDomainBrandR189CopyCard().catch(() => {});
        paintRoundLayerList189();
      }, 890);
      setTimeout(() => {
        paintBrandEnVersionDomainBrandR189CopyCard().catch(() => {});
        paintRoundLayerList189();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandBrandEn().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDispositionBeneficiaryTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetTagCategorySummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedWindowEndsLastAgoPlainR189Copy().catch(
      () => {}
    );
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedThresholdBalancePlainR189Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeCityDepartmentCopyButtonsR189().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintMissingCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameRelationCopyButtonsR189().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainProgressPctDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnVersionDomainBrandR189CopyCard().catch(() => {});
      paintRoundLayerList189();
    }, 910);
  }
})();
