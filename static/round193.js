/* 电子继承 · 第一百九十三批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round193SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+英文品牌+版本冷静条 */
  async function paintHomeDomainBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainBrandEnVersionCalmBarR193");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnVersionCalmBarR193";
      bar.className = "home-domain-brand-en-version-calm-r193";
      bar.setAttribute("role", "status");
      const brandDom = $("#homeBrandDomainVersionCalmBarR192");
      const brandEn = $("#homeBrandEnVersionDomainCalmBarR191");
      const verDom = $("#homeVersionDomainBrandCalmBarR190");
      if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r193-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r193-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR193">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR193");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r193-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r193-sub">域名英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR193">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR193");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+受益人+标题组合复制（四进位） */
  async function ensureLegacyDeviceOwnerBeneficiaryTitleCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const title = String(it.title || "").trim() || "无标题";
      const line = deviceOwner + " · " + beneficiary + " · " + title;
      el.dataset.deviceOwnerBeneficiaryTitleR193 = line;
      if (el.querySelector(".lg-copy-device-owner-beneficiary-title-r193")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-beneficiary-title-r193";
      btn.textContent = "复制归属受益人标题R193";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerBeneficiaryTitleR193 || "");
        softBanner(ok ? "已复制归属受益人标题R193" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+分类+更新时间组合复制（四进位） */
  async function ensureAssetSummaryCategoryUpdatedCopyButtons() {
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
      const updated =
        String(
          it.updated_at || it.updated || it.modified_at || it.created_at || ""
        ).trim() || "无更新时间";
      const line = summary + " · " + category + " · " + updated;
      el.dataset.summaryCategoryUpdatedR193 = line;
      if (el.querySelector(".as-copy-summary-category-updated-r193")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-category-updated-r193";
      btn.textContent = "复制摘要分类更新R193";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryCategoryUpdatedR193 || ""
        );
        softBanner(ok ? "已复制摘要分类更新R193" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态+窗口截止（四进位） */
  async function ensureCheckinNextSuggestedStatusWindowEndsPlainR193Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedStatusWindowEndsPlainR193CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedStatusWindowEndsPlainR193CopyCard";
      card.className =
        "checkin-next-suggested-status-window-ends-plain-r193-copy";
      const winStatus = $(
        "#checkinWindowEndsStatusLastAgoPlainR192CopyCard"
      );
      const lastStatus = $(
        "#checkinLastAgoStatusNextSuggestedPlainR191CopyCard"
      );
      const statusNext = $(
        "#checkinStatusNextSuggestedWindowEndsPlainR190CopyCard"
      );
      if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
      else if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
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
      const combo = nextAt + " · " + status + " · " + windowEnds;
      const line =
        "报备下次建议 · 状态 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-status-window-ends-plain-r193-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedStatusWindowEndsPlainR193CopyBtn">复制下次状态窗口R193</button>`;
      const btn = $("#checkinNextSuggestedStatusWindowEndsPlainR193CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次状态窗口R193" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次状态窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+余额+缺口三元复制（四进位） */
  async function ensureTravelDepositedBalanceShortfallPlainR193Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedBalanceShortfallPlainR193CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedBalanceShortfallPlainR193CopyCard";
      card.className = "travel-deposited-balance-shortfall-plain-r193-copy";
      const balThr = $(
        "#travelBalanceThresholdShortfallPlainR192CopyCard"
      );
      const thrShort = $(
        "#travelThresholdShortfallDepositedPlainR191CopyCard"
      );
      const shortDep = $("#travelShortfallDepositedThresholdPlainR190CopyCard");
      if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
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
      const combo = deposited + " · " + balance + " · " + shortfall;
      const line =
        "差旅已存 · 余额 · 缺口 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-balance-shortfall-plain-r193-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedBalanceShortfallPlainR193CopyBtn">复制已存余额缺口R193</button>`;
      const btn = $("#travelDepositedBalanceShortfallPlainR193CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存余额缺口R193" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存余额缺口文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+医院+城市组合复制（四进位） */
  async function ensureAftercareServiceTypeHospitalCityCopyButtonsR193() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const city = String(it.city || "").trim() || "未填城市";
      const line = serviceType + " · " + hospital + " · " + city;
      el.dataset.serviceTypeHospitalCityR193 = line;
      if (el.querySelector(".ac-copy-service-type-hospital-city-r193"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-service-type-hospital-city-r193";
      btn.textContent = "复制服务医院城市R193";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeHospitalCityR193 || ""
        );
        softBanner(ok ? "已复制服务医院城市R193" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+完成+缺失项组合复制（四进位） */
  async function ensureAuthDurationHintCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintCompleteMissingCopyR193Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintCompleteMissingCopyR193Card";
      card.className = "av-duration-hint-complete-missing-copy-r193";
      const readyMiss = $("#avReadyMissingCompleteCopyR192Card");
      const missReady = $("#avMissingReadyDurationHintCopyR191Card");
      const completeDur = $("#avCompleteDurationHintReadyCopyR190Card");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
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
      const combo = duration + " · " + complete + " · " + missing;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-complete-missing-copy-r193-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintCompleteMissingCopyR193Btn">复制时长完成缺失R193</button>`;
      const btn = $("#avDurationHintCompleteMissingCopyR193Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长完成缺失R193" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+姓名组合复制（四进位） */
  async function ensureHeirIdRelationNameCopyButtonsR193() {
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
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = idLabel + " · " + relation + " · " + name;
      if (el.querySelector(".bn-copy-id-relation-name-r193")) return;
      el.dataset.idRelationNameR193 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-name-r193";
      btn.textContent = "复制编号关系姓名R193";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idRelationNameR193 || "");
        softBanner(ok ? "已复制编号关系姓名R193" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+进度百分比+域名组合复制（四进位） */
  async function ensureHandoverSectionsProgressPctDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsProgressPctDomainCopyR193Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsProgressPctDomainCopyR193Card";
      card.className = "hand-sections-progress-pct-domain-copy-r193";
      const doneDom = $("#handDoneDomainSectionsCopyR192Card");
      const pctSec = $("#handProgressPctSectionsDoneCopyR191Card");
      const secDom = $("#handSectionsDomainProgressPctCopyR190Card");
      if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (pctSec && pctSec.parentNode)
        pctSec.insertAdjacentElement("afterend", card);
      else if (secDom && secDom.parentNode)
        secDom.insertAdjacentElement("afterend", card);
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
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
      const combo = sections + " · " + pct + " · " + domain;
      const line = "手册章节 · 进度 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-progress-pct-domain-copy-r193-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsProgressPctDomainCopyR193Btn">复制章节进度域名R193</button>`;
      const btn = $("#handSectionsProgressPctDomainCopyR193Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节进度域名R193" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节进度域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintOkVersionBrandDomainR193CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandDomainR193CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandDomainR193CopyCard";
      card.className = "card settings-ok-version-brand-domain-r193-copy-card";
      const verBrand = $("#settingsVersionBrandDomainBrandEnR192CopyCard");
      const brandEnOk = $("#settingsBrandBrandEnVersionOkR191CopyCard");
      const domEn = $("#settingsDomainBrandEnOkVersionR190CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk && brandEnOk.parentNode)
        brandEnOk.insertAdjacentElement("beforebegin", card);
      else if (domEn && domEn.parentNode)
        domEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = okLabel + " · " + ver + " · " + brand + " · " + domain;
      card.innerHTML = `<h3>ok · 版本 · 品牌 · 域名</h3>
        <p class="muted">一键复制健康态、版本、中文品牌与域名（演示级）。</p>
        <p class="settings-ok-version-brand-domain-r193-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandDomainR193CopyBtn">复制就绪版本品牌域名R193</button>`;
      const btn = $("#settingsOkVersionBrandDomainR193CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本品牌域名R193" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>ok · 版本 · 品牌 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList193() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 193); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round193 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerBeneficiaryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetSummaryCategoryUpdatedCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedStatusWindowEndsPlainR193Copy().catch(
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
        ensureTravelDepositedBalanceShortfallPlainR193Copy().catch(
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
        ensureAftercareServiceTypeHospitalCityCopyButtonsR193().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintCompleteMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdRelationNameCopyButtonsR193().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsProgressPctDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyDeviceOwnerBeneficiaryTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryCategoryUpdatedCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedStatusWindowEndsPlainR193Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedBalanceShortfallPlainR193Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeHospitalCityCopyButtonsR193().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintCompleteMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdRelationNameCopyButtonsR193().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsProgressPctDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandDomainR193CopyCard().catch(() => {});
        paintRoundLayerList193();
      }, 890);
      setTimeout(() => {
        paintOkVersionBrandDomainR193CopyCard().catch(() => {});
        paintRoundLayerList193();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyDeviceOwnerBeneficiaryTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryCategoryUpdatedCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedStatusWindowEndsPlainR193Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedBalanceShortfallPlainR193Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeHospitalCityCopyButtonsR193().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationNameCopyButtonsR193().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsProgressPctDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandDomainR193CopyCard().catch(() => {});
      paintRoundLayerList193();
    }, 910);
  }
})();
