/* 电子继承 · 第七十一批增量（叠在 round70…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round71SoftBanner_" + (hostId || "home");
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

  function visibilityLabel(raw) {
    const v = String(raw || "").toLowerCase();
    if (v === "family") return "家人可见";
    if (v === "private" || !v) return "仅自己可见";
    return String(raw);
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

  /* 1 · 首页报备手机号冷静条 */
  async function paintHomePhone() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homePhoneBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homePhoneBar";
      bar.className = "home-phone-bar";
      bar.setAttribute("role", "status");
      const brand = $("#homeBrandAppBar");
      const exec = $("#homeExecutorNameBar");
      const backup = $("#homeBackupCountBar");
      if (brand && brand.parentNode === home)
        brand.insertAdjacentElement("afterend", bar);
      else if (exec && exec.parentNode === home)
        exec.insertAdjacentElement("afterend", bar);
      else if (backup && backup.parentNode === home)
        backup.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const phone = String((st.user || {}).phone || "").trim() || "未填手机号";
      const sub = "手机 · " + phone;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-phone-mark">手机</span>
        <span class="muted home-phone-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homePhoneGo">去报备</button>`;
      const btn = $("#homePhoneGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-phone-mark">手机</span>
        <span class="muted home-phone-sub">手机号暂不可用</span>
        <button type="button" class="btn ghost sm" id="homePhoneGo">去报备</button>`;
      const btn = $("#homePhoneGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("checkin");
        };
      }
    }
  }

  /* 2 · 交割编号+标题+处置组合复制 */
  async function ensureLegacyIdTitleActionCopyButtons() {
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
      const title = String(it.title || "").trim() || "未填标题";
      const action = String(it.action || "").trim() || "未填处置";
      const line = "#" + it.id + " · " + title + " · " + action;
      el.dataset.idTitleAction = line;
      if (el.querySelector(".lg-copy-id-title-action")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-title-action";
      btn.textContent = "复制编号标题处置";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idTitleAction || "");
        softBanner(ok ? "已复制编号标题处置" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘标签+可见性组合复制 */
  async function ensureAssetTagVisCopyButtons() {
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
      const tag = String(it.tag || "").trim() || "无标签";
      const vis = visibilityLabel(it.visibility);
      const line = tag + " · " + vis;
      el.dataset.tagVis = line;
      if (el.querySelector(".as-copy-tag-vis")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-tag-vis";
      btn.textContent = "复制标签与可见性";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.tagVis || "");
        softBanner(ok ? "已复制标签与可见性" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制上次报备距今 */
  async function ensureCheckinLastAgoPlainCopy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinLastAgoPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinLastAgoPlainCopyCard";
      card.className = "checkin-last-ago-plain-copy";
      const phone = $("#checkinPhonePlainCopyCard");
      const softHard = $("#checkinSoftHardDueCopyCard");
      const backup = $("#checkinBackupCountCopyCard");
      if (phone && phone.parentNode)
        phone.insertAdjacentElement("afterend", card);
      else if (softHard && softHard.parentNode)
        softHard.insertAdjacentElement("afterend", card);
      else if (backup && backup.parentNode)
        backup.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const cd = st.countdown || {};
      const ago = String(cd.last_ago_label || "").trim();
      if (!ago) {
        card.innerHTML = `<p class="muted">上次报备距今暂不可用</p>`;
        return;
      }
      const line =
        "上次报备距今 · " +
        ago +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-last-ago-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinLastAgoPlainCopyBtn">复制上次报备距今</button>`;
      const btn = $("#checkinLastAgoPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(ago);
          softBanner(ok ? "已复制上次报备距今" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">上次报备距今暂不可用</p>`;
    }
  }

  /* 5 · 差旅短差与达标组合复制 */
  async function ensureTravelShortfallMetCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelShortfallMetCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelShortfallMetCopyCard";
      card.className = "travel-shortfall-met-copy";
      const aftercare = $("#travelHasAftercareAmountCopyCard");
      const refund = $("#travelRefundKindNoteCopyCard");
      const kindAmt = $("#travelLedgerKindAmountCopyCard");
      if (aftercare && aftercare.parentNode)
        aftercare.insertAdjacentElement("afterend", card);
      else if (refund && refund.parentNode)
        refund.insertAdjacentElement("afterend", card);
      else if (kindAmt && kindAmt.parentNode)
        kindAmt.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/travel-fund");
      const fund = data.fund || data;
      const shortfall = fund.shortfall;
      const met = truthyFlag(fund.met || fund.meets_threshold);
      if (shortfall == null && fund.met == null && fund.meets_threshold == null) {
        card.innerHTML = `<p class="muted">短差与达标暂不可用</p>`;
        return;
      }
      const shortPart =
        shortfall == null ? "—" : String(Math.round(Number(shortfall)));
      const metPart = met ? "已达标" : "未达标";
      const combo = shortPart + " · " + metPart;
      const line = "差旅短差 · 达标 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-shortfall-met-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelShortfallMetCopyBtn">复制短差与达标</button>`;
      const btn = $("#travelShortfallMetCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制短差与达标" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">短差与达标暂不可用</p>`;
    }
  }

  /* 6 · 善后编号+状态+城市组合复制 */
  async function ensureAftercareIdStatusCityCopyButtons() {
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
      const status =
        String(it.status_label || it.status || "").trim() || "未填状态";
      const city = String(it.city || "").trim() || "未填城市";
      const line = "#" + it.id + " · " + status + " · " + city;
      el.dataset.idStatusCity = line;
      if (el.querySelector(".ac-copy-id-status-city")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-id-status-city";
      btn.textContent = "复制编号状态城市";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idStatusCity || "");
        softBanner(ok ? "已复制编号状态城市" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频进度与缺失文案组合复制 */
  async function ensureAuthProgressMissingCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avProgressMissingCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avProgressMissingCopyCard";
      card.className = "av-progress-missing-copy";
      const active = $("#avActiveIdStatusCopyCard");
      const thresh = $("#avThresholdReadyCopyCard");
      const filename = $("#avFilenameStatusCopyCard");
      if (active && active.parentNode)
        active.insertAdjacentElement("afterend", card);
      else if (thresh && thresh.parentNode)
        thresh.insertAdjacentElement("afterend", card);
      else if (filename && filename.parentNode)
        filename.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const prog = data.progress || {};
      const done = prog.done;
      const total = prog.total;
      const missing = String(
        data.missing_text ||
          (Array.isArray(data.missing_labels)
            ? data.missing_labels.join("、")
            : "") ||
          ""
      ).trim();
      if (done == null && total == null && !missing) {
        card.innerHTML = `<p class="muted">进度与缺失暂不可用</p>`;
        return;
      }
      const progPart =
        done != null && total != null
          ? String(done) + "/" + String(total)
          : done != null
          ? String(done)
          : "—";
      const missPart = missing || "无缺失说明";
      const combo = progPart + " · " + missPart;
      const line = "授权视频进度 · 缺失 · " + combo;
      card.innerHTML = `<p class="muted av-progress-missing-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avProgressMissingCopyBtn">复制进度与缺失</button>`;
      const btn = $("#avProgressMissingCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制进度与缺失" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">进度与缺失暂不可用</p>`;
    }
  }

  /* 8 · 受益人口令提示+角色组合复制 */
  async function ensureHeirPassphraseRoleCopyButtons() {
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
      if (!it) return;
      const hint =
        String(it.passphrase_hint || "").trim() || "无口令提示";
      const role = String(it.role || "").trim() || "未填角色";
      const line = hint + " · " + role;
      if (el.querySelector(".bn-copy-passphrase-role")) return;
      el.dataset.passphraseRole = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-passphrase-role";
      btn.textContent = "复制口令与角色";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.passphraseRole || "");
        softBanner(ok ? "已复制口令与角色" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册品牌与域名组合复制 */
  async function ensureHandoverBrandDomainCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handBrandDomainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handBrandDomainCopyCard";
      card.className = "hand-brand-domain-copy";
      const itemDom = $("#handItemCountDomainCopyCard");
      const share = $("#handShareDomainCopyCard");
      const genDom = $("#handGeneratedDomainCopyCard");
      if (itemDom && itemDom.parentNode)
        itemDom.insertAdjacentElement("afterend", card);
      else if (share && share.parentNode)
        share.insertAdjacentElement("afterend", card);
      else if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const brand = String(data.brand || "").trim() || "E-Inherit";
      const domain = String(data.domain || "").trim();
      const combo = domain ? brand + " · " + domain : brand;
      const line = "手册品牌 · 域名 · " + combo;
      card.innerHTML = `<p class="muted hand-brand-domain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handBrandDomainCopyBtn">复制手册品牌与域名</button>`;
      const btn = $("#handBrandDomainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制手册品牌与域名" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">手册品牌与域名暂不可用</p>`;
    }
  }

  /* 10 · 设置·服务端版本+就绪组合复制 + round 层含 71 */
  async function paintServerVerOkCopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#serverVerOkR71CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "serverVerOkR71CopyCard";
      card.className = "card server-ver-ok-r71-copy-card";
      const brandTriple = $("#appBrandDomainEnR70CopyCard");
      const brandOk = $("#brandEnOkR69CopyCard");
      const verDom = $("#appVerDomainR68CopyCard");
      const roundList = $("#roundLayerListCard");
      if (brandTriple && brandTriple.parentNode)
        brandTriple.insertAdjacentElement("beforebegin", card);
      else if (brandOk && brandOk.parentNode)
        brandOk.insertAdjacentElement("beforebegin", card);
      else if (verDom && verDom.parentNode)
        verDom.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const ver = String(h.server_version || h.version || "").trim() || "—";
      const okPart = truthyFlag(h.ok) ? "就绪" : "未就绪";
      const line = ver + " · ok·" + okPart;
      card.innerHTML = `<h3>服务端版本与就绪</h3>
        <p class="muted">一键复制服务端版本与就绪状态（演示级）。</p>
        <p class="server-ver-ok-r71-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="serverVerOkR71CopyBtn">复制服务版本就绪</button>`;
      const btn = $("#serverVerOkR71CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制服务版本就绪" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>服务端版本与就绪</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList71() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 71;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 71); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round71 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomePhone().catch(() => {}), 540);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdTitleActionCopyButtons().catch(() => {}),
      370
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(() => ensureAssetTagVisCopyButtons().catch(() => {}), 370);
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(() => ensureCheckinLastAgoPlainCopy().catch(() => {}), 360);
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(() => ensureTravelShortfallMetCopy().catch(() => {}), 380);
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareIdStatusCityCopyButtons().catch(() => {}),
      370
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthProgressMissingCopy().catch(() => {}), 340);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirPassphraseRoleCopyButtons().catch(() => {}),
      370
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(() => ensureHandoverBrandDomainCopy().catch(() => {}), 380);
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomePhone().catch(() => {}), 540);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdTitleActionCopyButtons().catch(() => {}),
        390
      );
    if (id === "assets")
      setTimeout(() => ensureAssetTagVisCopyButtons().catch(() => {}), 380);
    if (id === "checkin")
      setTimeout(() => ensureCheckinLastAgoPlainCopy().catch(() => {}), 380);
    if (id === "travel")
      setTimeout(() => ensureTravelShortfallMetCopy().catch(() => {}), 400);
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareIdStatusCityCopyButtons().catch(() => {}),
        390
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthProgressMissingCopy().catch(() => {}), 360);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirPassphraseRoleCopyButtons().catch(() => {}),
        380
      );
    if (id === "handover")
      setTimeout(() => ensureHandoverBrandDomainCopy().catch(() => {}), 390);
    if (id === "settings") {
      setTimeout(() => {
        paintServerVerOkCopyCard().catch(() => {});
        paintRoundLayerList71();
      }, 430);
      setTimeout(() => {
        paintServerVerOkCopyCard().catch(() => {});
        paintRoundLayerList71();
      }, 1010);
    }
  };

  setTimeout(() => paintHomePhone().catch(() => {}), 590);
  setTimeout(() => ensureLegacyIdTitleActionCopyButtons().catch(() => {}), 610);
  setTimeout(() => ensureAssetTagVisCopyButtons().catch(() => {}), 630);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinLastAgoPlainCopy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelShortfallMetCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareIdStatusCityCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthProgressMissingCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirPassphraseRoleCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverBrandDomainCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintServerVerOkCopyCard().catch(() => {});
      paintRoundLayerList71();
    }, 450);
  }
})();
