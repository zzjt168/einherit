/* 电子继承 · 第二百零三批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round203SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+版本+域名冷静条 */
  async function paintHomeBrandVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandVersionDomainCalmBarR203");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandVersionDomainCalmBarR203";
      bar.className = "home-brand-version-domain-calm-r203";
      bar.setAttribute("role", "status");
      const prev = $("#homeVersionDomainBrandEnCalmBarR202");
      const prev2 = $("#homeBrandBrandEnDomainCalmBarR201");
      const domainEn = $("#homeDomainBrandEnVersionCalmBarR200");
      if (prev && prev.parentNode === home)
        prev.insertAdjacentElement("afterend", bar);
      else if (prev2 && prev2.parentNode === home)
        prev2.insertAdjacentElement("afterend", bar);
      else if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
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
      const version = String(h.version || h.server_version || "").trim() || "未标版本";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = brand + " · " + version + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-domain-calm-r203-mark">品牌</span>
        <span class="muted home-brand-version-domain-calm-r203-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionDomainCalmGoR203">去设置</button>`;
      const btn = $("#homeBrandVersionDomainCalmGoR203");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-domain-calm-r203-mark">品牌</span>
        <span class="muted home-brand-version-domain-calm-r203-sub">品牌版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionDomainCalmGoR203">去设置</button>`;
      const btn = $("#homeBrandVersionDomainCalmGoR203");
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
        String(it.device_owner || it.owner || it.belong_to || "").trim() ||
        "未填归属";
      const disposition =
        String(it.disposition || it.action || it.intent || "").trim() ||
        "未填处置";
      const line = beneficiary + " · " + deviceOwner + " · " + disposition;
      el.dataset.beneficiaryDeviceOwnerDispositionR203 = line;
      if (el.querySelector(".lg-copy-beneficiary-device-owner-disposition-r203")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-device-owner-disposition-r203";
      btn.textContent = "复制受益人归属处置R203";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryDeviceOwnerDispositionR203 || "");
        softBanner(ok ? "已复制受益人归属处置R203" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+分类+标签组合复制（四进位） */
  async function ensureAssetSummaryCategoryTagCopyButtons() {
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
      const category =
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const tag = String(it.tag || it.tags || it.label || "").trim() || "无标签";
      const line = summary + " · " + category + " · " + tag;
      el.dataset.summaryCategoryTagR203 = line;
      if (el.querySelector(".as-copy-summary-category-tag-r203")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-category-tag-r203";
      btn.textContent = "复制摘要分类标签R203";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryCategoryTagR203 || ""
        );
        softBanner(ok ? "已复制摘要分类标签R203" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态+窗口截止+上次距今（四进位） */
  async function ensureCheckinStatusWindowEndsLastAgoPlainR203Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusWindowEndsLastAgoPlainR203CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusWindowEndsLastAgoPlainR203CopyCard";
      card.className =
        "checkin-status-window-ends-last-ago-plain-r203-copy";
      const prevCk = $(
        "#checkinLastAgoNextSuggestedWindowEndsPlainR202CopyCard"
      );
      const prevCk2 = $(
        "#checkinNextSuggestedWindowEndsStatusPlainR201CopyCard"
      );
      const winLast = $(
        "#checkinWindowEndsLastAgoStatusPlainR200CopyCard"
      );
      if (prevCk && prevCk.parentNode)
        prevCk.insertAdjacentElement("afterend", card);
      else if (prevCk2 && prevCk2.parentNode)
        prevCk2.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const combo = status + " · " + windowEnds + " · " + lastAgo;
      const line =
        "报备状态 · 窗口截止 · 上次距今 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-window-ends-last-ago-plain-r203-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusWindowEndsLastAgoPlainR203CopyBtn">复制状态窗口距今R203</button>`;
      const btn = $("#checkinStatusWindowEndsLastAgoPlainR203CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态窗口距今R203" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态窗口距今文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+缺口三元复制（四进位） */
  async function ensureTravelThresholdBalanceShortfallPlainR203Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceShortfallPlainR203CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceShortfallPlainR203CopyCard";
      card.className = "travel-threshold-balance-shortfall-plain-r203-copy";
      const prevTr = $(
        "#travelShortfallDepositedBalancePlainR202CopyCard"
      );
      const prevTr2 = $(
        "#travelBalanceShortfallDepositedPlainR201CopyCard"
      );
      const depThr = $(
        "#travelDepositedThresholdShortfallPlainR200CopyCard"
      );
      if (prevTr && prevTr.parentNode)
        prevTr.insertAdjacentElement("afterend", card);
      else if (prevTr2 && prevTr2.parentNode)
        prevTr2.insertAdjacentElement("afterend", card);
      else if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = threshold + " · " + balance + " · " + shortfall;
      const line =
        "差旅门槛 · 余额 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-shortfall-plain-r203-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceShortfallPlainR203CopyBtn">复制门槛余额缺口R203</button>`;
      const btn = $("#travelThresholdBalanceShortfallPlainR203CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额缺口R203" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+服务类型组合复制（四进位） */
  async function ensureAftercareHospitalDepartmentServiceTypeCopyButtonsR203() {
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
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const line = hospital + " · " + department + " · " + serviceType;
      el.dataset.hospitalDepartmentServiceTypeR203 = line;
      if (el.querySelector(".ac-copy-hospital-department-service-type-r203"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-department-service-type-r203";
      btn.textContent = "复制医院科室服务R203";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalDepartmentServiceTypeR203 || ""
        );
        softBanner(ok ? "已复制医院科室服务R203" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+完成+时长提示组合复制（四进位） */
  async function ensureAuthMissingCompleteDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCompleteDurationHintCopyR203Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCompleteDurationHintCopyR203Card";
      card.className = "av-missing-complete-duration-hint-copy-r203";
      const prevAv = $("#avCompleteReadyMissingCopyR202Card");
      const prevAv2 = $("#avDurationHintMissingReadyCopyR201Card");
      const readyComplete = $("#avReadyCompleteDurationHintCopyR200Card");
      if (prevAv && prevAv.parentNode)
        prevAv.insertAdjacentElement("afterend", card);
      else if (prevAv2 && prevAv2.parentNode)
        prevAv2.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
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
            : latest.complete != null
              ? latest.complete
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
      const combo = missing + " · " + complete + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-complete-duration-hint-copy-r203-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCompleteDurationHintCopyR203Btn">复制缺失完成时长R203</button>`;
      const btn = $("#avMissingCompleteDurationHintCopyR203Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失完成时长R203" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失完成时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+编号+关系组合复制（四进位） */
  async function ensureHeirNameIdRelationCopyButtonsR203() {
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
      const relation =
        String(it.relation || it.role || "").trim() || "未填关系";
      const line = name + " · " + idLabel + " · " + relation;
      if (el.querySelector(".bn-copy-name-id-relation-r203")) return;
      el.dataset.nameIdRelationR203 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-id-relation-r203";
      btn.textContent = "复制姓名编号关系R203";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameIdRelationR203 || "");
        softBanner(ok ? "已复制姓名编号关系R203" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+进度百分比组合复制（四进位） */
  async function ensureHandoverSectionsDoneProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDoneProgressPctCopyR203Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDoneProgressPctCopyR203Card";
      card.className = "hand-sections-done-progress-pct-copy-r203";
      const prevHand = $("#handProgressPctSectionsDomainCopyR202Card");
      const prevHand2 = $("#handDoneDomainProgressPctCopyR201Card");
      const secPct = $("#handSectionsProgressPctDoneCopyR200Card");
      if (prevHand && prevHand.parentNode)
        prevHand.insertAdjacentElement("afterend", card);
      else if (prevHand2 && prevHand2.parentNode)
        prevHand2.insertAdjacentElement("afterend", card);
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
      const sections =
        prog.sections != null
          ? String(prog.sections)
          : data.sections != null
            ? String(data.sections)
            : prog.section_count != null
              ? String(prog.section_count)
              : prog.total != null
                ? String(prog.total)
                : "—";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
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
      const combo = sections + " · " + done + " · " + pct;
      const line = "手册章节 · 完成 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-progress-pct-copy-r203-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDoneProgressPctCopyR203Btn">复制章节完成进度R203</button>`;
      const btn = $("#handSectionsDoneProgressPctCopyR203Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节完成进度R203" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节完成进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+中文品牌+英文品牌四元复制（再进位） + round 层含 203 */
  async function paintDomainOkBrandBrandEnR203CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainOkBrandBrandEnR203CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainOkBrandBrandEnR203CopyCard";
      card.className = "card settings-domain-ok-brand-brand-en-r203-copy-card";
      const prevSet = $("#settingsVersionBrandBrandEnOkR202CopyCard");
      const prevSet2 = $("#settingsOkDomainVersionBrandEnR201CopyCard");
      const brandEnDom = $("#settingsBrandEnDomainBrandVersionR200CopyCard");
      const roundList = $("#roundLayerListCard");
      if (prevSet && prevSet.parentNode)
        prevSet.insertAdjacentElement("beforebegin", card);
      else if (prevSet2 && prevSet2.parentNode)
        prevSet2.insertAdjacentElement("beforebegin", card);
      else if (brandEnDom && brandEnDom.parentNode)
        brandEnDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + okLabel + " · " + brand + " · " + en;
      card.innerHTML = `<h3>域名 · 就绪 · 中文 · 英文</h3>
        <p class="muted">一键复制域名、就绪态与中英文品牌（演示级）。</p>
        <p class="settings-domain-ok-brand-brand-en-r203-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainOkBrandBrandEnR203CopyBtn">复制域名就绪中英R203</button>`;
      const btn = $("#settingsDomainOkBrandBrandEnR203CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪中英R203" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 中文 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList203() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 203;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 203); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round203 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandVersionDomain().catch(() => {}), 1000);
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
        ensureAssetSummaryCategoryTagCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusWindowEndsLastAgoPlainR203Copy().catch(
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
        ensureTravelThresholdBalanceShortfallPlainR203Copy().catch(
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
        ensureAftercareHospitalDepartmentServiceTypeCopyButtonsR203().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingCompleteDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameIdRelationCopyButtonsR203().catch(() => {}),
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
      setTimeout(() => paintHomeBrandVersionDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryCategoryTagCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusWindowEndsLastAgoPlainR203Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceShortfallPlainR203Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentServiceTypeCopyButtonsR203().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingCompleteDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameIdRelationCopyButtonsR203().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDoneProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkBrandBrandEnR203CopyCard().catch(() => {});
        paintRoundLayerList203();
      }, 890);
      setTimeout(() => {
        paintDomainOkBrandBrandEnR203CopyCard().catch(() => {});
        paintRoundLayerList203();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandVersionDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyBeneficiaryDeviceOwnerDispositionCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryCategoryTagCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusWindowEndsLastAgoPlainR203Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceShortfallPlainR203Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentServiceTypeCopyButtonsR203().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCompleteDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameIdRelationCopyButtonsR203().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDoneProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkBrandBrandEnR203CopyCard().catch(() => {});
      paintRoundLayerList203();
    }, 910);
  }
})();
