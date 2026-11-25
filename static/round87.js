/* 电子继承 · 第八十七批增量（叠在 round86…6 / 稳定 app.js 上，不改报备/退款状态机） */
(function () {
  function softBanner(msg, hostId, actions) {
    const host =
      (hostId && document.getElementById(hostId)) || document.getElementById("home");
    if (!host) return null;
    const eid = "round87SoftBanner_" + (hostId || "home");
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

  /* 1 · 首页应用名冷静条 */
  async function paintHomeAppNameCalm() {
    const home = $("#home");
    if (!home) return;
    let bar = $("#homeAppNameCalmBar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "homeAppNameCalmBar";
      bar.className = "home-app-name-calm-bar";
      bar.setAttribute("role", "status");
      const appOk = $("#homeAppOkCalmBar");
      const server = $("#homeServerVersionCalmBar");
      const ok = $("#homeOkStatusBar");
      if (appOk && appOk.parentNode === home)
        appOk.insertAdjacentElement("afterend", bar);
      else if (server && server.parentNode === home)
        server.insertAdjacentElement("afterend", bar);
      else if (ok && ok.parentNode === home)
        ok.insertAdjacentElement("afterend", bar);
      else {
        const todos = $("#todayTodos");
        if (todos && todos.parentNode === home)
          todos.insertAdjacentElement("beforebegin", bar);
        else home.appendChild(bar);
      }
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const sub = "应用名 · " + app;
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-name-calm-mark">应用</span>
        <span class="muted home-app-name-calm-sub">${esc(sub)}</span>
        <button type="button" class="btn ghost sm" id="homeAppNameCalmGo">去设置</button>`;
      const btn = $("#homeAppNameCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    } catch (_) {
      bar.hidden = false;
      bar.innerHTML = `<span class="home-app-name-calm-mark">应用</span>
        <span class="muted home-app-name-calm-sub">应用名暂不可用</span>
        <button type="button" class="btn ghost sm" id="homeAppNameCalmGo">去设置</button>`;
      const btn = $("#homeAppNameCalmGo");
      if (btn) {
        btn.onclick = () => {
          if (typeof show === "function") show("settings");
        };
      }
    }
  }

  /* 2 · 交割编号+处置+备注组合复制 */
  async function ensureLegacyIdActionNotesCopyButtons() {
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
      const action = String(it.action || "").trim() || "未填处置";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = "#" + it.id + " · " + action + " · " + notes;
      el.dataset.idActionNotes = line;
      if (el.querySelector(".lg-copy-id-action-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm lg-copy-id-action-notes";
      btn.textContent = "复制编号处置备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idActionNotes || "");
        softBanner(ok ? "已复制编号处置备注" : "复制未完成", "legacy");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 3 · 备忘编号+处置说明+标签组合复制 */
  async function ensureAssetIdDisposeTagCopyButtons() {
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
      if (!it || it.id == null) return;
      const dispose = String(it.dispose_note || "").trim() || "未填处置";
      const tag = String(it.tag || "").trim() || "未填标签";
      const line = "#" + it.id + " · " + dispose + " · " + tag;
      el.dataset.idDisposeTag = line;
      if (el.querySelector(".as-copy-id-dispose-tag")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm as-copy-id-dispose-tag";
      btn.textContent = "复制编号处置标签";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.idDisposeTag || "");
        softBanner(ok ? "已复制编号处置标签" : "复制未完成", "assets");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 4 · 报备页复制剩余秒数 */
  async function ensureCheckinSecondsRemainingPlainR87Copy() {
    const box = $("#checkinBox");
    if (!box) return;
    let card = $("#checkinSecondsRemainingPlainR87CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "checkinSecondsRemainingPlainR87CopyCard";
      card.className = "checkin-seconds-remaining-plain-r87-copy";
      const last = $("#checkinLastCheckinLabelPlainCopyCard");
      const nextAt = $("#checkinNextSuggestedAtPlainCopyCard");
      const readable = $("#checkinReadableCountdownPlainCopyCard");
      if (last && last.parentNode) last.insertAdjacentElement("afterend", card);
      else if (nextAt && nextAt.parentNode)
        nextAt.insertAdjacentElement("afterend", card);
      else if (readable && readable.parentNode)
        readable.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const st = await api("/api/checkin/status");
      const raw = (st.countdown || {}).seconds_remaining;
      const secs =
        raw == null || raw === ""
          ? "—"
          : String(Math.round(Number(raw)));
      const line =
        "剩余秒数 · " +
        secs +
        "（电子继承 · 演示说明，不改外呼流程）";
      card.innerHTML = `<p class="muted checkin-seconds-remaining-plain-r87-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="checkinSecondsRemainingPlainR87CopyBtn">复制剩余秒数</button>`;
      const btn = $("#checkinSecondsRemainingPlainR87CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(secs);
          softBanner(ok ? "已复制剩余秒数" : "复制未完成", "checkin");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">剩余秒数暂不可用</p>`;
    }
  }

  /* 5 · 差旅余额与短差组合复制 */
  async function ensureTravelBalanceShortfallPlainCopy() {
    const box = $("#travelBox");
    if (!box) return;
    let card = $("#travelBalanceShortfallPlainCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "travelBalanceShortfallPlainCopyCard";
      card.className = "travel-balance-shortfall-plain-copy";
      const shortPct = $("#travelShortfallProgressPctCopyCard");
      const thrMet = $("#travelThresholdMetPlainCopyCard");
      const kindAmt = $("#travelKindAmountLatestCopyCard");
      if (shortPct && shortPct.parentNode)
        shortPct.insertAdjacentElement("afterend", card);
      else if (thrMet && thrMet.parentNode)
        thrMet.insertAdjacentElement("afterend", card);
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
      const bal =
        fund.balance == null
          ? "—"
          : String(Math.round(Number(fund.balance)));
      const short =
        fund.shortfall == null
          ? "—"
          : String(Math.round(Number(fund.shortfall)));
      const combo = bal + " · " + short;
      const line = "差旅余额 · 短差 · " + combo + "（只读，不改退款流程）";
      card.innerHTML = `<p class="muted travel-balance-shortfall-plain-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="travelBalanceShortfallPlainCopyBtn">复制余额短差文案</button>`;
      const btn = $("#travelBalanceShortfallPlainCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制余额短差文案" : "复制未完成", "travel");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">余额短差文案暂不可用</p>`;
    }
  }

  /* 6 · 善后城市+状态+备注组合复制 */
  async function ensureAftercareCityStatusNotesCopyButtons() {
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
      const status = String(it.status || "").trim() || "未填状态";
      const notes = String(it.notes || "").trim() || "无备注";
      const line = city + " · " + status + " · " + notes;
      el.dataset.cityStatusNotes = line;
      if (el.querySelector(".ac-copy-city-status-notes")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm ac-copy-city-status-notes";
      btn.textContent = "复制城市状态备注";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.cityStatusNotes || "");
        softBanner(ok ? "已复制城市状态备注" : "复制未完成", "aftercare");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 7 · 授权视频生效编号与就绪组合复制 */
  async function ensureAuthActiveIdReadyCopy() {
    const panel = $("#authvideo");
    if (!panel) return;
    let card = $("#avActiveIdReadyCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "avActiveIdReadyCopyCard";
      card.className = "av-active-id-ready-copy";
      const complete = $("#avCompleteLabelReadyComboCopyCard");
      const gateMiss = $("#avGateMissingTextCopyCard");
      const progReady = $("#avProgressReadyCopyCard");
      if (complete && complete.parentNode)
        complete.insertAdjacentElement("afterend", card);
      else if (gateMiss && gateMiss.parentNode)
        gateMiss.insertAdjacentElement("afterend", card);
      else if (progReady && progReady.parentNode)
        progReady.insertAdjacentElement("afterend", card);
      else panel.insertBefore(card, panel.firstChild);
    }
    try {
      const data = await api("/api/auth-video");
      const aid = data.current_active_id;
      const idPart = aid == null || aid === "" ? "无生效编号" : "#" + aid;
      const ready = truthyFlag(data.ready) ? "已就绪" : "未就绪";
      const combo = idPart + " · " + ready;
      const line = "授权视频生效 · 就绪 · " + combo;
      card.innerHTML = `<p class="muted av-active-id-ready-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="avActiveIdReadyCopyBtn">复制生效编号就绪</button>`;
      const btn = $("#avActiveIdReadyCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制生效编号就绪" : "复制未完成", "authvideo");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">生效编号与就绪暂不可用</p>`;
    }
  }

  /* 8 · 受益人角色+口令+联系组合复制 */
  async function ensureHeirRolePassphraseContactCopyButtons() {
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
      const role = String(it.role || "").trim() || "未填角色";
      const phrase = String(it.passphrase_hint || "").trim() || "无口令提示";
      const contact = String(it.contact || "").trim() || "未填联系";
      const line = role + " · " + phrase + " · " + contact;
      if (el.querySelector(".bn-copy-role-passphrase-contact")) return;
      el.dataset.rolePassphraseContact = line;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost sm bn-copy-role-passphrase-contact";
      btn.textContent = "复制角色口令联系";
      btn.onclick = async () => {
        const ok = await copyText(el.dataset.rolePassphraseContact || "");
        softBanner(ok ? "已复制角色口令联系" : "复制未完成", "heirs");
        toast(ok ? "已复制" : "未能复制");
      };
      el.appendChild(btn);
    });
  }

  /* 9 · 手册导出路径与分享提示组合复制 */
  async function ensureHandoverExportPathShareHintCopy() {
    const box = $("#handoverBox");
    if (!box) return;
    let card = $("#handExportPathShareHintCopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "handExportPathShareHintCopyCard";
      card.className = "hand-export-path-share-hint-copy";
      const genDom = $("#handGeneratedAtDomainCopyCard");
      const itemBrand = $("#handItemCountBrandR85CopyCard");
      const shareBrand = $("#handShareHintBrandCopyCard");
      if (genDom && genDom.parentNode)
        genDom.insertAdjacentElement("afterend", card);
      else if (itemBrand && itemBrand.parentNode)
        itemBrand.insertAdjacentElement("afterend", card);
      else if (shareBrand && shareBrand.parentNode)
        shareBrand.insertAdjacentElement("afterend", card);
      else {
        const first = box.querySelector(".card");
        if (first) first.insertAdjacentElement("afterend", card);
        else box.insertBefore(card, box.firstChild);
      }
    }
    try {
      const data = await api("/api/handover");
      const path = String(data.export_path || "").trim() || "无导出路径";
      const hint = String(data.share_hint || "").trim() || "无分享提示";
      const combo = path + " · " + hint;
      const line = "手册导出 · 分享 · " + combo;
      card.innerHTML = `<p class="muted hand-export-path-share-hint-copy-line">${esc(
        line
      )}</p>
        <button type="button" class="btn ghost sm" id="handExportPathShareHintCopyBtn">复制导出分享提示</button>`;
      const btn = $("#handExportPathShareHintCopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(combo);
          softBanner(ok ? "已复制导出分享提示" : "复制未完成", "handover");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<p class="muted">导出路径与分享提示暂不可用</p>`;
    }
  }

  /* 10 · 设置·中文品牌+版本+英文品牌组合复制 + round 层含 87 */
  async function paintAppVersionBrandEnR87CopyCard() {
    const box = $("#settingsBox");
    if (!box) return;
    let card = $("#appVersionBrandEnR87CopyCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "appVersionBrandEnR87CopyCard";
      card.className = "card app-version-brand-en-r87-copy-card";
      const server = $("#serverOkBrandEnR86CopyCard");
      const okDom = $("#okDomainVersionR85CopyCard");
      const appEn = $("#appBrandEnOkR84CopyCard");
      const roundList = $("#roundLayerListCard");
      if (server && server.parentNode)
        server.insertAdjacentElement("beforebegin", card);
      else if (okDom && okDom.parentNode)
        okDom.insertAdjacentElement("beforebegin", card);
      else if (appEn && appEn.parentNode)
        appEn.insertAdjacentElement("beforebegin", card);
      else if (roundList && roundList.parentNode)
        roundList.insertAdjacentElement("beforebegin", card);
      else box.appendChild(card);
    }
    try {
      const h = await api("/api/health");
      const app = String(h.app || "电子继承 App").trim();
      const ver = String(h.version || h.server_version || "").trim() || "—";
      const en = String(h.brand_en || "E-Inherit").trim();
      const line = app + " · " + ver + " · " + en;
      card.innerHTML = `<h3>中文品牌 · 版本 · 英文品牌</h3>
        <p class="muted">一键复制中英文品牌与版本（演示级）。</p>
        <p class="app-version-brand-en-r87-copy-preview">${esc(line)}</p>
        <button type="button" class="btn ghost sm" id="appVersionBrandEnR87CopyBtn">复制应用版本英文</button>`;
      const btn = $("#appVersionBrandEnR87CopyBtn");
      if (btn) {
        btn.onclick = async () => {
          const ok = await copyText(line);
          softBanner(ok ? "已复制应用版本英文" : "复制未完成", "settings");
          toast(ok ? "已复制" : "未能复制");
        };
      }
    } catch (_) {
      card.innerHTML = `<h3>中文品牌 · 版本 · 英文品牌</h3><p class="muted">信息暂不可用</p>`;
    }
  }

  function paintRoundLayerList87() {
    const card = $("#roundLayerListCard");
    if (!card) return;
    const uniq = collectRoundLayers();
    const from = uniq.length ? Math.min.apply(null, uniq) : 6;
    const to = uniq.length ? Math.max.apply(null, uniq) : 87;
    const expected = [];
    for (let i = Math.max(6, from); i <= Math.max(to, 87); i++) expected.push(i);
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
          : `<p class="muted" style="margin-top:8px">round6…round87 均已挂载。</p>`
      }`;
  }

  const _refreshHome = window.refreshHome;
  window.refreshHome = async function () {
    await _refreshHome();
    setTimeout(() => paintHomeAppNameCalm().catch(() => {}), 700);
  };

  const _refreshLegacy = window.refreshLegacy;
  window.refreshLegacy = async function () {
    await _refreshLegacy();
    setTimeout(
      () => ensureLegacyIdActionNotesCopyButtons().catch(() => {}),
      530
    );
  };

  const _refreshAssets = window.refreshAssets;
  window.refreshAssets = async function () {
    await _refreshAssets();
    setTimeout(
      () => ensureAssetIdDisposeTagCopyButtons().catch(() => {}),
      530
    );
  };

  const _refreshCheckin = window.refreshCheckin;
  window.refreshCheckin = async function () {
    await _refreshCheckin();
    setTimeout(
      () => ensureCheckinSecondsRemainingPlainR87Copy().catch(() => {}),
      520
    );
  };

  const _refreshTravel = window.refreshTravel;
  window.refreshTravel = async function () {
    await _refreshTravel();
    setTimeout(
      () => ensureTravelBalanceShortfallPlainCopy().catch(() => {}),
      540
    );
  };

  const _refreshAftercare = window.refreshAftercare;
  window.refreshAftercare = async function () {
    await _refreshAftercare();
    setTimeout(
      () => ensureAftercareCityStatusNotesCopyButtons().catch(() => {}),
      530
    );
  };

  const _refreshAuthVideo = window.refreshAuthVideo;
  window.refreshAuthVideo = async function () {
    await _refreshAuthVideo();
    setTimeout(() => ensureAuthActiveIdReadyCopy().catch(() => {}), 500);
  };

  const _refreshHeirs = window.refreshHeirs;
  window.refreshHeirs = async function () {
    await _refreshHeirs();
    setTimeout(
      () => ensureHeirRolePassphraseContactCopyButtons().catch(() => {}),
      530
    );
  };

  const _refreshHandover = window.refreshHandover;
  window.refreshHandover = async function () {
    await _refreshHandover();
    setTimeout(
      () => ensureHandoverExportPathShareHintCopy().catch(() => {}),
      540
    );
  };

  const _show = window.show;
  window.show = function (id) {
    _show(id);
    if (id === "home")
      setTimeout(() => paintHomeAppNameCalm().catch(() => {}), 700);
    if (id === "legacy")
      setTimeout(
        () => ensureLegacyIdActionNotesCopyButtons().catch(() => {}),
        550
      );
    if (id === "assets")
      setTimeout(
        () => ensureAssetIdDisposeTagCopyButtons().catch(() => {}),
        540
      );
    if (id === "checkin")
      setTimeout(
        () => ensureCheckinSecondsRemainingPlainR87Copy().catch(() => {}),
        540
      );
    if (id === "travel")
      setTimeout(
        () => ensureTravelBalanceShortfallPlainCopy().catch(() => {}),
        560
      );
    if (id === "aftercare")
      setTimeout(
        () => ensureAftercareCityStatusNotesCopyButtons().catch(() => {}),
        550
      );
    if (id === "authvideo")
      setTimeout(() => ensureAuthActiveIdReadyCopy().catch(() => {}), 520);
    if (id === "heirs")
      setTimeout(
        () => ensureHeirRolePassphraseContactCopyButtons().catch(() => {}),
        540
      );
    if (id === "handover")
      setTimeout(
        () => ensureHandoverExportPathShareHintCopy().catch(() => {}),
        550
      );
    if (id === "settings") {
      setTimeout(() => {
        paintAppVersionBrandEnR87CopyCard().catch(() => {});
        paintRoundLayerList87();
      }, 590);
      setTimeout(() => {
        paintAppVersionBrandEnR87CopyCard().catch(() => {});
        paintRoundLayerList87();
      }, 1260);
    }
  };

  setTimeout(() => paintHomeAppNameCalm().catch(() => {}), 750);
  setTimeout(() => ensureLegacyIdActionNotesCopyButtons().catch(() => {}), 770);
  setTimeout(() => ensureAssetIdDisposeTagCopyButtons().catch(() => {}), 790);
  if ($("#checkin") && $("#checkin").classList.contains("active")) {
    ensureCheckinSecondsRemainingPlainR87Copy().catch(() => {});
  }
  if ($("#travel") && $("#travel").classList.contains("active")) {
    ensureTravelBalanceShortfallPlainCopy().catch(() => {});
  }
  if ($("#aftercare") && $("#aftercare").classList.contains("active")) {
    ensureAftercareCityStatusNotesCopyButtons().catch(() => {});
  }
  if ($("#authvideo") && $("#authvideo").classList.contains("active")) {
    ensureAuthActiveIdReadyCopy().catch(() => {});
  }
  if ($("#heirs") && $("#heirs").classList.contains("active")) {
    ensureHeirRolePassphraseContactCopyButtons().catch(() => {});
  }
  if ($("#handover") && $("#handover").classList.contains("active")) {
    ensureHandoverExportPathShareHintCopy().catch(() => {});
  }
  if ($("#settings") && $("#settings").classList.contains("active")) {
    setTimeout(() => {
      paintAppVersionBrandEnR87CopyCard().catch(() => {});
      paintRoundLayerList87();
    }, 610);
  }
})();
