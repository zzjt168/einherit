/* 电子继承 · 第一百五十一批增量（叠在 round150…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round151SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页中文品牌+域名+就绪冷静条 */
  async function paintHomeBrandDomainOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeBrandDomainOkCalmBarR151");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeBrandDomainOkCalmBarR151";
      bar.className = "home-brand-domain-ok-calm-r151";
      bar.setAttribute("role", "status");
      const okVer = $("#homeOkVersionBrandEnCalmBarR150");
      const enBrand = $("#homeBrandEnBrandVersionCalmBarR149");
      const verDom = $("#homeVersionDomainOkCalmBarR148");
      if (okVer && okVer.parentNode === home)
        okVer.insertAdjacentElement("afterend", bar);
      else if (enBrand && enBrand.parentNode === home)
        enBrand.insertAdjacentElement("afterend", bar);
      else if (verDom && verDom.parentNode === home)
        verDom.insertAdjacentElement("afterend", bar);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = brand + " · " + domain + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-ok-calm-r151-mark">品牌</span>
        <span class="muted home-brand-domain-ok-calm-r151-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainOkCalmGoR151">去设置</button>`;
      const btn = $("#homeBrandDomainOkCalmGoR151");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-brand-domain-ok-calm-r151-mark">品牌</span>
        <span class="muted home-brand-domain-ok-calm-r151-sub">品牌域名就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeBrandDomainOkCalmGoR151">去设置</button>`;
      const btn = $("#homeBrandDomainOkCalmGoR151");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割受益人+标题+编号组合复制 */
  async function ensureLegacyBeneficiaryTitleIdCopyButtons() {
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
      const beneficiary =
        String(it.beneficiary || it.device_owner || "").trim() || "未填受益人";
      const title =
        String(it.title || it.category || "").trim() || "无标题";
      const id = String(it.id);
      const line = beneficiary + " · " + title + " · #" + id;
      el.dataset.beneficiaryTitleId = line;
      if (el.querySelector(".lg-copy-beneficiary-title-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-beneficiary-title-id";
      btn.textContent = "复制受益人标题编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.beneficiaryTitleId || "");
        softBanner(ok ? "已复制受益人标题编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+分类+摘要组合复制 */
  async function ensureAssetPlatformCategorySummaryCopyButtons() {
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
      const platform =
        String(it.platform || it.title || "").trim() || "未填平台";
      const category =
        String(it.category || it.tag || it.dept || "").trim() || "未填分类";
      const summary =
        String(it.summary || it.account_hint || "").trim() || "无摘要";
      const line = platform + " · " + category + " · " + summary;
      el.dataset.platformCategorySummary = line;
      if (el.querySelector(".as-copy-platform-category-summary")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-category-summary";
      btn.textContent = "复制平台分类摘要";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformCategorySummary || "");
        softBanner(ok ? "已复制平台分类摘要" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制下次建议+状态标签 */
  async function ensureCheckinNextAtStatusLabelPlainR151Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinNextAtStatusLabelPlainR151CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinNextAtStatusLabelPlainR151CopyCard";
      card.className = "checkin-next-at-status-label-plain-r151-copy";
      const statusLast = $("#checkinStatusLabelLastAgoPlainR150CopyCard");
      const nextWin = $("#checkinNextAtWindowEndsPlainR149CopyCard");
      const winStatus = $("#checkinWindowEndsStatusLabelPlainR148CopyCard");
      if (statusLast && statusLast.parentNode)
        statusLast.insertAdjacentElement("afterend", card);
      else if (nextWin && nextWin.parentNode)
        nextWin.insertAdjacentElement("afterend", card);
      else if (winStatus && winStatus.parentNode)
        winStatus.insertAdjacentElement("afterend", card);
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
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const statusLabel =
        String(
          st.status_label ||
            cd.status_label ||
            user.status_label ||
            st.status ||
            ""
        ).trim() || "未标注";
      const combo = nextAt + " · " + statusLabel;
      const line =
        "报备下次建议 · 状态 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-next-at-status-label-plain-r151-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinNextAtStatusLabelPlainR151CopyBtn">复制下次状态R151</button>`;
      const btn = $("#checkinNextAtStatusLabelPlainR151CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制下次状态R151" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">下次状态文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅已存+门槛+短差三元复制 */
  async function ensureTravelDepositedThresholdShortfallPlainR151Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelDepositedThresholdShortfallPlainR151CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelDepositedThresholdShortfallPlainR151CopyCard";
      card.className = "travel-deposited-threshold-shortfall-plain-r151-copy";
      const thrProg = $("#travelThresholdProgressBalancePlainR150CopyCard");
      const balShort = $("#travelBalanceShortfallDepositedPlainR149CopyCard");
      const progDep = $("#travelProgressDepositedThresholdPlainR148CopyCard");
      if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
      else if (balShort && balShort.parentNode)
        balShort.insertAdjacentElement("afterend", card);
      else if (progDep && progDep.parentNode)
        progDep.insertAdjacentElement("afterend", card);
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
      const thr =
        fund.threshold == null
          ? "—"
          : String(Math.round(Number(fund.threshold)));
      const shortfall =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = deposited + " · " + thr + " · " + shortfall;
      const line =
        "差旅已存 · 门槛 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-deposited-threshold-shortfall-plain-r151-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelDepositedThresholdShortfallPlainR151CopyBtn">复制已存门槛短差</button>`;
      const btn = $("#travelDepositedThresholdShortfallPlainR151CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制已存门槛短差" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">已存门槛短差文案暂不可用</p>`;
    }
  }

  /* 6 · 善后医院+状态+服务类型组合复制 */
  async function ensureAftercareHospitalStatusServiceCopyButtons() {
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
        String(it.hospital || it.facility || it.city || "").trim() ||
        "未填医院";
      const status =
        String(it.status_label || it.status || it.status_key || it.title || "").trim() ||
        "未填状态";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = hospital + " · " + status + " · " + service;
      el.dataset.hospitalStatusService = line;
      if (el.querySelector(".ac-copy-hospital-status-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-hospital-status-service";
      btn.textContent = "复制医院状态服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.hospitalStatusService || "");
        softBanner(ok ? "已复制医院状态服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频缺失项+时长提示+完成态组合复制 */
  async function ensureAuthMissingDurationCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avMissingDurationCompleteCopyR151Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avMissingDurationCompleteCopyR151Card";
      card.className = "av-missing-duration-complete-copy-r151";
      const durComplete = $("#avDurationCompleteReadyCopyR150Card");
      const completeReady = $("#avCompleteReadyMissingCopyR149Card");
      const readyMiss = $("#avReadyMissingDurationCopyR148Card");
      if (durComplete && durComplete.parentNode)
        durComplete.insertAdjacentElement("afterend", card);
      else if (completeReady && completeReady.parentNode)
        completeReady.insertAdjacentElement("afterend", card);
      else if (readyMiss && readyMiss.parentNode)
        readyMiss.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
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
            latest.duration_hint ||
            data.duration ||
            latest.duration ||
            ""
        ).trim() || "未填时长";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = missLabel + " · " + duration + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-missing-duration-complete-copy-r151-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avMissingDurationCompleteCopyR151Btn">复制缺失时长完成</button>`;
      const btn = $("#avMissingDurationCompleteCopyR151Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制缺失时长完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">缺失时长完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+联系方式+关系组合复制 */
  async function ensureHeirPassphraseContactRelationCopyButtons() {
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
      const passphrase =
        String(it.passphrase_hint || "").trim() || "未填口令提示";
      const contact = String(it.contact || "").trim() || "未填联系";
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = passphrase + " · " + contact + " · " + relation;
      if (el.querySelector(".bn-copy-passphrase-contact-relation")) return;
      el.dataset.passphraseContactRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-contact-relation";
      btn.textContent = "复制口令联系关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseContactRelation || "");
        softBanner(ok ? "已复制口令联系关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+品牌+域名组合复制 */
  async function ensureHandoverDoneBrandDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneBrandDomainCopyCard";
      card.className = "hand-done-brand-domain-copy";
      const domainPct = $("#handDomainPctBrandCopyCard");
      const pctDone = $("#handPctDoneSectionsCopyCard");
      const brandDom = $("#handBrandDomainSectionsCopyR148Card");
      if (domainPct && domainPct.parentNode)
        domainPct.insertAdjacentElement("afterend", card);
      else if (pctDone && pctDone.parentNode)
        pctDone.insertAdjacentElement("afterend", card);
      else if (brandDom && brandDom.parentNode)
        brandDom.insertAdjacentElement("afterend", card);
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
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const domain =
        String(data.domain || "").trim() || "einherit.cn";
      const combo = done + " · " + brand + " · " + domain;
      const line = "手册完成 · 品牌 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-done-brand-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneBrandDomainCopyBtn">复制完成品牌域名</button>`;
      const btn = $("#handDoneBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制完成品牌域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">完成品牌域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+就绪+版本+英文品牌四元复制 + round 层含 151 */
  async function paintDomainOkVersionBrandEnR151CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainOkVersionBrandEnR151CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainOkVersionBrandEnR151CopyCard";
      card.className = "card settings-domain-ok-version-brand-en-r151-copy-card";
      const okVer = $("#settingsOkVersionBrandEnBrandR150CopyCard");
      const brandEn = $("#settingsBrandBrandEnOkDomainR149CopyCard");
      const verDom = $("#settingsVersionDomainOkBrandR148CopyCard");
      const roundList = $("#roundLayerListCard");
      if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (brandEn && brandEn.parentNode)
        brandEn.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = domain + " · " + ready + " · " + ver + " · " + en;
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 英文</h3>
        <p class="muted">一键复制域名、就绪状态、版本与英文品牌（演示级）。</p>
        <p class="settings-domain-ok-version-brand-en-r151-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainOkVersionBrandEnR151CopyBtn">复制域名就绪版本英文</button>`;
      const btn = $("#settingsDomainOkVersionBrandEnR151CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名就绪版本英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 就绪 · 版本 · 英文</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList151() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 151;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 151); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round151 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeBrandDomainOk().catch(() => {}), 980);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyBeneficiaryTitleIdCopyButtons().catch(() => {}),
      810
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformCategorySummaryCopyButtons().catch(() => {}),
      810
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinNextAtStatusLabelPlainR151Copy().catch(() => {}),
      800
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelDepositedThresholdShortfallPlainR151Copy().catch(
          () => {}
        ),
      820
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareHospitalStatusServiceCopyButtons().catch(() => {}),
      810
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthMissingDurationCompleteCopy().catch(() => {}),
      780
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseContactRelationCopyButtons().catch(() => {}),
      810
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneBrandDomainCopy().catch(() => {}),
      820
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeBrandDomainOk().catch(() => {}), 980);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyBeneficiaryTitleIdCopyButtons().catch(() => {}),
        830
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformCategorySummaryCopyButtons().catch(() => {}),
        820
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinNextAtStatusLabelPlainR151Copy().catch(() => {}),
        820
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelDepositedThresholdShortfallPlainR151Copy().catch(
            () => {}
          ),
        840
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareHospitalStatusServiceCopyButtons().catch(() => {}),
        830
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthMissingDurationCompleteCopy().catch(() => {}),
        800
      );
    if (id === "heirs")
      setTimeout(
        () =>
          ensureHeirPassphraseContactRelationCopyButtons().catch(() => {}),
        820
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneBrandDomainCopy().catch(() => {}),
        830
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainOkVersionBrandEnR151CopyCard().catch(() => {});
        paintRoundLayerList151();
      }, 870);
      setTimeout(() => {
        paintDomainOkVersionBrandEnR151CopyCard().catch(() => {});
        paintRoundLayerList151();
      }, 1550);
    }
  };

  setTimeout(() => paintHomeBrandDomainOk().catch(() => {}), 1030);
  setTimeout(
    () => ensureLegacyBeneficiaryTitleIdCopyButtons().catch(() => {}),
    1050
  );
  setTimeout(
    () => ensureAssetPlatformCategorySummaryCopyButtons().catch(() => {}),
    1070
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinNextAtStatusLabelPlainR151Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelDepositedThresholdShortfallPlainR151Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareHospitalStatusServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthMissingDurationCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseContactRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneBrandDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainOkVersionBrandEnR151CopyCard().catch(() => {});
      paintRoundLayerList151();
    }, 890);
  }
})();
