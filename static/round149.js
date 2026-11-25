/* 电子继承 · 第一百四十九批增量（叠在 round148…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round149SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+中文品牌+版本冷静条 */
  async function paintHomeBrandEnBrandVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnBrandVersionCalmBarR149");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnBrandVersionCalmBarR149";
      bar.className = "home-brand-en-brand-version-calm-r149";
      bar.setAttribute("role", "status");
      const verDom = $("#homeVersionDomainOkCalmBarR148");
      const okEn = $("#homeOkBrandEnBrandCalmBarR147");
      const enVer = $("#homeBrandEnVersionDomainCalmBarR146");
      if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else if (enVer && enVer.parentNode === home)
        enVer.insertAdjacentElement("afterend", bar);
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
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = en + " · " + brand + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-version-calm-r149-mark">品牌</span>
        <span class="muted home-brand-en-brand-version-calm-r149-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandVersionCalmGoR149">去设置</button>`;
      const btn = $("#homeBrandEnBrandVersionCalmGoR149");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-brand-version-calm-r149-mark">品牌</span>
        <span class="muted home-brand-en-brand-version-calm-r149-sub">英文中文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnBrandVersionCalmGoR149">去设置</button>`;
      const btn = $("#homeBrandEnBrandVersionCalmGoR149");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+处置方式+受益人组合复制 */
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
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const disposition =
        String(it.disposition || it.action || "").trim() || "未填处置";
      const beneficiary =
        String(it.beneficiary || it.device_owner || "").trim() || "未填受益人";
      const line = title + " · " + disposition + " · " + beneficiary;
      el.dataset.titleDispositionBeneficiary = line;
      if (el.querySelector(".lg-copy-title-disposition-beneficiary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-disposition-beneficiary";
      btn.textContent = "复制标题处置受益人";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDispositionBeneficiary || "");
        softBanner(ok ? "已复制标题处置受益人" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+摘要+平台组合复制 */
  async function ensureAssetCategorySummaryPlatformCopyButtons() {
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
        String(it.category || it.tag || it.dept || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const line = category + " · " + summary + " · " + platform;
      el.dataset.categorySummaryPlatform = line;
      if (el.querySelector(".as-copy-category-summary-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-summary-platform";
      btn.textContent = "复制分类摘要平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categorySummaryPlatform || "");
        softBanner(ok ? "已复制分类摘要平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+窗口截止 */
  async function ensureCheckinNextAtWindowEndsPlainR149Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtWindowEndsPlainR149CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtWindowEndsPlainR149CopyCard";
      card.className = "checkin-next-at-window-ends-plain-r149-copy";
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR148CopyCard");
      const nextLast = $("#checkinNextAtLastAgoPlainR147CopyCard");
      const winStatus146 = $("#checkinWindowEndsStatusLabelPlainR146CopyCard");
      if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
      else if (nextLast && nextLast.parentNode)
        nextLast.insertAdjacentElement("afterend", card);
      else if (winStatus146 && winStatus146.parentNode)
        winStatus146.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(cd.window_ends_label || st.window_ends_at || "").trim() ||
            "—";
      const combo = nextAt + " · " + windowEnds;
      const line =
        "报备下次建议 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-window-ends-plain-r149-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtWindowEndsPlainR149CopyBtn">复制下次窗口R149</button>`;
      const btn = $("#checkinNextAtWindowEndsPlainR149CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次窗口R149" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额+短差+已存三元复制 */
  async function ensureTravelBalanceShortfallDepositedPlainR149Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallDepositedPlainR149CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallDepositedPlainR149CopyCard";
      card.className = "travel-balance-shortfall-deposited-plain-r149-copy";
      const progDep = $("#travelProgressDepositedThresholdPlainR148CopyCard");
      const thrShort = $("#travelThresholdShortfallBalancePlainR147CopyCard");
      const progMet = $("#travelProgressMetDepositedPlainR146CopyCard");
      if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
      else if (thrShort && thrShort.parentNode)
        thrShort.insertAdjacentElement("afterend", card);
      else if (progMet && progMet.parentNode)
        progMet.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const deposited =
        fund.deposited == null
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const combo = bal + " · " + shortfall + " · " + deposited;
      const line =
        "差旅余额 · 短差 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-deposited-plain-r149-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallDepositedPlainR149CopyBtn">复制余额短差已存</button>`;
      const btn = $("#travelBalanceShortfallDepositedPlainR149CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额短差已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额短差已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后状态+服务类型+医院组合复制 */
  async function ensureAftercareStatusServiceHospitalCopyButtons() {
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
      const status =
        String(it.status_label || it.status || it.status_key || it.title || "").trim() ||
        "未填状态";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const line = status + " · " + service + " · " + hospital;
      el.dataset.statusServiceHospital = line;
      if (el.querySelector(".ac-copy-status-service-hospital")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-status-service-hospital";
      btn.textContent = "复制状态服务医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusServiceHospital || "");
        softBanner(ok ? "已复制状态服务医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+就绪+缺失项组合复制 */
  async function ensureAuthCompleteReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyMissingCopyR149Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyMissingCopyR149Card";
      card.className = "av-complete-ready-missing-copy-r149";
      const readyMiss = $("#avReadyMissingDurationCopyR148Card");
      const completeDur = $("#avCompleteDurationReadyCopyR147Card");
      const durReady = $("#avDurationReadyMissingCopyR146Card");
      if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else if (completeDur && completeDur.parentNode)
        completeDur.insertAdjacentElement("afterend", card);
      else if (durReady && durReady.parentNode)
        durReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
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
      const combo = complete + " · " + ready + " · " + missLabel;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-complete-ready-missing-copy-r149-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyMissingCopyR149Btn">复制完成就绪缺失</button>`;
      const btn = $("#avCompleteReadyMissingCopyR149Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成就绪缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成就绪缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+口令提示+姓名组合复制 */
  async function ensureHeirIdPassphraseNameCopyButtons() {
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
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const name = String(it.name || "").trim() || "未填姓名";
      const line = "#" + id + " · " + passphrase + " · " + name;
      if (el.querySelector(".bn-copy-id-passphrase-name-r149")) return;
      el.dataset.idPassphraseNameR149 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-passphrase-name-r149";
      btn.textContent = "复制编号口令姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idPassphraseNameR149 || "");
        softBanner(ok ? "已复制编号口令姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+章节数组合复制 */
  async function ensureHandoverPctDoneSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handPctDoneSectionsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handPctDoneSectionsCopyCard";
      card.className = "hand-pct-done-sections-copy";
      const brandDom = $("#handBrandDomainSectionsCopyR148Card");
      const secPct = $("#handSectionsPctDoneCopyCard");
      const brandDom146 = $("#handBrandDomainSectionsCopyCard");
      if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
      else if (secPct && secPct.parentNode)
        secPct.insertAdjacentElement("afterend", card);
      else if (brandDom146 && brandDom146.parentNode)
        brandDom146.insertAdjacentElement("afterend", card);
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
      else if (data.progress_pct != null) pct = String(data.progress_pct) + "%";
      else if (typeof data.progress === "number")
        pct = String(data.progress) + "%";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = pct + " · " + done + " · " + sectionsCount;
      const line = "手册进度 · 完成 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-pct-done-sections-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handPctDoneSectionsCopyBtn">复制进度完成章节</button>`;
      const btn = $("#handPctDoneSectionsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+英文品牌+就绪+域名四元复制 + round 层含 149 */
  async function paintBrandBrandEnOkDomainR149CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandBrandEnOkDomainR149CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandBrandEnOkDomainR149CopyCard";
      card.className = "card settings-brand-brand-en-ok-domain-r149-copy-card";
      const verDom = $("#settingsVersionDomainOkBrandR148CopyCard");
      const brandEn = $("#settingsBrandEnOkVersionDomainR147CopyCard");
      const verDom146 = $("#settingsVersionDomainOkBrandR146CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (verDom146 && verDom146.parentNode)
        verDom146.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const line = brand + " · " + en + " · " + ready + " · " + domain;
      card.innerHTML = `<h3>品牌 · 英文 · 就绪 · 域名</h3>
        <p class="muted">一键复制中文品牌、英文品牌、就绪状态与域名（演示级）。</p>
        <p class="settings-brand-brand-en-ok-domain-r149-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandBrandEnOkDomainR149CopyBtn">复制品牌英文就绪域名</button>`;
      const btn = $("#settingsBrandBrandEnOkDomainR149CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制品牌英文就绪域名" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>品牌 · 英文 · 就绪 · 域名</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList149() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 149;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 149); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round149 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 960);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
      790
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategorySummaryPlatformCopyButtons().catch(() => {}),
      790
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtWindowEndsPlainR149Copy().catch(() => {}),
      780
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelBalanceShortfallDepositedPlainR149Copy().catch(() => {}),
      800
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {}),
      790
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
      760
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdPassphraseNameCopyButtons().catch(() => {}),
      790
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverPctDoneSectionsCopy().catch(() => {}),
      800
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 960);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(
            () => {}
          ),
        810
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategorySummaryPlatformCopyButtons().catch(() => {}),
        800
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtWindowEndsPlainR149Copy().catch(() => {}),
        800
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelBalanceShortfallDepositedPlainR149Copy().catch(
            () => {}
          ),
        820
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {}),
        810
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
        780
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdPassphraseNameCopyButtons().catch(() => {}),
        800
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverPctDoneSectionsCopy().catch(() => {}),
        810
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandBrandEnOkDomainR149CopyCard().catch(() => {});
        paintRoundLayerList149();
      }, 850);
      setTimeout(() => {
        paintBrandBrandEnOkDomainR149CopyCard().catch(() => {});
        paintRoundLayerList149();
      }, 1530);
    }
  };

  setTimeout(() => paintHomeBrandEnBrandVersion().catch(() => {}), 1010);
  setTimeout(
    () =>
      ensureLegacyTitleDispositionBeneficiaryCopyButtons().catch(() => {}),
    1030
  );
  setTimeout(
    () => ensureAssetCategorySummaryPlatformCopyButtons().catch(() => {}),
    1050
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtWindowEndsPlainR149Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallDepositedPlainR149Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareStatusServiceHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdPassphraseNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverPctDoneSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandBrandEnOkDomainR149CopyCard().catch(() => {});
      paintRoundLayerList149();
    }, 870);
  }
})();
