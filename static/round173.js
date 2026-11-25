/* 电子继承 · 第一百七十三批增量（叠在 round172…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round173SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+版本+中文品牌冷静条 */
  async function paintHomeDomainVersionBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainVersionBrandCalmBarR173");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR173";
      bar.className = "home-domain-version-brand-calm-r173";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandBrandEnDomainCalmBarR172");
      const verEn = $("#homeVersionBrandEnDomainCalmBarR171");
      const brandEnDom = $("#homeBrandEnDomainBrandCalmBarR170");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ver + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r173-mark">站点</span>
        <span class="muted home-domain-version-brand-calm-r173-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR173">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR173");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r173-mark">站点</span>
        <span class="muted home-domain-version-brand-calm-r173-sub">域名版本品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR173">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR173");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割处置意向+受益人+设备归属组合复制（进位） */
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
      el.dataset.dispositionBeneficiaryDeviceOwnerR173 = line;
      if (el.querySelector(".lg-copy-disposition-beneficiary-device-owner-r173"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm lg-copy-disposition-beneficiary-device-owner-r173";
      btn.textContent = "复制处置受益人归属";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.dispositionBeneficiaryDeviceOwnerR173 || ""
        );
        softBanner(ok ? "已复制处置受益人归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性+分类组合复制（进位） */
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
      el.dataset.tagVisibilityCategoryR173 = line;
      if (el.querySelector(".as-copy-tag-visibility-category-r173")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-visibility-category-r173";
      btn.textContent = "复制标签可见性分类";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVisibilityCategoryR173 || "");
        softBanner(ok ? "已复制标签可见性分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议时间+状态标签（进位） */
  async function ensureCheckinNextSuggestedAtStatusLabelPlainR173Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedAtStatusLabelPlainR173CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedAtStatusLabelPlainR173CopyCard";
      card.className = "checkin-next-suggested-at-status-label-plain-r173-copy";
      const statusLast = $("#checkinStatusLabelLastAgoPlainR172CopyCard");
      const lastWin = $("#checkinLastAgoWindowEndsPlainR171CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR170CopyCard");
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
      card.innerHTML = `<p class="muted checkin-next-suggested-at-status-label-plain-r173-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedAtStatusLabelPlainR173CopyBtn">复制下次建议状态</button>`;
      const btn = $("#checkinNextSuggestedAtStatusLabelPlainR173CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议状态" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+短差+门槛三元复制（进位） */
  async function ensureTravelDepositedShortfallThresholdPlainR173Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedShortfallThresholdPlainR173CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedShortfallThresholdPlainR173CopyCard";
      card.className = "travel-deposited-shortfall-threshold-plain-r173-copy";
      const shortThr = $("#travelShortfallThresholdBalancePlainR172CopyCard");
      const thrBal = $("#travelThresholdBalanceDepositedPlainR171CopyCard");
      const balDep = $("#travelBalanceDepositedShortfallPlainR170CopyCard");
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
      card.innerHTML = `<p class="muted travel-deposited-shortfall-threshold-plain-r173-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedShortfallThresholdPlainR173CopyBtn">复制已存短差门槛R173</button>`;
      const btn = $("#travelDepositedShortfallThresholdPlainR173CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存短差门槛R173" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存短差门槛文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅服务类型+科室+城市组合复制（进位） */
  async function ensureAftercareServiceTypeDepartmentCityCopyButtonsR173() {
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
      el.dataset.serviceTypeDepartmentCityR173 = line;
      if (el.querySelector(".ac-copy-service-type-department-city-r173"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type-department-city-r173";
      btn.textContent = "复制服务科室城市R173";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeDepartmentCityR173 || ""
        );
        softBanner(ok ? "已复制服务科室城市R173" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频就绪+完成态+缺失项组合复制（进位） */
  async function ensureAuthReadyCompleteMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avReadyCompleteMissingCopyR173Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avReadyCompleteMissingCopyR173Card";
      card.className = "av-ready-complete-missing-copy-r173";
      const completeMiss = $("#avCompleteMissingDurationHintCopyR172Card");
      const missDur = $("#avMissingDurationHintReadyCopyR171Card");
      const durReady = $("#avDurationHintReadyCompleteCopyR170Card");
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
      card.innerHTML = `<p class="muted av-ready-complete-missing-copy-r173-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avReadyCompleteMissingCopyR173Btn">复制就绪完成缺失</button>`;
      const btn = $("#avReadyCompleteMissingCopyR173Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制就绪完成缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">就绪完成缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+联系方式+姓名组合复制（进位） */
  async function ensureHeirIdContactNameCopyButtonsR173() {
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
      if (el.querySelector(".bn-copy-id-contact-name-r173")) return;
      el.dataset.idContactNameR173 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-contact-name-r173";
      btn.textContent = "复制编号联系姓名R173";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idContactNameR173 || "");
        softBanner(ok ? "已复制编号联系姓名R173" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+章节数+进度百分比组合复制 */
  async function ensureHandoverDomainSectionsProgressPctCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainSectionsProgressPctCopyR173Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainSectionsProgressPctCopyR173Card";
      card.className = "hand-domain-sections-progress-pct-copy-r173";
      const secPct = $("#handSectionsProgressPctDoneCopyR172Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR171Card");
      const domDone = $("#handDomainDoneSectionsCopyR170Card");
      if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (domDone && domDone.parentNode)
        domDone.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted hand-domain-sections-progress-pct-copy-r173-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainSectionsProgressPctCopyR173Btn">复制域名章节进度</button>`;
      const btn = $("#handDomainSectionsProgressPctCopyR173Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名章节进度" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名章节进度暂不可用</p>`;
    }
  }

  /* 10 · 设置·ok+版本+英文品牌+中文品牌四元复制 + round 层含 173 */
  async function paintOkVersionBrandEnBrandR173CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionBrandEnBrandR173CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionBrandEnBrandR173CopyCard";
      card.className = "card settings-ok-version-brand-en-brand-r173-copy-card";
      const verEn = $("#settingsVersionBrandEnBrandOkR172CopyCard");
      const brandEn = $("#settingsBrandEnBrandOkDomainR171CopyCard");
      const brandOk = $("#settingsBrandOkDomainVersionR170CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verEn && verEn.parentNode)
        verEn.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + ver + " · " + en + " · " + brand;
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3>
        <p class="muted">一键复制就绪态、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-ok-version-brand-en-brand-r173-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionBrandEnBrandR173CopyBtn">复制就绪版本英文品牌</button>`;
      const btn = $("#settingsOkVersionBrandEnBrandR173CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList173() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 173;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 173); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round173 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
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
        ensureCheckinNextSuggestedAtStatusLabelPlainR173Copy().catch(
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
        ensureTravelDepositedShortfallThresholdPlainR173Copy().catch(
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
        ensureAftercareServiceTypeDepartmentCityCopyButtonsR173().catch(
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
      () => ensureHeirIdContactNameCopyButtonsR173().catch(() => {}),
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
      setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1000);
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
          ensureCheckinNextSuggestedAtStatusLabelPlainR173Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedShortfallThresholdPlainR173Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeDepartmentCityCopyButtonsR173().catch(
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
        () => ensureHeirIdContactNameCopyButtonsR173().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainSectionsProgressPctCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionBrandEnBrandR173CopyCard().catch(() => {});
        paintRoundLayerList173();
      }, 890);
      setTimeout(() => {
        paintOkVersionBrandEnBrandR173CopyCard().catch(() => {});
        paintRoundLayerList173();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 1050);
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
    ensureCheckinNextSuggestedAtStatusLabelPlainR173Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedShortfallThresholdPlainR173Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeDepartmentCityCopyButtonsR173().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthReadyCompleteMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdContactNameCopyButtonsR173().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainSectionsProgressPctCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionBrandEnBrandR173CopyCard().catch(() => {});
      paintRoundLayerList173();
    }, 910);
  }
})();
