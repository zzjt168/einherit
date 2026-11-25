/* 电子继承 · 第一百八十五批增量（叠在 round184…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round185SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeDomainBrandEnVersionCalmBarR185");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainBrandEnVersionCalmBarR185";
      bar.className = "home-domain-brand-en-version-calm-r185";
      bar.setAttribute("role", "status");
      const brandEnBrand = $("#homeBrandEnBrandVersionCalmBarR184");
      const verDom = $("#homeVersionDomainBrandCalmBarR183");
      const brandBrandEn = $("#homeBrandBrandEnDomainCalmBarR182");
      if (brandEnBrand && brandEnBrand.parentNode === home)
        brandEnBrand.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r185-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r185-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR185">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR185");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-brand-en-version-calm-r185-mark">域名</span>
        <span class="muted home-domain-brand-en-version-calm-r185-sub">域名英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainBrandEnVersionCalmGoR185">去设置</button>`;
      const btn = $("#homeDomainBrandEnVersionCalmGoR185");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+受益人+设备归属组合复制（四进位） */
  async function ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填归属";
      const line = disposition + " · " + beneficiary + " · " + deviceOwner;
      el.dataset.dispositionBeneficiaryDeviceOwnerR185 = line;
      if (
        el.querySelector(".lg-copy-disposition-beneficiary-device-owner-r185")
      )
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-disposition-beneficiary-device-owner-r185";
      btn.textContent = "复制处置受益人归属R185";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryDeviceOwnerR185 || ""
        );
        softBanner(ok ? "已复制处置受益人归属R185" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+分类组合复制（四进位） */
  async function ensureAssetTagVisibilityCategoryCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const line = tag + " · " + visibility + " · " + category;
      el.dataset.tagVisibilityCategoryR185 = line;
      if (el.querySelector(".as-copy-tag-visibility-category-r185")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-category-r185";
      btn.textContent = "复制标签可见性分类R185";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisibilityCategoryR185 || "");
        softBanner(ok ? "已复制标签可见性分类R185" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时间+状态标签（四进位） */
  async function ensureCheckinNextSuggestedAtStatusLabelPlainR185Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedAtStatusLabelPlainR185CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedAtStatusLabelPlainR185CopyCard";
      card.className = "checkin-next-suggested-at-status-label-plain-r185-copy";
      const statusLast = $("#checkinStatusLabelLastAgoPlainR184CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR183CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR182CopyCard");
      if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "暂无状态标签";
      const combo = nextAt + " · " + statusLabel;
      const line =
        "报备下次建议 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-at-status-label-plain-r185-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedAtStatusLabelPlainR185CopyBtn">复制下次建议状态R185</button>`;
      const btn = $("#checkinNextSuggestedAtStatusLabelPlainR185CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议状态R185" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+短差+门槛三元复制（四进位） */
  async function ensureTravelDepositedShortfallThresholdPlainR185Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallThresholdPlainR185CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallThresholdPlainR185CopyCard";
      card.className = "travel-deposited-shortfall-threshold-plain-r185-copy";
      const shortThr = $("#travelShortfallThresholdBalancePlainR184CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR183CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR182CopyCard");
      if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
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
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const threshold =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = deposited + " · " + shortfall + " · " + threshold;
      const line =
        "差旅已存 · 短差 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-shortfall-threshold-plain-r185-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallThresholdPlainR185CopyBtn">复制已存短差门槛R185</button>`;
      const btn = $("#travelDepositedShortfallThresholdPlainR185CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存短差门槛R185" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存短差门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+科室+城市组合复制（四进位） */
  async function ensureAftercareServiceTypeDepartmentCityCopyButtonsR185() {
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
      const department =
        String(it.department || it.dept || "").trim() || "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const line = serviceType + " · " + department + " · " + city;
      el.dataset.serviceTypeDepartmentCityR185 = line;
      if (el.querySelector(".ac-copy-service-type-department-city-r185"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-service-type-department-city-r185";
      btn.textContent = "复制服务科室城市R185";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeDepartmentCityR185 || ""
        );
        softBanner(ok ? "已复制服务科室城市R185" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+缺失项组合复制（四进位） */
  async function ensureAuthReadyCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCopyR185Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCopyR185Card";
      card.className = "av-ready-complete-missing-copy-r185";
      const completeMiss = $("#avCompleteMissingDurationHintCopyR184Card");
      const missDur = $("#avMissingDurationHintReadyCopyR183Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR182Card");
      if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted av-ready-complete-missing-copy-r185-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCopyR185Btn">复制就绪完成缺失R185</button>`;
      const btn = $("#avReadyCompleteMissingCopyR185Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成缺失R185" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式+姓名组合复制（四进位） */
  async function ensureHeirIdContactNameCopyButtonsR185() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = idLabel + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-id-contact-name-r185")) return;
      el.dataset.idContactNameR185 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-name-r185";
      btn.textContent = "复制编号联系姓名R185";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactNameR185 || "");
        softBanner(ok ? "已复制编号联系姓名R185" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+进度百分比组合复制（三进位） */
  async function ensureHandoverDomainSectionsProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsProgressPctCopyR185Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsProgressPctCopyR185Card";
      card.className = "hand-domain-sections-progress-pct-copy-r185";
      const secPct = $("#handSectionsProgressPctDoneCopyR184Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR183Card");
      const doneDom = $("#handDoneDomainSectionsCopyR182Card");
      if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
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
      const combo = domain + " · " + sections + " · " + pct;
      const line = "手册域名 · 章节 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-sections-progress-pct-copy-r185-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsProgressPctCopyR185Btn">复制域名章节进度R185</button>`;
      const btn = $("#handDomainSectionsProgressPctCopyR185Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节进度R185" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+域名+ok+版本四元复制（再进位） + round 层含 185 */
  async function paintBrandDomainOkVersionR185CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandDomainOkVersionR185CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandDomainOkVersionR185CopyCard";
      card.className = "card settings-brand-domain-ok-version-r185-copy-card";
      const domOk = $("#settingsDomainOkVersionBrandEnR184CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR183CopyCard");
      const verBrand = $("#settingsVersionBrandEnBrandDomainR182CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "ok" : "not-ok";
      const ver = String(h.version || h.server_version || "—").trim();
      const line = brand + " · " + domain + " · " + okLabel + " · " + ver;
      card.innerHTML = `<h3>品牌 · 域名 · ok · 版本</h3>
        <p class="muted">一键复制中文品牌、域名、健康态与版本（演示级）。</p>
        <p class="settings-brand-domain-ok-version-r185-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandDomainOkVersionR185CopyBtn">复制品牌域名ok版本R185</button>`;
      const btn = $("#settingsBrandDomainOkVersionR185CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌域名ok版本R185" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 域名 · ok · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList185() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 185;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 185); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round185 均已挂载。</p>`
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
      () =>
        ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedAtStatusLabelPlainR185Copy().catch(
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
        ensureTravelDepositedShortfallThresholdPlainR185Copy().catch(
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
        ensureAftercareServiceTypeDepartmentCityCopyButtonsR185().catch(
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
      () => ensureHeirIdContactNameCopyButtonsR185().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainSectionsProgressPctCopy().catch(() => {}),
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
          ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedAtStatusLabelPlainR185Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallThresholdPlainR185Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeDepartmentCityCopyButtonsR185().catch(
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
        () => ensureHeirIdContactNameCopyButtonsR185().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandDomainOkVersionR185CopyCard().catch(() => {});
        paintRoundLayerList185();
      }, 890);
      setTimeout(() => {
        paintBrandDomainOkVersionR185CopyCard().catch(() => {});
        paintRoundLayerList185();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainBrandEnVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyDispositionBeneficiaryDeviceOwnerCopyButtons().catch(
        () => {}
      ),
    1070
  );
  setTimeout(
    () => ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedAtStatusLabelPlainR185Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallThresholdPlainR185Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeDepartmentCityCopyButtonsR185().catch(
      () => {}
    );
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactNameCopyButtonsR185().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandDomainOkVersionR185CopyCard().catch(() => {});
      paintRoundLayerList185();
    }, 910);
  }
})();
