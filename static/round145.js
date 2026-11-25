/* 电子继承 · 第一百四十五批增量（叠在 round144…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round145SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页域名+就绪+中文品牌冷静条 */
  async function paintHomeDomainOkBrand() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeDomainOkBrandCalmBarR145");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainOkBrandCalmBarR145";
      bar.className = "home-domain-ok-brand-calm-r145";
      bar.setAttribute("role", "status");
      const okBrand = $("#homeOkBrandVersionCalmBarR144");
      const brandVer = $("#homeBrandVersionBrandEnCalmBarR143");
      const enOk = $("#homeBrandEnOkDomainCalmBarR142");
      if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (brandVer && brandVer.parentNode === home)
        brandVer.insertAdjacentElement("afterend", bar);
      else if (enOk && enOk.parentNode === home)
        enOk.insertAdjacentElement("afterend", bar);
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
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const sub = domain + " · " + ready + " · " + brand;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-brand-calm-r145-mark">域名</span>
        <span class="muted home-domain-ok-brand-calm-r145-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkBrandCalmGoR145">去设置</button>`;
      const btn = $("#homeDomainOkBrandCalmGoR145");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-ok-brand-calm-r145-mark">域名</span>
        <span class="muted home-domain-ok-brand-calm-r145-sub">域名就绪品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainOkBrandCalmGoR145">去设置</button>`;
      const btn = $("#homeDomainOkBrandCalmGoR145");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+状态+标题组合复制 */
  async function ensureLegacyBeneficiaryStatusTitleCopyButtons() {
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
        String(it.beneficiary || it.device_owner || "").trim() || "未填受益人";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const title = String(it.title || it.category || "").trim() || "无标题";
      const line = beneficiary + " · " + status + " · " + title;
      el.dataset.beneficiaryStatusTitle = line;
      if (el.querySelector(".lg-copy-beneficiary-status-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-status-title";
      btn.textContent = "复制受益人状态标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryStatusTitle || "");
        softBanner(ok ? "已复制受益人状态标题" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘分类+处置说明+摘要组合复制 */
  async function ensureAssetCategoryDisposeSummaryCopyButtons() {
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
      const dispose =
        String(it.dispose_note || "").trim() || "未填处置";
      const summary =
        String(it.summary || it.account_hint || it.platform || "").trim() ||
        "无摘要";
      const line = category + " · " + dispose + " · " + summary;
      el.dataset.categoryDisposeSummary = line;
      if (el.querySelector(".as-copy-category-dispose-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-category-dispose-summary";
      btn.textContent = "复制分类处置摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.categoryDisposeSummary || "");
        softBanner(ok ? "已复制分类处置摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+窗口截止 */
  async function ensureCheckinLastAgoWindowEndsPlainR145Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoWindowEndsPlainR145CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoWindowEndsPlainR145CopyCard";
      card.className = "checkin-last-ago-window-ends-plain-r145-copy";
      const statusNext = $("#checkinStatusLabelNextAtPlainR144CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR143CopyCard");
      const lastStatus = $("#checkinLastAgoStatusLabelPlainR142CopyCard");
      if (statusNext && statusNext.parentNode)
        statusNext.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
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
      const lastAgo =
        String(
          st.last_ago_label ||
            cd.last_ago_label ||
            user.last_ago_label ||
            cd.last_checkin_ago ||
            ""
        ).trim() || "暂无距上次";
      const windowEnds =
        cd.window_ends_at != null
          ? String(cd.window_ends_at)
          : String(cd.window_ends_label || st.window_ends_at || "").trim() ||
            "—";
      const combo = lastAgo + " · " + windowEnds;
      const line =
        "报备距上次 · 窗口截止 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-window-ends-plain-r145-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoWindowEndsPlainR145CopyBtn">复制距上次窗口R145</button>`;
      const btn = $("#checkinLastAgoWindowEndsPlainR145CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次窗口R145" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次窗口文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+余额+短差三元复制 */
  async function ensureTravelDepositedBalanceShortfallPlainR145Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedBalanceShortfallPlainR145CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedBalanceShortfallPlainR145CopyCard";
      card.className = "travel-deposited-balance-shortfall-plain-r145-copy";
      const balMet = $("#travelBalanceMetThresholdPlainR144CopyCard");
      const shortThr = $("#travelShortfallThresholdProgressPlainR143CopyCard");
      const metDep = $("#travelMetDepositedProgressPlainR142CopyCard");
      if (balMet && balMet.parentNode)
        balMet.insertAdjacentElement("afterend", card);
      else if (shortThr && shortThr.parentNode)
        shortThr.insertAdjacentElement("afterend", card);
      else if (metDep && metDep.parentNode)
        metDep.insertAdjacentElement("afterend", card);
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
          ? "—"
          : String(Math.round(Number(fund.deposited)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = deposited + " · " + bal + " · " + shortfall;
      const line =
        "差旅已存 · 余额 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-balance-shortfall-plain-r145-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedBalanceShortfallPlainR145CopyBtn">复制已存余额短差</button>`;
      const btn = $("#travelDepositedBalanceShortfallPlainR145CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存余额短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存余额短差文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+编号+科室组合复制 */
  async function ensureAftercareHospitalIdDepartmentCopyButtons() {
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
      const hospital =
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const id = String(it.id);
      const department =
        String(it.department || it.dept || it.service_type || "").trim() ||
        "未填科室";
      const line = hospital + " · #" + id + " · " + department;
      el.dataset.hospitalIdDepartment = line;
      if (el.querySelector(".ac-copy-hospital-id-department")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-id-department";
      btn.textContent = "复制医院编号科室";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalIdDepartment || "");
        softBanner(ok ? "已复制医院编号科室" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+完成态+就绪组合复制 */
  async function ensureAuthMissingCompleteReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingCompleteReadyCopyR145Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingCompleteReadyCopyR145Card";
      card.className = "av-missing-complete-ready-copy-r145";
      const readyTitle = $("#avReadyTitleMissingCopyR144Card");
      const durComplete = $("#avDurationCompleteTitleCopyR143Card");
      const completeReady = $("#avCompleteReadyMissingCopyR142Card");
      if (readyTitle && readyTitle.parentNode)
        readyTitle.insertAdjacentElement("afterend", card);
      else if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const missing = Array.isArray(data.missing) ? data.missing : [];
      const missLabel =
        missing.length === 0
          ? "无缺失"
          : "缺失 " +
            missing.length +
            (data.missing_text
              ? " · " + String(data.missing_text).slice(0, 24)
              : "");
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const combo = missLabel + " · " + complete + " · " + ready;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-complete-ready-copy-r145-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingCompleteReadyCopyR145Btn">复制缺失完成就绪</button>`;
      const btn = $("#avMissingCompleteReadyCopyR145Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失完成就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失完成就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人编号+姓名+口令提示组合复制 */
  async function ensureHeirIdNamePassphraseCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const line = "#" + id + " · " + name + " · " + passphrase;
      if (el.querySelector(".bn-copy-id-name-passphrase-r145")) return;
      el.dataset.idNamePassphraseR145 = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-id-name-passphrase-r145";
      btn.textContent = "复制编号姓名口令";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idNamePassphraseR145 || "");
        softBanner(ok ? "已复制编号姓名口令" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册进度百分比+完成数+域名组合复制 */
  async function ensureHandoverPctDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handPctDoneDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handPctDoneDomainCopyCard";
      card.className = "hand-pct-done-domain-copy";
      const doneBrand = $("#handDoneBrandSectionsCopyCard");
      const domSec = $("#handDomainSectionsProgressCopyCard");
      const progBrand = $("#handProgressBrandDoneCopyCard");
      if (doneBrand && doneBrand.parentNode)
        doneBrand.insertAdjacentElement("afterend", card);
      else if (domSec && domSec.parentNode)
        domSec.insertAdjacentElement("afterend", card);
      else if (progBrand && progBrand.parentNode)
        progBrand.insertAdjacentElement("afterend", card);
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
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      const combo = pct + " · " + done + " · " + domain;
      const line = "手册进度 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-pct-done-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handPctDoneDomainCopyBtn">复制进度完成域名</button>`;
      const btn = $("#handPctDoneDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度完成域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+英文品牌+中文品牌四元复制 + round 层含 145 */
  async function paintDomainOkBrandEnBrandR145CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainOkBrandEnBrandR145CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainOkBrandEnBrandR145CopyCard";
      card.className = "card settings-domain-ok-brand-en-brand-r145-copy-card";
      const okBrand = $("#settingsOkBrandEnBrandVersionR144CopyCard");
      const brandVer = $("#settingsBrandVersionBrandEnDomainR143CopyCard");
      const enDom = $("#settingsBrandEnDomainOkVersionR142CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okBrand && okBrand.parentNode)
        okBrand.insertAdjacentElement("beforebegin", card);
      else if (brandVer && brandVer.parentNode)
        brandVer.insertAdjacentElement("beforebegin", card);
      else if (enDom && enDom.parentNode)
        enDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = domain + " · " + ready + " · " + en + " · " + brand;
      card.innerHTML = `<h3>域名 · 就绪 · 英文 · 品牌</h3>
        <p class="muted">一键复制域名、就绪状态、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-domain-ok-brand-en-brand-r145-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainOkBrandEnBrandR145CopyBtn">复制域名就绪英文品牌</button>`;
      const btn = $("#settingsDomainOkBrandEnBrandR145CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList145() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 145;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 145); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round145 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainOkBrand().catch(() => {}), 920);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryStatusTitleCopyButtons().catch(() => {}),
      750
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetCategoryDisposeSummaryCopyButtons().catch(() => {}),
      750
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoWindowEndsPlainR145Copy().catch(() => {}),
      740
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedBalanceShortfallPlainR145Copy().catch(() => {}),
      760
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareHospitalIdDepartmentCopyButtons().catch(() => {}),
      750
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
      720
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirIdNamePassphraseCopyButtons().catch(() => {}),
      750
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverPctDoneDomainCopy().catch(() => {}),
      760
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainOkBrand().catch(() => {}), 920);
    if (id === "legacy")
      setTimeout(
        () =>
          ensureLegacyBeneficiaryStatusTitleCopyButtons().catch(() => {}),
        770
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetCategoryDisposeSummaryCopyButtons().catch(() => {}),
        760
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoWindowEndsPlainR145Copy().catch(() => {}),
        760
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedBalanceShortfallPlainR145Copy().catch(() => {}),
        780
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareHospitalIdDepartmentCopyButtons().catch(() => {}),
        770
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingCompleteReadyCopy().catch(() => {}),
        740
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirIdNamePassphraseCopyButtons().catch(() => {}),
        760
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverPctDoneDomainCopy().catch(() => {}),
        770
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkBrandEnBrandR145CopyCard().catch(() => {});
        paintRoundLayerList145();
      }, 810);
      setTimeout(() => {
        paintDomainOkBrandEnBrandR145CopyCard().catch(() => {});
        paintRoundLayerList145();
      }, 1490);
    }
  };

  setTimeout(() => paintHomeDomainOkBrand().catch(() => {}), 970);
  setTimeout(
    () => ensureLegacyBeneficiaryStatusTitleCopyButtons().catch(() => {}),
    990
  );
  setTimeout(
    () => ensureAssetCategoryDisposeSummaryCopyButtons().catch(() => {}),
    1010
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoWindowEndsPlainR145Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedBalanceShortfallPlainR145Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalIdDepartmentCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingCompleteReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirIdNamePassphraseCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverPctDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkBrandEnBrandR145CopyCard().catch(() => {});
      paintRoundLayerList145();
    }, 830);
  }
})();
