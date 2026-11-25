/* 电子继承 · 第一百六十七批增量（叠在 round166…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round167SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+就绪+版本冷静条 */
  async function paintHomeDomainOkVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainOkVersionCalmBarR167");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainOkVersionCalmBarR167";
      bar.className = "home-domain-ok-version-calm-r167";
      bar.setAttribute("role", "status");
      const brandEn = $("#homeBrandEnOkBrandCalmBarR166");
      const verBrand = $("#homeVersionBrandOkCalmBarR165");
      const brandDom = $("#homeBrandDomainBrandEnCalmBarR164");
      if (brandEn && brandEn.parentNode === home)
        brandEn.insertAdjacentElement("afterend", bar);
      else if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
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
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = domain + " · " + okLabel + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-version-calm-r167-mark">域名</span>
        <span class="muted home-domain-ok-version-calm-r167-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkVersionCalmGoR167">去设置</button>`;
      const btn = $("#homeDomainOkVersionCalmGoR167");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-version-calm-r167-mark">域名</span>
        <span class="muted home-domain-ok-version-calm-r167-sub">域名就绪版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkVersionCalmGoR167">去设置</button>`;
      const btn = $("#homeDomainOkVersionCalmGoR167");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置方式+设备归属组合复制 */
  async function ensureLegacyTitleDispositionDeviceOwnerCopyButtons() {
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
      const deviceOwner =
        String(
          it.device_owner || it.owner || it.device || it.device_name || ""
        ).trim() || "未填设备归属";
      const line = title + " · " + disposition + " · " + deviceOwner;
      el.dataset.titleDispositionDeviceOwnerR167 = line;
      if (el.querySelector(".lg-copy-title-disposition-device-owner-r167"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-device-owner-r167";
      btn.textContent = "复制标题处置归属";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.titleDispositionDeviceOwnerR167 || ""
        );
        softBanner(ok ? "已复制标题处置归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+标签+摘要组合复制 */
  async function ensureAssetCategoryTagSummaryCopyButtons() {
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
        String(it.category || it.dept || "").trim() || "未填分类";
      const tag = String(it.tag || it.category || "").trim() || "未填标签";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = category + " · " + tag + " · " + summary;
      el.dataset.categoryTagSummaryR167 = line;
      if (el.querySelector(".as-copy-category-tag-summary-r167")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-tag-summary-r167";
      btn.textContent = "复制分类标签摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryTagSummaryR167 || "");
        softBanner(ok ? "已复制分类标签摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+距上次标签 */
  async function ensureCheckinNextSuggestedLastAgoPlainR167Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextSuggestedLastAgoPlainR167CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextSuggestedLastAgoPlainR167CopyCard";
      card.className = "checkin-next-suggested-last-ago-plain-r167-copy";
      const winNext = $("#checkinWindowEndsNextSuggestedPlainR166CopyCard");
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR165CopyCard");
      const statusNext = $("#checkinStatusLabelNextSuggestedPlainR164CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
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
      const nextSuggested =
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
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const combo = nextSuggested + " · " + lastAgo;
      const line =
        "报备下次建议 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-suggested-last-ago-plain-r167-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextSuggestedLastAgoPlainR167CopyBtn">复制下次建议距上次</button>`;
      const btn = $("#checkinNextSuggestedLastAgoPlainR167CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次建议距上次" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次建议距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+门槛+已存三元复制 */
  async function ensureTravelProgressThresholdDepositedPlainR167Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressThresholdDepositedPlainR167CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressThresholdDepositedPlainR167CopyCard";
      card.className = "travel-progress-threshold-deposited-plain-r167-copy";
      const depProg = $("#travelDepositedProgressShortfallPlainR166CopyCard");
      const thrBal = $("#travelThresholdBalanceShortfallPlainR165CopyCard");
      const shortDep = $("#travelShortfallDepositedBalancePlainR164CopyCard");
      if (depProg && depProg.parentNode)
        depProg.insertAdjacentElement("afterend", card);
      else if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
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
      let pct = "—";
      if (fund.progress_pct != null) pct = String(fund.progress_pct) + "%";
      else if (fund.progress != null && typeof fund.progress === "number")
        pct = String(Math.round(fund.progress)) + "%";
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = pct + " · " + thr + " · " + deposited;
      const line =
        "差旅进度 · 门槛 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-threshold-deposited-plain-r167-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressThresholdDepositedPlainR167CopyBtn">复制进度门槛已存</button>`;
      const btn = $("#travelProgressThresholdDepositedPlainR167CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度门槛已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度门槛已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+状态+医院组合复制 */
  async function ensureAftercareServiceTypeStatusHospitalCopyButtons() {
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
        String(it.service_type || it.service || it.department || "").trim() ||
        "未填服务类型";
      const status =
        String(it.status || it.state || it.visit_pref || "").trim() ||
        "未填状态";
      const hospital =
        String(it.hospital || it.facility || it.title || "").trim() ||
        "未填医院";
      const line = serviceType + " · " + status + " · " + hospital;
      el.dataset.serviceTypeStatusHospitalR167 = line;
      if (el.querySelector(".ac-copy-service-type-status-hospital-r167"))
        return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-type-status-hospital-r167";
      btn.textContent = "复制类型状态医院";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.serviceTypeStatusHospitalR167 || ""
        );
        softBanner(ok ? "已复制类型状态医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频时长提示+就绪+缺失项组合复制 */
  async function ensureAuthDurationHintReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avDurationHintReadyMissingCopyR167Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avDurationHintReadyMissingCopyR167Card";
      card.className = "av-duration-hint-ready-missing-copy-r167";
      const missReady = $("#avMissingReadyCompleteCopyR166Card");
      const readyComplete = $("#avReadyCompleteDurationHintCopyR165Card");
      const durMiss = $("#avDurationHintMissingCompleteCopyR164Card");
      if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyComplete && readyComplete.parentNode)
        readyComplete.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
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
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const combo = duration + " · " + ready + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-duration-hint-ready-missing-copy-r167-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avDurationHintReadyMissingCopyR167Btn">复制时长就绪缺失</button>`;
      const btn = $("#avDurationHintReadyMissingCopyR167Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制时长就绪缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">时长就绪缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+关系+口令提示组合复制 */
  async function ensureHeirIdRelationPassphraseHintCopyButtons() {
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
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const hint =
        String(it.passphrase_hint || it.hint || "").trim() || "无口令提示";
      const line = id + " · " + relation + " · " + hint;
      if (el.querySelector(".bn-copy-id-relation-passphrase-hint-r167")) return;
      el.dataset.idRelationPassphraseHintR167 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-relation-passphrase-hint-r167";
      btn.textContent = "复制编号关系口令";
      btn.onclick = async () => {
        const ok = await copyText(
          el.dataset.idRelationPassphraseHintR167 || ""
        );
        softBanner(ok ? "已复制编号关系口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+章节数+品牌组合复制 */
  async function ensureHandoverDoneSectionsBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneSectionsBrandCopyR167Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneSectionsBrandCopyR167Card";
      card.className = "hand-done-sections-brand-copy-r167";
      const brandDom = $("#handBrandDomainSectionsCopyR166Card");
      const secDone = $("#handSectionsDoneProgressPctCopyR165Card");
      const pctDone = $("#handProgressPctDoneDomainCopyR164Card");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
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
      const brand = String(data.brand || "").trim() || "电子继承 App";
      const combo = done + " · " + sections + " · " + brand;
      const line = "手册完成 · 章节 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-done-sections-brand-copy-r167-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneSectionsBrandCopyR167Btn">复制完成章节品牌</button>`;
      const btn = $("#handDoneSectionsBrandCopyR167Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成章节品牌" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成章节品牌暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+英文品牌+版本+中文品牌四元复制 + round 层含 167 */
  async function paintOkBrandEnVersionBrandR167CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkBrandEnVersionBrandR167CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkBrandEnVersionBrandR167CopyCard";
      card.className = "card settings-ok-brand-en-version-brand-r167-copy-card";
      const verBrand = $("#settingsVersionBrandDomainOkR166CopyCard");
      const brandDom = $("#settingsBrandDomainOkBrandEnR165CopyCard");
      const brandEn = $("#settingsBrandEnVersionOkDomainR164CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verBrand && verBrand.parentNode)
        verBrand.insertAdjacentElement("beforebegin", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const okLabel = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = okLabel + " · " + en + " · " + ver + " · " + brand;
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 品牌</h3>
        <p class="muted">一键复制就绪态、英文品牌、版本与中文品牌（演示级）。</p>
        <p class="settings-ok-brand-en-version-brand-r167-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkBrandEnVersionBrandR167CopyBtn">复制就绪英文版本品牌</button>`;
      const btn = $("#settingsOkBrandEnVersionBrandR167CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪英文版本品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 英文 · 版本 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList167() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 167;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 167); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round167 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainOkVersion().catch(() => {}), 1000);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryTagSummaryCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () =>
        ensureCheckinNextSuggestedLastAgoPlainR167Copy().catch(() => {}),
      820
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressThresholdDepositedPlainR167Copy().catch(
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
        ensureAftercareServiceTypeStatusHospitalCopyButtons().catch(
          () => {}
        ),
      830
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthDurationHintReadyMissingCopy().catch(() => {}),
      800
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () =>
        ensureHeirIdRelationPassphraseHintCopyButtons().catch(() => {}),
      830
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneSectionsBrandCopy().catch(() => {}),
      840
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainOkVersion().catch(() => {}), 1000);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategoryTagSummaryCopyButtons().catch(() => {}),
        840
      );
    if (id === "checkin")
      setTimeout(
        () =>
          ensureCheckinNextSuggestedLastAgoPlainR167Copy().catch(() => {}),
        840
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressThresholdDepositedPlainR167Copy().catch(
            () => {}
          ),
        860
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareServiceTypeStatusHospitalCopyButtons().catch(
            () => {}
          ),
        850
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthDurationHintReadyMissingCopy().catch(() => {}),
        820
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirIdRelationPassphraseHintCopyButtons().catch(() => {}),
        840
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneSectionsBrandCopy().catch(() => {}),
        850
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkBrandEnVersionBrandR167CopyCard().catch(() => {});
        paintRoundLayerList167();
      }, 890);
      setTimeout(() => {
        paintOkBrandEnVersionBrandR167CopyCard().catch(() => {});
        paintRoundLayerList167();
      }, 1570);
    }
  };

  setTimeout(() => paintHomeDomainOkVersion().catch(() => {}), 1050);
  setTimeout(
    () =>
      ensureLegacyTitleDispositionDeviceOwnerCopyButtons().catch(() => {}),
    1070
  );
  setTimeout(
    () => ensureAssetCategoryTagSummaryCopyButtons().catch(() => {}),
    1090
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextSuggestedLastAgoPlainR167Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressThresholdDepositedPlainR167Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceTypeStatusHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthDurationHintReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdRelationPassphraseHintCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneSectionsBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkBrandEnVersionBrandR167CopyCard().catch(() => {});
      paintRoundLayerList167();
    }, 910);
  }
})();
