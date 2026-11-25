/* 电子继承 · 第一百九十六批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round196SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+版本+英文品牌冷静条 */
  async function paintHomeBrandVersionBrandEn() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandVersionBrandEnCalmBarR196");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandVersionBrandEnCalmBarR196";
      bar.className = "home-brand-version-brand-en-calm-r196";
      bar.setAttribute("role", "status");
      const brandEnDom = $("#homeBrandEnBrandDomainCalmBarR195");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR194");
      const domainEn = $("#homeDomainBrandEnVersionCalmBarR193");
      if (brandEnDom && brandEnDom.parentNode === home)
        brandEnDom.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const sub = brand + " · " + ver + " · " + en;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r196-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r196-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR196">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR196");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r196-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r196-sub">品牌版本英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR196">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR196");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+处置意向+受益人组合复制（四进位） */
  async function ensureLegacyNotesDispositionBeneficiaryCopyButtons() {
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
      const notes = String(it.notes || it.note || "").trim() || "无备注";
      const disposition =
        String(
          it.disposition || it.action || it.dispose || it.dispose_action || ""
        ).trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const line = notes + " · " + disposition + " · " + beneficiary;
      el.dataset.notesDispositionBeneficiaryR196 = line;
      if (el.querySelector(".lg-copy-notes-disposition-beneficiary-r196")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-disposition-beneficiary-r196";
      btn.textContent = "复制备注处置受益人R196";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesDispositionBeneficiaryR196 || "");
        softBanner(ok ? "已复制备注处置受益人R196" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘更新时间+标签+可见性组合复制（四进位） */
  async function ensureAssetUpdatedTagVisibilityCopyButtons() {
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
      const updated =
        String(
          it.updated_at || it.updated || it.modified_at || it.created_at || ""
        ).trim() || "无更新时间";
      const tag = String(it.tag || it.tags || "").trim() || "无标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = updated + " · " + tag + " · " + visibility;
      el.dataset.updatedTagVisibilityR196 = line;
      if (el.querySelector(".as-copy-updated-tag-visibility-r196")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-updated-tag-visibility-r196";
      btn.textContent = "复制更新标签可见性R196";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.updatedTagVisibilityR196 || ""
        );
        softBanner(ok ? "已复制更新标签可见性R196" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+上次距今+状态（四进位） */
  async function ensureCheckinNextSuggestedLastAgoStatusPlainR196Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedLastAgoStatusPlainR196CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedLastAgoStatusPlainR196CopyCard";
      card.className =
        "checkin-next-suggested-last-ago-status-plain-r196-copy";
      const statusLast = $(
        "#checkinStatusLastAgoWindowEndsPlainR195CopyCard"
      );
      const lastNext = $(
        "#checkinLastAgoNextSuggestedWindowEndsPlainR194CopyCard"
      );
      const nextStatus = $(
        "#checkinNextSuggestedStatusWindowEndsPlainR193CopyCard"
      );
      if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            st.last_ago ||
            cd.last_ago ||
            ""
        ).trim() || "暂无上次距今";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const combo = nextAt + " · " + lastAgo + " · " + status;
      const line =
        "报备下次建议 · 上次距今 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-last-ago-status-plain-r196-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedLastAgoStatusPlainR196CopyBtn">复制下次距今状态R196</button>`;
      const btn = $("#checkinNextSuggestedLastAgoStatusPlainR196CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次距今状态R196" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次距今状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+缺口+余额三元复制（四进位） */
  async function ensureTravelDepositedShortfallBalancePlainR196Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallBalancePlainR196CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallBalancePlainR196CopyCard";
      card.className = "travel-deposited-shortfall-balance-plain-r196-copy";
      const thrBal = $(
        "#travelThresholdBalanceDepositedPlainR195CopyCard"
      );
      const shortBal = $(
        "#travelShortfallBalanceDepositedPlainR194CopyCard"
      );
      const depBal = $(
        "#travelDepositedBalanceShortfallPlainR193CopyCard"
      );
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (depBal && depBal.parentNode)
        depBal.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const combo = deposited + " · " + shortfall + " · " + balance;
      const line =
        "差旅已存 · 缺口 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-shortfall-balance-plain-r196-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallBalancePlainR196CopyBtn">复制已存缺口余额R196</button>`;
      const btn = $("#travelDepositedShortfallBalancePlainR196CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存缺口余额R196" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存缺口余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+城市组合复制（四进位） */
  async function ensureAftercareHospitalDepartmentCityCopyButtonsR196() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const line = hospital + " · " + department + " · " + city;
      el.dataset.hospitalDepartmentCityR196 = line;
      if (el.querySelector(".ac-copy-hospital-department-city-r196"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-department-city-r196";
      btn.textContent = "复制医院科室城市R196";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalDepartmentCityR196 || ""
        );
        softBanner(ok ? "已复制医院科室城市R196" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+时长提示+缺失项组合复制（四进位） */
  async function ensureAuthReadyDurationHintMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyDurationHintMissingCopyR196Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyDurationHintMissingCopyR196Card";
      card.className = "av-ready-duration-hint-missing-copy-r196";
      const missComplete = $("#avMissingCompleteReadyCopyR195Card");
      const completeReady = $("#avCompleteReadyDurationHintCopyR194Card");
      const durComplete = $("#avDurationHintCompleteMissingCopyR193Card");
      if (missComplete && missComplete.parentNode)
        missComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
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
      const combo = ready + " · " + duration + " · " + missing;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-duration-hint-missing-copy-r196-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyDurationHintMissingCopyR196Btn">复制就绪时长缺失R196</button>`;
      const btn = $("#avReadyDurationHintMissingCopyR196Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪时长缺失R196" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪时长缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+姓名+编号组合复制（四进位） */
  async function ensureHeirRelationNameIdCopyButtonsR196() {
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
      const relation =
        String(it.relation || it.role || it.relationship || "").trim() ||
        "未填关系";
      const name = String(it.name || "").trim() || "未填姓名";
      const idLabel = String(it.id);
      const line = relation + " · " + name + " · " + idLabel;
      if (el.querySelector(".bn-copy-relation-name-id-r196")) return;
      el.dataset.relationNameIdR196 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-name-id-r196";
      btn.textContent = "复制关系姓名编号R196";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationNameIdR196 || "");
        softBanner(ok ? "已复制关系姓名编号R196" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+域名组合复制（四进位） */
  async function ensureHandoverSectionsDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDoneDomainCopyR196Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDoneDomainCopyR196Card";
      card.className = "hand-sections-done-domain-copy-r196";
      const pctDone = $("#handProgressPctDoneSectionsCopyR195Card");
      const domDone = $("#handDomainDoneProgressPctCopyR194Card");
      const secPct = $("#handSectionsProgressPctDomainCopyR193Card");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (domDone && domDone.parentNode)
        domDone.insertAdjacentElement("afterend", card);
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
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
      const combo = sections + " · " + done + " · " + domain;
      const line = "手册章节 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-domain-copy-r196-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDoneDomainCopyR196Btn">复制章节完成域名R196</button>`;
      const btn = $("#handSectionsDoneDomainCopyR196Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节完成域名R196" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintBrandOkBrandEnDomainR196CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandOkBrandEnDomainR196CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandOkBrandEnDomainR196CopyCard";
      card.className = "card settings-brand-ok-brand-en-domain-r196-copy-card";
      const domVer = $("#settingsDomainVersionOkBrandEnR195CopyCard");
      const brandEnOk2 = $("#settingsBrandEnOkBrandVersionR194CopyCard");
      const okVer = $("#settingsOkVersionBrandDomainR193CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk2 && brandEnOk2.parentNode)
        brandEnOk2.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const line = brand + " · " + okLabel + " · " + en + " · " + domain;
      card.innerHTML = `<h3>品牌 · ok · 英文 · 域名</h3>
        <p class="muted">一键复制中文品牌、健康态、英文品牌与域名（演示级）。</p>
        <p class="settings-brand-ok-brand-en-domain-r196-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandOkBrandEnDomainR196CopyBtn">复制品牌就绪英文域名R196</button>`;
      const btn = $("#settingsBrandOkBrandEnDomainR196CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌就绪英文域名R196" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · ok · 英文 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList196() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 196); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round196 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesDispositionBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetUpdatedTagVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedLastAgoStatusPlainR196Copy().catch(
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
        ensureTravelDepositedShortfallBalancePlainR196Copy().catch(
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
        ensureAftercareHospitalDepartmentCityCopyButtonsR196().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyDurationHintMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationNameIdCopyButtonsR196().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDoneDomainCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyNotesDispositionBeneficiaryCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetUpdatedTagVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedLastAgoStatusPlainR196Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallBalancePlainR196Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentCityCopyButtonsR196().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyDurationHintMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationNameIdCopyButtonsR196().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDoneDomainCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandOkBrandEnDomainR196CopyCard().catch(() => {});
        paintRoundLayerList196();
      }, 890);
      setTimeout(() => {
        paintBrandOkBrandEnDomainR196CopyCard().catch(() => {});
        paintRoundLayerList196();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyNotesDispositionBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetUpdatedTagVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedLastAgoStatusPlainR196Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallBalancePlainR196Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentCityCopyButtonsR196().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyDurationHintMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationNameIdCopyButtonsR196().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandOkBrandEnDomainR196CopyCard().catch(() => {});
      paintRoundLayerList196();
    }, 910);
  }
})();
