/* 电子继承 · 第一百四十二批增量（叠在 round141…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round142SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页英文品牌+就绪+域名冷静条 */
  async function paintHomeBrandEnOkDomain() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandEnOkDomainCalmBarR142");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandEnOkDomainCalmBarR142";
      bar.className = "home-brand-en-ok-domain-calm-r142";
      bar.setAttribute("role", "status");
      const verBrand = $("#homeVersionBrandOkCalmBarR141");
      const okDom = $("#homeOkDomainBrandEnCalmBarR140");
      const brandDom = $("#homeBrandDomainVersionCalmBarR139");
      if (verBrand && verBrand.parentNode === home)
        verBrand.insertAdjacentElement("afterend", bar);
      else if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
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
      const en = String(h.brand_en || "E-Inherit").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const domain = String(h.domain || "einherit.cn").trim();
      const sub = en + " · " + ready + " · " + domain;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-r142-mark">英文</span>
        <span class="muted home-brand-en-ok-domain-calm-r142-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGoR142">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGoR142");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-en-ok-domain-calm-r142-mark">英文</span>
        <span class="muted home-brand-en-ok-domain-calm-r142-sub">英文就绪域名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandEnOkDomainCalmGoR142">去设置</button>`;
      const btn = $("#homeBrandEnOkDomainCalmGoR142");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割状态+受益人+设备归属组合复制 */
  async function ensureLegacyStatusBeneficiaryDeviceOwnerCopyButtons() {
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
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const bene = String(it.beneficiary || "").trim() || "未填受益人";
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const line = status + " · " + bene + " · " + owner;
      el.dataset.statusBeneficiaryDeviceOwner = line;
      if (el.querySelector(".lg-copy-status-beneficiary-device-owner")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-status-beneficiary-device-owner";
      btn.textContent = "复制状态受益人归属";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.statusBeneficiaryDeviceOwner || "");
        softBanner(ok ? "已复制状态受益人归属" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘可见性+分类+平台组合复制 */
  async function ensureAssetVisibilityCategoryPlatformCopyButtons() {
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
        String(it.visibility || "").trim() || "未填可见性";
      const category =
        String(it.category || it.tag || "").trim() || "未填分类";
      const platform = String(it.platform || "").trim() || "未填平台";
      const line = visibility + " · " + category + " · " + platform;
      el.dataset.visibilityCategoryPlatform = line;
      if (el.querySelector(".as-copy-visibility-category-platform")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-visibility-category-platform";
      btn.textContent = "复制可见分类平台";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.visibilityCategoryPlatform || "");
        softBanner(ok ? "已复制可见分类平台" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+状态标签 */
  async function ensureCheckinLastAgoStatusLabelPlainR142Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoStatusLabelPlainR142CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoStatusLabelPlainR142CopyCard";
      card.className = "checkin-last-ago-status-label-plain-r142-copy";
      const winNext = $("#checkinWindowEndsNextAtPlainR141CopyCard");
      const nextStatus = $("#checkinNextAtStatusLabelPlainR140CopyCard");
      const winAgo = $("#checkinWindowEndsLastAgoPlainR139CopyCard");
      if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (winAgo && winAgo.parentNode)
        winAgo.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(cd.last_ago_label || st.last_ago_label || "").trim() || "—";
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const combo = lastAgo + " · " + statusLabel;
      const line =
        "距上次 · 报备状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-status-label-plain-r142-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoStatusLabelPlainR142CopyBtn">复制距上次状态R142</button>`;
      const btn = $("#checkinLastAgoStatusLabelPlainR142CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次状态R142" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅达标+已存+进度百分比三元复制 */
  async function ensureTravelMetDepositedProgressPlainR142Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelMetDepositedProgressPlainR142CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelMetDepositedProgressPlainR142CopyCard";
      card.className = "travel-met-deposited-progress-plain-r142-copy";
      const thrBal = $("#travelThresholdBalanceDepositedPlainR141CopyCard");
      const balProg = $("#travelBalanceProgressShortfallPlainR140CopyCard");
      const depShort = $("#travelDepositedShortfallMetPlainR139CopyCard");
      if (thrBal && thrBal.parentNode)
        thrBal.insertAdjacentElement("afterend", card);
      else if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
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
      const met = truthyFlag(fund.met) ? "已达标" : "未达标";
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const pct =
        fund.progress_pct != null
          ? String(Math.round(Number(fund.progress_pct)))
          : fund.progress != null
            ? String(Math.round(Number(fund.progress)))
            : "—";
      const combo = met + " · " + deposited + " · " + pct + "%";
      const line =
        "差旅达标 · 已存 · 进度 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-met-deposited-progress-plain-r142-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelMetDepositedProgressPlainR142CopyBtn">复制达标已存进度</button>`;
      const btn = $("#travelMetDepositedProgressPlainR142CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制达标已存进度" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">达标已存进度文案暂不可用</p>`;
    }
  }

  /* 6 · 善后科室+城市+编号组合复制 */
  async function ensureAftercareDepartmentCityIdCopyButtons() {
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
      if (!it || it.id == null) return;
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const city = String(it.city || "").trim() || "未填城市";
      const id = String(it.id);
      const line = department + " · " + city + " · #" + id;
      el.dataset.departmentCityId = line;
      if (el.querySelector(".ac-copy-department-city-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-department-city-id";
      btn.textContent = "复制科室城市编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.departmentCityId || "");
        softBanner(ok ? "已复制科室城市编号" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频完成态+就绪+缺失项组合复制 */
  async function ensureAuthCompleteReadyMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avCompleteReadyMissingCopyR142Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avCompleteReadyMissingCopyR142Card";
      card.className = "av-complete-ready-missing-copy-r142";
      const titleMiss = $("#avTitleMissingDurationCopyR141Card");
      const readyDur = $("#avReadyDurationCompleteCopyR140Card");
      const completeMiss = $("#avCompleteMissingTitleCopyR139Card");
      if (titleMiss && titleMiss.parentNode)
        titleMiss.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
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
      card.innerHTML = `<p class="muted av-complete-ready-missing-copy-r142-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avCompleteReadyMissingCopyR142Btn">复制完成就绪缺失</button>`;
      const btn = $("#avCompleteReadyMissingCopyR142Btn");
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

  /* 8 · 受益人联系方式+编号+关系组合复制 */
  async function ensureHeirContactIdRelationCopyButtons() {
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
      const contact = String(it.contact || "").trim() || "未填联系";
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = contact + " · #" + id + " · " + relation;
      if (el.querySelector(".bn-copy-contact-id-relation")) return;
      el.dataset.contactIdRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-contact-id-relation";
      btn.textContent = "复制联系编号关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.contactIdRelation || "");
        softBanner(ok ? "已复制联系编号关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+品牌+完成数组合复制 */
  async function ensureHandoverProgressBrandDoneCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handProgressBrandDoneCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handProgressBrandDoneCopyCard";
      card.className = "hand-progress-brand-done-copy";
      const secDone = $("#handSectionsDoneDomainCopyCard");
      const doneDom = $("#handDoneDomainProgressCopyCard");
      const brandProg = $("#handBrandProgressSectionsCopyCard");
      if (secDone && secDone.parentNode)
        secDone.insertAdjacentElement("afterend", card);
      else if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
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
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const combo = pct + "% · " + brand + " · " + done;
      const line = "手册进度 · 品牌 · 完成 · " + combo;
      card.innerHTML = `<p class="muted hand-progress-brand-done-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handProgressBrandDoneCopyBtn">复制进度品牌完成</button>`;
      const btn = $("#handProgressBrandDoneCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度品牌完成" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度品牌完成暂不可用</p>`;
    }
  }

  /* 10 · 设置·英文品牌+域名+就绪+版本四元复制 + round 层含 142 */
  async function paintBrandEnDomainOkVersionR142CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsBrandEnDomainOkVersionR142CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsBrandEnDomainOkVersionR142CopyCard";
      card.className = "card settings-brand-en-domain-ok-version-r142-copy-card";
      const domBrand = $("#settingsDomainBrandVersionOkR141CopyCard");
      const verOk = $("#settingsVersionOkBrandBrandEnR140CopyCard");
      const brandOk = $("#settingsBrandBrandEnDomainOkR139CopyCard");
      const roundList = $("#roundLayerListCard");
      if (domBrand && domBrand.parentNode)
        domBrand.insertAdjacentElement("beforebegin", card);
      else if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const en = String(h.brand_en || "E-Inherit").trim();
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const line = en + " · " + domain + " · " + ready + " · " + ver;
      card.innerHTML = `<h3>英文 · 域名 · 就绪 · 版本</h3>
        <p class="muted">一键复制英文品牌、域名、就绪状态与版本（演示级）。</p>
        <p class="settings-brand-en-domain-ok-version-r142-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsBrandEnDomainOkVersionR142CopyBtn">复制英文域名就绪版本</button>`;
      const btn = $("#settingsBrandEnDomainOkVersionR142CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制英文域名就绪版本" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>英文 · 域名 · 就绪 · 版本</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList142() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 142;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 142); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round142 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 890);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () =>
        ensureLegacyStatusBeneficiaryDeviceOwnerCopyButtons().catch(() => {}),
      720
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () =>
        ensureAssetVisibilityCategoryPlatformCopyButtons().catch(() => {}),
      720
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoStatusLabelPlainR142Copy().catch(() => {}),
      710
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelMetDepositedProgressPlainR142Copy().catch(() => {}),
      730
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareDepartmentCityIdCopyButtons().catch(() => {}),
      720
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
      690
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirContactIdRelationCopyButtons().catch(() => {}),
      720
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverProgressBrandDoneCopy().catch(() => {}),
      730
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 890);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyStatusBeneficiaryDeviceOwnerCopyButtons().catch(
            () => {}
          ),
        740
      );
    if (id === "assets")
      setTimeout(
        () =>
          ensureAssetVisibilityCategoryPlatformCopyButtons().catch(() => {}),
        730
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoStatusLabelPlainR142Copy().catch(() => {}),
        730
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelMetDepositedProgressPlainR142Copy().catch(() => {}),
        750
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareDepartmentCityIdCopyButtons().catch(() => {}),
        740
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthCompleteReadyMissingCopy().catch(() => {}),
        710
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirContactIdRelationCopyButtons().catch(() => {}),
        730
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverProgressBrandDoneCopy().catch(() => {}),
        740
      );
    if (id === "settings") {
      setTimeout(() => {
        paintBrandEnDomainOkVersionR142CopyCard().catch(() => {});
        paintRoundLayerList142();
      }, 780);
      setTimeout(() => {
        paintBrandEnDomainOkVersionR142CopyCard().catch(() => {});
        paintRoundLayerList142();
      }, 1460);
    }
  };

  setTimeout(() => paintHomeBrandEnOkDomain().catch(() => {}), 940);
  setTimeout(
    () =>
      ensureLegacyStatusBeneficiaryDeviceOwnerCopyButtons().catch(() => {}),
    960
  );
  setTimeout(
    () =>
      ensureAssetVisibilityCategoryPlatformCopyButtons().catch(() => {}),
    980
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoStatusLabelPlainR142Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelMetDepositedProgressPlainR142Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareDepartmentCityIdCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthCompleteReadyMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirContactIdRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverProgressBrandDoneCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintBrandEnDomainOkVersionR142CopyCard().catch(() => {});
      paintRoundLayerList142();
    }, 800);
  }
})();
