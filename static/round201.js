/* 电子继承 · 第二百零一批增量（叠在 round190…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round201SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+英文品牌+域名冷静条 */
  async function paintHomeBrandBrandEnDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandBrandEnDomainCalmBarR201");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandBrandEnDomainCalmBarR201";
      bar.className = "home-brand-brand-en-domain-calm-r201";
      bar.setAttribute("role", "status");
      const domainEn = $("#homeDomainBrandEnVersionCalmBarR200");
      const verEn = $("#homeVersionBrandEnBrandCalmBarR199");
      const brandEnDom2 = $("#homeBrandEnDomainBrandCalmBarR198");
      if (domainEn && domainEn.parentNode === home)
        domainEn.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (brandEnDom2 && brandEnDom2.parentNode === home)
        brandEnDom2.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = brand + " · " + en + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-domain-calm-r201-mark">品牌</span>
        <span class="muted home-brand-brand-en-domain-calm-r201-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnDomainCalmGoR201">去设置</button>`;
      const btn = $("#homeBrandBrandEnDomainCalmGoR201");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-brand-en-domain-calm-r201-mark">品牌</span>
        <span class="muted home-brand-brand-en-domain-calm-r201-sub">品牌英文域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandBrandEnDomainCalmGoR201">去设置</button>`;
      const btn = $("#homeBrandBrandEnDomainCalmGoR201");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割备注+受益人+标题组合复制（四进位） */
  async function ensureLegacyNotesBeneficiaryTitleCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || it.heir_name || "").trim() ||
        "未填受益人";
      const title = String(it.title || "").trim() || "无标题";
      const line = notes + " · " + beneficiary + " · " + title;
      el.dataset.notesBeneficiaryTitleR201 = line;
      if (el.querySelector(".lg-copy-notes-beneficiary-title-r201")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-notes-beneficiary-title-r201";
      btn.textContent = "复制备注受益人标题R201";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.notesBeneficiaryTitleR201 || "");
        softBanner(ok ? "已复制备注受益人标题R201" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+摘要+可见性组合复制（四进位） */
  async function ensureAssetCategorySummaryVisibilityCopyButtons() {
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
        String(it.category || it.platform || it.kind || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = category + " · " + summary + " · " + visibility;
      el.dataset.categorySummaryVisibilityR201 = line;
      if (el.querySelector(".as-copy-category-summary-visibility-r201")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-summary-visibility-r201";
      btn.textContent = "复制分类摘要可见性R201";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.categorySummaryVisibilityR201 || ""
        );
        softBanner(ok ? "已复制分类摘要可见性R201" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止+状态（四进位） */
  async function ensureCheckinNextSuggestedWindowEndsStatusPlainR201Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedWindowEndsStatusPlainR201CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedWindowEndsStatusPlainR201CopyCard";
      card.className =
        "checkin-next-suggested-window-ends-status-plain-r201-copy";
      const winLast = $(
        "#checkinWindowEndsLastAgoStatusPlainR200CopyCard"
      );
      const lastStatus = $(
        "#checkinLastAgoStatusNextSuggestedPlainR199CopyCard"
      );
      const statusWin = $(
        "#checkinStatusWindowEndsNextSuggestedPlainR198CopyCard"
      );
      if (winLast && winLast.parentNode)
        winLast.insertAdjacentElement("afterend", card);
      else if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
      else if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
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
            st.window_end ||
            cd.window_end ||
            ""
        ).trim() || "暂无窗口截止";
      const status =
        String(
          st.status ||
            cd.status ||
            user.status ||
            st.status_label ||
            cd.status_label ||
            ""
        ).trim() || "暂无状态";
      const combo = nextAt + " · " + windowEnds + " · " + status;
      const line =
        "报备下次建议 · 窗口截止 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-window-ends-status-plain-r201-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedWindowEndsStatusPlainR201CopyBtn">复制下次窗口状态R201</button>`;
      const btn = $("#checkinNextSuggestedWindowEndsStatusPlainR201CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口状态R201" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+缺口+已存三元复制（四进位） */
  async function ensureTravelBalanceShortfallDepositedPlainR201Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallDepositedPlainR201CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallDepositedPlainR201CopyCard";
      card.className = "travel-balance-shortfall-deposited-plain-r201-copy";
      const depThr = $(
        "#travelDepositedThresholdShortfallPlainR200CopyCard"
      );
      const thrDep = $(
        "#travelThresholdDepositedShortfallPlainR199CopyCard"
      );
      const shortThr = $(
        "#travelShortfallThresholdBalancePlainR198CopyCard"
      );
      if (depThr && depThr.parentNode)
        depThr.insertAdjacentElement("afterend", card);
      else if (thrDep && thrDep.parentNode)
        thrDep.insertAdjacentElement("afterend", card);
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
      const deposited =
        fund.deposited == null
          ? fund.balance == null
            ? "—"
            : String(Math.round(Number(fund.balance)))
          : String(Math.round(Number(fund.deposited)));
      const combo = balance + " · " + shortfall + " · " + deposited;
      const line =
        "差旅余额 · 缺口 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-deposited-plain-r201-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallDepositedPlainR201CopyBtn">复制余额缺口已存R201</button>`;
      const btn = $("#travelBalanceShortfallDepositedPlainR201CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额缺口已存R201" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额缺口已存文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+城市+医院组合复制（四进位） */
  async function ensureAftercareServiceTypeCityHospitalCopyButtonsR201() {
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
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = serviceType + " · " + city + " · " + hospital;
      el.dataset.serviceTypeCityHospitalR201 = line;
      if (el.querySelector(".ac-copy-service-type-city-hospital-r201"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-service-type-city-hospital-r201";
      btn.textContent = "复制服务城市医院R201";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeCityHospitalR201 || ""
        );
        softBanner(ok ? "已复制服务城市医院R201" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+缺失项+就绪组合复制（四进位） */
  async function ensureAuthDurationHintMissingReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintMissingReadyCopyR201Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintMissingReadyCopyR201Card";
      card.className = "av-duration-hint-missing-ready-copy-r201";
      const readyComplete = $("#avReadyCompleteDurationHintCopyR200Card");
      const missDur = $("#avMissingDurationHintReadyCopyR199Card");
      const completeMiss = $("#avCompleteMissingDurationHintCopyR198Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
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
      const ready = truthyFlag(
        data.ready != null
          ? data.ready
          : prog.ready != null
            ? prog.ready
            : data.complete
      )
        ? "已就绪"
        : "未就绪";
      const combo = duration + " · " + missing + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-missing-ready-copy-r201-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintMissingReadyCopyR201Btn">复制时长缺失就绪R201</button>`;
      const btn = $("#avDurationHintMissingReadyCopyR201Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长缺失就绪R201" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长缺失就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+联系方式组合复制（四进位） */
  async function ensureHeirIdNameContactCopyButtonsR201() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = idLabel + " · " + name + " · " + contact;
      if (el.querySelector(".bn-copy-id-name-contact-r201")) return;
      el.dataset.idNameContactR201 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-contact-r201";
      btn.textContent = "复制编号姓名联系R201";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNameContactR201 || "");
        softBanner(ok ? "已复制编号姓名联系R201" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+域名+进度百分比组合复制（四进位） */
  async function ensureHandoverDoneDomainProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneDomainProgressPctCopyR201Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneDomainProgressPctCopyR201Card";
      card.className = "hand-done-domain-progress-pct-copy-r201";
      const secPct = $("#handSectionsProgressPctDoneCopyR200Card");
      const pctDom = $("#handProgressPctDomainSectionsCopyR199Card");
      const domSec = $("#handDomainSectionsDoneCopyR198Card");
      if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
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
      const domain =
        String(
          data.domain || prog.domain || "einherit.cn"
        ).trim() || "einherit.cn";
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
      const combo = done + " · " + domain + " · " + pct;
      const line = "手册完成 · 域名 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-done-domain-progress-pct-copy-r201-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneDomainProgressPctCopyR201Btn">复制完成域名进度R201</button>`;
      const btn = $("#handDoneDomainProgressPctCopyR201Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成域名进度R201" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成域名进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+版本+就绪四元复制（再进位） + round 层含 191 */
  async function paintOkDomainVersionBrandEnR201CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkDomainVersionBrandEnR201CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkDomainVersionBrandEnR201CopyCard";
      card.className = "card settings-ok-domain-version-brand-en-r201-copy-card";
      const brandEnDom = $("#settingsBrandEnDomainBrandVersionR200CopyCard");
      const brandVer = $("#settingsBrandVersionDomainOkR199CopyCard");
      const okEn = $("#settingsOkBrandEnVersionBrandR198CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandEnDom && brandEnDom.parentNode)
        brandEnDom.insertAdjacentElement("beforebegin", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = okLabel + " · " + domain + " · " + ver + " · " + en;
      card.innerHTML = `<h3>ok · 域名 · 版本 · 英文</h3>
        <p class="muted">一键复制健康态、域名、版本与英文品牌（演示级）。</p>
        <p class="settings-ok-domain-version-brand-en-r201-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkDomainVersionBrandEnR201CopyBtn">复制就绪域名版本英文R201</button>`;
      const btn = $("#settingsOkDomainVersionBrandEnR201CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪域名版本英文R201" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>ok · 域名 · 版本 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList201() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 191;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 201); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round201 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandBrandEnDomain().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyNotesBeneficiaryTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetCategorySummaryVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedWindowEndsStatusPlainR201Copy().catch(
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
        ensureTravelBalanceShortfallDepositedPlainR201Copy().catch(
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
        ensureAftercareServiceTypeCityHospitalCopyButtonsR201().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintMissingReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNameContactCopyButtonsR201().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandBrandEnDomain().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyNotesBeneficiaryTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetCategorySummaryVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedWindowEndsStatusPlainR201Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceShortfallDepositedPlainR201Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeCityHospitalCopyButtonsR201().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintMissingReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNameContactCopyButtonsR201().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneDomainProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkDomainVersionBrandEnR201CopyCard().catch(() => {});
        paintRoundLayerList201();
      }, 890);
      setTimeout(() => {
        paintOkDomainVersionBrandEnR201CopyCard().catch(() => {});
        paintRoundLayerList201();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandBrandEnDomain().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyNotesBeneficiaryTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategorySummaryVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedWindowEndsStatusPlainR201Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallDepositedPlainR201Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeCityHospitalCopyButtonsR201().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintMissingReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNameContactCopyButtonsR201().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneDomainProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkDomainVersionBrandEnR201CopyCard().catch(() => {});
      paintRoundLayerList201();
    }, 910);
  }
})();
