/* 电子继承 · 第一百六十八批增量（叠在 round167…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round168SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeBrandVersionBrandEnCalmBarR168");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandVersionBrandEnCalmBarR168";
      bar.className = "home-brand-version-brand-en-calm-r168";
      bar.setAttribute("role", "status");
      const domainOk = $("#homeDomainOkVersionCalmBarR167");
      const brandEn = $("#homeBrandEnOkBrandCalmBarR166");
      const verBrand = $("#homeVersionBrandOkCalmBarR165");
      if (domainOk && domainOk.parentNode === home)
        domainOk.insertAdjacentElement("afterend", bar);
      else if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
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
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r168-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r168-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR168">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR168");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-version-brand-en-calm-r168-mark">品牌</span>
        <span class="muted home-brand-version-brand-en-calm-r168-sub">品牌版本英文暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandVersionBrandEnCalmGoR168">去设置</button>`;
      const btn = $("#homeBrandVersionBrandEnCalmGoR168");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+编号+标题组合复制 */
  async function ensureLegacyBeneficiaryIdTitleCopyButtons() {
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
        String(it.beneficiary || it.heir || "").trim() || "未填受益人";
      const id = it.id != null ? String(it.id) : "—";
      const title = String(it.title || "").trim() || "无标题";
      const line = beneficiary + " · " + id + " · " + title;
      el.dataset.beneficiaryIdTitleR168 = line;
      if (el.querySelector(".lg-copy-beneficiary-id-title-r168")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-id-title-r168";
      btn.textContent = "复制受益人编号标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryIdTitleR168 || "");
        softBanner(ok ? "已复制受益人编号标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+摘要+分类组合复制 */
  async function ensureAssetVisibilitySummaryCategoryCopyButtons() {
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
      const visibility =
        String(it.visibility || it.share_level || "").trim() || "未填可见性";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const category =
        String(it.category || it.dept || "").trim() || "未填分类";
      const line = visibility + " · " + summary + " · " + category;
      el.dataset.visibilitySummaryCategoryR168 = line;
      if (el.querySelector(".as-copy-visibility-summary-category-r168")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-summary-category-r168";
      btn.textContent = "复制可见性摘要分类";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.visibilitySummaryCategoryR168 || ""
        );
        softBanner(ok ? "已复制可见性摘要分类" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+窗口截止 */
  async function ensureCheckinStatusLabelWindowEndsPlainR168Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelWindowEndsPlainR168CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelWindowEndsPlainR168CopyCard";
      card.className = "checkin-status-label-window-ends-plain-r168-copy";
      const nextLast = $("#checkinNextSuggestedLastAgoPlainR167CopyCard");
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR166CopyCard");
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR165CopyCard");
      if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (lastStatus && lastStatus.parentNode)
        lastStatus.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "暂无状态";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(
              cd.window_ends_label || st.window_ends_at || ""
            ).trim() || "—";
      const combo = statusLabel + " · " + windowEnds;
      const line =
        "报备状态 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-window-ends-plain-r168-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelWindowEndsPlainR168CopyBtn">复制状态窗口截止</button>`;
      const btn = $("#checkinStatusLabelWindowEndsPlainR168CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态窗口截止" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态窗口截止文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差+门槛+余额三元复制 */
  async function ensureTravelShortfallThresholdBalancePlainR168Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallThresholdBalancePlainR168CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallThresholdBalancePlainR168CopyCard";
      card.className = "travel-shortfall-threshold-balance-plain-r168-copy";
      const progThr = $("#travelProgressThresholdDepositedPlainR167CopyCard");
      const depProg = $("#travelDepositedProgressShortfallPlainR166CopyCard");
      const thrBal = $("#travelThresholdBalanceShortfallPlainR165CopyCard");
      if (progThr && progThr.parentNode)
        progThr.insertAdjacentElement("afterend", card);
      else if (depProg && depProg.parentNode)
        depProg.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const balance =
        fund.balance == null
          ? fund.deposited == null
            ? "—"
            : String(Math.round(Number(fund.deposited)))
          : String(Math.round(Number(fund.balance)));
      const combo = shortfall + " · " + thr + " · " + balance;
      const line =
        "差旅短差 · 门槛 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-threshold-balance-plain-r168-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallThresholdBalancePlainR168CopyBtn">复制短差门槛余额</button>`;
      const btn = $("#travelShortfallThresholdBalancePlainR168CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差门槛余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差门槛余额文案暂不可用</p>`;
    }
  }

  /* 6 · 医旅科室+城市+医院组合复制 */
  async function ensureAftercareDepartmentCityHospitalCopyButtons() {
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
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = department + " · " + city + " · " + hospital;
      el.dataset.departmentCityHospitalR168 = line;
      if (el.querySelector(".ac-copy-department-city-hospital-r168")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-city-hospital-r168";
      btn.textContent = "复制科室城市医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentCityHospitalR168 || "");
        softBanner(ok ? "已复制科室城市医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+时长提示+就绪组合复制 */
  async function ensureAuthCompleteDurationHintReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteDurationHintReadyCopyR168Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteDurationHintReadyCopyR168Card";
      card.className = "av-complete-duration-hint-ready-copy-r168";
      const durReady = $("#avDurationHintReadyMissingCopyR167Card");
      const missReady = $("#avMissingReadyCompleteCopyR166Card");
      const readyComplete = $("#avReadyCompleteDurationHintCopyR165Card");
      if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const prog = data.progress || {};
      const complete = truthyFlag(
        data.complete != null
          ? data.complete
          : prog.complete != null
            ? prog.complete
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
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = complete + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-duration-hint-ready-copy-r168-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteDurationHintReadyCopyR168Btn">复制完成时长就绪</button>`;
      const btn = $("#avCompleteDurationHintReadyCopyR168Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成时长就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人联系方式+姓名+关系组合复制 */
  async function ensureHeirContactNameRelationCopyButtons() {
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
      const contact =
        String(it.contact || it.phone || it.email || "").trim() ||
        "未填联系方式";
      const name = String(it.name || "").trim() || "未填姓名";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · " + name + " · " + relation;
      if (el.querySelector(".bn-copy-contact-name-relation-r168")) return;
      el.dataset.contactNameRelationR168 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-name-relation-r168";
      btn.textContent = "复制联系姓名关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactNameRelationR168 || "");
        softBanner(ok ? "已复制联系姓名关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+域名+完成数组合复制 */
  async function ensureHandoverProgressPctDomainDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressPctDomainDoneCopyR168Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressPctDomainDoneCopyR168Card";
      card.className = "hand-progress-pct-domain-done-copy-r168";
      const doneSec = $("#handDoneSectionsBrandCopyR167Card");
      const brandDom = $("#handBrandDomainSectionsCopyR166Card");
      const secDone = $("#handSectionsDoneProgressPctCopyR165Card");
      if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let pct = "—";
      if (prog.pct != null) pct = String(prog.pct) + "%";
      else if (prog.percent != null) pct = String(prog.percent) + "%";
      else if (data.progress_pct != null)
        pct = String(data.progress_pct) + "%";
      const domain = String(data.domain || "einherit.cn").trim();
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = pct + " · " + domain + " · " + done;
      const line = "手册进度 · 域名 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-pct-domain-done-copy-r168-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressPctDomainDoneCopyR168Btn">复制进度域名完成</button>`;
      const btn = $("#handProgressPctDomainDoneCopyR168Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度域名完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度域名完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+英文品牌+中文品牌+就绪四元复制 + round 层含 168 */
  async function paintDomainBrandEnBrandOkR168CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainBrandEnBrandOkR168CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainBrandEnBrandOkR168CopyCard";
      card.className = "card settings-domain-brand-en-brand-ok-r168-copy-card";
      const okEn = $("#settingsOkBrandEnVersionBrandR167CopyCard");
      const verBrand = $("#settingsVersionBrandDomainOkR166CopyCard");
      const brandDom = $("#settingsBrandDomainOkBrandEnR165CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okEn && okEn.parentNode)
        okEn.insertAdjacentElement("beforebegin", card);
      else if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = domain + " · " + en + " · " + brand + " · " + okLabel;
      card.innerHTML = `<h3>域名 · 英文 · 品牌 · 就绪</h3>
        <p class="muted">一键复制域名、英文品牌、中文品牌与就绪态（演示级）。</p>
        <p class="settings-domain-brand-en-brand-ok-r168-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainBrandEnBrandOkR168CopyBtn">复制域名英文品牌就绪</button>`;
      const btn = $("#settingsDomainBrandEnBrandOkR168CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名英文品牌就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 英文 · 品牌 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList168() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 168;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 168); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round168 均已挂载。</p>`
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
      () => ensureLegacyBeneficiaryIdTitleCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilitySummaryCategoryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinStatusLabelWindowEndsPlainR168Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelShortfallThresholdBalancePlainR168Copy().catch(() => {}),
      840
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () =>
        ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteDurationHintReadyCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressPctDomainDoneCopy().catch(() => {}),
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
        () => ensureLegacyBeneficiaryIdTitleCopyButtons().catch(() => {}),
        850
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilitySummaryCategoryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinStatusLabelWindowEndsPlainR168Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelShortfallThresholdBalancePlainR168Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {}),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteDurationHintReadyCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactNameRelationCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressPctDomainDoneCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandEnBrandOkR168CopyCard().catch(() => {});
        paintRoundLayerList168();
      }, 890);
      setTimeout(() => {
        paintDomainBrandEnBrandOkR168CopyCard().catch(() => {});
        paintRoundLayerList168();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeBrandVersionBrandEn().catch(() => {}), 1050);
  setTimeout(
    () => ensureLegacyBeneficiaryIdTitleCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetVisibilitySummaryCategoryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelWindowEndsPlainR168Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallThresholdBalancePlainR168Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteDurationHintReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactNameRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressPctDomainDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandEnBrandOkR168CopyCard().catch(() => {});
      paintRoundLayerList168();
    }, 910);
  }
})();
