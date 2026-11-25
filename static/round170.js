/* 电子继承 · 第一百七十批增量（叠在 round169…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round170SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+域名+中文品牌冷静条 */
  async function paintHomeBrandEnDomainBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnDomainBrandCalmBarR170");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnDomainBrandCalmBarR170";
      bar.className = "home-brand-en-domain-brand-calm-r170";
      bar.setAttribute("role", "status");
      const domainBrand = $("#homeDomainBrandVersionCalmBarR169");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR168");
      const domainOk = $("#homeDomainOkVersionCalmBarR167");
      if (domainBrand && domainBrand.parentNode === home)
        domainBrand.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (domainOk && domainOk.parentNode === home)
        domainOk.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = en + " · " + domain + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-brand-calm-r170-mark">英文</span>
        <span class="muted home-brand-en-domain-brand-calm-r170-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainBrandCalmGoR170">去设置</button>`;
      const btn = $("#homeBrandEnDomainBrandCalmGoR170");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-domain-brand-calm-r170-mark">英文</span>
        <span class="muted home-brand-en-domain-brand-calm-r170-sub">英文域名品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnDomainBrandCalmGoR170">去设置</button>`;
      const btn = $("#homeBrandEnDomainBrandCalmGoR170");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置意向+受益人组合复制 */
  async function ensureLegacyTitleDispositionBeneficiaryCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const line = title + " · " + disposition + " · " + beneficiary;
      el.dataset.titleDispositionBeneficiaryR170 = line;
      if (el.querySelector(".lg-copy-title-disposition-beneficiary-r170"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-beneficiary-r170";
      btn.textContent = "复制标题处置受益人";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.titleDispositionBeneficiaryR170 || ""
        );
        softBanner(ok ? "已复制标题处置受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘摘要+标签+可见性组合复制 */
  async function ensureAssetSummaryTagVisibilityCopyButtons() {
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
      const tag = String(it.tag || it.category || "").trim() || "未填标签";
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const line = summary + " · " + tag + " · " + visibility;
      el.dataset.summaryTagVisibilityR170 = line;
      if (el.querySelector(".as-copy-summary-tag-visibility-r170")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-summary-tag-visibility-r170";
      btn.textContent = "复制摘要标签可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.summaryTagVisibilityR170 || "");
        softBanner(ok ? "已复制摘要标签可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议时间 */
  async function ensureCheckinWindowEndsNextSuggestedPlainR170Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextSuggestedPlainR170CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextSuggestedPlainR170CopyCard";
      card.className = "checkin-window-ends-next-suggested-plain-r170-copy";
      const nextStatus = $("#checkinNextSuggestedStatusLabelPlainR169CopyCard");
      const statusWin = $("#checkinStatusLabelWindowEndsPlainR168CopyCard");
      const nextLast = $("#checkinNextSuggestedLastAgoPlainR167CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
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
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const nextSuggested =
        String(
          st.next_suggested_at ||
            cd.next_suggested_at ||
            user.next_suggested_at ||
            st.next_at ||
            cd.next_at ||
            ""
        ).trim() || "暂无下次建议";
      const combo = windowEnds + " · " + nextSuggested;
      const line =
        "报备窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-suggested-plain-r170-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextSuggestedPlainR170CopyBtn">复制窗口下次建议R170</button>`;
      const btn = $("#checkinWindowEndsNextSuggestedPlainR170CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次建议R170" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次建议文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+已存+短差三元复制 */
  async function ensureTravelBalanceDepositedShortfallPlainR170Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceDepositedShortfallPlainR170CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceDepositedShortfallPlainR170CopyCard";
      card.className = "travel-balance-deposited-shortfall-plain-r170-copy";
      const depShort = $("#travelDepositedShortfallThresholdPlainR169CopyCard");
      const shortThr = $("#travelShortfallThresholdBalancePlainR168CopyCard");
      const progThr = $("#travelProgressThresholdDepositedPlainR167CopyCard");
      if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
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
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = balance + " · " + deposited + " · " + shortfall;
      const line =
        "差旅余额 · 已存 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-deposited-shortfall-plain-r170-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceDepositedShortfallPlainR170CopyBtn">复制余额已存短差</button>`;
      const btn = $("#travelBalanceDepositedShortfallPlainR170CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额已存短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额已存短差文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅医院+服务类型+科室组合复制 */
  async function ensureAftercareHospitalServiceTypeDepartmentCopyButtons() {
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
      const serviceType =
        String(it.service_type || it.service || it.department || "").trim() ||
        "未填服务类型";
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const line = hospital + " · " + serviceType + " · " + department;
      el.dataset.hospitalServiceTypeDepartmentR170 = line;
      if (el.querySelector(".ac-copy-hospital-service-type-department-r170"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "btn ghost sm ac-copy-hospital-service-type-department-r170";
      btn.textContent = "复制医院类型科室";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.hospitalServiceTypeDepartmentR170 || ""
        );
        softBanner(ok ? "已复制医院类型科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+完成态组合复制 */
  async function ensureAuthDurationHintReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyCompleteCopyR170Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyCompleteCopyR170Card";
      card.className = "av-duration-hint-ready-complete-copy-r170";
      const readyComplete = $("#avReadyCompleteMissingCopyR169Card");
      const completeDur = $("#avCompleteDurationHintReadyCopyR168Card");
      const durReady = $("#avDurationHintReadyMissingCopyR167Card");
      if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
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
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
            : data.ready
      )
        ? "已完成"
        : "未完成";
      const combo = duration + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-complete-copy-r170-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyCompleteCopyR170Btn">复制时长就绪完成</button>`;
      const btn = $("#avDurationHintReadyCompleteCopyR170Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人关系+编号+联系方式组合复制 */
  async function ensureHeirRelationIdContactCopyButtons() {
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
      const id = String(it.id);
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const line = relation + " · " + id + " · " + contact;
      if (el.querySelector(".bn-copy-relation-id-contact-r170")) return;
      el.dataset.relationIdContactR170 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-relation-id-contact-r170";
      btn.textContent = "复制关系编号联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.relationIdContactR170 || "");
        softBanner(ok ? "已复制关系编号联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册域名+完成数+章节数组合复制 */
  async function ensureHandoverDomainDoneSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDomainDoneSectionsCopyR170Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDomainDoneSectionsCopyR170Card";
      card.className = "hand-domain-done-sections-copy-r170";
      const doneSec = $("#handDoneSectionsProgressPctCopyR169Card");
      const pctDom = $("#handProgressPctDomainDoneCopyR168Card");
      const doneBrand = $("#handDoneSectionsBrandCopyR167Card");
      if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else if (pctDom && pctDom.parentNode)
        pctDom.insertAdjacentElement("afterend", card);
      else if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const domain = String(data.domain || "einherit.cn").trim();
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
      const combo = domain + " · " + done + " · " + sections;
      const line = "手册域名 · 完成 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-domain-done-sections-copy-r170-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDomainDoneSectionsCopyR170Btn">复制域名完成章节</button>`;
      const btn = $("#handDomainDoneSectionsCopyR170Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制域名完成章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">域名完成章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+ok+域名+版本四元复制 + round 层含 170 */
  async function paintBrandOkDomainVersionR170CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandOkDomainVersionR170CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandOkDomainVersionR170CopyCard";
      card.className = "card settings-brand-ok-domain-version-r170-copy-card";
      const okDom = $("#settingsOkDomainVersionBrandEnR169CopyCard");
      const domainEn = $("#settingsDomainBrandEnBrandOkR168CopyCard");
      const okEn = $("#settingsOkBrandEnVersionBrandR167CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (domainEn && domainEn.parentNode)
        domainEn.insertAdjacentElement("beforebegin", card);
      else if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const line = brand + " · " + okLabel + " · " + domain + " · " + ver;
      card.innerHTML = `<h3>品牌 · 就绪 · 域名 · 版本</h3>
        <p class="muted">一键复制中文品牌、就绪态、域名与版本（演示级）。</p>
        <p class="settings-brand-ok-domain-version-r170-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandOkDomainVersionR170CopyBtn">复制品牌就绪域名版本</button>`;
      const btn = $("#settingsBrandOkDomainVersionR170CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌就绪域名版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 就绪 · 域名 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList170() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 170;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 170); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round170 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinWindowEndsNextSuggestedPlainR170Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceDepositedShortfallPlainR170Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareHospitalServiceTypeDepartmentCopyButtons().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRelationIdContactCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDomainDoneSectionsCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinWindowEndsNextSuggestedPlainR170Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceDepositedShortfallPlainR170Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalServiceTypeDepartmentCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyCompleteCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRelationIdContactCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDomainDoneSectionsCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandOkDomainVersionR170CopyCard().catch(() => {});
        paintRoundLayerList170();
      }, 890);
      setTimeout(() => {
        paintBrandOkDomainVersionR170CopyCard().catch(() => {});
        paintRoundLayerList170();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandEnDomainBrand().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetSummaryTagVisibilityCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextSuggestedPlainR170Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceDepositedShortfallPlainR170Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalServiceTypeDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRelationIdContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDomainDoneSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandOkDomainVersionR170CopyCard().catch(() => {});
      paintRoundLayerList170();
    }, 910);
  }
})();
