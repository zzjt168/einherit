/* 电子继承 · 第一百九十一批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round191SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+版本+域名冷静条 */
  async function paintHomeBrandEnVersionDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnVersionDomainCalmBarR191");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionDomainCalmBarR191";
      bar.className = "home-brand-en-version-domain-calm-r191";
      bar.setAttribute("role", "status");
      const verDom = $("#homeVersionDomainBrandCalmBarR190");
      const domainBrand = $("#homeDomainBrandBrandEnCalmBarR189");
      const brandBrandEn = $("#homeBrandBrandEnVersionCalmBarR188");
      if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else if (domainBrand && domainBrand.parentNode === home)
        domainBrand.insertAdjacentElement("afterend", bar);
      else if (brandBrandEn && brandBrandEn.parentNode === home)
        brandBrandEn.insertAdjacentElement("afterend", bar);
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
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + ver + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r191-mark">英文</span>
        <span class="muted home-brand-en-version-domain-calm-r191-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR191">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR191");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r191-mark">英文</span>
        <span class="muted home-brand-en-version-domain-calm-r191-sub">英文版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR191">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR191");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+标题+设备归属组合复制（四进位） */
  async function ensureLegacyNotesTitleDeviceOwnerCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const line = notes + " · " + title + " · " + deviceOwner;
      el.dataset.notesTitleDeviceOwnerR191 = line;
      if (el.querySelector(".lg-copy-notes-title-device-owner-r191")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-title-device-owner-r191";
      btn.textContent = "复制备注标题归属R191";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesTitleDeviceOwnerR191 || "");
        softBanner(ok ? "已复制备注标题归属R191" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘更新时间+摘要+可见性组合复制（四进位） */
  async function ensureAssetUpdatedSummaryVisibilityCopyButtons() {
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
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = updated + " · " + summary + " · " + visibility;
      el.dataset.updatedSummaryVisibilityR191 = line;
      if (el.querySelector(".as-copy-updated-summary-visibility-r191")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-updated-summary-visibility-r191";
      btn.textContent = "复制更新摘要可见性R191";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.updatedSummaryVisibilityR191 || ""
        );
        softBanner(ok ? "已复制更新摘要可见性R191" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次距今+状态+下次建议（四进位） */
  async function ensureCheckinLastAgoStatusNextSuggestedPlainR191Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoStatusNextSuggestedPlainR191CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoStatusNextSuggestedPlainR191CopyCard";
      card.className =
        "checkin-last-ago-status-next-suggested-plain-r191-copy";
      const statusNext = $(
        "#checkinStatusNextSuggestedWindowEndsPlainR190CopyCard"
      );
      const nextWin = $(
        "#checkinNextSuggestedWindowEndsLastAgoPlainR189CopyCard"
      );
      const winLast = $("#checkinWindowEndsLastAgoStatusPlainR188CopyCard");
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
      const nextAt =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = lastAgo + " · " + status + " · " + nextAt;
      const line =
        "报备上次距今 · 状态 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-status-next-suggested-plain-r191-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoStatusNextSuggestedPlainR191CopyBtn">复制上次状态下次R191</button>`;
      const btn = $("#checkinLastAgoStatusNextSuggestedPlainR191CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制上次状态下次R191" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次状态下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+缺口+已存三元复制（四进位） */
  async function ensureTravelThresholdShortfallDepositedPlainR191Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdShortfallDepositedPlainR191CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdShortfallDepositedPlainR191CopyCard";
      card.className = "travel-threshold-shortfall-deposited-plain-r191-copy";
      const shortDep = $("#travelShortfallDepositedThresholdPlainR190CopyCard");
      const depThr = $("#travelDepositedThresholdBalancePlainR189CopyCard");
      const balShort = $("#travelBalanceShortfallThresholdPlainR188CopyCard");
      if (shortDep && shortDep.parentNode)
        shortDep.insertAdjacentElement("afterend", card);
      else if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const combo = threshold + " · " + shortfall + " · " + deposited;
      const line =
        "差旅门槛 · 缺口 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-shortfall-deposited-plain-r191-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdShortfallDepositedPlainR191CopyBtn">复制门槛缺口已存R191</button>`;
      const btn = $("#travelThresholdShortfallDepositedPlainR191CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛缺口已存R191" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛缺口已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅城市+科室+服务类型组合复制（四进位） */
  async function ensureAftercareCityDepartmentServiceTypeCopyButtonsR191() {
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
        String(it.department || it.dept || "").trim() || "未填科室";
      const serviceType =
        String(it.service_type || it.service || "").trim() || "未填服务类型";
      const line = city + " · " + department + " · " + serviceType;
      el.dataset.cityDepartmentServiceTypeR191 = line;
      if (el.querySelector(".ac-copy-city-department-service-type-r191"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-city-department-service-type-r191";
      btn.textContent = "复制城市科室服务R191";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.cityDepartmentServiceTypeR191 || ""
        );
        softBanner(ok ? "已复制城市科室服务R191" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+就绪+时长提示组合复制（四进位） */
  async function ensureAuthMissingReadyDurationHintCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingReadyDurationHintCopyR191Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingReadyDurationHintCopyR191Card";
      card.className = "av-missing-ready-duration-hint-copy-r191";
      const completeDur = $("#avCompleteDurationHintReadyCopyR190Card");
      const durMiss = $("#avDurationHintMissingCompleteCopyR189Card");
      const readyComplete = $("#avReadyCompleteMissingCopyR188Card");
      if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
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
      const combo = missing + " · " + ready + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-ready-duration-hint-copy-r191-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingReadyDurationHintCopyR191Btn">复制缺失就绪时长R191</button>`;
      const btn = $("#avMissingReadyDurationHintCopyR191Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失就绪时长R191" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失就绪时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式+编号组合复制（四进位） */
  async function ensureHeirNameContactIdCopyButtonsR191() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const idLabel = String(it.id);
      const line = name + " · " + contact + " · " + idLabel;
      if (el.querySelector(".bn-copy-name-contact-id-r191")) return;
      el.dataset.nameContactIdR191 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-id-r191";
      btn.textContent = "复制姓名联系编号R191";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactIdR191 || "");
        softBanner(ok ? "已复制姓名联系编号R191" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+章节数+完成数组合复制（四进位） */
  async function ensureHandoverProgressPctSectionsDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctSectionsDoneCopyR191Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctSectionsDoneCopyR191Card";
      card.className = "hand-progress-pct-sections-done-copy-r191";
      const secDom = $("#handSectionsDomainProgressPctCopyR190Card");
      const domPct = $("#handDomainProgressPctDoneCopyR189Card");
      const doneSec = $("#handDoneSectionsProgressPctCopyR188Card");
      if (secDom && secDom.parentNode)
        secDom.insertAdjacentElement("afterend", card);
      else if (domPct && domPct.parentNode)
        domPct.insertAdjacentElement("afterend", card);
      else if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
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
      const combo = pct + " · " + sections + " · " + done;
      const line = "手册进度 · 章节 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-sections-done-copy-r191-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctSectionsDoneCopyR191Btn">复制进度章节完成R191</button>`;
      const btn = $("#handProgressPctSectionsDoneCopyR191Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度章节完成R191" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度章节完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintBrandBrandEnVersionOkR191CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandBrandEnVersionOkR191CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandBrandEnVersionOkR191CopyCard";
      card.className = "card settings-brand-brand-en-version-ok-r191-copy-card";
      const domEn = $("#settingsDomainBrandEnOkVersionR190CopyCard");
      const brandEnVer = $("#settingsBrandEnVersionDomainBrandR189CopyCard");
      const brandDom = $("#settingsBrandDomainVersionOkR188CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domEn && domEn.parentNode)
        domEn.insertAdjacentElement("beforebegin", card);
      else if (brandEnVer && brandEnVer.parentNode)
        brandEnVer.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = brand + " · " + en + " · " + ver + " · " + okLabel;
      card.innerHTML = `<h3>品牌 · 英文 · 版本 · ok</h3>
        <p class="muted">一键复制中文品牌、英文品牌、版本与健康态（演示级）。</p>
        <p class="settings-brand-brand-en-version-ok-r191-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandBrandEnVersionOkR191CopyBtn">复制品牌英文版本okR191</button>`;
      const btn = $("#settingsBrandBrandEnVersionOkR191CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌英文版本okR191" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 英文 · 版本 · ok</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList191() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 191); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round191 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesTitleDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetUpdatedSummaryVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinLastAgoStatusNextSuggestedPlainR191Copy().catch(
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
        ensureTravelThresholdShortfallDepositedPlainR191Copy().catch(
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
        ensureAftercareCityDepartmentServiceTypeCopyButtonsR191().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingReadyDurationHintCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactIdCopyButtonsR191().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctSectionsDoneCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyNotesTitleDeviceOwnerCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetUpdatedSummaryVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinLastAgoStatusNextSuggestedPlainR191Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdShortfallDepositedPlainR191Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentServiceTypeCopyButtonsR191().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingReadyDurationHintCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactIdCopyButtonsR191().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctSectionsDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandBrandEnVersionOkR191CopyCard().catch(() => {});
        paintRoundLayerList191();
      }, 890);
      setTimeout(() => {
        paintBrandBrandEnVersionOkR191CopyCard().catch(() => {});
        paintRoundLayerList191();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyNotesTitleDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetUpdatedSummaryVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoStatusNextSuggestedPlainR191Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdShortfallDepositedPlainR191Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentServiceTypeCopyButtonsR191().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingReadyDurationHintCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactIdCopyButtonsR191().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctSectionsDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandBrandEnVersionOkR191CopyCard().catch(() => {});
      paintRoundLayerList191();
    }, 910);
  }
})();
