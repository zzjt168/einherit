/* 电子继承 · 第一百三十八批增量（叠在 round137…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round138SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页就绪+英文品牌+版本冷静条 */
  async function paintHomeOkBrandEnVersion() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeOkBrandEnVersionCalmBarR138");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeOkBrandEnVersionCalmBarR138";
      bar.className = "home-ok-brand-en-version-calm-r138";
      bar.setAttribute("role", "status");
      const domVer = $("#homeDomainVersionBrandCalmBarR137");
      const verEn = $("#homeVersionBrandEnOkCalmBarR136");
      const okBrand = $("#homeOkBrandDomainCalmBarR135");
      if (domVer && domVer.parentNode === home)
        domVer.insertAdjacentElement("afterend", bar);
      else if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const sub = ready + " · " + en + " · " + ver;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r138-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r138-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR138">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR138");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-ok-brand-en-version-calm-r138-mark">就绪</span>
        <span class="muted home-ok-brand-en-version-calm-r138-sub">就绪英文版本暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeOkBrandEnVersionCalmGoR138">去设置</button>`;
      const btn = $("#homeOkBrandEnVersionCalmGoR138");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+编号+设备归属组合复制 */
  async function ensureLegacyBeneficiaryIdDeviceOwnerCopyButtons() {
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
      if (!it || it.id == null) return;
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const id = String(it.id);
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const line = bene + " · #" + id + " · " + owner;
      el.dataset.beneficiaryIdDeviceOwner = line;
      if (el.querySelector(".lg-copy-beneficiary-id-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-id-device-owner";
      btn.textContent = "复制受益人编号归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryIdDeviceOwner || "");
        softBanner(ok ? "已复制受益人编号归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+可见性+处置说明组合复制 */
  async function ensureAssetCategoryVisibilityDisposeCopyButtons() {
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
        String(it.category || it.tag || "").trim() || "未填分类";
      const visibility =
        String(it.visibility || "").trim() || "未填可见性";
      const dispose =
        String(it.dispose_note || "").trim() || "未填处置";
      const line = category + " · " + visibility + " · " + dispose;
      el.dataset.categoryVisibilityDispose = line;
      if (el.querySelector(".as-copy-category-visibility-dispose")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-visibility-dispose";
      btn.textContent = "复制分类可见处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryVisibilityDispose || "");
        softBanner(ok ? "已复制分类可见处置" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制状态标签+距上次标签 */
  async function ensureCheckinStatusLabelLastAgoPlainR138Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinStatusLabelLastAgoPlainR138CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinStatusLabelLastAgoPlainR138CopyCard";
      card.className = "checkin-status-label-last-ago-plain-r138-copy";
      const lastNext = $("#checkinLastAgoNextAtPlainR137CopyCard");
      const statusWin = $("#checkinStatusLabelWindowEndsPlainR136CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR135CopyCard");
      if (lastNext && lastNext.parentNode)
        lastNext.insertAdjacentElement("afterend", card);
      else if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
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
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const lastAgo =
        String(cd.last_ago_label || st.last_ago_label || "").trim() || "—";
      const combo = statusLabel + " · " + lastAgo;
      const line =
        "报备状态 · 距上次 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-status-label-last-ago-plain-r138-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinStatusLabelLastAgoPlainR138CopyBtn">复制状态距上次R138</button>`;
      const btn = $("#checkinStatusLabelLastAgoPlainR138CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制状态距上次R138" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">状态距上次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+进度百分比+达标三元复制 */
  async function ensureTravelThresholdProgressMetPlainR138Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdProgressMetPlainR138CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdProgressMetPlainR138CopyCard";
      card.className = "travel-threshold-progress-met-plain-r138-copy";
      const progDep = $("#travelProgressDepositedBalancePlainR137CopyCard");
      const metShort = $("#travelMetShortfallThresholdPlainR136CopyCard");
      const shortBal = $("#travelShortfallBalanceDepositedPlainR135CopyCard");
      if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
      else if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const pct =
        fund.progress_pct != null
          ? String(Math.round(Number(fund.progress_pct)))
          : fund.progress != null
            ? String(Math.round(Number(fund.progress)))
            : "—";
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const combo = thr + " · " + pct + "% · " + met;
      const line =
        "差旅门槛 · 进度 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-progress-met-plain-r138-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdProgressMetPlainR138CopyBtn">复制门槛进度达标</button>`;
      const btn = $("#travelThresholdProgressMetPlainR138CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛进度达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛进度达标文案暂不可用</p>`;
    }
  }

  /* 6 · 善后服务类型+状态+城市组合复制 */
  async function ensureAftercareServiceStatusCityCopyButtons() {
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
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = service + " · " + status + " · " + city;
      el.dataset.serviceStatusCity = line;
      if (el.querySelector(".ac-copy-service-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-service-status-city";
      btn.textContent = "复制服务状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.serviceStatusCity || "");
        softBanner(ok ? "已复制服务状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+时长提示+就绪组合复制 */
  async function ensureAuthMissingDurationReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingDurationReadyCopyR138Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingDurationReadyCopyR138Card";
      card.className = "av-missing-duration-ready-copy-r138";
      const titleReady = $("#avTitleReadyCompleteCopyR137Card");
      const durMiss = $("#avDurationMissingCompleteCopyR136Card");
      const missReady = $("#avMissingReadyTitleCopyR135Card");
      if (titleReady && titleReady.parentNode)
        titleReady.insertAdjacentElement("afterend", card);
      else if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const duration =
        String(
          data.duration_hint ||
            prog.duration_hint ||
            data.duration ||
            ""
        ).trim() || "无时长提示";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = missLabel + " · " + duration + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-duration-ready-copy-r138-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingDurationReadyCopyR138Btn">复制缺失时长就绪</button>`;
      const btn = $("#avMissingDurationReadyCopyR138Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失时长就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失时长就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人姓名+联系方式+编号组合复制 */
  async function ensureHeirNameContactIdCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const id = String(it.id);
      const line = name + " · " + contact + " · #" + id;
      if (el.querySelector(".bn-copy-name-contact-id-r138")) return;
      el.dataset.nameContactId = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-name-contact-id-r138";
      btn.textContent = "复制姓名联系编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.nameContactId || "");
        softBanner(ok ? "已复制姓名联系编号" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+域名+章节数组合复制 */
  async function ensureHandoverProgressDomainSectionsCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressDomainSectionsCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressDomainSectionsCopyCard";
      card.className = "hand-progress-domain-sections-copy";
      const doneSec = $("#handDoneSectionsBrandCopyCard");
      const secBrand = $("#handSectionsBrandDomainCopyCard");
      const domainProg = $("#handDomainProgressDoneCopyCard");
      if (doneSec && doneSec.parentNode)
        doneSec.insertAdjacentElement("afterend", card);
      else if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else if (domainProg && domainProg.parentNode)
        domainProg.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      const pct =
        prog.pct != null
          ? String(Math.round(Number(prog.pct)))
          : data.progress_pct != null
            ? String(Math.round(Number(data.progress_pct)))
            : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const combo = pct + "% · " + domain + " · " + sectionsCount;
      const line = "手册进度 · 域名 · 章节 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-domain-sections-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressDomainSectionsCopyBtn">复制进度域名章节</button>`;
      const btn = $("#handProgressDomainSectionsCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度域名章节" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度域名章节暂不可用</p>`;
    }
  }

  /* 10 · 设置·就绪+版本+域名+英文品牌四元复制 + round 层含 138 */
  async function paintOkVersionDomainBrandEnR138CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsOkVersionDomainBrandEnR138CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsOkVersionDomainBrandEnR138CopyCard";
      card.className = "card settings-ok-version-domain-brand-en-r138-copy-card";
      const domVer = $("#settingsDomainVersionBrandEnBrandR137CopyCard");
      const verOk = $("#settingsVersionBrandEnBrandOkR136CopyCard");
      const brandEn = $("#settingsBrandEnBrandOkDomainR135CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domVer && domVer.parentNode)
        domVer.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = ready + " · " + ver + " · " + domain + " · " + en;
      card.innerHTML = `<h3>就绪 · 版本 · 域名 · 英文</h3>
        <p class="muted">一键复制就绪状态、版本、域名与英文品牌（演示级）。</p>
        <p class="settings-ok-version-domain-brand-en-r138-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsOkVersionDomainBrandEnR138CopyBtn">复制就绪版本域名英文</button>`;
      const btn = $("#settingsOkVersionDomainBrandEnR138CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制就绪版本域名英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>就绪 · 版本 · 域名 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList138() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 138;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 138); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round138 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 850);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryIdDeviceOwnerCopyButtons().catch(() => {}),
      680
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryVisibilityDisposeCopyButtons().catch(() => {}),
      680
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinStatusLabelLastAgoPlainR138Copy().catch(() => {}),
      670
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdProgressMetPlainR138Copy().catch(() => {}),
      690
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareServiceStatusCityCopyButtons().catch(() => {}),
      680
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingDurationReadyCopy().catch(() => {}),
      650
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirNameContactIdCopyButtons().catch(() => {}),
      680
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressDomainSectionsCopy().catch(() => {}),
      690
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 850);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryIdDeviceOwnerCopyButtons().catch(() => {}),
        700
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetCategoryVisibilityDisposeCopyButtons().catch(() => {}),
        690
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinStatusLabelLastAgoPlainR138Copy().catch(() => {}),
        690
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdProgressMetPlainR138Copy().catch(() => {}),
        710
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareServiceStatusCityCopyButtons().catch(() => {}),
        700
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingDurationReadyCopy().catch(() => {}),
        670
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirNameContactIdCopyButtons().catch(() => {}),
        690
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressDomainSectionsCopy().catch(() => {}),
        700
      );
    if (id === "settings") {
      setTimeout(() => {
        paintOkVersionDomainBrandEnR138CopyCard().catch(() => {});
        paintRoundLayerList138();
      }, 740);
      setTimeout(() => {
        paintOkVersionDomainBrandEnR138CopyCard().catch(() => {});
        paintRoundLayerList138();
      }, 1420);
    }
  };

  setTimeout(() => paintHomeOkBrandEnVersion().catch(() => {}), 900);
  setTimeout(
    () => ensureLegacyBeneficiaryIdDeviceOwnerCopyButtons().catch(() => {}),
    920
  );
  setTimeout(
    () => ensureAssetCategoryVisibilityDisposeCopyButtons().catch(() => {}),
    940
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinStatusLabelLastAgoPlainR138Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdProgressMetPlainR138Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareServiceStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingDurationReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirNameContactIdCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressDomainSectionsCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintOkVersionDomainBrandEnR138CopyCard().catch(() => {});
      paintRoundLayerList138();
    }, 760);
  }
})();
