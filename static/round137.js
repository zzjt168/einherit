/* 电子继承 · 第一百三十七批增量（叠在 round136…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round137SoftBanner_" + (hostId || "home");
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
    let bar = $("#homeDomainVersionBrandCalmBarR137");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeDomainVersionBrandCalmBarR137";
      bar.className = "home-domain-version-brand-calm-r137";
      bar.setAttribute("role", "status");
      const verEn = $("#homeVersionBrandEnOkCalmBarR136");
      const okBrand = $("#homeOkBrandDomainCalmBarR135");
      const brandEnVer = $("#homeBrandBrandEnVersionCalmBarR134");
      if (verEn && verEn.parentNode === home)
        verEn.insertAdjacentElement("afterend", bar);
      else if (okBrand && okBrand.parentNode === home)
        okBrand.insertAdjacentElement("afterend", bar);
      else if (brandEnVer && brandEnVer.parentNode === home)
        brandEnVer.insertAdjacentElement("afterend", bar);
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
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r137-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r137-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR137">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR137");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-domain-version-brand-calm-r137-mark">域名</span>
        <span class="muted home-domain-version-brand-calm-r137-sub">域名版本品牌暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeDomainVersionBrandCalmGoR137">去设置</button>`;
      const btn = $("#homeDomainVersionBrandCalmGoR137");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割设备归属+标题+状态组合复制 */
  async function ensureLegacyDeviceOwnerTitleStatusCopyButtons() {
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
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const title = String(it.title || "").trim() || "无标题";
      const status =
        String(it.status_label || it.status || it.status_key || "").trim() ||
        "未填状态";
      const line = owner + " · " + title + " · " + status;
      el.dataset.deviceOwnerTitleStatus = line;
      if (el.querySelector(".lg-copy-device-owner-title-status")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-device-owner-title-status";
      btn.textContent = "复制归属标题状态";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.deviceOwnerTitleStatus || "");
        softBanner(ok ? "已复制归属标题状态" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘平台+标题+标签组合复制 */
  async function ensureAssetPlatformTitleTagCopyButtons() {
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
      const platform = String(it.platform || "").trim() || "未填平台";
      const title = String(it.title || it.platform || "").trim() || "无标题";
      const tag = String(it.tag || "").trim() || "无标签";
      const line = platform + " · " + title + " · " + tag;
      el.dataset.platformTitleTag = line;
      if (el.querySelector(".as-copy-platform-title-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-platform-title-tag";
      btn.textContent = "复制平台标题标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.platformTitleTag || "");
        softBanner(ok ? "已复制平台标题标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制距上次标签+下次建议 */
  async function ensureCheckinLastAgoNextAtPlainR137Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoNextAtPlainR137CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoNextAtPlainR137CopyCard";
      card.className = "checkin-last-ago-next-at-plain-r137-copy";
      const statusWin = $("#checkinStatusLabelWindowEndsPlainR136CopyCard");
      const winNext = $("#checkinWindowEndsNextAtPlainR135CopyCard");
      const nextAgo = $("#checkinNextAtLastAgoPlainR134CopyCard");
      if (statusWin && statusWin.parentNode)
        statusWin.insertAdjacentElement("afterend", card);
      else if (winNext && winNext.parentNode)
        winNext.insertAdjacentElement("afterend", card);
      else if (nextAgo && nextAgo.parentNode)
        nextAgo.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const lastAgo =
        String(cd.last_ago_label || st.last_ago_label || "").trim() || "—";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = lastAgo + " · " + nextAt;
      const line =
        "距上次 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-next-at-plain-r137-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoNextAtPlainR137CopyBtn">复制距上次下次R137</button>`;
      const btn = $("#checkinLastAgoNextAtPlainR137CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制距上次下次R137" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">距上次下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅进度百分比+已存+余额三元复制 */
  async function ensureTravelProgressDepositedBalancePlainR137Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelProgressDepositedBalancePlainR137CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelProgressDepositedBalancePlainR137CopyCard";
      card.className = "travel-progress-deposited-balance-plain-r137-copy";
      const metShort = $("#travelMetShortfallThresholdPlainR136CopyCard");
      const shortBal = $("#travelShortfallBalanceDepositedPlainR135CopyCard");
      const balThr = $("#travelBalanceThresholdMetPlainR134CopyCard");
      if (metShort && metShort.parentNode)
        metShort.insertAdjacentElement("afterend", card);
      else if (shortBal && shortBal.parentNode)
        shortBal.insertAdjacentElement("afterend", card);
      else if (balThr && balThr.parentNode)
        balThr.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const pct =
        fund.progress_pct != null
          ? String(Math.round(Number(fund.progress_pct)))
          : fund.progress != null
            ? String(Math.round(Number(fund.progress)))
            : "—";
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const combo = pct + "% · " + deposited + " · " + bal;
      const line =
        "差旅进度 · 已存 · 余额 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-progress-deposited-balance-plain-r137-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelProgressDepositedBalancePlainR137CopyBtn">复制进度已存余额</button>`;
      const btn = $("#travelProgressDepositedBalancePlainR137CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度已存余额" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度已存余额文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+科室+医院组合复制 */
  async function ensureAftercareCityDepartmentHospitalCopyButtons() {
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
      const city = String(it.city || "").trim() || "未填城市";
      const department =
        String(
          it.department || it.service_type || it.service || ""
        ).trim() || "未填科室";
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const line = city + " · " + department + " · " + hospital;
      el.dataset.cityDepartmentHospital = line;
      if (el.querySelector(".ac-copy-city-department-hospital")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-department-hospital";
      btn.textContent = "复制城市科室医院";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityDepartmentHospital || "");
        softBanner(ok ? "已复制城市科室医院" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频标题+就绪+完成态组合复制 */
  async function ensureAuthTitleReadyCompleteCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avTitleReadyCompleteCopyR137Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avTitleReadyCompleteCopyR137Card";
      card.className = "av-title-ready-complete-copy-r137";
      const durMiss = $("#avDurationMissingCompleteCopyR136Card");
      const missReady = $("#avMissingReadyTitleCopyR135Card");
      const readyDur = $("#avReadyCompleteDurationCopyR134Card");
      if (durMiss && durMiss.parentNode)
        durMiss.insertAdjacentElement("afterend", card);
      else if (missReady && missReady.parentNode)
        missReady.insertAdjacentElement("afterend", card);
      else if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const latest = data.latest || {};
      const script0 = Array.isArray(data.script) ? data.script[0] : null;
      const title =
        String(
          data.title ||
            latest.original_name ||
            latest.active_label ||
            (script0 && script0.title) ||
            ""
        ).trim() || "授权视频";
      const ready = truthyFlag(data.ready) ? "就绪" : "未就绪";
      const complete = truthyFlag(data.complete) ? "已完成" : "未完成";
      const combo = title + " · " + ready + " · " + complete;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-title-ready-complete-copy-r137-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avTitleReadyCompleteCopyR137Btn">复制标题就绪完成</button>`;
      const btn = $("#avTitleReadyCompleteCopyR137Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制标题就绪完成" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">标题就绪完成暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+编号+关系组合复制 */
  async function ensureHeirPassphraseIdRelationCopyButtons() {
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
      const id = String(it.id);
      const relation = String(it.relation || "").trim() || "未填关系";
      const line = passphrase + " · #" + id + " · " + relation;
      if (el.querySelector(".bn-copy-passphrase-id-relation")) return;
      el.dataset.passphraseIdRelation = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-id-relation";
      btn.textContent = "复制口令编号关系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseIdRelation || "");
        softBanner(ok ? "已复制口令编号关系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册完成数+章节数+品牌组合复制 */
  async function ensureHandoverDoneSectionsBrandCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handDoneSectionsBrandCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handDoneSectionsBrandCopyCard";
      card.className = "hand-done-sections-brand-copy";
      const secBrand = $("#handSectionsBrandDomainCopyCard");
      const domainProg = $("#handDomainProgressDoneCopyCard");
      const brandDone = $("#handBrandDoneProgressCopyCard");
      if (secBrand && secBrand.parentNode)
        secBrand.insertAdjacentElement("afterend", card);
      else if (domainProg && domainProg.parentNode)
        domainProg.insertAdjacentElement("afterend", card);
      else if (brandDone && brandDone.parentNode)
        brandDone.insertAdjacentElement("afterend", card);
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
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const brand =
        String(data.brand || "").trim() || "电子继承 App";
      const combo = done + " · " + sectionsCount + " · " + brand;
      const line = "手册完成 · 章节 · 品牌 · " + combo;
      card.innerHTML = `<p class="muted hand-done-sections-brand-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handDoneSectionsBrandCopyBtn">复制完成章节品牌</button>`;
      const btn = $("#handDoneSectionsBrandCopyBtn");
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

  /* 10 · 设置·域名+版本+英文品牌+中文品牌四元复制 + round 层含 137 */
  async function paintDomainVersionBrandEnBrandR137CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainVersionBrandEnBrandR137CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainVersionBrandEnBrandR137CopyCard";
      card.className = "card settings-domain-version-brand-en-brand-r137-copy-card";
      const verOk = $("#settingsVersionBrandEnBrandOkR136CopyCard");
      const brandEn = $("#settingsBrandEnBrandOkDomainR135CopyCard");
      const brandOk = $("#settingsBrandOkDomainVersionR134CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
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
      const domain = String(h.domain || "einherit.cn").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const en = String(h.brand_en || "E-Inherit").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const line = domain + " · " + ver + " · " + en + " · " + brand;
      card.innerHTML = `<h3>域名 · 版本 · 英文 · 品牌</h3>
        <p class="muted">一键复制域名、版本、英文品牌与中文品牌（演示级）。</p>
        <p class="settings-domain-version-brand-en-brand-r137-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainVersionBrandEnBrandR137CopyBtn">复制域名版本英文品牌</button>`;
      const btn = $("#settingsDomainVersionBrandEnBrandR137CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名版本英文品牌" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 版本 · 英文 · 品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList137() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 137;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 137); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round137 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 840);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyDeviceOwnerTitleStatusCopyButtons().catch(() => {}),
      670
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetPlatformTitleTagCopyButtons().catch(() => {}),
      670
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinLastAgoNextAtPlainR137Copy().catch(() => {}),
      660
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelProgressDepositedBalancePlainR137Copy().catch(() => {}),
      680
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
      670
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthTitleReadyCompleteCopy().catch(() => {}),
      640
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseIdRelationCopyButtons().catch(() => {}),
      670
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverDoneSectionsBrandCopy().catch(() => {}),
      680
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 840);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyDeviceOwnerTitleStatusCopyButtons().catch(() => {}),
        690
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetPlatformTitleTagCopyButtons().catch(() => {}),
        680
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinLastAgoNextAtPlainR137Copy().catch(() => {}),
        680
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelProgressDepositedBalancePlainR137Copy().catch(() => {}),
        700
      );
    if (id === "aftercare")
      setTimeout(
        () =>
          ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {}),
        690
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthTitleReadyCompleteCopy().catch(() => {}),
        660
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseIdRelationCopyButtons().catch(() => {}),
        680
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverDoneSectionsBrandCopy().catch(() => {}),
        690
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainVersionBrandEnBrandR137CopyCard().catch(() => {});
        paintRoundLayerList137();
      }, 730);
      setTimeout(() => {
        paintDomainVersionBrandEnBrandR137CopyCard().catch(() => {});
        paintRoundLayerList137();
      }, 1410);
    }
  };

  setTimeout(() => paintHomeDomainVersionBrand().catch(() => {}), 890);
  setTimeout(
    () => ensureLegacyDeviceOwnerTitleStatusCopyButtons().catch(() => {}),
    910
  );
  setTimeout(
    () => ensureAssetPlatformTitleTagCopyButtons().catch(() => {}),
    930
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoNextAtPlainR137Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelProgressDepositedBalancePlainR137Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityDepartmentHospitalCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthTitleReadyCompleteCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseIdRelationCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverDoneSectionsBrandCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainVersionBrandEnBrandR137CopyCard().catch(() => {});
      paintRoundLayerList137();
    }, 750);
  }
})();
