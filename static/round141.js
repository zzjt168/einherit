/* 电子继承 · 第一百四十一批增量（叠在 round140…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round141SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页版本+中文品牌+就绪冷静条 */
  async function paintHomeVersionBrandOk() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeVersionBrandOkCalmBarR141");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeVersionBrandOkCalmBarR141";
      bar.className = "home-version-brand-ok-calm-r141";
      bar.setAttribute("role", "status");
      const okDom = $("#homeOkDomainBrandEnCalmBarR140");
      const brandDom = $("#homeBrandDomainVersionCalmBarR139");
      const okEn = $("#homeOkBrandEnVersionCalmBarR138");
      if (okDom && okDom.parentNode === home)
        okDom.insertAdjacentElement("afterend", bar);
      else if (brandDom && brandDom.parentNode === home)
        brandDom.insertAdjacentElement("afterend", bar);
      else if (okEn && okEn.parentNode === home)
        okEn.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.version || h.server_version || "—").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const sub = ver + " · " + brand + " · " + ready;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-ok-calm-r141-mark">版本</span>
        <span class="muted home-version-brand-ok-calm-r141-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandOkCalmGoR141">去设置</button>`;
      const btn = $("#homeVersionBrandOkCalmGoR141");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-version-brand-ok-calm-r141-mark">版本</span>
        <span class="muted home-version-brand-ok-calm-r141-sub">版本品牌就绪暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeVersionBrandOkCalmGoR141">去设置</button>`;
      const btn = $("#homeVersionBrandOkCalmGoR141");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割标题+设备归属+编号组合复制 */
  async function ensureLegacyTitleDeviceOwnerIdCopyButtons() {
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
      const title = String(it.title || "").trim() || "无标题";
      const owner =
        String(
          it.device_owner || it.beneficiary || it.dept || ""
        ).trim() || "未填归属";
      const id = String(it.id);
      const line = title + " · " + owner + " · #" + id;
      el.dataset.titleDeviceOwnerId = line;
      if (el.querySelector(".lg-copy-title-device-owner-id")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-title-device-owner-id";
      btn.textContent = "复制标题归属编号";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.titleDeviceOwnerId || "");
        softBanner(ok ? "已复制标题归属编号" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘处置说明+标签+标题组合复制 */
  async function ensureAssetDisposeTagTitleCopyButtons() {
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
      const dispose =
        String(it.dispose_note || "").trim() || "未填处置";
      const tag = String(it.tag || "").trim() || "无标签";
      const title =
        String(it.title || it.platform || "").trim() || "无标题";
      const line = dispose + " · " + tag + " · " + title;
      el.dataset.disposeTagTitle = line;
      if (el.querySelector(".as-copy-dispose-tag-title")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-dispose-tag-title";
      btn.textContent = "复制处置标签标题";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.disposeTagTitle || "");
        softBanner(ok ? "已复制处置标签标题" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制窗口截止+下次建议（HIT r141） */
  async function ensureCheckinWindowEndsNextAtPlainR141Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinWindowEndsNextAtPlainR141CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinWindowEndsNextAtPlainR141CopyCard";
      card.className = "checkin-window-ends-next-at-plain-r141-copy";
      const nextStatus = $("#checkinNextAtStatusLabelPlainR140CopyCard");
      const winAgo = $("#checkinWindowEndsLastAgoPlainR139CopyCard");
      const statusAgo = $("#checkinStatusLabelLastAgoPlainR138CopyCard");
      if (nextStatus && nextStatus.parentNode)
        nextStatus.insertAdjacentElement("afterend", card);
      else if (winAgo && winAgo.parentNode)
        winAgo.insertAdjacentElement("afterend", card);
      else if (statusAgo && statusAgo.parentNode)
        statusAgo.insertAdjacentElement("afterend", card);
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
          : user.checkin_due_at != null
            ? String(user.checkin_due_at)
            : user.checkin_hard_due_at != null
              ? String(user.checkin_hard_due_at)
              : "—";
      const nextAt =
        cd.next_suggested_at != null
          ? String(cd.next_suggested_at)
          : String(cd.next_suggested_label || "").trim() || "—";
      const combo = windowEnds + " · " + nextAt;
      const line =
        "窗口截止 · 下次建议 · " +
        combo +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-window-ends-next-at-plain-r141-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinWindowEndsNextAtPlainR141CopyBtn">复制窗口下次R141</button>`;
      const btn = $("#checkinWindowEndsNextAtPlainR141CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制窗口下次R141" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">窗口下次文案暂不可用</p>`;
    }
  }

  /* 5 · 差旅门槛+余额+已存三元复制 */
  async function ensureTravelThresholdBalanceDepositedPlainR141Copy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelThresholdBalanceDepositedPlainR141CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelThresholdBalanceDepositedPlainR141CopyCard";
      card.className = "travel-threshold-balance-deposited-plain-r141-copy";
      const balProg = $("#travelBalanceProgressShortfallPlainR140CopyCard");
      const depShort = $("#travelDepositedShortfallMetPlainR139CopyCard");
      const thrProg = $("#travelThresholdProgressMetPlainR138CopyCard");
      if (balProg && balProg.parentNode)
        balProg.insertAdjacentElement("afterend", card);
      else if (depShort && depShort.parentNode)
        depShort.insertAdjacentElement("afterend", card);
      else if (thrProg && thrProg.parentNode)
        thrProg.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const depositedRaw =
        fund.deposited != null ? fund.deposited : fund.balance;
      const deposited =
        depositedRaw == null
          ? "—"
          : String(Math.round(Number(depositedRaw)));
      const combo = thr + " · " + bal + " · " + deposited;
      const line =
        "差旅门槛 · 余额 · 已存 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-threshold-balance-deposited-plain-r141-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelThresholdBalanceDepositedPlainR141CopyBtn">复制门槛余额已存</button>`;
      const btn = $("#travelThresholdBalanceDepositedPlainR141CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制门槛余额已存" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">门槛余额已存文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+医院+服务类型组合复制 */
  async function ensureAftercareCityHospitalServiceCopyButtons() {
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
      const hospital =
        String(it.hospital || it.title || "").trim() || "未填医院";
      const service =
        String(it.service_type || it.service || "").trim() || "未填服务";
      const line = city + " · " + hospital + " · " + service;
      el.dataset.cityHospitalService = line;
      if (el.querySelector(".ac-copy-city-hospital-service")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-hospital-service";
      btn.textContent = "复制城市医院服务";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityHospitalService || "");
        softBanner(ok ? "已复制城市医院服务" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频标题+缺失项+时长提示组合复制 */
  async function ensureAuthTitleMissingDurationCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avTitleMissingDurationCopyR141Card");
    if (!card) {
      card = document.createElement("div");
      card.id = "avTitleMissingDurationCopyR141Card";
      card.className = "av-title-missing-duration-copy-r141";
      const readyDur = $("#avReadyDurationCompleteCopyR140Card");
      const completeMiss = $("#avCompleteMissingTitleCopyR139Card");
      const missDur = $("#avMissingDurationReadyCopyR138Card");
      if (readyDur && readyDur.parentNode)
        readyDur.insertAdjacentElement("afterend", card);
      else if (completeMiss && completeMiss.parentNode)
        completeMiss.insertAdjacentElement("afterend", card);
      else if (missDur && missDur.parentNode)
        missDur.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
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
      const combo = title + " · " + missLabel + " · " + duration;
      const line = "授权视频 · " + combo;
      card.innerHTML = `<p class="muted av-title-missing-duration-copy-r141-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avTitleMissingDurationCopyR141Btn">复制标题缺失时长</button>`;
      const btn = $("#avTitleMissingDurationCopyR141Btn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制标题缺失时长" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">标题缺失时长暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+联系方式+姓名组合复制 */
  async function ensureHeirPassphraseContactNameCopyButtons() {
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
      const name = String(it.name || "").trim() || "未填姓名";
      const line = passphrase + " · " + contact + " · " + name;
      if (el.querySelector(".bn-copy-passphrase-contact-name")) return;
      el.dataset.passphraseContactName = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-contact-name";
      btn.textContent = "复制口令联系姓名";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseContactName || "");
        softBanner(ok ? "已复制口令联系姓名" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册章节数+完成数+域名组合复制 */
  async function ensureHandoverSectionsDoneDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handSectionsDoneDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handSectionsDoneDomainCopyCard";
      card.className = "hand-sections-done-domain-copy";
      const doneDom = $("#handDoneDomainProgressCopyCard");
      const brandProg = $("#handBrandProgressSectionsCopyCard");
      const progDom = $("#handProgressDomainSectionsCopyCard");
      if (doneDom && doneDom.parentNode)
        doneDom.insertAdjacentElement("afterend", card);
      else if (brandProg && brandProg.parentNode)
        brandProg.insertAdjacentElement("afterend", card);
      else if (progDom && progDom.parentNode)
        progDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const prog = data.progress || {};
      let sectionsCount = "—";
      if (Array.isArray(data.sections)) sectionsCount = String(data.sections.length);
      else if (prog.total_types != null) sectionsCount = String(prog.total_types);
      else if (data.section_count != null) sectionsCount = String(data.section_count);
      const done =
        data.done != null
          ? String(data.done)
          : prog.filled_types != null
            ? String(prog.filled_types)
            : prog.done != null
              ? String(prog.done)
              : "—";
      const domain = String(data.domain || "").trim() || "无域名";
      const combo = sectionsCount + " · " + done + " · " + domain;
      const line = "手册章节 · 完成 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-sections-done-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handSectionsDoneDomainCopyBtn">复制章节完成域名</button>`;
      const btn = $("#handSectionsDoneDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制章节完成域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">章节完成域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·域名+中文品牌+版本+就绪四元复制 + round 层含 141 */
  async function paintDomainBrandVersionOkR141CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#settingsDomainBrandVersionOkR141CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "settingsDomainBrandVersionOkR141CopyCard";
      card.className = "card settings-domain-brand-version-ok-r141-copy-card";
      const verOk = $("#settingsVersionOkBrandBrandEnR140CopyCard");
      const brandOk = $("#settingsBrandBrandEnDomainOkR139CopyCard");
      const okVer = $("#settingsOkVersionDomainBrandEnR138CopyCard");
      const roundList = $("#roundLayerListCard");
      if (verOk && verOk.parentNode)
        verOk.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (okVer && okVer.parentNode)
        okVer.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const domain = String(h.domain || "einherit.cn").trim();
      const brand = String(h.brand || h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "—").trim();
      const ready = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = domain + " · " + brand + " · " + ver + " · " + ready;
      card.innerHTML = `<h3>域名 · 品牌 · 版本 · 就绪</h3>
        <p class="muted">一键复制域名、中文品牌、版本与就绪状态（演示级）。</p>
        <p class="settings-domain-brand-version-ok-r141-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="settingsDomainBrandVersionOkR141CopyBtn">复制域名品牌版本就绪</button>`;
      const btn = $("#settingsDomainBrandVersionOkR141CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制域名品牌版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>域名 · 品牌 · 版本 · 就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList141() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 141;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 141); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round141 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 880);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyTitleDeviceOwnerIdCopyButtons().catch(() => {}),
      710
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetDisposeTagTitleCopyButtons().catch(() => {}),
      710
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinWindowEndsNextAtPlainR141Copy().catch(() => {}),
      700
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () =>
        ensureTravelThresholdBalanceDepositedPlainR141Copy().catch(() => {}),
      720
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityHospitalServiceCopyButtons().catch(() => {}),
      710
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(
      () => ensureAuthTitleMissingDurationCopy().catch(() => {}),
      680
    );
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseContactNameCopyButtons().catch(() => {}),
      710
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverSectionsDoneDomainCopy().catch(() => {}),
      720
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 880);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyTitleDeviceOwnerIdCopyButtons().catch(() => {}),
        730
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetDisposeTagTitleCopyButtons().catch(() => {}),
        720
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinWindowEndsNextAtPlainR141Copy().catch(() => {}),
        720
      );
    if (id === "travel")
      setTimeout(
        () =>
          ensureTravelThresholdBalanceDepositedPlainR141Copy().catch(
            () => {}
          ),
        740
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityHospitalServiceCopyButtons().catch(() => {}),
        730
      );
    if (id === "authvideo")
      setTimeout(
        () => ensureAuthTitleMissingDurationCopy().catch(() => {}),
        700
      );
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseContactNameCopyButtons().catch(() => {}),
        720
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverSectionsDoneDomainCopy().catch(() => {}),
        730
      );
    if (id === "settings") {
      setTimeout(() => {
        paintDomainBrandVersionOkR141CopyCard().catch(() => {});
        paintRoundLayerList141();
      }, 770);
      setTimeout(() => {
        paintDomainBrandVersionOkR141CopyCard().catch(() => {});
        paintRoundLayerList141();
      }, 1450);
    }
  };

  setTimeout(() => paintHomeVersionBrandOk().catch(() => {}), 930);
  setTimeout(
    () => ensureLegacyTitleDeviceOwnerIdCopyButtons().catch(() => {}),
    950
  );
  setTimeout(
    () => ensureAssetDisposeTagTitleCopyButtons().catch(() => {}),
    970
  );
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinWindowEndsNextAtPlainR141Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelThresholdBalanceDepositedPlainR141Copy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityHospitalServiceCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthTitleMissingDurationCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseContactNameCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverSectionsDoneDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintDomainBrandVersionOkR141CopyCard().catch(() => {});
      paintRoundLayerList141();
    }, 790);
  }
})();
