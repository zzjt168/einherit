/* 电子继承 · 第一百八十八批增量（叠在 round187…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round188SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+英文品牌+版本冷静条 */
  async function paintHomeBrandBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandBrandEnVersionCalmBarR188");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandBrandEnVersionCalmBarR188";
      bar.className = "home-brand-brand-en-version-calm-r188";
      bar.setAttribute("role", "status");
      const brandEnDom = $("#homeBrandEnDomainVersionCalmBarR187");
      const brandVer = $("#homeBrandVersionDomainCalmBarR186");
      const domEn = $("#homeDomainBrandEnVersionCalmBarR185");
      if (brandEnDom && brandEnDom.parentNode === home)
        brandEnDom.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (domEn && domEn.parentNode === home)
        domEn.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = brand + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-version-calm-r188-mark">品牌</span>
        <span class="muted home-brand-brand-en-version-calm-r188-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnVersionCalmGoR188">去设置</button>`;
      const btn = $("#homeBrandBrandEnVersionCalmGoR188");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-version-calm-r188-mark">品牌</span>
        <span class="muted home-brand-brand-en-version-calm-r188-sub">品牌英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnVersionCalmGoR188">去设置</button>`;
      const btn = $("#homeBrandBrandEnVersionCalmGoR188");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置意向+备注组合复制（四进位） */
  async function ensureLegacyTitleDispositionNotesCopyButtons() {
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
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const notes = String(it.notes || it.note || "").trim() || "无备注";
      const line = title + " · " + disposition + " · " + notes;
      el.dataset.titleDispositionNotesR188 = line;
      if (el.querySelector(".lg-copy-title-disposition-notes-r188")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-notes-r188";
      btn.textContent = "复制标题处置备注R188";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDispositionNotesR188 || "");
        softBanner(ok ? "已复制标题处置备注R188" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+可见性+更新时间组合复制（四进位） */
  async function ensureAssetSummaryVisibilityUpdatedCopyButtons() {
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
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const updated =
        String(
          it.updated_at || it.updated || it.modified_at || it.created_at || ""
        ).trim() || "无更新时间";
      const line = summary + " · " + visibility + " · " + updated;
      el.dataset.summaryVisibilityUpdatedR188 = line;
      if (el.querySelector(".as-copy-summary-visibility-updated-r188")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-visibility-updated-r188";
      btn.textContent = "复制摘要可见性更新R188";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.summaryVisibilityUpdatedR188 || ""
        );
        softBanner(ok ? "已复制摘要可见性更新R188" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+上次距今+状态（四进位） */
  async function ensureCheckinWindowEndsLastAgoStatusPlainR188Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsLastAgoStatusPlainR188CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsLastAgoStatusPlainR188CopyCard";
      card.className = "checkin-window-ends-last-ago-status-plain-r188-copy";
      const lastWin = $("#checkinLastAgoWindowEndsPlainR187CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR186CopyCard");
      const nextStatus = $("#checkinNextSuggestedAtStatusLabelPlainR185CopyCard");
      if (lastWin && lastWin.parentNode)
        lastWin.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const combo = windowEnds + " · " + lastAgo + " · " + status;
      const line =
        "报备窗口截止 · 上次距今 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-last-ago-status-plain-r188-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsLastAgoStatusPlainR188CopyBtn">复制窗口上次状态R188</button>`;
      const btn = $("#checkinWindowEndsLastAgoStatusPlainR188CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口上次状态R188" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口上次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+缺口+门槛三元复制（四进位） */
  async function ensureTravelBalanceShortfallThresholdPlainR188Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallThresholdPlainR188CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallThresholdPlainR188CopyCard";
      card.className = "travel-balance-shortfall-threshold-plain-r188-copy";
      const thrBal = $("#travelThresholdBalanceDepositedPlainR187CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR186CopyCard");
      const depShort = $("#travelDepositedShortfallThresholdPlainR185CopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balDep && balDep.parentNode)
        balDep.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
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
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = balance + " · " + shortfall + " · " + threshold;
      const line =
        "差旅余额 · 缺口 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-threshold-plain-r188-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallThresholdPlainR188CopyBtn">复制余额缺口门槛R188</button>`;
      const btn = $("#travelBalanceShortfallThresholdPlainR188CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额缺口门槛R188" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额缺口门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+科室+城市组合复制（四进位） */
  async function ensureAftercareHospitalDepartmentCityCopyButtonsR188() {
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
      el.dataset.hospitalDepartmentCityR188 = line;
      if (el.querySelector(".ac-copy-hospital-department-city-r188")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-department-city-r188";
      btn.textContent = "复制医院科室城市R188";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalDepartmentCityR188 || "");
        softBanner(ok ? "已复制医院科室城市R188" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成+缺失项组合复制（四进位） */
  async function ensureAuthReadyCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCopyR188Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCopyR188Card";
      card.className = "av-ready-complete-missing-copy-r188";
      const missDur = $("#avMissingDurationHintReadyCopyR187Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR186Card");
      const readyComplete = $("#avReadyCompleteMissingCopyR185Card");
      if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
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
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
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
      const combo = ready + " · " + complete + " · " + missing;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-missing-copy-r188-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCopyR188Btn">复制就绪完成缺失R188</button>`;
      const btn = $("#avReadyCompleteMissingCopyR188Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成缺失R188" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+联系方式+姓名组合复制（四进位） */
  async function ensureHeirRelationContactNameCopyButtonsR188() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const line = relation + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-relation-contact-name-r188")) return;
      el.dataset.relationContactNameR188 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-contact-name-r188";
      btn.textContent = "复制关系联系姓名R188";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationContactNameR188 || "");
        softBanner(ok ? "已复制关系联系姓名R188" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+章节数+进度百分比组合复制（四进位） */
  async function ensureHandoverDoneSectionsProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneSectionsProgressPctCopyR188Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneSectionsProgressPctCopyR188Card";
      card.className = "hand-done-sections-progress-pct-copy-r188";
      const pctDone = $("#handProgressPctDoneDomainCopyR187Card");
      const doneDom = $("#handDoneDomainSectionsCopyR186Card");
      const domSec = $("#handDomainSectionsProgressPctCopyR185Card");
      if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
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
      const combo = done + " · " + sections + " · " + pct;
      const line = "手册完成 · 章节 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-sections-progress-pct-copy-r188-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneSectionsProgressPctCopyR188Btn">复制完成章节进度R188</button>`;
      const btn = $("#handDoneSectionsProgressPctCopyR188Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成章节进度R188" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成章节进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+域名+版本+就绪四元复制（再进位） + round 层含 188 */
  async function paintBrandDomainVersionOkR188CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandDomainVersionOkR188CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandDomainVersionOkR188CopyCard";
      card.className = "card settings-brand-domain-version-ok-r188-copy-card";
      const verBrand = $("#settingsVersionBrandEnBrandDomainR187CopyCard");
      const brandEnOk = $("#settingsBrandEnBrandDomainOkR186CopyCard");
      const brandDom = $("#settingsBrandDomainOkVersionR185CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandEnOk && brandEnOk.parentNode)
        brandEnOk.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const line = brand + " · " + domain + " · " + ver + " · " + okLabel;
      card.innerHTML = `<h3>品牌 · 域名 · 版本 · ok</h3>
        <p class="muted">一键复制中文品牌、域名、版本与健康态（演示级）。</p>
        <p class="settings-brand-domain-version-ok-r188-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandDomainVersionOkR188CopyBtn">复制品牌域名版本okR188</button>`;
      const btn = $("#settingsBrandDomainVersionOkR188CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名版本okR188" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · 版本 · ok</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList188() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 188;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 188); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round188 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDispositionNotesCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetSummaryVisibilityUpdatedCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsLastAgoStatusPlainR188Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceShortfallThresholdPlainR188Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalDepartmentCityCopyButtonsR188().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthReadyCompleteMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationContactNameCopyButtonsR188().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneSectionsProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionNotesCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetSummaryVisibilityUpdatedCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsLastAgoStatusPlainR188Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceShortfallThresholdPlainR188Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalDepartmentCityCopyButtonsR188().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthReadyCompleteMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationContactNameCopyButtonsR188().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneSectionsProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandDomainVersionOkR188CopyCard().catch(() => {});
        paintRoundLayerList188();
      }, 890);
      setTimeout(() => {
        paintBrandDomainVersionOkR188CopyCard().catch(() => {});
        paintRoundLayerList188();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyTitleDispositionNotesCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryVisibilityUpdatedCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsLastAgoStatusPlainR188Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallThresholdPlainR188Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalDepartmentCityCopyButtonsR188().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationContactNameCopyButtonsR188().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneSectionsProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandDomainVersionOkR188CopyCard().catch(() => {});
      paintRoundLayerList188();
    }, 910);
  }
})();
