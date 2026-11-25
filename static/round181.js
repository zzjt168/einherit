/* 电子继承 · 第一百八十一批增量（叠在 round180…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round181SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeBrandEnVersionDomainCalmBarR181");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnVersionDomainCalmBarR181";
      bar.className = "home-brand-en-version-domain-calm-r181";
      bar.setAttribute("role", "status");
      const brandDom = $("#homeBrandDomainBrandEnCalmBarR180");
      const verBrand = $("#homeVersionBrandBrandEnCalmBarR179");
      const domBrand = $("#homeDomainBrandEnBrandCalmBarR178");
      if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (domBrand && domBrand.parentNode === home)
        domBrand.insertAdjacentElement("afterend", bar);
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
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r181-mark">品牌</span>
        <span class="muted home-brand-en-version-domain-calm-r181-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR181">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR181");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-version-domain-calm-r181-mark">品牌</span>
        <span class="muted home-brand-en-version-domain-calm-r181-sub">英文版本域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnVersionDomainCalmGoR181">去设置</button>`;
      const btn = $("#homeBrandEnVersionDomainCalmGoR181");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+受益人+设备归属组合复制（三进位） */
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
        ).trim() || "未填设备归属";
      const line = disposition + " · " + beneficiary + " · " + deviceOwner;
      el.dataset.dispositionBeneficiaryDeviceOwnerR181 = line;
      if (el.querySelector(".lg-copy-disposition-beneficiary-device-owner-r181"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-disposition-beneficiary-device-owner-r181";
      btn.textContent = "复制处置受益人归属R181";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryDeviceOwnerR181 || ""
        );
        softBanner(ok ? "已复制处置受益人归属R181" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+分类组合复制（三进位） */
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
      el.dataset.tagVisibilityCategoryR181 = line;
      if (el.querySelector(".as-copy-tag-visibility-category-r181")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-category-r181";
      btn.textContent = "复制标签可见性分类R181";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisibilityCategoryR181 || "");
        softBanner(ok ? "已复制标签可见性分类R181" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时间+状态标签（三进位） */
  async function ensureCheckinNextSuggestedAtStatusLabelPlainR181Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedAtStatusLabelPlainR181CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedAtStatusLabelPlainR181CopyCard";
      card.className = "checkin-next-suggested-at-status-label-plain-r181-copy";
      const statusLast = $("#checkinStatusLabelLastAgoPlainR180CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR179CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR178CopyCard");
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
        ).trim() || "暂无状态";
      const combo = nextAt + " · " + statusLabel;
      const line =
        "报备下次建议 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-at-status-label-plain-r181-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedAtStatusLabelPlainR181CopyBtn">复制下次建议状态R181</button>`;
      const btn = $("#checkinNextSuggestedAtStatusLabelPlainR181CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议状态R181" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+短差+门槛三元复制（三进位） */
  async function ensureTravelDepositedShortfallThresholdPlainR181Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallThresholdPlainR181CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallThresholdPlainR181CopyCard";
      card.className = "travel-deposited-shortfall-threshold-plain-r181-copy";
      const shortThr = $("#travelShortfallThresholdBalancePlainR180CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR179CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR178CopyCard");
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const combo = deposited + " · " + shortfall + " · " + thr;
      const line =
        "差旅已存 · 短差 · 门槛 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-shortfall-threshold-plain-r181-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallThresholdPlainR181CopyBtn">复制已存短差门槛R181</button>`;
      const btn = $("#travelDepositedShortfallThresholdPlainR181CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存短差门槛R181" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存短差门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+科室+城市组合复制（三进位） */
  async function ensureAftercareServiceTypeDepartmentCityCopyButtonsR181() {
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
      el.dataset.serviceTypeDepartmentCityR181 = line;
      if (el.querySelector(".ac-copy-service-type-department-city-r181"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type-department-city-r181";
      btn.textContent = "复制服务科室城市R181";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeDepartmentCityR181 || ""
        );
        softBanner(ok ? "已复制服务科室城市R181" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+缺失项组合复制（三进位） */
  async function ensureAuthReadyCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCopyR181Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCopyR181Card";
      card.className = "av-ready-complete-missing-copy-r181";
      const completeMiss = $("#avCompleteMissingDurationHintCopyR180Card");
      const missDur = $("#avMissingDurationHintReadyCopyR179Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR178Card");
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
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const combo = ready + " · " + complete + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-ready-complete-missing-copy-r181-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCopyR181Btn">复制就绪完成缺失R181</button>`;
      const btn = $("#avReadyCompleteMissingCopyR181Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成缺失R181" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式+姓名组合复制（三进位） */
  async function ensureHeirIdContactNameCopyButtonsR181() {
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
      if (el.querySelector(".bn-copy-id-contact-name-r181")) return;
      el.dataset.idContactNameR181 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-name-r181";
      btn.textContent = "复制编号联系姓名R181";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactNameR181 || "");
        softBanner(ok ? "已复制编号联系姓名R181" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+进度百分比组合复制（再进位） */
  async function ensureHandoverDomainSectionsProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsProgressPctCopyR181Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsProgressPctCopyR181Card";
      card.className = "hand-domain-sections-progress-pct-copy-r181";
      const secPct = $("#handSectionsProgressPctDoneCopyR180Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR179Card");
      const doneDom = $("#handDoneDomainSectionsCopyR178Card");
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
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const combo = domain + " · " + sections + " · " + pct;
      const line = "手册域名 · 章节 · 进度 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-sections-progress-pct-copy-r181-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsProgressPctCopyR181Btn">复制域名章节进度R181</button>`;
      const btn = $("#handDomainSectionsProgressPctCopyR181Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节进度R181" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+中文品牌+域名+ok四元复制（进位） + round 层含 181 */
  async function paintBrandEnBrandDomainOkR181CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnBrandDomainOkR181CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnBrandDomainOkR181CopyCard";
      card.className = "card settings-brand-en-brand-domain-ok-r181-copy-card";
      const brandDom = $("#settingsBrandDomainOkVersionR180CopyCard");
      const domOk = $("#settingsDomainOkVersionBrandEnR179CopyCard");
      const okVer = $("#settingsOkVersionBrandEnBrandR178CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (domOk && domOk.parentNode)
        domOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = en + " · " + brand + " · " + domain + " · " + okLabel;
      card.innerHTML = `<h3>英文 · 品牌 · 域名 · 就绪</h3>
        <p class="muted">一键复制英文品牌、中文品牌、域名与就绪态（演示级）。</p>
        <p class="settings-brand-en-brand-domain-ok-r181-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnBrandDomainOkR181CopyBtn">复制英文品牌域名就绪R181</button>`;
      const btn = $("#settingsBrandEnBrandDomainOkR181CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文品牌域名就绪R181" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 品牌 · 域名 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList181() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 181;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 181); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round181 均已挂载。</p>`
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
        ensureCheckinNextSuggestedAtStatusLabelPlainR181Copy().catch(
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
        ensureTravelDepositedShortfallThresholdPlainR181Copy().catch(
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
        ensureAftercareServiceTypeDepartmentCityCopyButtonsR181().catch(
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
      () => ensureHeirIdContactNameCopyButtonsR181().catch(() => {}),
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
      setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1000);
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
        () =>
          ensureAssetTagVisibilityCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedAtStatusLabelPlainR181Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallThresholdPlainR181Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeDepartmentCityCopyButtonsR181().catch(
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
        () => ensureHeirIdContactNameCopyButtonsR181().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnBrandDomainOkR181CopyCard().catch(() => {});
        paintRoundLayerList181();
      }, 890);
      setTimeout(() => {
        paintBrandEnBrandDomainOkR181CopyCard().catch(() => {});
        paintRoundLayerList181();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnVersionDomain().catch(() => {}), 1050);
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
    ensureCheckinNextSuggestedAtStatusLabelPlainR181Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallThresholdPlainR181Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeDepartmentCityCopyButtonsR181().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactNameCopyButtonsR181().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnBrandDomainOkR181CopyCard().catch(() => {});
      paintRoundLayerList181();
    }, 910);
  }
})();
